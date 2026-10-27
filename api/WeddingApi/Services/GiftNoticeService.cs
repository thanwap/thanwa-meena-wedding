using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;
using WeddingApi.Security;

namespace WeddingApi.Services;

public class GiftNoticeService : IGiftNoticeService
{
    public const int GiverMaxLength = 120;
    public const decimal AmountMax = 10_000_000m;
    /// <summary>The browser shrinks slips to 1600px; anything far beyond that wasn't made by the site.</summary>
    public const int SlipMaxEdge = 4000;
    /// <summary>Phone clocks drift — allow a little "future" before calling it a typo.</summary>
    private static readonly TimeSpan ClockSkew = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan SignedUrlLifetime = TimeSpan.FromMinutes(5);
    private static readonly TimeZoneInfo Bangkok = TimeZoneInfo.FindSystemTimeZoneById("Asia/Bangkok");

    private readonly AppDbContext _db;
    private readonly ISlipStorage _storage;
    private readonly TimeProvider _time;

    public GiftNoticeService(AppDbContext db, ISlipStorage storage, TimeProvider time)
    {
        _db = db;
        _storage = storage;
        _time = time;
    }

    public async Task<GiftSlipDto> UploadSlipAsync(Stream image, CancellationToken ct = default)
    {
        using var buffer = new MemoryStream();
        await image.CopyToAsync(buffer, ct);

        // Header-only check: the browser already re-encoded it (which also drops EXIF),
        // so there is nothing to gain from decoding and re-encoding it again here
        buffer.Position = 0;
        ImageInfo info;
        try
        {
            info = await Image.IdentifyAsync(buffer, ct);
        }
        catch (Exception ex) when (ex is UnknownImageFormatException or InvalidImageContentException)
        {
            throw new UnsupportedImageException("Slip must be a JPEG image");
        }
        if (info.Metadata.DecodedImageFormat is not JpegFormat)
            throw new UnsupportedImageException("Slip must be a JPEG image");
        if (info.Width > SlipMaxEdge || info.Height > SlipMaxEdge)
            throw new UnsupportedImageException($"Slip is larger than {SlipMaxEdge}px");

        var slipId = Guid.NewGuid();
        await _storage.UploadAsync(SlipPath(slipId), buffer.ToArray(), "image/jpeg", ct);
        return new GiftSlipDto(slipId);
    }

    public async Task<GiftNoticeDto> CreateAsync(GiftNoticeCreateRequest request, CancellationToken ct = default)
    {
        var giver = GuestText.Clean(request.Giver);
        if (!GuestText.HasVisibleText(giver))
            throw new ArgumentException("Giver is required");
        if (giver.Length > GiverMaxLength)
            throw new ArgumentException($"Giver must be {GiverMaxLength} characters or fewer");

        if (request.TransferredAt is not { } transferredAt)
            throw new ArgumentException("Transfer time is required");
        if (transferredAt > _time.GetUtcNow() + ClockSkew)
            throw new ArgumentException("Transfer time is in the future");

        ValidateAmount(request.Amount);

        var notice = new GiftNotice
        {
            Id = Guid.NewGuid(),
            Giver = giver,
            TransferredAt = transferredAt.UtcDateTime,
            Amount = request.Amount,
            SlipPath = request.SlipId is { } slipId ? SlipPath(slipId) : null,
            CreatedAt = _time.GetUtcNow().UtcDateTime,
        };
        _db.GiftNotices.Add(notice);
        await _db.SaveChangesAsync(ct);
        return ToDto(notice, slipUrl: null);
    }

    public async Task<List<GiftNoticeDto>> ListAsync(CancellationToken ct = default)
    {
        var notices = await _db.GiftNotices
            .AsNoTracking()
            .OrderBy(n => n.TransferredAt)
            .ThenBy(n => n.CreatedAt)
            .ToListAsync(ct);

        // One signing request for the whole page instead of one per row
        var slipPaths = notices.Where(n => n.SlipPath is not null).Select(n => n.SlipPath!).ToList();
        var urls = await _storage.SignedUrlsAsync(slipPaths, SignedUrlLifetime, ct);

        return notices
            .Select(n => ToDto(n, n.SlipPath is not null && urls.TryGetValue(n.SlipPath, out var url) ? url : null))
            .ToList();
    }

    public async Task<GiftNoticeDto?> UpdateAsync(Guid id, GiftNoticeUpdateRequest request, CancellationToken ct = default)
    {
        ValidateAmount(request.Amount);

        var notice = await _db.GiftNotices.FindAsync([id], ct);
        if (notice is null) return null;

        notice.Amount = request.Amount;
        notice.Verified = request.Verified;
        await _db.SaveChangesAsync(ct);
        return ToDto(notice, slipUrl: null);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var notice = await _db.GiftNotices.FindAsync([id], ct);
        if (notice is null) return false;

        _db.GiftNotices.Remove(notice);
        await _db.SaveChangesAsync(ct);
        if (notice.SlipPath is not null)
            await _storage.DeleteAsync([notice.SlipPath], CancellationToken.None);
        return true;
    }

    public async Task<int> DeleteAllSlipsAsync(CancellationToken ct = default)
    {
        // List the bucket rather than the table: slips whose notice was never sent go too
        var paths = await _storage.ListAllAsync(ct);
        await _storage.DeleteAsync(paths, ct);

        var withSlip = await _db.GiftNotices.Where(n => n.SlipPath != null).ToListAsync(ct);
        foreach (var notice in withSlip) notice.SlipPath = null;
        await _db.SaveChangesAsync(ct);
        return paths.Count;
    }

    public async Task<string> ExportCsvAsync(CancellationToken ct = default)
    {
        var notices = await _db.GiftNotices
            .AsNoTracking()
            .OrderBy(n => n.TransferredAt)
            .ToListAsync(ct);

        var sb = new StringBuilder();
        sb.AppendLine("Giver,TransferredAt,Amount,Verified,HasSlip,SubmittedAt");
        foreach (var n in notices)
        {
            sb.AppendLine(string.Join(",",
                CsvEscape(n.Giver),
                BangkokTime(n.TransferredAt),
                n.Amount?.ToString("0.##", CultureInfo.InvariantCulture) ?? "",
                n.Verified ? "yes" : "no",
                n.SlipPath is not null ? "yes" : "no",
                BangkokTime(n.CreatedAt)));
        }
        return sb.ToString();
    }

    public static string SlipPath(Guid slipId) => $"{slipId}.jpg";

    private static void ValidateAmount(decimal? amount)
    {
        if (amount is null) return;
        if (amount <= 0 || amount > AmountMax)
            throw new ArgumentException("Amount must be more than 0");
        if (decimal.Round(amount.Value, 2) != amount.Value)
            throw new ArgumentException("Amount can have at most 2 decimal places");
    }

    /// <summary>The couple reads times off a Thai bank app, so the export speaks Bangkok time.</summary>
    private static string BangkokTime(DateTime utc) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), Bangkok)
            .ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture);

    private static string CsvEscape(string value)
    {
        // A leading =, +, - or @ makes Excel run the cell as a formula
        if (value.Length > 0 && value[0] is '=' or '+' or '-' or '@') value = "'" + value;
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n') || value.Contains('\r'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }

    private static GiftNoticeDto ToDto(GiftNotice n, string? slipUrl) => new(
        n.Id,
        n.Giver,
        DateTime.SpecifyKind(n.TransferredAt, DateTimeKind.Utc),
        n.Amount,
        n.SlipPath is not null,
        slipUrl,
        n.Verified,
        DateTime.SpecifyKind(n.CreatedAt, DateTimeKind.Utc));
}
