using System.Text.Json.Serialization;


namespace BudgetBuddy.API.Models
{
    /// <summary>
    /// Represents a saved AI-generated financial recommendation for a user
    /// Stores insights from both rule-based and ML-powered recommendations
    /// </summary>
    public class AIRecommendation
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string RecommendationText { get; set; } = default!;
        public DateTime GeneratedAt { get; set; }

        [JsonIgnore]
        public User User { get; set; } = default!;
    }
}
