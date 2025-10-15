using System.ComponentModel.DataAnnotations;

namespace BudgetBuddy.API.Dtos
{
    public class RegisterDto
    {
        [Required, EmailAddress] public string Email { get; set; } = default!;
        [Required, MinLength(6)] public string Password { get; set; } = default!;
        [Required, StringLength(50)] public string FullName { get; set; } = default!;
    }
}
