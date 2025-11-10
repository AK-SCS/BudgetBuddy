using BudgetBuddy.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BudgetBuddy.API.Data
{
    /// <summary>
    /// Entity Framework database context for BudgetBuddy application
    /// Manages users, budget entries, financial goals, and AI recommendations
    /// </summary>
    public class BudgetBuddyDbContext : DbContext
    {
        public BudgetBuddyDbContext(DbContextOptions<BudgetBuddyDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<BudgetEntry> BudgetEntries => Set<BudgetEntry>();
        public DbSet<FinancialGoal> FinancialGoals => Set<FinancialGoal>();
        public DbSet<AIRecommendation> AIRecommendations => Set<AIRecommendation>();

        /// <summary>
        /// Configures entity relationships and database-specific conversions
        /// Ensures unique email constraint and handles SQLite decimal conversion
        /// </summary>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

            modelBuilder.Entity<User>()
                .HasMany(u => u.BudgetEntries)
                .WithOne(b => b.User)
                .HasForeignKey(b => b.UserId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.FinancialGoals)
                .WithOne(f => f.User)
                .HasForeignKey(f => f.UserId);

            modelBuilder.Entity<User>()
                .HasMany(u => u.AIRecommendations)
                .WithOne(a => a.User)
                .HasForeignKey(a => a.UserId);

            if (Database.IsSqlite())
            {
                var conv = new ValueConverter<decimal, double>(v => (double)v, v => (decimal)v);
                foreach (var p in modelBuilder.Model.GetEntityTypes().SelectMany(t => t.GetProperties()).Where(p => p.ClrType == typeof(decimal)))
                    p.SetValueConverter(conv);
            }
        }
    }
}
