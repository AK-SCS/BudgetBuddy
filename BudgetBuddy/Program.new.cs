using System.Text;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using BudgetBuddy.API.Data;
using BudgetBuddy.API.Services;
using BudgetBuddy.API.Middleware;

// Load environment variables from .env file
DotNetEnv.Env.Load();

// Configure Serilog for structured logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/budgetbuddy-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 30)
    .CreateLogger();

try
{
    Log.Information("Starting BudgetBuddy API...");

    var builder = WebApplication.CreateBuilder(args);

    // Use Serilog for logging
    builder.Host.UseSerilog();

    // Add environment variables to configuration
    builder.Configuration.AddEnvironmentVariables();

    /// <summary>
    /// Configure MVC controllers for API endpoints with custom validation
    /// </summary>
    builder.Services.AddControllers()
        .ConfigureApiBehaviorOptions(options =>
        {
            options.SuppressModelStateInvalidFilter = false;
        });

    /// <summary>
    /// Configure Swagger/OpenAPI documentation with JWT authentication support
    /// </summary>
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "BudgetBuddy API",
            Version = "v1",
            Description = "AI-powered personal finance and budgeting API with multi-region support",
            Contact = new OpenApiContact
            {
                Name = "BudgetBuddy Support",
                Email = "support@budgetbuddy.com"
            }
        });

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "Paste only your JWT token below (no 'Bearer' prefix)."
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });

    /// <summary>
    /// Configure database with support for both SQLite (dev) and PostgreSQL (prod)
    /// </summary>
    var dbType = Environment.GetEnvironmentVariable("DATABASE_TYPE") ?? builder.Configuration["DatabaseType"] ?? "sqlite";
    
    if (dbType.Equals("postgresql", StringComparison.OrdinalIgnoreCase))
    {
        var connectionString = Environment.GetEnvironmentVariable("POSTGRES_CONNECTION_STRING") 
            ?? builder.Configuration.GetConnectionString("PostgreSQL")
            ?? throw new InvalidOperationException("PostgreSQL connection string not found");
        
        builder.Services.AddDbContext<BudgetBuddyDbContext>(options =>
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.EnableRetryOnFailure(3);
                npgsqlOptions.CommandTimeout(30);
            }));
        Log.Information("Using PostgreSQL database");
    }
    else
    {
        var dataDir = Path.Combine(builder.Environment.ContentRootPath, "Data");
        Directory.CreateDirectory(dataDir);
        var dbFile = Path.Combine(dataDir, "budgetbuddy.db");
        var connectionString = Environment.GetEnvironmentVariable("SQLITE_CONNECTION_STRING") 
            ?? $"Data Source={dbFile}";
        
        builder.Services.AddDbContext<BudgetBuddyDbContext>(options =>
            options.UseSqlite(connectionString));
        Log.Information("Using SQLite database at {DbPath}", dbFile);
    }

    /// <summary>
    /// Configure HTTP client for Python ML service communication
    /// </summary>
    var mlServiceUrl = Environment.GetEnvironmentVariable("ML_SERVICE_BASE_URL") 
        ?? builder.Configuration["MlService:BaseUrl"] 
        ?? "http://localhost:8000";
    
    builder.Services.AddHttpClient("ml", client =>
    {
        client.BaseAddress = new Uri(mlServiceUrl);
        client.Timeout = TimeSpan.FromSeconds(30);
    });

    /// <summary>
    /// Register HTTP client factory and Gemini AI service for chat functionality
    /// </summary>
    builder.Services.AddHttpClient();
    builder.Services.AddScoped<GeminiService>();

    /// <summary>
    /// Configure distributed memory cache required for session state
    /// </summary>
    builder.Services.AddDistributedMemoryCache();

    /// <summary>
    /// Configure session support for maintaining chat conversation history
    /// </summary>
    builder.Services.AddSession(options =>
    {
        options.IdleTimeout = TimeSpan.FromMinutes(30);
        options.Cookie.HttpOnly = true;
        options.Cookie.IsEssential = true;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.Cookie.SameSite = SameSiteMode.Strict;
    });

    /// <summary>
    /// Configure JWT Bearer authentication with secure token validation
    /// </summary>
    var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET") 
        ?? builder.Configuration["JwtSettings:Secret"]
        ?? throw new InvalidOperationException("JWT_SECRET not configured");
    
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
        ?? builder.Configuration["JwtSettings:Issuer"] 
        ?? "BudgetBuddyAPI";
    
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
        ?? builder.Configuration["JwtSettings:Audience"] 
        ?? "BudgetBuddyClient";

    if (jwtSecret.Length < 32)
    {
        throw new InvalidOperationException("JWT_SECRET must be at least 32 characters long");
    }

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = "Bearer";
        options.DefaultChallengeScheme = "Bearer";
    })
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew = TimeSpan.FromMinutes(5)
        };
    });

    builder.Services.AddAuthorization();

    /// <summary>
    /// Register application-specific services
    /// </summary>
    builder.Services.AddHttpContextAccessor();
    builder.Services.AddScoped<ICurrentUser, CurrentUser>();

    /// <summary>
    /// Configure CORS with environment-based allowed origins
    /// </summary>
    var allowedOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS")
        ?? builder.Configuration["AllowedOrigins"]
        ?? "http://localhost:5173,http://localhost:3000";
    
    var originsArray = allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(o => o.Trim()).ToArray();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowedOrigins", policy => policy
            .WithOrigins(originsArray)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
    });

    /// <summary>
    /// Configure rate limiting to prevent abuse
    /// </summary>
    var rateLimitRequests = int.Parse(
        Environment.GetEnvironmentVariable("RATE_LIMIT_REQUESTS_PER_MINUTE") 
        ?? builder.Configuration["RateLimiting:RequestsPerMinute"] 
        ?? "100"
    );

    builder.Services.AddRateLimiter(options =>
    {
        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: context.User.Identity?.Name ?? context.Request.Headers.Host.ToString(),
                factory: partition => new FixedWindowRateLimiterOptions
                {
                    AutoReplenishment = true,
                    PermitLimit = rateLimitRequests,
                    QueueLimit = 0,
                    Window = TimeSpan.FromMinutes(1)
                }));
        
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    });

    /// <summary>
    /// Add health checks
    /// </summary>
    builder.Services.AddHealthChecks();

    var app = builder.Build();

    /// <summary>
    /// Configure middleware pipeline
    /// </summary>
    
    // Global exception handling
    app.UseMiddleware<GlobalExceptionMiddleware>();

    // Security headers
    app.UseMiddleware<SecurityHeadersMiddleware>();

    // Enable Swagger in development
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "BudgetBuddy API v1");
        });
    }

    // HTTPS redirection in production
    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    // Rate limiting
    app.UseRateLimiter();

    // CORS must come before authentication
    app.UseCors("AllowedOrigins");

    // Session management
    app.UseSession();

    // Authentication and Authorization
    app.UseAuthentication();
    app.UseAuthorization();

    // Map controllers
    app.MapControllers();

    // Health check endpoint
    app.MapHealthChecks("/health");

    // Info endpoint
    app.MapGet("/api/info", () => new
    {
        version = "1.0.0",
        environment = app.Environment.EnvironmentName,
        timestamp = DateTime.UtcNow,
        supportedRegions = new[] { "GB", "IN" }
    }).AllowAnonymous();

    Log.Information("BudgetBuddy API started successfully on {Environment}", app.Environment.EnvironmentName);
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
