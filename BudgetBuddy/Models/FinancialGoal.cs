namespace BudgetBuddy.API.Models
{
    public class FinancialGoal
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string GoalName { get; set; } = default!;
        public decimal TargetAmount { get; set; }
        public decimal CurrentProgress { get; set; }
        public DateTime Deadline { get; set; }

        public User User { get; set; } = default!;
    }
}
