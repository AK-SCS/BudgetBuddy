using System.Security.Claims;

namespace BudgetBuddy.API.Services
{
    public class CurrentUser : ICurrentUser
    {
        private readonly IHttpContextAccessor _http;
        public CurrentUser(IHttpContextAccessor http) => _http = http;

        public int UserId => int.TryParse(_http.HttpContext?.User?.FindFirst("userId")?.Value, out var id) ? id : 0;
        public string? Email => _http.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                             ?? _http.HttpContext?.User?.FindFirst("sub")?.Value;
        public bool IsAdmin => string.Equals(_http.HttpContext?.User?.FindFirst("role")?.Value, "admin", StringComparison.OrdinalIgnoreCase);
    }
}
