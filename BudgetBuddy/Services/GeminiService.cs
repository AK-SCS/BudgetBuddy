using BudgetBuddy.API.Data;
using BudgetBuddy.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace BudgetBuddy.API.Services
{
    /// <summary>
    /// Service for integrating with Google Gemini AI API to provide personalized financial advice
    /// Contextualizes responses using user's budget data and financial goals
    /// </summary>
    public class GeminiService
    {
        private readonly string _apiKey;
        private readonly BudgetBuddyDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<GeminiService> _logger;

        public GeminiService(IConfiguration configuration, BudgetBuddyDbContext context, IHttpClientFactory httpClientFactory, ILogger<GeminiService> logger)
        {
            _apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini API key not found");
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        /// <summary>
        /// Generates AI-powered financial advice based on user's budget context
        /// Combines user message with recent budget data and financial goals
        /// </summary>
        /// <param name="userMessage">User's question or request</param>
        /// <param name="userId">ID of the user requesting advice</param>
        /// <returns>AI-generated financial advice</returns>
        public async Task<string> GetFinancialAdviceAsync(string userMessage, int userId)
        {
            try
            {
                _logger.LogInformation("Getting financial advice for user {UserId}", userId);

                var budgetContext = await GetUserBudgetContextAsync(userId);

                var prompt = $@"You are a helpful financial advisor assistant for BudgetBuddy, a personal finance management application.

{budgetContext}

User Question: {userMessage}

Provide practical, actionable financial advice based on their budget data. Keep responses concise, friendly, and specific to their situation.";

                var client = _httpClientFactory.CreateClient();
                var requestBody = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = prompt }
                            }
                        }
                    }
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";
                _logger.LogInformation("Calling Gemini API...");

                var response = await client.PostAsync(url, content);

                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogInformation("Gemini API Response Status: {StatusCode}", response.StatusCode);
                _logger.LogInformation("Gemini API Response: {Response}", responseContent);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Gemini API Error: {Error}", responseContent);
                    return $"AI service error: {response.StatusCode}. Please check your API key.";
                }

                var doc = JsonDocument.Parse(responseContent);

                var textResponse = doc.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();

                return textResponse ?? "I'm sorry, I couldn't generate a response.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting financial advice");
                return $"I apologize, but I encountered an error: {ex.Message}";
            }
        }

        /// <summary>
        /// Retrieves list of available Gemini AI models from the API
        /// </summary>
        /// <returns>JSON string of available models</returns>
        public async Task<string> ListAvailableModels()
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                var url = $"https://generativelanguage.googleapis.com/v1beta/models?key={_apiKey}";
                
                var response = await client.GetAsync(url);
                var content = await response.Content.ReadAsStringAsync();
                
                _logger.LogInformation("Available Models: {Content}", content);
                return content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error listing models");
                return ex.Message;
            }
        }

        /// <summary>
        /// Builds contextual information about user's financial situation
        /// Includes recent budget entries, expense breakdown, and financial goals
        /// </summary>
        /// <param name="userId">User ID to retrieve context for</param>
        /// <returns>Formatted context string for AI prompt</returns>
        private async Task<string> GetUserBudgetContextAsync(int userId)
        {
            var budgetEntries = await _context.BudgetEntries
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.Month)
                .Take(3)
                .ToListAsync();

            var goals = await _context.FinancialGoals
                .Where(g => g.UserId == userId)
                .ToListAsync();

            if (!budgetEntries.Any())
            {
                return "User has no budget entries yet.";
            }

            var latestEntry = budgetEntries.First();
            var totalIncome = latestEntry.Monthly_Income;
            var totalExpenses = latestEntry.Total_Expenses;
            var savings = latestEntry.Monthly_Savings;

            var context = $@"User's Current Financial Overview:
- Monthly Income: ${totalIncome:N2}
- Total Expenses: ${totalExpenses:N2}
- Monthly Savings: ${savings:N2}
- Net Worth: ${latestEntry.Net_Worth:N2}
- Debt: ${latestEntry.Debt:N2}

Expense Breakdown:
- Rent: ${latestEntry.Rent:N2}
- Loan Repayment: ${latestEntry.Loan_Repayment:N2}
- Insurance: ${latestEntry.Insurance:N2}
- Groceries: ${latestEntry.Groceries:N2}
- Utilities: ${latestEntry.Utilities:N2}
- Travel: ${latestEntry.Travel:N2}
- Entertainment: ${latestEntry.Entertainment:N2}
- Healthcare: ${latestEntry.Healthcare:N2}
- Education: ${latestEntry.Education:N2}

Budget Allocation:
- Needs: ${latestEntry.Needs:N2}
- Wants: ${latestEntry.Wants:N2}
- Savings & Investments: ${latestEntry.Savings_Investment_Total:N2}";

            if (goals.Any())
            {
                context += $"\n\nFinancial Goals:";
                foreach (var goal in goals.Take(3))
                {
                    var progress = goal.TargetAmount > 0 ? (goal.CurrentProgress / goal.TargetAmount * 100) : 0;
                    context += $"\n- {goal.GoalName}: ${goal.CurrentProgress:N2} / ${goal.TargetAmount:N2} ({progress:N1}% complete, Deadline: {goal.Deadline:d})";
                }
            }

            return context;
        }
    }

    /// <summary>
    /// Represents a single chat message in a conversation
    /// </summary>
    public class ChatMessage
    {
        public bool IsUser { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }
}