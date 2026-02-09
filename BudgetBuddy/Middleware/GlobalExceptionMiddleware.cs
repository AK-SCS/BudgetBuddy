using Microsoft.AspNetCore.Http;
using Serilog;
using System.Net;
using System.Text.Json;

namespace BudgetBuddy.API.Middleware
{
    /// <summary>
    /// Global exception handler middleware for consistent error responses
    /// </summary>
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IWebHostEnvironment _env;

        public GlobalExceptionMiddleware(RequestDelegate next, IWebHostEnvironment env)
        {
            _next = next;
            _env = env;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Unhandled exception occurred");
                await HandleExceptionAsync(context, ex);
            }
        }

        private Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var response = new
            {
                statusCode = context.Response.StatusCode,
                message = _env.IsDevelopment() 
                    ? exception.Message 
                    : "An error occurred processing your request.",
                detail = _env.IsDevelopment() ? exception.StackTrace : null,
                timestamp = DateTime.UtcNow
            };

            var jsonResponse = JsonSerializer.Serialize(response);
            return context.Response.WriteAsync(jsonResponse);
        }
    }
}
