using BudgetBuddy.API.Data;
using BudgetBuddy.API.Dtos;
using BudgetBuddy.API.Models;
using BudgetBuddy.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BudgetBuddy.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class BudgetEntriesController : ControllerBase
    {
        private readonly BudgetBuddyDbContext _context;
        private readonly ICurrentUser _current;

        public BudgetEntriesController(BudgetBuddyDbContext context, ICurrentUser current)
        {
            _context = context;
            _current = current;
        }

        // GET: api/BudgetEntries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BudgetEntry>>> GetBudgetEntries()
        {
            var userId = _current.UserId;
            return Ok(await _context.BudgetEntries.Where(b => b.UserId == userId).ToListAsync());
        }

        // GET: api/BudgetEntries/5
        [HttpGet("{id}")]
        public async Task<ActionResult<BudgetEntry>> GetBudgetEntry(int id)
        {
            var userId = _current.UserId;
            var entry = await _context.BudgetEntries.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
            return entry is null ? NotFound() : Ok(entry);
        }

        // POST: api/BudgetEntries
        [HttpPost]
        public async Task<ActionResult<BudgetEntry>> PostBudgetEntry(BudgetEntryDto dto)
        {
            if (dto.Month < 1 || dto.Month > 12)
                return BadRequest("Month must be between 1 and 12.");

            var userId = _current.UserId;
            var entry = new BudgetEntry
            {
                UserId = userId,
                Month = dto.Month,
                Monthly_Income = dto.Monthly_Income,
                Rent = dto.Rent,
                Loan_Repayment = dto.Loan_Repayment,
                Insurance = dto.Insurance,
                Subscriptions = dto.Subscriptions,
                Groceries = dto.Groceries,
                Travel = dto.Travel,
                Going_Out = dto.Going_Out,
                Entertainment = dto.Entertainment,
                Utilities = dto.Utilities,
                Healthcare = dto.Healthcare,
                Education = dto.Education,
                Miscellaneous = dto.Miscellaneous,
                Savings = dto.Savings,
                Investments = dto.Investments,
                Net_Worth = dto.Net_Worth,
                Financial_Goals = dto.Financial_Goals ?? "",
                Debt = dto.Debt,
                Total_Liabilities = dto.Total_Liabilities
            };

            Compute(entry);

            _context.BudgetEntries.Add(entry);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBudgetEntry), new { id = entry.Id }, entry);
        }

        // PUT: api/BudgetEntries/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBudgetEntry(int id, BudgetEntryDto dto)
        {
            var userId = _current.UserId;
            var entry = await _context.BudgetEntries.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
            if (entry == null) return NotFound();

            entry.Month = dto.Month;
            entry.Monthly_Income = dto.Monthly_Income;
            entry.Rent = dto.Rent;
            entry.Loan_Repayment = dto.Loan_Repayment;
            entry.Insurance = dto.Insurance;
            entry.Subscriptions = dto.Subscriptions;
            entry.Groceries = dto.Groceries;
            entry.Travel = dto.Travel;
            entry.Going_Out = dto.Going_Out;
            entry.Entertainment = dto.Entertainment;
            entry.Utilities = dto.Utilities;
            entry.Healthcare = dto.Healthcare;
            entry.Education = dto.Education;
            entry.Miscellaneous = dto.Miscellaneous;
            entry.Savings = dto.Savings;
            entry.Investments = dto.Investments;
            entry.Net_Worth = dto.Net_Worth;
            entry.Financial_Goals = dto.Financial_Goals ?? "";
            entry.Debt = dto.Debt;
            entry.Total_Liabilities = dto.Total_Liabilities;

            Compute(entry);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/BudgetEntries/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBudgetEntry(int id)
        {
            var userId = _current.UserId;
            var entry = await _context.BudgetEntries.FirstOrDefaultAsync(b => b.Id == id && b.UserId == userId);
            if (entry == null) return NotFound();

            _context.BudgetEntries.Remove(entry);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static void Compute(BudgetEntry e)
        {
            e.Total_Expenses = e.Rent + e.Loan_Repayment + e.Insurance + e.Subscriptions +
                               e.Groceries + e.Travel + e.Going_Out + e.Entertainment +
                               e.Utilities + e.Healthcare + e.Education + e.Miscellaneous;

            e.Needs = e.Rent + e.Loan_Repayment + e.Insurance + e.Groceries + e.Utilities + e.Healthcare + e.Education;
            e.Wants = e.Subscriptions + e.Travel + e.Going_Out + e.Entertainment + e.Miscellaneous;
            e.Savings_Investment_Total = e.Savings + e.Investments;
            e.Monthly_Savings = e.Monthly_Income - e.Total_Expenses;
        }
    }
}
