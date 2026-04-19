using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Unicode;
using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;

namespace WeddingApi.Services;

public class GuestbookService : IGuestbookService
{
    // Encodes only HTML-dangerous chars (<, >, &, ", ') — leaves Thai/Unicode intact
    private static readonly HtmlEncoder SafeEncoder =
        HtmlEncoder.Create(new TextEncoderSettings(UnicodeRanges.All));

    private static readonly string[] AllowedMimeTypes =
        ["image/jpeg", "image/png", "image/webp", "image/heic"];
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private readonly AppDbContext _db;
    private readonly IStorageService _storage;

    public GuestbookService(AppDbContext db, IStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task<GuestbookDto> CreateAsync(GuestbookCreateFormRequest request)
    {
        if (!string.IsNullOrEmpty(request.HpWebsite))
            throw new InvalidOperationException("rejected");

        var images = request.Images ?? new List<IFormFile>();

        if (images.Count > 3)
            throw new ArgumentException("Maximum 3 images allowed.");

        foreach (var image in images)
        {
            if (!AllowedMimeTypes.Contains(image.ContentType))
                throw new ArgumentException($"File type '{image.ContentType}' is not allowed.");
            if (image.Length > MaxFileSizeBytes)
                throw new ArgumentException($"'{image.FileName}' exceeds the 5 MB size limit.");
        }

        // Upload images to Google Drive
        var imageUrls = new List<string>();
        foreach (var image in images)
        {
            using var stream = image.OpenReadStream();
            var url = await _storage.UploadAsync(stream, image.FileName, image.ContentType);
            imageUrls.Add(url);
        }

        var now = DateTime.UtcNow;
        var entry = new GuestbookEntry
        {
            Name = SafeEncoder.Encode(request.Name.Trim()),
            Message = SafeEncoder.Encode(request.Message.Trim()),
            ImageUrls = imageUrls.Count > 0 ? JsonSerializer.Serialize(imageUrls) : null,
            CreatedAt = now,
            UpdatedAt = now,
        };

        _db.GuestbookEntries.Add(entry);
        await _db.SaveChangesAsync();
        return ToDto(entry);
    }

    public async Task<List<GuestbookDto>> ListPublicAsync(int count = 0)
    {
        IQueryable<GuestbookEntry> query = count > 0
            ? _db.GuestbookEntries.OrderBy(e => EF.Functions.Random()).Take(count)
            : _db.GuestbookEntries.OrderByDescending(e => e.CreatedAt);

        var entries = await query.ToListAsync();
        return entries.Select(ToDto).ToList();
    }

    public async Task<PagedResult<GuestbookAdminDto>> ListAdminPagedAsync(int page, int pageSize, string? search)
    {
        var query = _db.GuestbookEntries.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(e => e.Name.ToLower().Contains(q));
        }

        query = query.OrderByDescending(e => e.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<GuestbookAdminDto>
        {
            Items = items.Select(ToAdminDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entry = await _db.GuestbookEntries.FindAsync(id);
        if (entry is null) return false;

        entry.DeletedAt = DateTime.UtcNow;
        entry.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    private static List<string> ParseImageUrls(string? json)
    {
        if (string.IsNullOrEmpty(json)) return new();
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? new(); }
        catch { return new(); }
    }

    private static GuestbookDto ToDto(GuestbookEntry e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Message = e.Message,
        ImageUrls = ParseImageUrls(e.ImageUrls),
        CreatedAt = e.CreatedAt,
    };

    private static GuestbookAdminDto ToAdminDto(GuestbookEntry e) => new()
    {
        Id = e.Id,
        Name = e.Name,
        Message = e.Message,
        ImageUrls = ParseImageUrls(e.ImageUrls),
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
    };
}
