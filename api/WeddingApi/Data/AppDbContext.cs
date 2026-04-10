using Microsoft.EntityFrameworkCore;
using WeddingApi.Entities;

namespace WeddingApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Config> Configs => Set<Config>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<Rsvp> Rsvps => Set<Rsvp>();
    public DbSet<Guest> Guests => Set<Guest>();
    public DbSet<WeddingTable> WeddingTables => Set<WeddingTable>();

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

        modelBuilder.Entity<Rsvp>(entity =>
        {
            entity.ToTable("rsvps");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).UseIdentityColumn();

            entity.Property(e => e.Name)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(e => e.Dietary)
                .HasMaxLength(300)
                .IsRequired(false);

            entity.Property(e => e.Message)
                .HasMaxLength(1000)
                .IsRequired(false);

            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
            entity.Property(e => e.DeletedAt).IsRequired(false);

            // Automatically excludes soft-deleted rows from all queries
            entity.HasQueryFilter(e => e.DeletedAt == null);

            entity.HasIndex(e => e.CreatedAt);
        });

        modelBuilder.Entity<Guest>(entity =>
        {
            entity.ToTable("guests");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).UseIdentityColumn();

            entity.Property(e => e.Name)
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(e => e.SortOrder).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();

            entity.HasOne(e => e.Rsvp)
                .WithMany(r => r.Guests)
                .HasForeignKey(e => e.RsvpId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Table)
                .WithMany(t => t.Guests)
                .HasForeignKey(e => e.TableId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.RsvpId);
            entity.HasIndex(e => e.TableId);
        });

        modelBuilder.Entity<WeddingTable>(entity =>
        {
            entity.ToTable("wedding_tables");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).UseIdentityColumn();

            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(e => e.Capacity).IsRequired();

            entity.Property(e => e.Shape)
                .HasMaxLength(20)
                .IsRequired()
                .HasDefaultValue("circle");

            entity.Property(e => e.PositionX).HasDefaultValue(0.0);
            entity.Property(e => e.PositionY).HasDefaultValue(0.0);

            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
        });

        modelBuilder.Entity<AdminUser>(entity =>
        {
            entity.ToTable("admin_users");
            entity.HasKey(e => e.Username);
            entity.Property(e => e.Username).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(200).IsRequired();
            entity.Property(e => e.UpdatedAt).IsRequired();
        });
    }
}
