using System.Text.Json.Serialization;

namespace BudgetBuddy.API.Models
{
    /// <summary>
    /// Represents a user's financial goal with target amount and progress tracking
    /// Used for savings goals, debt payoff, or other financial objectives
    /// </summary>
    public class FinancialGoal
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string GoalName { get; set; } = default!;
        public decimal TargetAmount { get; set; }
        public decimal CurrentProgress { get; set; }
        public DateTime Deadline { get; set; }

        [JsonIgnore]
        public User User { get; set; } = default!;
    }
}
