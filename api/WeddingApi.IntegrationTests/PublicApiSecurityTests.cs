using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;

namespace WeddingApi.IntegrationTests;

/// <summary>
/// Abuse cases for the public API: direct calls that skip the site, per-guest rate
/// limits, photo ownership and hostile input.
/// </summary>
public class PublicApiSecurityTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public PublicApiSecurityTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    private static MultipartFormDataContent Letter(string name = "Guest", string message = "ยินดีด้วย") => new()
    {
        { new StringContent(name), "name" },
        { new StringContent(message), "message" },
        { new StringContent("1"), "postcardId" },
    };

    private HttpClient Guest(string ip)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Remove("X-Guest-Ip");
        client.DefaultRequestHeaders.Add("X-Guest-Ip", ip);
        return client;
    }

    // ── Gateway secret ──────────────────────────────────────────────────────

    [Theory]
    [InlineData("GET", "/api/guestbook")]
    [InlineData("POST", "/api/guestbook")]
    [InlineData("POST", "/api/rsvps")]
    [InlineData("POST", "/api/auth/login")]
    [InlineData("POST", "/api/photos/upload")]
    [InlineData("GET", "/api/photos")]
    [InlineData("GET", "/api/table/search?name=ab")]
    [InlineData("GET", "/api/rsvps")]
    public async Task DirectCall_WithoutSecret_Returns403(string method, string url)
    {
        var client = _factory.CreateDirectClient();

        var response = await client.SendAsync(new HttpRequestMessage(new HttpMethod(method), url));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Theory]
    [InlineData("wrong")]
    [InlineData("")]
    [InlineData(CustomWebApplicationFactory.GatewaySecret + "x")]
    [InlineData("TEST-GATEWAY-SECRET-AT-LEAST-32-CHARACTERS-LONG")]
    public async Task DirectCall_WithWrongSecret_Returns403(string secret)
    {
        var client = _factory.CreateDirectClient();
        client.DefaultRequestHeaders.Add("X-Gateway-Secret", secret);

        var response = await client.PostAsync("/api/guestbook", Letter());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ── Per-guest rate limits ───────────────────────────────────────────────

    [Fact]
    public async Task GuestbookFlood_LimitsThatGuest_NotOthers()
    {
        var spammer = Guest(CustomWebApplicationFactory.RandomGuestIp());
        for (var i = 0; i < 15; i++)
            Assert.Equal(HttpStatusCode.Created, (await spammer.PostAsync("/api/guestbook", Letter())).StatusCode);

        Assert.Equal(HttpStatusCode.TooManyRequests, (await spammer.PostAsync("/api/guestbook", Letter())).StatusCode);

        var guest = Guest(CustomWebApplicationFactory.RandomGuestIp());
        Assert.Equal(HttpStatusCode.Created, (await guest.PostAsync("/api/guestbook", Letter())).StatusCode);
    }

    [Fact]
    public async Task Ipv6Guest_RotatingWithinTheirSlash64_SharesOneLimit()
    {
        var prefix = $"2001:db8:{Random.Shared.Next(0xffff):x}:{Random.Shared.Next(0xffff):x}";
        for (var i = 1; i <= 15; i++)
            Assert.Equal(HttpStatusCode.Created,
                (await Guest($"{prefix}::{i:x}").PostAsync("/api/guestbook", Letter())).StatusCode);

        var rotated = await Guest($"{prefix}::beef").PostAsync("/api/guestbook", Letter());

        Assert.Equal(HttpStatusCode.TooManyRequests, rotated.StatusCode);
    }

    [Fact]
    public async Task LoginBruteForce_LimitsThatGuest_AdminElsewhereStillGetsThrough()
    {
        var attacker = Guest(CustomWebApplicationFactory.RandomGuestIp());
        var attempt = new LoginRequest("thanwa", "guess");
        for (var i = 0; i < 5; i++)
            Assert.Equal(HttpStatusCode.Unauthorized, (await attacker.PostAsJsonAsync("/api/auth/login", attempt)).StatusCode);

        Assert.Equal(HttpStatusCode.TooManyRequests, (await attacker.PostAsJsonAsync("/api/auth/login", attempt)).StatusCode);

        var admin = Guest(CustomWebApplicationFactory.RandomGuestIp());
        Assert.Equal(HttpStatusCode.Unauthorized, (await admin.PostAsJsonAsync("/api/auth/login", attempt)).StatusCode);
    }

    // ── Photo ownership ─────────────────────────────────────────────────────

    private async Task<(Guid mine, Guid theirs)> SeedPhotosAsync(string myDevice, string theirDevice)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        Photo Make(string device) => new()
        {
            Id = Guid.NewGuid(),
            DeviceId = device,
            DisplayName = "Booth",
            FilePath = "full/x.jpg",
            ThumbPath = "thumb/x.jpg",
            CreatedAt = DateTime.UtcNow,
        };
        var mine = Make(myDevice);
        var theirs = Make(theirDevice);
        db.Photos.AddRange(mine, theirs);
        await db.SaveChangesAsync();
        return (mine.Id, theirs.Id);
    }

    [Fact]
    public async Task PhotoList_MarksOwnPhotos_AndNeverExposesDeviceIds()
    {
        var me = Guid.NewGuid().ToString();
        var other = Guid.NewGuid().ToString();
        var (mineId, theirsId) = await SeedPhotosAsync(me, other);
        var client = _factory.CreateClient();

        var json = await client.GetStringAsync($"/api/photos?deviceId={me}&limit=50");

        Assert.DoesNotContain(me, json);
        Assert.DoesNotContain(other, json);
        Assert.DoesNotContain("deviceId", json, StringComparison.OrdinalIgnoreCase);
        var page = JsonSerializer.Deserialize<PhotoPagedResult>(json, JsonSerializerOptions.Web)!;
        Assert.True(page.Photos.Single(p => p.Id == mineId).IsMine);
        Assert.False(page.Photos.Single(p => p.Id == theirsId).IsMine);

        var mineOnly = await client.GetFromJsonAsync<PhotoPagedResult>($"/api/photos?deviceId={me}&mine=true");
        Assert.Equal(mineId, Assert.Single(mineOnly!.Photos).Id);
    }

    [Fact]
    public async Task DeletingSomeoneElsesPhoto_Returns404_AndKeepsIt()
    {
        var owner = Guid.NewGuid().ToString();
        var (photoId, _) = await SeedPhotosAsync(owner, Guid.NewGuid().ToString());
        var client = _factory.CreateClient();

        var response = await client.SendAsync(new HttpRequestMessage(HttpMethod.Delete, $"/api/photos/{photoId}")
        {
            Content = JsonContent.Create(new PhotoDeleteRequest(Guid.NewGuid().ToString())),
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        using var scope = _factory.Services.CreateScope();
        Assert.NotNull(await scope.ServiceProvider.GetRequiredService<AppDbContext>().Photos.FindAsync(photoId));
    }

    [Theory]
    [InlineData("../../etc")]
    [InlineData("abc")]
    [InlineData("")]
    public async Task PhotoList_WithMalformedDeviceId_Returns400(string deviceId)
    {
        var response = await _factory.CreateClient().GetAsync($"/api/photos?deviceId={Uri.EscapeDataString(deviceId)}&mine=true");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static MultipartFormDataContent Upload(byte[] full, string deviceId, string displayName = "Booth", string filter = "none")
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(deviceId), "deviceId" },
            { new StringContent(displayName), "displayName" },
            { new StringContent(filter), "filterName" },
        };
        form.Add(new ByteArrayContent(full), "full", "full.jpg");
        form.Add(new ByteArrayContent(full), "thumb", "thumb.jpg");
        return form;
    }

    [Fact]
    public async Task Upload_NonJpeg_Returns400()
    {
        var html = "<html><script>alert(1)</script></html>"u8.ToArray();

        var response = await _factory.CreateClient().PostAsync("/api/photos/upload", Upload(html, Guid.NewGuid().ToString()));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData("../evil", "Booth", "none")]
    [InlineData(null, "", "none")]
    [InlineData(null, "​​", "none")]
    [InlineData(null, "This display name is far too long to fit on a photo", "none")]
    [InlineData(null, "Booth", "<script>")]
    public async Task Upload_WithBadFields_Returns400(string? deviceId, string displayName, string filter)
    {
        byte[] jpeg = [0xFF, 0xD8, 0xFF, 0xE0, 0, 0];

        var response = await _factory.CreateClient().PostAsync("/api/photos/upload",
            Upload(jpeg, deviceId ?? Guid.NewGuid().ToString(), displayName, filter));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ── RSVP input ──────────────────────────────────────────────────────────

    [Theory]
    [InlineData("\u0000", null)]
    [InlineData("​", null)]
    [InlineData("Guest", "x")]
    public async Task Rsvp_WithHostileInput_Returns400_NotServerError(string name, string? longField)
    {
        var request = new RsvpCreateRequest(
            Attending: true,
            Name: longField is null ? name : new string('ก', 121),
            GuestCount: 1,
            Dietary: null,
            Message: null,
            HpWebsite: null);

        var response = await _factory.CreateClient().PostAsJsonAsync("/api/rsvps", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Rsvp_WithNulInMessage_StripsIt()
    {
        var request = new RsvpCreateRequest(true, "Nul\u0000Guest", 1, null, "hi\u0000there", null);

        var response = await _factory.CreateClient().PostAsJsonAsync("/api/rsvps", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<RsvpDto>();
        Assert.Equal("NulGuest", created!.Name);
    }
}
