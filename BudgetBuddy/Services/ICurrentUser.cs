namespace BudgetBuddy.API.Services
{
    public interface ICurrentUser
    {
        int UserId { get; }
        string? Email { get; }
        bool IsAdmin { get; }
    }
}
