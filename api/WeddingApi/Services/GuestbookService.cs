using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;
using static WeddingApi.Security.GuestText;

namespace WeddingApi.Services;

public class GuestbookService : IGuestbookService
{
    public const int NameMaxLength = 120;
    public const int MessageMaxLength = 2000;
    /// <summary>Postcards live in the frontend; any id in this range is accepted so new photos need no API change.</summary>
    public const int MaxPostcardId = 99;

    private readonly AppDbContext _db;

    public GuestbookService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<GuestbookDto> CreateAsync(GuestbookCreateFormRequest request)
    {
        if (!string.IsNullOrEmpty(request.HpWebsite))
            throw new InvalidOperationException("rejected");

        var name = Clean(request.Name);
        var message = Clean(request.Message);

        if (!HasVisibleText(name))
            throw new ArgumentException("Name is required.");
        if (name.Length > NameMaxLength)
            throw new ArgumentException($"Name must be {NameMaxLength} characters or fewer.");
        if (!HasVisibleText(message))
            throw new ArgumentException("Message is required.");
        if (message.Length > MessageMaxLength)
            throw new ArgumentException($"Message must be {MessageMaxLength} characters or fewer.");
        if (request.PostcardId is not (>= 1 and <= MaxPostcardId))
            throw new ArgumentException("Choose a postcard.");

        // Stored as typed: React escapes on render. (Rows saved before this were
        // HTML-encoded — ToDto decodes them.)
        var now = DateTime.UtcNow;
        var entry = new GuestbookEntry
        {
            Name = name,
            Message = message,
            PostcardId = request.PostcardId,
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
        Name = WebUtility.HtmlDecode(e.Name),
        Message = WebUtility.HtmlDecode(e.Message),
        PostcardId = e.PostcardId,
        ImageUrls = ParseImageUrls(e.ImageUrls),
        CreatedAt = e.CreatedAt,
    };

    private static GuestbookAdminDto ToAdminDto(GuestbookEntry e) => new()
    {
        Id = e.Id,
        Name = WebUtility.HtmlDecode(e.Name),
        Message = WebUtility.HtmlDecode(e.Message),
        PostcardId = e.PostcardId,
        ImageUrls = ParseImageUrls(e.ImageUrls),
        CreatedAt = e.CreatedAt,
        UpdatedAt = e.UpdatedAt,
    };
}
