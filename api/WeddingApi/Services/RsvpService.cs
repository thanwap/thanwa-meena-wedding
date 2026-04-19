using System.Text;
using System.Text.Encodings.Web;
using System.Text.Unicode;
using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;

namespace WeddingApi.Services;

public class RsvpService : IRsvpService
{
    // Encodes only HTML-dangerous chars (<, >, &, ", ') — leaves Thai/Unicode intact
    private static readonly HtmlEncoder SafeEncoder =
        HtmlEncoder.Create(new TextEncoderSettings(UnicodeRanges.All));

    private readonly AppDbContext _db;
    private readonly ISeatingService _seating;

    public RsvpService(AppDbContext db, ISeatingService seating)
    {
        _db = db;
        _seating = seating;
    }

    public async Task<RsvpDto> CreateAsync(RsvpCreateRequest request)
    {
        // Honeypot — bots fill this hidden field; humans leave it empty
        if (!string.IsNullOrEmpty(request.HpWebsite))
            throw new InvalidOperationException("rejected");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.", nameof(request));

        if (request.GuestCount < 1 || request.GuestCount > 10)
            throw new ArgumentOutOfRangeException(nameof(request), "GuestCount must be between 1 and 10.");

        var now = DateTime.UtcNow;
        var rsvp = new Rsvp
        {
            Attending = request.Attending,
            Name = SafeEncoder.Encode(request.Name.Trim()),
            GuestCount = request.GuestCount,
            Dietary = string.IsNullOrWhiteSpace(request.Dietary) ? null : SafeEncoder.Encode(request.Dietary.Trim()),
            Message = string.IsNullOrWhiteSpace(request.Message) ? null : SafeEncoder.Encode(request.Message.Trim()),
            Status = "pending",
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Rsvps.Add(rsvp);
        await _db.SaveChangesAsync();

        if (rsvp.Attending)
            await _seating.GenerateGuestsForRsvpAsync(rsvp.Id);

        return ToDto(rsvp);
    }

    public async Task<RsvpDto> AdminCreateAsync(AdminRsvpCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Name is required.", nameof(request));

        if (request.GuestCount < 1 || request.GuestCount > 10)
            throw new ArgumentOutOfRangeException(nameof(request), "GuestCount must be between 1 and 10.");

        var validStatuses = new[] { "pending", "confirmed", "cancelled" };
        var status = validStatuses.Contains(request.Status) ? request.Status : "confirmed";

        var now = DateTime.UtcNow;
        var rsvp = new Rsvp
        {
            Attending = request.Attending,
            Name = SafeEncoder.Encode(request.Name.Trim()),
            GuestCount = request.GuestCount,
            Dietary = string.IsNullOrWhiteSpace(request.Dietary) ? null : SafeEncoder.Encode(request.Dietary.Trim()),
            Message = string.IsNullOrWhiteSpace(request.Message) ? null : SafeEncoder.Encode(request.Message.Trim()),
            Status = status,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Rsvps.Add(rsvp);
        await _db.SaveChangesAsync();

        if (rsvp.Attending && status != "cancelled")
            await _seating.GenerateGuestsForRsvpAsync(rsvp.Id);

        return ToDto(rsvp);
    }

    public async Task<PagedResult<RsvpDto>> ListPagedAsync(int page, int pageSize, string? search, string? status)
    {
        var query = _db.Rsvps.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.ToLower();
            query = query.Where(r => r.Name.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(status) && status != "all")
            query = query.Where(r => r.Status == status);

        query = query.OrderByDescending(r => r.CreatedAt);

        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<RsvpDto>
        {
            Items = items.Select(ToDto).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<RsvpStatsDto> GetStatsAsync()
    {
        var total = await _db.Rsvps.CountAsync();
        var attending = await _db.Rsvps.CountAsync(r => r.Attending);
        var totalGuests = await _db.Rsvps.Where(r => r.Attending).SumAsync(r => r.GuestCount);
        var confirmedGuests = await _db.Rsvps.Where(r => r.Status == "confirmed").SumAsync(r => r.GuestCount);
        var pending = await _db.Rsvps.CountAsync(r => r.Status == "pending");
        var confirmed = await _db.Rsvps.CountAsync(r => r.Status == "confirmed");
        var cancelled = await _db.Rsvps.CountAsync(r => r.Status == "cancelled");
        return new RsvpStatsDto(total, attending, total - attending, totalGuests, confirmedGuests, pending, confirmed, cancelled);
    }

    public async Task<RsvpDto?> GetAsync(int id)
    {
        var rsvp = await _db.Rsvps.FirstOrDefaultAsync(r => r.Id == id);
        return rsvp is null ? null : ToDto(rsvp);
    }

    public async Task<RsvpDto?> UpdateStatusAsync(int id, RsvpUpdateRequest request)
    {
        var rsvp = await _db.Rsvps
            .Include(r => r.Guests)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (rsvp is null) return null;

        var oldStatus = rsvp.Status;
        rsvp.Status = request.Status;
        rsvp.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        if (request.Status == "cancelled" && oldStatus != "cancelled")
        {
            await _seating.DeleteGuestsByRsvpAsync(rsvp.Id);
        }
        else if (oldStatus == "cancelled" && request.Status != "cancelled" && rsvp.Attending)
        {
            await _seating.GenerateGuestsForRsvpAsync(rsvp.Id);
        }

        return ToDto(rsvp);
    }

    public async Task<RsvpDto?> UpdateGuestCountAsync(int id, int guestCount)
    {
        if (guestCount < 1 || guestCount > 10)
            throw new ArgumentOutOfRangeException(nameof(guestCount), "GuestCount must be between 1 and 10.");

        var rsvp = await _db.Rsvps
            .Include(r => r.Guests)
            .FirstOrDefaultAsync(r => r.Id == id);
        if (rsvp is null) return null;

        var oldCount = rsvp.GuestCount;
        rsvp.GuestCount = guestCount;
        rsvp.UpdatedAt = DateTime.UtcNow;

        if (guestCount > oldCount && rsvp.Attending)
        {
            // Add more companion guests
            var now = DateTime.UtcNow;
            var existingMax = rsvp.Guests.Count > 0
                ? rsvp.Guests.Max(g => g.SortOrder)
                : 0;

            for (var i = oldCount; i < guestCount; i++)
            {
                var name = $"{rsvp.Name} (ผู้ติดตามคนที่ {i})";
                _db.Guests.Add(new Entities.Guest
                {
                    RsvpId = rsvp.Id,
                    Name = name,
                    SortOrder = existingMax + (i - oldCount) + 1,
                    CreatedAt = now,
                    UpdatedAt = now
                });
            }
        }
        else if (guestCount < oldCount && rsvp.Guests.Count > 0)
        {
            // Remove excess guests (highest sort order first)
            var toRemove = rsvp.Guests
                .OrderByDescending(g => g.SortOrder)
                .Take(oldCount - guestCount)
                .ToList();
            _db.Guests.RemoveRange(toRemove);
        }

        await _db.SaveChangesAsync();
        return ToDto(rsvp);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var rsvp = await _db.Rsvps.FirstOrDefaultAsync(r => r.Id == id);
        if (rsvp is null) return false;

        rsvp.DeletedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<int> BatchUpdateStatusAsync(List<int> ids, string status)
    {
        var rsvps = await _db.Rsvps
            .Include(r => r.Guests)
            .Where(r => ids.Contains(r.Id))
            .ToListAsync();
        var now = DateTime.UtcNow;

        foreach (var r in rsvps)
        {
            var oldStatus = r.Status;
            r.Status = status;
            r.UpdatedAt = now;

            if (status == "cancelled" && oldStatus != "cancelled")
            {
                await _seating.DeleteGuestsByRsvpAsync(r.Id);
            }
            else if (oldStatus == "cancelled" && status != "cancelled" && r.Attending)
            {
                await _seating.GenerateGuestsForRsvpAsync(r.Id);
            }
        }

        await _db.SaveChangesAsync();
        return rsvps.Count;
    }

    public async Task<int> BatchDeleteAsync(List<int> ids)
    {
        var rsvps = await _db.Rsvps.Where(r => ids.Contains(r.Id)).ToListAsync();
        var now = DateTime.UtcNow;
        foreach (var r in rsvps)
            r.DeletedAt = now;
        await _db.SaveChangesAsync();
        return rsvps.Count;
    }

    // Kept for unit-test convenience; production code uses GetStatsAsync().
    public RsvpStatsDto GetStats(List<RsvpDto> rsvps)
    {
        var total = rsvps.Count;
        var attending = rsvps.Count(r => r.Attending);
        var totalGuests = rsvps.Where(r => r.Attending).Sum(r => r.GuestCount);
        var confirmedGuests = rsvps.Where(r => r.Status == "confirmed").Sum(r => r.GuestCount);
        var pending = rsvps.Count(r => r.Status == "pending");
        var confirmed = rsvps.Count(r => r.Status == "confirmed");
        var cancelled = rsvps.Count(r => r.Status == "cancelled");
        return new RsvpStatsDto(total, attending, total - attending, totalGuests, confirmedGuests, pending, confirmed, cancelled);
    }

    public async Task<string> ExportCsvAsync()
    {
        var rsvps = await _db.Rsvps
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,Attending,Name,GuestCount,Dietary,Message,Status,CreatedAt");

        foreach (var r in rsvps)
        {
            sb.AppendLine(string.Join(",",
                r.Id,
                r.Attending,
                CsvEscape(r.Name),
                r.GuestCount,
                CsvEscape(r.Dietary ?? ""),
                CsvEscape(r.Message ?? ""),
                r.Status,
                r.CreatedAt.ToString("O")));
        }

        return sb.ToString();
    }

    private static string CsvEscape(string value)
    {
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }

    private static RsvpDto ToDto(Rsvp r) =>
        new(r.Id, r.Attending, r.Name, r.GuestCount, r.Dietary, r.Message, r.Status, r.CreatedAt, r.UpdatedAt);
}
