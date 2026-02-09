using Microsoft.AspNetCore.Http;

namespace BudgetBuddy.API.Middleware
{
    /// <summary>
    /// Adds security headers to all responses
    /// </summary>
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Prevent clickjacking
            context.Response.Headers["X-Frame-Options"] = "DENY";
            
            // Prevent MIME type sniffing
            context.Response.Headers["X-Content-Type-Options"] = "nosniff";
            
            // Enable XSS protection
            context.Response.Headers["X-XSS-Protection"] = "1; mode=block";
            
            // Content Security Policy
            context.Response.Headers["Content-Security-Policy"] = 
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;";
            
            // Referrer Policy
            context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";
            
            // Permissions Policy
            context.Response.Headers["Permissions-Policy"] = 
                "geolocation=(), microphone=(), camera=()";

            await _next(context);
        }
    }
}
