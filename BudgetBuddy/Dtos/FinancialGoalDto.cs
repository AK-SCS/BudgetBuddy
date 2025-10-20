using System.ComponentModel.DataAnnotations;

namespace BudgetBuddy.API.Dtos
{
    public class FinancialGoalDto
    {
        [Required] public string GoalName { get; set; } = default!;
        [Range(0, double.MaxValue)] public decimal TargetAmount { get; set; }
        [Range(0, double.MaxValue)] public decimal CurrentProgress { get; set; }
        [Required] public DateTime Deadline { get; set; }
    }
}
