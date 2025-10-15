using BudgetBuddy.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace BudgetBuddy.API.Data
{
    public class BudgetBuddyDbContext : DbContext
    {
        public BudgetBuddyDbContext(DbContextOptions<BudgetBuddyDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<BudgetEntry> BudgetEntries => Set<BudgetEntry>();
        public DbSet<FinancialGoal> FinancialGoals => Set<FinancialGoal>();
        public DbSet<AIRecommendation> AIRecommendations => Set<AIRecommendation>();

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

            // SQLite: map decimal <-> double
            if (Database.IsSqlite())
            {
                var conv = new ValueConverter<decimal, double>(v => (double)v, v => (decimal)v);
                foreach (var p in modelBuilder.Model.GetEntityTypes().SelectMany(t => t.GetProperties()).Where(p => p.ClrType == typeof(decimal)))
                    p.SetValueConverter(conv);
            }
        }
    }
}
