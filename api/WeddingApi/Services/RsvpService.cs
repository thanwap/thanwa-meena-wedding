using System.Text;
using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;

namespace WeddingApi.Services;

public class RsvpService : IRsvpService
{
    private readonly AppDbContext _db;

    public RsvpService(AppDbContext db)
    {
        _db = db;
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
            Name = request.Name.Trim(),
            GuestCount = request.GuestCount,
            Dietary = request.Dietary,
            Message = request.Message,
            Status = "pending",
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Rsvps.Add(rsvp);
        await _db.SaveChangesAsync();
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
            Name = request.Name.Trim(),
            GuestCount = request.GuestCount,
            Dietary = string.IsNullOrWhiteSpace(request.Dietary) ? null : request.Dietary.Trim(),
            Message = string.IsNullOrWhiteSpace(request.Message) ? null : request.Message.Trim(),
            Status = status,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.Rsvps.Add(rsvp);
        await _db.SaveChangesAsync();
        return ToDto(rsvp);
    }

    public async Task<List<RsvpDto>> ListAsync() =>
        await _db.Rsvps
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => ToDto(r))
            .ToListAsync();

    public async Task<RsvpDto?> GetAsync(int id)
    {
        var rsvp = await _db.Rsvps.FirstOrDefaultAsync(r => r.Id == id);
        return rsvp is null ? null : ToDto(rsvp);
    }

    public async Task<RsvpDto?> UpdateStatusAsync(int id, RsvpUpdateRequest request)
    {
        var rsvp = await _db.Rsvps.FirstOrDefaultAsync(r => r.Id == id);
        if (rsvp is null) return null;

        rsvp.Status = request.Status;
        rsvp.UpdatedAt = DateTime.UtcNow;
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

    public RsvpStatsDto GetStats(List<RsvpDto> rsvps)
    {
        var total = rsvps.Count;
        var attending = rsvps.Count(r => r.Attending);
        var declining = rsvps.Count(r => !r.Attending);
        var totalGuests = rsvps.Where(r => r.Attending).Sum(r => r.GuestCount);
        var pending = rsvps.Count(r => r.Status == "pending");
        var confirmed = rsvps.Count(r => r.Status == "confirmed");
        var cancelled = rsvps.Count(r => r.Status == "cancelled");

        return new RsvpStatsDto(total, attending, declining, totalGuests, pending, confirmed, cancelled);
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
