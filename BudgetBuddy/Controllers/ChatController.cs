using BudgetBuddy.API.Dtos;
using BudgetBuddy.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BudgetBuddy.API.Controllers
{
    /// <summary>
    /// Handles AI-powered chat conversations for financial advice using Gemini API
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly GeminiService _geminiService;
        private readonly ICurrentUser _currentUser;

        public ChatController(GeminiService geminiService, ICurrentUser currentUser)
        {
            _geminiService = geminiService;
            _currentUser = currentUser;
        }

        /// <summary>
        /// Processes a chat message and returns AI-generated financial advice
        /// Falls back to 503 error if AI service is unavailable
        /// </summary>
        /// <param name="request">User's chat message</param>
        /// <returns>AI-generated response with timestamp</returns>
        [HttpPost("message")]
        public async Task<ActionResult<ChatResponse>> SendMessage([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { error = "Message cannot be empty" });
            }

            var userId = _currentUser.UserId;
            if (userId == 0)
            {
                return Unauthorized(new { error = "User not authenticated" });
            }

            try
            {
                var response = await _geminiService.GetFinancialAdviceAsync(request.Message, userId);

                return Ok(new ChatResponse
                {
                    Message = response,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Chat error: {ex.Message}");

                return StatusCode(503, new
                {
                    error = "AI service temporarily unavailable. ServiceUnavailable",
                    message = "The AI service is currently overloaded or unavailable."
                });
            }
        }

        /// <summary>
        /// Lists available Gemini AI models for debugging purposes
        /// </summary>
        /// <returns>List of available AI models</returns>
        [HttpGet("models")]
        public async Task<ActionResult> ListModels()
        {
            try
            {
                var models = await _geminiService.ListAvailableModels();
                return Ok(models);
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { error = ex.Message });
            }
        }
    }
}