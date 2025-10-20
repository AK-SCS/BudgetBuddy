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
    public class FinancialGoalsController : ControllerBase
    {
        private readonly BudgetBuddyDbContext _context;
        private readonly ICurrentUser _current;

        public FinancialGoalsController(BudgetBuddyDbContext context, ICurrentUser current)
        {
            _context = context;
            _current = current;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FinancialGoal>>> GetGoals()
        {
            var uid = _current.UserId;
            return Ok(await _context.FinancialGoals.Where(f => f.UserId == uid).ToListAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FinancialGoal>> GetGoal(int id)
        {
            var uid = _current.UserId;
            var goal = await _context.FinancialGoals.FirstOrDefaultAsync(f => f.Id == id && f.UserId == uid);
            return goal is null ? NotFound() : Ok(goal);
        }

        [HttpPost]
        public async Task<ActionResult<FinancialGoal>> PostGoal(FinancialGoalDto dto)
        {
            var uid = _current.UserId;
            var goal = new FinancialGoal
            {
                UserId = uid,
                GoalName = dto.GoalName,
                TargetAmount = dto.TargetAmount,
                CurrentProgress = dto.CurrentProgress,
                Deadline = dto.Deadline
            };

            _context.FinancialGoals.Add(goal);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetGoal), new { id = goal.Id }, goal);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutGoal(int id, FinancialGoalDto dto)
        {
            var uid = _current.UserId;
            var goal = await _context.FinancialGoals.FirstOrDefaultAsync(f => f.Id == id && f.UserId == uid);
            if (goal == null) return NotFound();

            goal.GoalName = dto.GoalName;
            goal.TargetAmount = dto.TargetAmount;
            goal.CurrentProgress = dto.CurrentProgress;
            goal.Deadline = dto.Deadline;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoal(int id)
        {
            var uid = _current.UserId;
            var goal = await _context.FinancialGoals.FirstOrDefaultAsync(f => f.Id == id && f.UserId == uid);
            if (goal == null) return NotFound();

            _context.FinancialGoals.Remove(goal);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
