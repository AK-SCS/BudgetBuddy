using System.ComponentModel.DataAnnotations;

namespace BudgetBuddy.API.Dtos
{
    public class BudgetEntryDto
    {
        [Required, Range(1, 12)] public int Month { get; set; }

        [Range(0, double.MaxValue)] public decimal Monthly_Income { get; set; }
        [Range(0, double.MaxValue)] public decimal Rent { get; set; }
        [Range(0, double.MaxValue)] public decimal Loan_Repayment { get; set; }
        [Range(0, double.MaxValue)] public decimal Insurance { get; set; }
        [Range(0, double.MaxValue)] public decimal Subscriptions { get; set; }
        [Range(0, double.MaxValue)] public decimal Groceries { get; set; }
        [Range(0, double.MaxValue)] public decimal Travel { get; set; }
        [Range(0, double.MaxValue)] public decimal Going_Out { get; set; }
        [Range(0, double.MaxValue)] public decimal Entertainment { get; set; }
        [Range(0, double.MaxValue)] public decimal Utilities { get; set; }
        [Range(0, double.MaxValue)] public decimal Healthcare { get; set; }
        [Range(0, double.MaxValue)] public decimal Education { get; set; }
        [Range(0, double.MaxValue)] public decimal Miscellaneous { get; set; }
        [Range(0, double.MaxValue)] public decimal Savings { get; set; }
        [Range(0, double.MaxValue)] public decimal Investments { get; set; }
        [Range(0, double.MaxValue)] public decimal Net_Worth { get; set; }
        public string? Financial_Goals { get; set; }
        [Range(0, double.MaxValue)] public decimal Debt { get; set; }
        [Range(0, double.MaxValue)] public decimal Total_Liabilities { get; set; }
        
        /// <summary>
        /// Region code (GB for UK, IN for India) for currency formatting
        /// </summary>
        public string Region { get; set; } = "GB";
    }
}
