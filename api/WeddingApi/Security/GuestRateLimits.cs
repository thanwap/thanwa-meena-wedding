using System.Threading.RateLimiting;

namespace WeddingApi.Security;

/// <summary>Marks an endpoint with one of the <see cref="GuestRateLimits"/> policies.</summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class)]
public sealed class GuestRateLimitAttribute(string policy) : Attribute
{
    public string Policy { get; } = policy;
}

/// <summary>
/// Public endpoints get two fixed windows: one per guest IP (so one script can't lock
/// everyone out) and one global ceiling (so many IPs together can't flood the database).
/// The per-guest window is checked first, so a guest who is already over their limit
/// doesn't eat into the global budget.
/// </summary>
public static class GuestRateLimits
{
    public record Policy(int PerGuest, int Global, TimeSpan Window);

    public static readonly IReadOnlyDictionary<string, Policy> Policies = new Dictionary<string, Policy>
    {
        // Venue Wi-Fi puts a whole room behind one IP — per-guest limits leave room for that
        ["guestbook-post"] = new(15, 120, TimeSpan.FromMinutes(1)),
        ["rsvp-post"] = new(15, 60, TimeSpan.FromMinutes(1)),
        ["login-post"] = new(5, 30, TimeSpan.FromMinutes(15)),
        ["photos-upload"] = new(30, 100, TimeSpan.FromMinutes(10)),
        // Re-picking a slip uploads again, so leave room for a few tries per notice
        ["gift-slip-upload"] = new(10, 100, TimeSpan.FromMinutes(10)),
        ["gift-notice-post"] = new(15, 60, TimeSpan.FromMinutes(1)),
        ["photos-delete"] = new(30, 300, TimeSpan.FromMinutes(1)),
        ["table-search"] = new(20, 600, TimeSpan.FromMinutes(1)),
        ["photos-get"] = new(120, 1200, TimeSpan.FromMinutes(1)),
        // Read through Next's cache, so it arrives without a guest IP
        ["guestbook-get"] = new(60, 60, TimeSpan.FromMinutes(1)),
    };

    public static PartitionedRateLimiter<HttpContext> Create() =>
        PartitionedRateLimiter.CreateChained(
            PartitionedRateLimiter.Create<HttpContext, string>(context =>
                PolicyOf(context) is { } name
                    ? Window($"{name}|{GuestIp.Resolve(context)}", Policies[name].PerGuest, Policies[name].Window)
                    : RateLimitPartition.GetNoLimiter(string.Empty)),
            PartitionedRateLimiter.Create<HttpContext, string>(context =>
                PolicyOf(context) is { } name
                    ? Window(name, Policies[name].Global, Policies[name].Window)
                    : RateLimitPartition.GetNoLimiter(string.Empty)));

    private static string? PolicyOf(HttpContext context)
    {
        var name = context.GetEndpoint()?.Metadata.GetMetadata<GuestRateLimitAttribute>()?.Policy;
        return name is not null && Policies.ContainsKey(name) ? name : null;
    }

    private static RateLimitPartition<string> Window(string key, int permits, TimeSpan window) =>
        RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = permits,
            Window = window,
            QueueLimit = 0,
        });
}
