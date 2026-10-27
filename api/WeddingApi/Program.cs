using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WeddingApi.Data;
using WeddingApi.Security;
using WeddingApi.Services;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ──────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── Services ──────────────────────────────────────────────────────────────
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IStorageService, SupabaseStorageService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRsvpService, RsvpService>();
builder.Services.AddScoped<ISeatingService, SeatingService>();
builder.Services.AddScoped<IGuestbookService, GuestbookService>();
builder.Services.AddScoped<IPhotoService, PhotoService>();
builder.Services.AddSingleton<IPhotoStorage, SupabasePhotoStorage>();
builder.Services.AddSingleton<IImageProcessor, ImageSharpProcessor>();
builder.Services.AddScoped<IPreweddingPhotoService, PreweddingPhotoService>();
builder.Services.AddSingleton<ISlipStorage, SupabaseSlipStorage>();
builder.Services.AddScoped<IGiftNoticeService, GiftNoticeService>();
builder.Services.AddSingleton(TimeProvider.System);

// ─── CORS ──────────────────────────────────────────────────────────────────
var allowedOrigins = builder.Configuration["AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries)
    ?? ["http://localhost:3000"];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// ─── Rate Limiting ─────────────────────────────────────────────────────────
// Per-guest + global windows for public endpoints — see GuestRateLimits
builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = GuestRateLimits.Create();
    options.RejectionStatusCode = 429;
});

// ─── Gateway secret ────────────────────────────────────────────────────────
// Shared with the Next.js server (Vercel API_GATEWAY_SECRET). Production refuses to
// start without it — an unguarded API would let anyone forge X-Guest-Ip.
var gatewaySecret = builder.Configuration["Gateway:Secret"];
if (string.IsNullOrEmpty(gatewaySecret) && builder.Environment.IsProduction())
    throw new InvalidOperationException("Gateway:Secret is not configured");
if (!string.IsNullOrEmpty(gatewaySecret) && gatewaySecret.Length < 32)
    throw new InvalidOperationException("Gateway:Secret must be at least 32 characters");

// ─── Authentication: self-issued HS256 JWT ────────────────────────────────
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "wedding-api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "wedding-web";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();

var app = builder.Build();

// ─── One-off CLI: `dotnet run -- seed-admins` or `reset-admins` ───────────
if (args.Length > 0 && (args[0] == "seed-admins" || args[0] == "reset-admins"))
{
    var reset = args[0] == "reset-admins";
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    var fixedPassword = Environment.GetEnvironmentVariable("SEED_PASSWORD");

    string GeneratePassword()
    {
        if (fixedPassword is not null) return fixedPassword;
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        var bytes = new byte[16];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        var sb = new System.Text.StringBuilder(16);
        foreach (var b in bytes) sb.Append(chars[b % chars.Length]);
        return sb.ToString();
    }

    var results = new List<(string user, string pw, string status)>();

    foreach (var username in new[] { "thanwa", "meena" })
    {
        var existing = db.AdminUsers.FirstOrDefault(u => u.Username == username);

        if (existing is not null && !reset)
        {
            results.Add((username, "(unchanged)", "skipped"));
            continue;
        }

        var password = GeneratePassword();
        var hash = BCrypt.Net.BCrypt.HashPassword(password);

        if (existing is not null)
        {
            existing.PasswordHash = hash;
            existing.Role = "super_admin";
            existing.UpdatedAt = DateTime.UtcNow;
            results.Add((username, password, "reset"));
        }
        else
        {
            db.AdminUsers.Add(new WeddingApi.Entities.AdminUser
            {
                Username = username,
                PasswordHash = hash,
                Role = "super_admin",
                UpdatedAt = DateTime.UtcNow,
            });
            results.Add((username, password, "created"));
        }
    }
    db.SaveChanges();

    // Print passwords AFTER SaveChanges so EF debug logs don't bury them
    Console.Error.Flush();
    Console.Out.Flush();
    Console.WriteLine();
    Console.WriteLine("==================================================");
    Console.WriteLine("  ADMIN CREDENTIALS — SAVE NOW, WILL NOT REPEAT");
    Console.WriteLine("==================================================");
    foreach (var (user, pw, status) in results)
    {
        Console.WriteLine($"  {user,-10} {pw,-20} [{status}]");
    }
    Console.WriteLine("==================================================");
    Console.WriteLine();
    if (results.Any(r => r.status == "skipped"))
    {
        Console.WriteLine("Existing users were skipped. To regenerate passwords for");
        Console.WriteLine("existing users, run: dotnet run -- reset-admins");
        Console.WriteLine();
    }
    return;
}

if (!string.IsNullOrEmpty(gatewaySecret))
    app.UseMiddleware<GatewaySecretMiddleware>(gatewaySecret);
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Expose Program class for WebApplicationFactory in integration tests
public partial class Program { }
