using Xunit;
using BudgetBuddy.API.Controllers;
using BudgetBuddy.API.Data;
using BudgetBuddy.API.Dtos;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace BudgetBuddy.Tests.Controllers
{
    public class AuthControllerTests : IDisposable
    {
        private readonly BudgetBuddyDbContext _context;
        private readonly AuthController _controller;

        public AuthControllerTests()
        {
            var options = new DbContextOptionsBuilder<BudgetBuddyDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new BudgetBuddyDbContext(options);
            
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string>
                {
                    {"JwtSettings:Secret", "test-secret-key-minimum-32-characters-long-for-testing-purposes"},
                    {"JwtSettings:Issuer", "TestIssuer"},
                    {"JwtSettings:Audience", "TestAudience"}
                })
                .Build();

            _controller = new AuthController(_context, configuration);
        }

        [Fact]
        public async Task Register_WithValidData_ReturnsOk()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!",
                FullName = "Test User"
            };

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            Assert.Single(_context.Users);
        }

        [Fact]
        public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!",
                FullName = "Test User"
            };

            await _controller.Register(registerDto);

            // Act
            var result = await _controller.Register(registerDto);

            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task Login_WithValidCredentials_ReturnsToken()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!",
                FullName = "Test User"
            };
            await _controller.Register(registerDto);

            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!"
            };

            // Act
            var result = await _controller.Login(loginDto) as OkObjectResult;

            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.Value);
        }

        [Fact]
        public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
        {
            // Arrange
            var registerDto = new RegisterDto
            {
                Email = "test@example.com",
                Password = "TestPassword123!",
                FullName = "Test User"
            };
            await _controller.Register(registerDto);

            var loginDto = new LoginDto
            {
                Email = "test@example.com",
                Password = "WrongPassword123!"
            };

            // Act
            var result = await _controller.Login(loginDto);

            // Assert
            Assert.IsType<UnauthorizedObjectResult>(result);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
