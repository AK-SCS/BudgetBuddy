namespace BudgetBuddy.API.Models
{
    /// <summary>
    /// Represents a registered user in the BudgetBuddy application
    /// Stores authentication credentials and password reset tokens
    /// </summary>
    public class User
    {
        public int Id { get; set; }
        public string Email { get; set; } = default!;
        public string PasswordHash { get; set; } = default!;
        public string FullName { get; set; } = default!;

        /// <summary>
        /// Temporary token for password reset (6-digit code)
        /// </summary>
        public string? ResetToken { get; set; }
        
        /// <summary>
        /// Expiration time for reset token (15 minutes from generation)
        /// </summary>
        public DateTime? ResetTokenExpiry { get; set; }

        /// <summary>
        /// Navigation properties for related entities
        /// </summary>
        public ICollection<BudgetEntry> BudgetEntries { get; set; } = new List<BudgetEntry>();
        public ICollection<FinancialGoal> FinancialGoals { get; set; } = new List<FinancialGoal>();
        public ICollection<AIRecommendation> AIRecommendations { get; set; } = new List<AIRecommendation>();
    }
}