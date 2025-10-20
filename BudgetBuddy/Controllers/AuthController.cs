using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BudgetBuddy.API.Data;
using BudgetBuddy.API.Dtos;
using BudgetBuddy.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace BudgetBuddy.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly BudgetBuddyDbContext _context;
        private readonly IConfiguration _config;
        private readonly PasswordHasher<User> _hasher = new();

        public AuthController(BudgetBuddyDbContext context, IConfiguration config)
        { _context = context; _config = config; }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var email = dto.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Email.ToLower() == email))
                return BadRequest("Email already in use.");

            var user = new User { Email = email, FullName = dto.FullName };
            user.PasswordHash = _hasher.HashPassword(user, dto.Password);

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "User registered successfully." });
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
            if (user == null) return Unauthorized("Invalid credentials.");

            var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, dto.Password);
            if (result == PasswordVerificationResult.Failed) return Unauthorized("Invalid credentials.");

            var token = GenerateJwtToken(user);
            return Ok(new { token, user = new { user.Id, user.FullName, user.Email } });
        }

        private string GenerateJwtToken(User user)
        {
            var jwt = _config.GetSection("JwtSettings");
            var issuer = (jwt["Issuer"] ?? "BudgetBuddyAPI").Trim();
            var audience = (jwt["Audience"] ?? "BudgetBuddyClient").Trim();
            var secret = (jwt["Secret"] ?? "ThisIsASecretKeyForJWT_DoNotShare").Trim();
            var minutes = double.TryParse(jwt["ExpirationMinutes"], out var m) ? m : 120;

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim("userId", user.Id.ToString()),
                new Claim("role", user.Email.Equals("admin@budgetbuddy.local", StringComparison.OrdinalIgnoreCase) ? "admin" : "user"),
                new Claim(ClaimTypes.NameIdentifier, user.Email)
            };

            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Issuer = issuer,
                Audience = string.IsNullOrWhiteSpace(audience) ? "BudgetBuddyClient" : audience,
                Expires = DateTime.UtcNow.AddMinutes(minutes),
                SigningCredentials = creds
            };

            var handler = new JwtSecurityTokenHandler();
            var token = handler.CreateToken(descriptor);
            return handler.WriteToken(token);
        }
    }
}
