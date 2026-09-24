using Auth.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace Auth.Api.Data
{
    public class AuthDbContext : DbContext
    {
        public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();

                entity.HasData(new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@prestamos.com",
                    PasswordHash = "$2a$11$qRzS2jU5/d0bY6nN5gG1p.L/4XzV8p7M6qO5nN3kL1jI9hH7gF6eS", // BCrypt hash de "password123"
                    CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                });
            });
        }
    }
}
