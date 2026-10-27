using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Testcontainers.PostgreSql;
using WeddingApi.Data;
using WeddingApi.Services;

namespace WeddingApi.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    public FakePhotoStorage PhotoStorage { get; } = new();
    public FakeSlipStorage SlipStorage { get; } = new();

    public const string GatewaySecret = "test-gateway-secret-at-least-32-characters-long";

    public async Task InitializeAsync()
    {
        Environment.SetEnvironmentVariable("Jwt__Key", "test-secret-key-must-be-long-enough-for-hs256-aaaaaaaa");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "wedding-api");
        Environment.SetEnvironmentVariable("Jwt__Audience", "wedding-web");
        Environment.SetEnvironmentVariable("Gateway__Secret", GatewaySecret);
        await _postgres.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.StopAsync();
        await base.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // Override configuration before the app reads it
        builder.ConfigureAppConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Key"] = "test-secret-key-must-be-long-enough-for-hs256-aaaaaaaa",
                ["Jwt:Issuer"] = "wedding-api",
                ["Jwt:Audience"] = "wedding-web"
            });
        });

        // Override services AFTER the app's Program.cs registers them
        builder.ConfigureTestServices(services =>
        {
            // Replace real DbContext with Testcontainers connection
            var dbDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (dbDescriptor != null) services.Remove(dbDescriptor);

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(_postgres.GetConnectionString()));

            // Swap Supabase Storage for an in-memory fake
            services.RemoveAll<IPhotoStorage>();
            services.AddSingleton<IPhotoStorage>(PhotoStorage);
            services.RemoveAll<ISlipStorage>();
            services.AddSingleton<ISlipStorage>(SlipStorage);

            // Replace Google JWT auth with test scheme that always succeeds
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "Test";
                options.DefaultChallengeScheme = "Test";
                options.DefaultScheme = "Test";
            })
            .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>("Test", _ => { });
        });

        builder.UseEnvironment("Testing");
    }

    /// <summary>
    /// Clients act like the Next.js server: they send the gateway secret, and each client
    /// is a different guest IP so tests don't share rate-limit windows.
    /// </summary>
    protected override void ConfigureClient(HttpClient client)
    {
        base.ConfigureClient(client);
        client.DefaultRequestHeaders.Add("X-Gateway-Secret", GatewaySecret);
        client.DefaultRequestHeaders.Add("X-Guest-Ip", RandomGuestIp());
    }

    public static string RandomGuestIp() =>
        $"10.{Random.Shared.Next(256)}.{Random.Shared.Next(256)}.{Random.Shared.Next(1, 255)}";

    /// <summary>A client with no gateway secret — a direct call to the public Railway URL.</summary>
    public HttpClient CreateDirectClient()
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Remove("X-Gateway-Secret");
        return client;
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        // Run EF Core migrations against the Testcontainers Postgres instance
        using var scope = host.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();

        return host;
    }
}
