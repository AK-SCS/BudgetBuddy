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
    /// <summary>
    /// Handles user authentication, registration, and password reset functionality
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly BudgetBuddyDbContext _context;
        private readonly IConfiguration _config;
        private readonly PasswordHasher<User> _hasher = new();

        public AuthController(BudgetBuddyDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        /// <summary>
        /// Registers a new user account with email and password
        /// </summary>
        /// <param name="dto">User registration details including email, password, and full name</param>
        /// <returns>Success message if registration completes successfully</returns>
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

        /// <summary>
        /// Authenticates a user and returns a JWT token
        /// </summary>
        /// <param name="dto">Login credentials (email and password)</param>
        /// <returns>JWT token and user information on successful authentication</returns>
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

        /// <summary>
        /// Initiates password reset process by generating a 6-digit token
        /// </summary>
        /// <param name="dto">Email address for password reset</param>
        /// <returns>Reset token with 15-minute expiration</returns>
        [HttpPost("request-password-reset")]
        [AllowAnonymous]
        public async Task<IActionResult> RequestPasswordReset([FromBody] RequestResetDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);

            if (user == null)
            {
                return NotFound(new { message = "User not found with that email address." });
            }

            var random = new Random();
            var token = random.Next(100000, 999999).ToString();

            user.ResetToken = token;
            user.ResetTokenExpiry = DateTime.UtcNow.AddMinutes(15);

            await _context.SaveChangesAsync();

            return Ok(new { token = token, message = "Reset token generated successfully." });
        }

        /// <summary>
        /// Completes password reset using the provided token
        /// </summary>
        /// <param name="dto">Email, reset token, and new password</param>
        /// <returns>Success message if password reset is successful</returns>
        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var email = dto.Email.Trim().ToLowerInvariant();
            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.Email.ToLower() == email &&
                u.ResetToken == dto.Token &&
                u.ResetTokenExpiry > DateTime.UtcNow);

            if (user == null)
            {
                return BadRequest(new { message = "Invalid or expired reset token." });
            }

            user.PasswordHash = _hasher.HashPassword(user, dto.NewPassword);

            user.ResetToken = null;
            user.ResetTokenExpiry = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password reset successful. You can now login with your new password." });
        }

        /// <summary>
        /// Generates a JWT token for authenticated user with claims
        /// </summary>
        /// <param name="user">User entity to generate token for</param>
        /// <returns>Signed JWT token string</returns>
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

    /// <summary>
    /// DTO for requesting a password reset token
    /// </summary>
    public class RequestResetDto
    {
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO for completing password reset with token
    /// </summary>
    public class ResetPasswordDto
    {
        public string Email { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }
}