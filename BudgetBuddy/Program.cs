using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BudgetBuddy.API.Data;
using BudgetBuddy.API.Services;

var builder = WebApplication.CreateBuilder(args);

/// <summary>
/// Configure MVC controllers for API endpoints
/// </summary>
builder.Services.AddControllers();

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
        Description = "AI-powered personal finance and budgeting API"
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
/// Configure SQLite database with explicit path in Data folder
/// Ensures Data directory exists and sets up Entity Framework context
/// </summary>
var dataDir = Path.Combine(builder.Environment.ContentRootPath, "Data");
Directory.CreateDirectory(dataDir);
var dbFile = Path.Combine(dataDir, "budgetbuddy.db");

builder.Services.AddDbContext<BudgetBuddyDbContext>(options =>
    options.UseSqlite($"Data Source={dbFile}"));

/// <summary>
/// Configure HTTP client for Python ML service communication
/// Base URL configured via appsettings MlService:BaseUrl
/// </summary>
builder.Services.AddHttpClient("ml", (sp, client) =>
{
    var cfg = sp.GetRequiredService<IConfiguration>();
    var baseUrl = cfg["MlService:BaseUrl"];
    if (!string.IsNullOrWhiteSpace(baseUrl))
    {
        client.BaseAddress = new Uri(baseUrl);
    }
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
/// Sessions expire after 30 minutes of inactivity
/// </summary>
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

/// <summary>
/// Configure JWT Bearer authentication with token validation parameters
/// Credentials loaded from JwtSettings configuration section
/// </summary>
var jwt = builder.Configuration.GetSection("JwtSettings");
var issuer = (jwt["Issuer"] ?? "BudgetBuddyAPI").Trim();
var audience = (jwt["Audience"] ?? "BudgetBuddyClient").Trim();
var secret = (jwt["Secret"] ?? "ThisIsASecretKeyForJWT_DoNotShare").Trim();

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
        ValidIssuer = issuer,
        ValidAudience = string.IsNullOrWhiteSpace(audience) ? "BudgetBuddyClient" : audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

/// <summary>
/// Register application-specific services for user context management
/// </summary>
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

/// <summary>
/// Configure CORS to allow requests from React frontend development server
/// Enables credentials for authentication cookies and headers
/// </summary>
var allowedOrigins = "_ui";
builder.Services.AddCors(o =>
{
    o.AddPolicy(allowedOrigins, p => p
        .WithOrigins("http://localhost:5173", "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

var app = builder.Build();

/// <summary>
/// Enable Swagger UI in development environment for API testing
/// </summary>
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

/// <summary>
/// Configure middleware pipeline in correct order
/// CORS -> Session -> Authentication -> Authorization
/// </summary>
app.UseCors(allowedOrigins);
app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

/// <summary>
/// Debug endpoint to verify SQLite database file location
/// </summary>
app.MapGet("/debug/dbpath", () =>
{
    var path = Path.GetFullPath(dbFile);
    return Results.Text($"SQLite DB path: {path}");
});

app.Run();
