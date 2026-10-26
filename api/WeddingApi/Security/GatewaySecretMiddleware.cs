using System.Security.Cryptography;
using System.Text;

namespace WeddingApi.Security;

/// <summary>
/// Only the Next.js server may call the API: every request must carry the shared
/// <c>X-Gateway-Secret</c>. Without it the public Railway URL would let anyone skip
/// the site, forge <c>X-Guest-Ip</c> and dodge the per-guest rate limits.
/// </summary>
public class GatewaySecretMiddleware
{
    public const string HeaderName = "X-Gateway-Secret";

    private readonly RequestDelegate _next;
    private readonly byte[] _secret;

    public GatewaySecretMiddleware(RequestDelegate next, string secret)
    {
        _next = next;
        _secret = Encoding.UTF8.GetBytes(secret);
    }

    public Task InvokeAsync(HttpContext context)
    {
        var provided = Encoding.UTF8.GetBytes(context.Request.Headers[HeaderName].ToString());
        // FixedTimeEquals returns false on length mismatch without leaking where the bytes differ
        if (!CryptographicOperations.FixedTimeEquals(provided, _secret))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }
        return _next(context);
    }
}
