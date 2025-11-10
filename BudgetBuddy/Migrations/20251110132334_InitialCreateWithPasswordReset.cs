using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BudgetBuddy.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreateWithPasswordReset : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Email = table.Column<string>(type: "TEXT", nullable: false),
                    PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                    FullName = table.Column<string>(type: "TEXT", nullable: false),
                    ResetToken = table.Column<string>(type: "TEXT", nullable: true),
                    ResetTokenExpiry = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AIRecommendations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    RecommendationText = table.Column<string>(type: "TEXT", nullable: false),
                    GeneratedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AIRecommendations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AIRecommendations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BudgetEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Month = table.Column<int>(type: "INTEGER", nullable: false),
                    Monthly_Income = table.Column<double>(type: "REAL", nullable: false),
                    Rent = table.Column<double>(type: "REAL", nullable: false),
                    Loan_Repayment = table.Column<double>(type: "REAL", nullable: false),
                    Insurance = table.Column<double>(type: "REAL", nullable: false),
                    Subscriptions = table.Column<double>(type: "REAL", nullable: false),
                    Groceries = table.Column<double>(type: "REAL", nullable: false),
                    Travel = table.Column<double>(type: "REAL", nullable: false),
                    Going_Out = table.Column<double>(type: "REAL", nullable: false),
                    Entertainment = table.Column<double>(type: "REAL", nullable: false),
                    Utilities = table.Column<double>(type: "REAL", nullable: false),
                    Healthcare = table.Column<double>(type: "REAL", nullable: false),
                    Education = table.Column<double>(type: "REAL", nullable: false),
                    Miscellaneous = table.Column<double>(type: "REAL", nullable: false),
                    Savings = table.Column<double>(type: "REAL", nullable: false),
                    Investments = table.Column<double>(type: "REAL", nullable: false),
                    Net_Worth = table.Column<double>(type: "REAL", nullable: false),
                    Financial_Goals = table.Column<string>(type: "TEXT", nullable: false),
                    Debt = table.Column<double>(type: "REAL", nullable: false),
                    Total_Liabilities = table.Column<double>(type: "REAL", nullable: false),
                    Total_Expenses = table.Column<double>(type: "REAL", nullable: false),
                    Monthly_Savings = table.Column<double>(type: "REAL", nullable: false),
                    Needs = table.Column<double>(type: "REAL", nullable: false),
                    Wants = table.Column<double>(type: "REAL", nullable: false),
                    Savings_Investment_Total = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BudgetEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BudgetEntries_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FinancialGoals",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    GoalName = table.Column<string>(type: "TEXT", nullable: false),
                    TargetAmount = table.Column<double>(type: "REAL", nullable: false),
                    CurrentProgress = table.Column<double>(type: "REAL", nullable: false),
                    Deadline = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinancialGoals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinancialGoals_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AIRecommendations_UserId",
                table: "AIRecommendations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetEntries_UserId",
                table: "BudgetEntries",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FinancialGoals_UserId",
                table: "FinancialGoals",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AIRecommendations");

            migrationBuilder.DropTable(
                name: "BudgetEntries");

            migrationBuilder.DropTable(
                name: "FinancialGoals");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}
