// BudgetBuddy.API/Controllers/PlannerController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BudgetBuddy.API.Data;
using System.Linq;

namespace BudgetBuddy.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PlannerController : ControllerBase
    {
        private readonly BudgetBuddyDbContext _db;
        public PlannerController(BudgetBuddyDbContext db) => _db = db;

        private int GetUserId() => int.Parse(User.Claims.First(c => c.Type == "userId").Value);

        // GET: api/Planner/allocate?month=10
        [HttpGet("allocate")]
        public async Task<IActionResult> Allocate([FromQuery] int? month = null)
        {
            int uid = GetUserId();

            IQueryable<Models.BudgetEntry> q = _db.BudgetEntries.Where(b => b.UserId == uid);
            if (month.HasValue)
                q = q.Where(b => b.Month == month.Value);

            var last = await q.OrderByDescending(b => b.Id).FirstOrDefaultAsync();
            if (last == null)
                return Ok(new { message = "No budget found. Add a month first." });

            // Ensure decimal math throughout
            decimal income = last.Monthly_Income;
            decimal expenses = last.Total_Expenses;
            decimal spare = Math.Max(0m, income - expenses);

            // Simple rules (decimal literals with 'm')
            decimal towardDebt = Math.Round(spare * 0.35m, 2, MidpointRounding.AwayFromZero);
            decimal towardSavings = Math.Round(spare * 0.40m, 2, MidpointRounding.AwayFromZero);
            decimal towardInvest = Math.Round(spare - towardDebt - towardSavings, 2, MidpointRounding.AwayFromZero);

            return Ok(new
            {
                month = last.Month,
                income,
                expenses,
                spare,
                allocation = new
                {
                    debt = towardDebt,
                    savings = towardSavings,
                    investments = towardInvest
                }
            });
        }
    }
}
