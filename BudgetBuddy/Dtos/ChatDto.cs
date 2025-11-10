using System.ComponentModel.DataAnnotations;

namespace BudgetBuddy.API.Dtos
{
    public class ChatRequest
    {
        [Required]
        public string Message { get; set; } = string.Empty;
    }

    public class ChatResponse
    {
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}
