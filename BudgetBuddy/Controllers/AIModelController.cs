using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Nodes;
using BudgetBuddy.API.Data;
using BudgetBuddy.API.Models;

namespace BudgetBuddy.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AIModelController : ControllerBase
    {
        private readonly BudgetBuddyDbContext _db;

        public AIModelController(BudgetBuddyDbContext db) => _db = db;

       // Baseline: simple rules. Later, load ONNX/ML.NET here.
        [HttpPost("predict")]
        public async Task<IActionResult> Predict([FromBody] JsonObject payload)
        {
            // read minimal inputs
            decimal income = (decimal?)payload["monthlyIncome"] ?? 0m;
            decimal debt = (decimal?)payload["debt"] ?? 0m;
            decimal targetSave = (decimal?)payload["targetMonthlySavings"] ?? 0m;

            // Simple 50/30/20 baseline adjusted by debt
            var baseSavings = Math.Max(targetSave, income * 0.2m);
            if (debt > income * 2) baseSavings = income * 0.1m; // if heavy debt, save less, service debt more

            var needs = income * 0.5m;
            var wants = income - (needs + baseSavings);
            if (wants < 0) { needs = income * 0.6m; wants = income - (needs + baseSavings); }
            if (wants < 0) wants = 0;

            var text = $"Based on your income (£{income:0.00}) and debt (£{debt:0.00}), " +
                       $"allocate roughly Needs £{needs:0.00}, Wants £{wants:0.00}, Savings/Investments £{baseSavings:0.00}. " +
                       $"Try to keep subscriptions low and prioritize an emergency fund.";

            // Optionally persist a recommendation row
            var userId = int.Parse(User.Claims.First(c => c.Type == "userId").Value);
            var rec = new AIRecommendation
            {
                UserId = userId,
                RecommendationText = text,
                GeneratedAt = DateTime.UtcNow
            };
            _db.AIRecommendations.Add(rec);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                recommendationText = text,
                allocations = new { needs, wants, savings = baseSavings }
            });
        }
    }
}
