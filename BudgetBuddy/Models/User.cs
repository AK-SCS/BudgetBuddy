namespace BudgetBuddy.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = default!;
        public string PasswordHash { get; set; } = default!;
        public string FullName { get; set; } = default!;

        public ICollection<BudgetEntry> BudgetEntries { get; set; } = new List<BudgetEntry>();
        public ICollection<FinancialGoal> FinancialGoals { get; set; } = new List<FinancialGoal>();
        public ICollection<AIRecommendation> AIRecommendations { get; set; } = new List<AIRecommendation>();
    }
}
