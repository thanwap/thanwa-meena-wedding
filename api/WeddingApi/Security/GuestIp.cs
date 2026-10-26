using System.Net;
using System.Net.Sockets;

namespace WeddingApi.Security;

/// <summary>
/// The guest's IP as resolved by the Next.js server (requests reach the API from Vercel,
/// so the socket address is useless). Trusted only because <see cref="GatewaySecretMiddleware"/>
/// has already proven the request came from Next.
/// </summary>
public static class GuestIp
{
    public const string HeaderName = "X-Guest-Ip";

    /// <summary>Partition used when Next sent no guest IP (server-side cached reads).</summary>
    public const string Unknown = "unknown";

    public static string Resolve(HttpContext context) =>
        Normalize(context.Request.Headers[HeaderName].ToString());

    /// <summary>
    /// Canonical rate-limit key: IPv4 as-is, IPv6 truncated to its /64 — one home or phone
    /// gets a whole /64, so keying on the full address would let a guest rotate past the limit.
    /// </summary>
    public static string Normalize(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw) || !IPAddress.TryParse(raw.Trim(), out var ip))
            return Unknown;

        if (ip.IsIPv4MappedToIPv6) ip = ip.MapToIPv4();
        if (ip.AddressFamily != AddressFamily.InterNetworkV6) return ip.ToString();

        var bytes = ip.GetAddressBytes();
        Array.Clear(bytes, 8, 8);
        return $"{new IPAddress(bytes)}/64";
    }
}
