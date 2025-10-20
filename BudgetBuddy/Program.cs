using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using BudgetBuddy.API.Data;
using BudgetBuddy.API.Services;

var builder = WebApplication.CreateBuilder(args);




builder.Services.AddControllers();


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

// DbContext (SQLite)
builder.Services.AddDbContext<BudgetBuddyDbContext>(options =>
    options.UseSqlite("Data Source=budgetbuddy.db"));

// JWT Authentication
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

// App services used by controllers
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

//  CORS for frontend dev URLs
var allowedOrigins = "_ui";
builder.Services.AddCors(o =>
{
    o.AddPolicy(allowedOrigins, p => p
        .WithOrigins("http://localhost:5173", "http://localhost:3000")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});


// Build & Middleware
// 
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// CORS must be before auth
app.UseCors(allowedOrigins);

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
