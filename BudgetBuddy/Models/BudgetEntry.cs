using System.Text.Json.Serialization;

namespace BudgetBuddy.API.Models
{
    /// <summary>
    /// Represents a monthly budget entry with income, expenses, and financial metrics
    /// Automatically calculates totals, savings, and needs vs wants breakdown
    /// </summary>
    public class BudgetEntry
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        /// <summary>
        /// Month number (1-12) for the budget period
        /// </summary>
        public int Month { get; set; }
        
        /// <summary>
        /// User-entered income and expense categories
        /// </summary>
        public decimal Monthly_Income { get; set; }
        public decimal Rent { get; set; }
        public decimal Loan_Repayment { get; set; }
        public decimal Insurance { get; set; }
        public decimal Subscriptions { get; set; }
        public decimal Groceries { get; set; }
        public decimal Travel { get; set; }
        public decimal Going_Out { get; set; }
        public decimal Entertainment { get; set; }
        public decimal Utilities { get; set; }
        public decimal Healthcare { get; set; }
        public decimal Education { get; set; }
        public decimal Miscellaneous { get; set; }
        public decimal Savings { get; set; }
        public decimal Investments { get; set; }
        public decimal Net_Worth { get; set; }
        public string Financial_Goals { get; set; } = string.Empty;
        public decimal Debt { get; set; }
        public decimal Total_Liabilities { get; set; }

        /// <summary>
        /// Computed financial metrics (calculated by Compute method)
        /// </summary>
        public decimal Total_Expenses { get; set; }
        public decimal Monthly_Savings { get; set; }
        public decimal Needs { get; set; }
        public decimal Wants { get; set; }
        public decimal Savings_Investment_Total { get; set; }

        [JsonIgnore]
        public User User { get; set; } = default!;
    }
}
