using System.Security.Claims;

namespace BudgetBuddy.API.Services
{
    /// <summary>
    /// Service for accessing authenticated user information from JWT claims
    /// Provides strongly-typed access to user ID, email, and role
    /// </summary>
    public class CurrentUser : ICurrentUser
    {
        private readonly IHttpContextAccessor _http;
        public CurrentUser(IHttpContextAccessor http) => _http = http;

        /// <summary>
        /// Gets the current user's ID from JWT token claims
        /// </summary>
        public int UserId => int.TryParse(_http.HttpContext?.User?.FindFirst("userId")?.Value, out var id) ? id : 0;
        
        /// <summary>
        /// Gets the current user's email from JWT token claims
        /// </summary>
        public string? Email => _http.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? _http.HttpContext?.User?.FindFirst("sub")?.Value;
        
        /// <summary>
        /// Checks if the current user has admin role
        /// </summary>
        public bool IsAdmin => string.Equals(_http.HttpContext?.User?.FindFirst("role")?.Value, "admin", StringComparison.OrdinalIgnoreCase);
    }
}
