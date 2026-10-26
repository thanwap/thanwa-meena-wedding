using System.Reflection;
using WeddingApi.Security;

namespace WeddingApi.UnitTests;

public class GuestIpTests
{
    [Theory]
    [InlineData("203.0.113.7", "203.0.113.7")]
    [InlineData(" 203.0.113.7 ", "203.0.113.7")]
    [InlineData("::ffff:203.0.113.7", "203.0.113.7")]
    [InlineData("2001:db8:1:2:aaaa:bbbb:cccc:dddd", "2001:db8:1:2::/64")]
    [InlineData("2001:db8:1:2::1", "2001:db8:1:2::/64")]
    [InlineData(null, GuestIp.Unknown)]
    [InlineData("", GuestIp.Unknown)]
    [InlineData("not-an-ip", GuestIp.Unknown)]
    [InlineData("203.0.113.7, 10.0.0.1", GuestIp.Unknown)]
    public void Normalize(string? raw, string expected)
    {
        Assert.Equal(expected, GuestIp.Normalize(raw));
    }
}

public class GuestRateLimitTests
{
    [Fact]
    public void EveryAnnotatedEndpoint_UsesAKnownPolicy()
    {
        var used = typeof(Program).Assembly.GetTypes()
            .SelectMany(t => t.GetMethods())
            .SelectMany(m => m.GetCustomAttributes<GuestRateLimitAttribute>())
            .Select(a => a.Policy)
            .ToList();

        Assert.NotEmpty(used);
        Assert.All(used, policy => Assert.True(GuestRateLimits.Policies.ContainsKey(policy), policy));
    }
}

public class GuestTextTests
{
    [Theory]
    [InlineData("a\u0000b", "ab")]
    [InlineData("‮evil", "evil")]
    [InlineData("  line1\nline2  ", "line1\nline2")]
    [InlineData(null, "")]
    public void Clean(string? raw, string expected)
    {
        Assert.Equal(expected, GuestText.Clean(raw));
    }
}
