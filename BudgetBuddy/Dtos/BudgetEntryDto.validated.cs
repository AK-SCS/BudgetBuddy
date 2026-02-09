using System.ComponentModel.DataAnnotations;

namespace BudgetBuddy.API.Dtos
{
    /// <summary>
    /// Base DTO with validation for budget entries with region support
    /// </summary>
    public class BudgetEntryDtoBase
    {
        [Required(ErrorMessage = "Month is required")]
        [Range(1, 12, ErrorMessage = "Month must be between 1 and 12")]
        public int Month { get; set; }

        [Required(ErrorMessage = "Monthly income is required")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Monthly income must be greater than 0")]
        public decimal MonthlyIncome { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Rent must be non-negative")]
        public decimal Rent { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Loan repayment must be non-negative")]
        public decimal LoanRepayment { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Insurance must be non-negative")]
        public decimal Insurance { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Subscriptions must be non-negative")]
        public decimal Subscriptions { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Groceries must be non-negative")]
        public decimal Groceries { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Travel must be non-negative")]
        public decimal Travel { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Going out must be non-negative")]
        public decimal GoingOut { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Entertainment must be non-negative")]
        public decimal Entertainment { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Utilities must be non-negative")]
        public decimal Utilities { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Healthcare must be non-negative")]
        public decimal Healthcare { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Education must be non-negative")]
        public decimal Education { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Miscellaneous must be non-negative")]
        public decimal Miscellaneous { get; set; }

        [RegularExpression("^(GB|IN)$", ErrorMessage = "Region must be either GB or IN")]
        public string Region { get; set; } = "GB";
    }

    public class BudgetEntryDto : BudgetEntryDtoBase
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateBudgetEntryDto : BudgetEntryDtoBase
    {
    }

    public class UpdateBudgetEntryDto : BudgetEntryDtoBase
    {
        [Required]
        public int Id { get; set; }
    }
}
