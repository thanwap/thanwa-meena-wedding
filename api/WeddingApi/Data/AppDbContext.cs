using Microsoft.EntityFrameworkCore;
using WeddingApi.Entities;

namespace WeddingApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Config> Configs => Set<Config>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Config>(entity =>
        {
            entity.ToTable("configs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).UseIdentityColumn();

            entity.Property(e => e.Key)
                .HasMaxLength(100)
                .IsRequired();
            entity.HasIndex(e => e.Key).IsUnique();

            entity.Property(e => e.Value)
                .HasMaxLength(300)
                .IsRequired();

            entity.Property(e => e.Type)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.DeletedAt).IsRequired(false);

            // Automatically excludes soft-deleted rows from all queries
            entity.HasQueryFilter(e => e.DeletedAt == null);
        });
    }
}
