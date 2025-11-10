using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace BudgetBuddy.API.Controllers;

/// <summary>
/// Proxies requests to the Python ML service for predictions and budget allocation
/// </summary>
[Authorize]
[ApiController]
[Route("api/[controller]")]
public class MLController : ControllerBase
{
    private readonly IHttpClientFactory _http;
    public MLController(IHttpClientFactory http) => _http = http;

    /// <summary>
    /// Predicts total expenses using machine learning model based on budget categories
    /// Normalizes input field names to handle both camelCase and snake_case
    /// </summary>
    /// <param name="body">Budget data with income and expense categories</param>
    /// <returns>ML prediction with confidence level</returns>
    [HttpPost("predict")]
    public async Task<IActionResult> Predict([FromBody] JsonElement body)
    {
        var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(body.GetRawText())
                   ?? new Dictionary<string, JsonElement>(StringComparer.OrdinalIgnoreCase);

        string ReadNum(string a, string b, string fallback = "0") =>
            dict.TryGetValue(a, out var v1) ? v1.GetRawText()
          : dict.TryGetValue(b, out var v2) ? v2.GetRawText()
          : fallback;

        string month = dict.ContainsKey("month") ? dict["month"].GetRawText() : "0";

        var payload = new
        {
            month = JsonSerializer.Deserialize<int>(month),
            monthly_income = JsonSerializer.Deserialize<decimal>(ReadNum("monthly_income", "monthlyIncome")),
            rent = JsonSerializer.Deserialize<decimal>(ReadNum("rent", "rent")),
            loan_repayment = JsonSerializer.Deserialize<decimal>(ReadNum("loan_repayment", "loanRepayment")),
            insurance = JsonSerializer.Deserialize<decimal>(ReadNum("insurance", "insurance")),
            subscriptions = JsonSerializer.Deserialize<decimal>(ReadNum("subscriptions", "subscriptions")),
            groceries = JsonSerializer.Deserialize<decimal>(ReadNum("groceries", "groceries")),
            travel = JsonSerializer.Deserialize<decimal>(ReadNum("travel", "travel")),
            going_out = JsonSerializer.Deserialize<decimal>(ReadNum("going_out", "goingOut")),
            entertainment = JsonSerializer.Deserialize<decimal>(ReadNum("entertainment", "entertainment")),
            utilities = JsonSerializer.Deserialize<decimal>(ReadNum("utilities", "utilities")),
            healthcare = JsonSerializer.Deserialize<decimal>(ReadNum("healthcare", "healthcare")),
            education = JsonSerializer.Deserialize<decimal>(ReadNum("education", "education")),
            miscellaneous = JsonSerializer.Deserialize<decimal>(ReadNum("miscellaneous", "miscellaneous"))
        };

        var client = _http.CreateClient("ml");
        var res = await client.PostAsJsonAsync("/predict", payload);
        var json = await res.Content.ReadAsStringAsync();
        return Content(json, "application/json");
    }

    /// <summary>
    /// Generates smart spare cash allocation recommendations using ML service
    /// Accepts flexible field names for income and expenses
    /// </summary>
    /// <param name="body">Income and expense data for allocation analysis</param>
    /// <returns>Prioritized allocation recommendations</returns>
    [HttpPost("allocate")]
    public async Task<IActionResult> Allocate([FromBody] JsonElement body)
    {
        using var doc = JsonDocument.Parse(body.GetRawText());
        var root = doc.RootElement;
        var income = root.TryGetProperty("income", out var i) ? i.GetDecimal()
                   : root.TryGetProperty("monthly_income", out var mi) ? mi.GetDecimal()
                   : 0m;

        var expenses = root.TryGetProperty("expenses", out var e) ? e.GetDecimal()
                     : root.TryGetProperty("total_expenses", out var te) ? te.GetDecimal()
                     : 0m;

        var client = _http.CreateClient("ml");
        var payload = new { income, expenses };
        var res = await client.PostAsJsonAsync("/allocate", payload);
        var json = await res.Content.ReadAsStringAsync();
        return Content(json, "application/json");
    }

}
