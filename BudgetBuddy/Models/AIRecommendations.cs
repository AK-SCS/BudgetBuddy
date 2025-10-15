namespace BudgetBuddy.API.Models
{
    public class AIRecommendation
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string RecommendationText { get; set; } = default!;
        public DateTime GeneratedAt { get; set; }

        public User User { get; set; } = default!;
    }
}
