using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using WeddingApi.Dtos;

namespace WeddingApi.IntegrationTests;

/// <summary>Gift transfer notices against real PostgreSQL (slips go to <see cref="FakeSlipStorage"/>).</summary>
public class GiftNoticesApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public GiftNoticesApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private static byte[] JpegBytes()
    {
        using var image = new Image<Rgba32>(800, 1600, new Rgba32(245, 245, 245));
        using var ms = new MemoryStream();
        image.SaveAsJpeg(ms);
        return ms.ToArray();
    }

    private async Task<Guid> UploadSlipAsync()
    {
        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(JpegBytes());
        file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form.Add(file, "file", "slip.jpg");

        var res = await _client.PostAsync("/api/gift-notices/slips", form);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return (await res.Content.ReadFromJsonAsync<GiftSlipDto>())!.SlipId;
    }

    private Task<HttpResponseMessage> PostNoticeAsync(string giver, DateTimeOffset at, decimal? amount = null, Guid? slipId = null) =>
        _client.PostAsJsonAsync("/api/gift-notices", new GiftNoticeCreateRequest(giver, at, amount, slipId));

    private async Task<GiftNoticeDto> FindAsync(string giver) =>
        (await _client.GetFromJsonAsync<List<GiftNoticeDto>>("/api/gift-notices"))!.Single(n => n.Giver == giver);

    [Fact]
    public async Task SlipFirst_ThenNotice_AdminSeesSignedSlip()
    {
        var slipId = await UploadSlipAsync();
        var giver = $"ครอบครัวพัวมณี {Guid.NewGuid():N}";

        var res = await PostNoticeAsync(giver, DateTimeOffset.UtcNow.AddMinutes(-2), 3000m, slipId);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);

        var notice = await FindAsync(giver);
        Assert.Equal(3000m, notice.Amount);
        Assert.True(notice.HasSlip);
        Assert.Equal($"https://storage.test/sign/{slipId}.jpg?expires=300", notice.SlipUrl);
    }

    [Fact]
    public async Task Notice_WithoutAmountOrSlip_Returns201()
    {
        var res = await PostNoticeAsync($"ต้อม {Guid.NewGuid():N}", DateTimeOffset.UtcNow);

        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
    }

    [Fact]
    public async Task Notice_InTheFuture_Returns400()
    {
        var res = await PostNoticeAsync("ต้อม", DateTimeOffset.UtcNow.AddDays(1));

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Slip_NotJpeg_Returns400()
    {
        using var form = new MultipartFormDataContent();
        form.Add(new ByteArrayContent("hello"u8.ToArray()), "file", "slip.jpg");

        var res = await _client.PostAsync("/api/gift-notices/slips", form);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task AdminVerifiesAndCorrectsAmount()
    {
        var giver = $"แนน {Guid.NewGuid():N}";
        await PostNoticeAsync(giver, DateTimeOffset.UtcNow);
        var notice = await FindAsync(giver);

        var res = await _client.PatchAsJsonAsync($"/api/gift-notices/{notice.Id}", new GiftNoticeUpdateRequest(1500m, true));

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var updated = await FindAsync(giver);
        Assert.Equal(1500m, updated.Amount);
        Assert.True(updated.Verified);
    }

    [Fact]
    public async Task DeleteAllSlips_EmptiesBucket_KeepsNotices()
    {
        var giver = $"บอส {Guid.NewGuid():N}";
        await PostNoticeAsync(giver, DateTimeOffset.UtcNow, slipId: await UploadSlipAsync());
        await UploadSlipAsync(); // picked, but the notice was never sent

        var res = await _client.DeleteAsync("/api/gift-notices/slips");

        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.Empty(_factory.SlipStorage.Objects);
        var notice = await FindAsync(giver);
        Assert.False(notice.HasSlip);
        Assert.Null(notice.SlipUrl);
    }

    [Fact]
    public async Task ExportCsv_StartsWithBom()
    {
        await PostNoticeAsync($"ปอ {Guid.NewGuid():N}", DateTimeOffset.UtcNow);

        var bytes = await _client.GetByteArrayAsync("/api/gift-notices/export.csv");

        Assert.Equal(new byte[] { 0xEF, 0xBB, 0xBF }, bytes[..3]);
    }
}
