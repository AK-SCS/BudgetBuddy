using BudgetBuddy.API.Data;
using BudgetBuddy.API.Dtos;
using BudgetBuddy.API.Models;
using BudgetBuddy.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetBuddy.API.Controllers
{
    /// <summary>
    /// Manages AI-generated financial recommendations and insights
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AIRecommendationsController : ControllerBase
    {
        private readonly BudgetBuddyDbContext _context;
        private readonly ICurrentUser _current;

        public AIRecommendationsController(BudgetBuddyDbContext context, ICurrentUser current)
        {
            _context = context;
            _current = current;
        }

        /// <summary>
        /// Retrieves all saved AI recommendations for the authenticated user
        /// </summary>
        /// <returns>List of AI recommendations</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AIRecommendation>>> GetRecommendations()
        {
            var uid = _current.UserId;
            var data = await _context.AIRecommendations.Where(a => a.UserId == uid).ToListAsync();
            return Ok(data);
        }

        /// <summary>
        /// Saves a new AI recommendation for the authenticated user
        /// </summary>
        /// <param name="dto">Recommendation text to save</param>
        /// <returns>Created recommendation with timestamp</returns>
        [HttpPost]
        public async Task<ActionResult<AIRecommendation>> PostRecommendation(AIRecommendationDto dto)
        {
            var uid = _current.UserId;
            var rec = new AIRecommendation
            {
                UserId = uid,
                RecommendationText = dto.RecommendationText,
                GeneratedAt = DateTime.UtcNow
            };
            _context.AIRecommendations.Add(rec);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetRecommendations), new { id = rec.Id }, rec);
        }

        /// <summary>
        /// Generates a rule-based financial recommendation based on latest budget and goals
        /// Analyzes spending patterns, savings rate, and goal progress
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Generated recommendation with actionable insights</returns>
        [HttpPost("generate")]
        public async Task<ActionResult<AIRecommendation>> Generate(CancellationToken ct)
        {
            var uid = _current.UserId;

            var latest = await _context.BudgetEntries
                .Where(b => b.UserId == uid)
                .OrderByDescending(b => b.Id)
                .FirstOrDefaultAsync(ct);

            if (latest is null) return BadRequest("No budget entries found.");

            var goals = await _context.FinancialGoals
                .Where(g => g.UserId == uid)
                .Select(g => new { g.GoalName, g.TargetAmount, g.CurrentProgress, g.Deadline })
                .ToListAsync(ct);

            var needs = latest.Needs;
            var wants = latest.Wants;
            var savingsRate = latest.Monthly_Income == 0 ? 0 : (latest.Savings / latest.Monthly_Income);

            var goalLine = goals.Any()
                ? string.Join("; ", goals.Select(g => $"{g.GoalName}: £{g.CurrentProgress:n0}/£{g.TargetAmount:n0} by {g.Deadline:yyyy-MM-dd}"))
                : "No goals set.";

            var text =
$@"Suggested budget:
- Needs/Wants: {(needs + wants == 0 ? "n/a" : $"{Math.Round(needs / (needs + wants) * 100)}% needs / {Math.Round(wants / (needs + wants) * 100)}% wants")}
- Savings rate: {savingsRate:P0}. Aim ≥ 20% if possible.
- Review subscriptions/groceries for 5–10% quick savings.
- Goals: {goalLine}";

            var rec = new AIRecommendation
            {
                UserId = uid,
                RecommendationText = text,
                GeneratedAt = DateTime.UtcNow
            };

            _context.AIRecommendations.Add(rec);
            await _context.SaveChangesAsync(ct);
            return CreatedAtAction(nameof(GetRecommendations), new { id = rec.Id }, rec);
        }
    }
}
