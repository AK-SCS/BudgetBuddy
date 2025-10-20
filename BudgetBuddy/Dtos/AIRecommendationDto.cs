using System.ComponentModel.DataAnnotations;

namespace BudgetBuddy.API.Dtos
{
    public class AIRecommendationDto
    {
        [Required] public string RecommendationText { get; set; } = default!;
    }
}
