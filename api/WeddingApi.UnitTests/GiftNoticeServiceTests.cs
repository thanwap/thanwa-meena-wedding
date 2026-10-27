using Microsoft.EntityFrameworkCore;
using Moq;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;
using WeddingApi.Services;

namespace WeddingApi.UnitTests;

public class GiftNoticeServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 12, 26, 8, 0, 0, TimeSpan.Zero);

    private readonly Mock<ISlipStorage> _storage = new();
    private readonly AppDbContext _db = new(new DbContextOptionsBuilder<AppDbContext>()
        .UseInMemoryDatabase(Guid.NewGuid().ToString())
        .Options);

    private GiftNoticeService CreateService() => new(_db, _storage.Object, new FixedTime(Now));

    private static GiftNoticeCreateRequest Valid(
        string? giver = "ต้อม & แนน", DateTimeOffset? at = null, decimal? amount = null, Guid? slipId = null) =>
        new(giver, at ?? Now.AddMinutes(-3), amount, slipId);

    private static MemoryStream Image(Action<Image<Rgba32>, Stream> save, int width = 800, int height = 1600)
    {
        using var image = new Image<Rgba32>(width, height, new Rgba32(240, 240, 240));
        var ms = new MemoryStream();
        save(image, ms);
        ms.Position = 0;
        return ms;
    }

    // ── Create ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task Create_StoresUtcTime_AndSlipPath()
    {
        var slipId = Guid.NewGuid();
        var bangkok = new DateTimeOffset(2026, 12, 26, 14, 32, 0, TimeSpan.FromHours(7));

        var dto = await CreateService().CreateAsync(Valid(at: bangkok, amount: 1000m, slipId: slipId));

        var row = await _db.GiftNotices.SingleAsync();
        Assert.Equal(new DateTime(2026, 12, 26, 7, 32, 0), row.TransferredAt);
        Assert.Equal(1000m, row.Amount);
        Assert.Equal($"{slipId}.jpg", row.SlipPath);
        Assert.True(dto.HasSlip);
        Assert.False(row.Verified);
    }

    [Fact]
    public async Task Create_WithoutAmountOrSlip_IsAllowed()
    {
        var dto = await CreateService().CreateAsync(Valid());

        Assert.Null(dto.Amount);
        Assert.False(dto.HasSlip);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    [InlineData("​")]
    public async Task Create_WithoutGiver_Throws(string? giver)
    {
        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateAsync(Valid(giver: giver)));
    }

    [Fact]
    public async Task Create_TooLongGiver_Throws()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().CreateAsync(Valid(giver: new string('ก', GiftNoticeService.GiverMaxLength + 1))));
    }

    [Fact]
    public async Task Create_WithoutTime_Throws()
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().CreateAsync(new GiftNoticeCreateRequest("ต้อม", null, null, null)));
    }

    [Fact]
    public async Task Create_FutureTime_Throws_ButSmallClockSkewIsFine()
    {
        await CreateService().CreateAsync(Valid(at: Now.AddMinutes(5)));

        await Assert.ThrowsAsync<ArgumentException>(() => CreateService().CreateAsync(Valid(at: Now.AddHours(1))));
    }

    [Theory]
    [InlineData("0")]
    [InlineData("-100")]
    [InlineData("10000000.01")]
    [InlineData("100.505")]
    public async Task Create_BadAmount_Throws(string amount)
    {
        await Assert.ThrowsAsync<ArgumentException>(() =>
            CreateService().CreateAsync(Valid(amount: decimal.Parse(amount))));
    }

    // ── Slip upload ─────────────────────────────────────────────────────────

    [Fact]
    public async Task UploadSlip_Jpeg_StoresAsIs()
    {
        using var jpeg = Image((img, s) => img.SaveAsJpeg(s));
        var bytes = jpeg.ToArray();

        var dto = await CreateService().UploadSlipAsync(jpeg);

        _storage.Verify(s => s.UploadAsync(
            $"{dto.SlipId}.jpg",
            It.Is<byte[]>(b => b.SequenceEqual(bytes)),
            "image/jpeg",
            It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task UploadSlip_Png_Throws()
    {
        using var png = Image((img, s) => img.SaveAsPng(s));

        await Assert.ThrowsAsync<UnsupportedImageException>(() => CreateService().UploadSlipAsync(png));
    }

    [Fact]
    public async Task UploadSlip_NotAnImage_Throws()
    {
        using var junk = new MemoryStream("%PDF-1.7"u8.ToArray());

        await Assert.ThrowsAsync<UnsupportedImageException>(() => CreateService().UploadSlipAsync(junk));
    }

    [Fact]
    public async Task UploadSlip_Huge_Throws()
    {
        using var jpeg = Image((img, s) => img.SaveAsJpeg(s), width: 100, height: GiftNoticeService.SlipMaxEdge + 1);

        await Assert.ThrowsAsync<UnsupportedImageException>(() => CreateService().UploadSlipAsync(jpeg));
    }

    // ── Admin ───────────────────────────────────────────────────────────────

    private GiftNotice Seed(string giver, DateTime at, string? slip = null)
    {
        var notice = new GiftNotice
        {
            Id = Guid.NewGuid(), Giver = giver, TransferredAt = at, SlipPath = slip, CreatedAt = at,
        };
        _db.GiftNotices.Add(notice);
        _db.SaveChanges();
        return notice;
    }

    [Fact]
    public async Task List_SortsByTransferTime_AndSignsSlipsInOneCall()
    {
        Seed("later", new DateTime(2026, 12, 26, 10, 0, 0), "b.jpg");
        Seed("earlier", new DateTime(2026, 12, 26, 9, 0, 0), "a.jpg");
        Seed("no slip", new DateTime(2026, 12, 26, 11, 0, 0));
        _storage.Setup(s => s.SignedUrlsAsync(It.IsAny<IReadOnlyCollection<string>>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Dictionary<string, string> { ["a.jpg"] = "signed-a", ["b.jpg"] = "signed-b" });

        var list = await CreateService().ListAsync();

        Assert.Equal(["earlier", "later", "no slip"], list.Select(n => n.Giver));
        Assert.Equal(["signed-a", "signed-b", null], list.Select(n => n.SlipUrl));
        _storage.Verify(s => s.SignedUrlsAsync(
            It.IsAny<IReadOnlyCollection<string>>(), It.IsAny<TimeSpan>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_OverwritesAmount_AndVerified()
    {
        var notice = Seed("ต้อม", Now.UtcDateTime);

        var dto = await CreateService().UpdateAsync(notice.Id, new GiftNoticeUpdateRequest(2000m, true));

        Assert.Equal(2000m, dto!.Amount);
        Assert.True(dto.Verified);
    }

    [Fact]
    public async Task Delete_RemovesRowAndSlip()
    {
        var notice = Seed("ต้อม", Now.UtcDateTime, "x.jpg");

        Assert.True(await CreateService().DeleteAsync(notice.Id));

        Assert.Empty(_db.GiftNotices);
        _storage.Verify(s => s.DeleteAsync(new[] { "x.jpg" }, It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task DeleteAllSlips_ClearsBucketIncludingOrphans_AndKeepsNotices()
    {
        Seed("ต้อม", Now.UtcDateTime, "x.jpg");
        Seed("แนน", Now.UtcDateTime);
        _storage.Setup(s => s.ListAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(["x.jpg", "orphan.jpg"]);

        var deleted = await CreateService().DeleteAllSlipsAsync();

        Assert.Equal(2, deleted);
        _storage.Verify(s => s.DeleteAsync(
            It.Is<IEnumerable<string>>(p => p.SequenceEqual(new[] { "x.jpg", "orphan.jpg" })), It.IsAny<CancellationToken>()));
        Assert.Equal(2, _db.GiftNotices.Count());
        Assert.All(_db.GiftNotices, n => Assert.Null(n.SlipPath));
    }

    [Fact]
    public async Task ExportCsv_UsesBangkokTime_AndDefusesFormulas()
    {
        Seed("=HYPERLINK(\"x\")", new DateTime(2026, 12, 26, 7, 32, 0));

        var csv = await CreateService().ExportCsvAsync();

        var row = csv.Split('\n')[1];
        Assert.StartsWith("\"'=HYPERLINK(\"\"x\"\")\",2026-12-26 14:32,", row);
    }

    private sealed class FixedTime(DateTimeOffset now) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => now;
    }
}
