using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace WeddingApi.Data;

/// <summary>
/// Used only by EF Core CLI tooling (dotnet ef migrations add / database update).
/// Set the DESIGN_TIME_DB environment variable to your Supabase connection string
/// when running database update. Migrations generation does not need a live connection.
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("DESIGN_TIME_DB")
            ?? "Host=localhost;Database=wedding;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new AppDbContext(optionsBuilder.Options);
    }
}
