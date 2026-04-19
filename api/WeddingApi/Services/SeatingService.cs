using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;

namespace WeddingApi.Services;

public class SeatingService : ISeatingService
{
    private readonly AppDbContext _db;

    public SeatingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<SeatingOverviewDto> GetOverviewAsync()
    {
        var tables = await _db.WeddingTables
            .Include(t => t.Guests)
                .ThenInclude(g => g.Rsvp)
            .OrderBy(t => t.Id)
            .ToListAsync();

        var unassigned = await _db.Guests
            .Include(g => g.Rsvp)
            .Where(g => g.TableId == null)
            .OrderBy(g => g.RsvpId)
            .ThenBy(g => g.SortOrder)
            .ToListAsync();

        return new SeatingOverviewDto(
            tables.Select(ToTableDto).ToList(),
            unassigned.Select(ToGuestDto).ToList());
    }

    public async Task<WeddingTableDto> CreateTableAsync(WeddingTableCreateRequest request)
    {
        var now = DateTime.UtcNow;
        var table = new WeddingTable
        {
            Name = request.Name.Trim(),
            Capacity = request.Capacity,
            Shape = request.Shape,
            PositionX = 100,
            PositionY = 100,
            CreatedAt = now,
            UpdatedAt = now
        };

        _db.WeddingTables.Add(table);
        await _db.SaveChangesAsync();
        return ToTableDto(table);
    }

    public async Task<WeddingTableDto?> UpdateTableAsync(int id, WeddingTableUpdateRequest request)
    {
        var table = await _db.WeddingTables
            .Include(t => t.Guests)
                .ThenInclude(g => g.Rsvp)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (table is null) return null;

        if (request.Name is not null) table.Name = request.Name.Trim();
        if (request.Capacity.HasValue) table.Capacity = request.Capacity.Value;
        if (request.Shape is not null) table.Shape = request.Shape;
        table.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return ToTableDto(table);
    }

    public async Task<bool> UpdateTablePositionAsync(int id, WeddingTablePositionRequest request)
    {
        var table = await _db.WeddingTables.FirstOrDefaultAsync(t => t.Id == id);
        if (table is null) return false;

        table.PositionX = request.PositionX;
        table.PositionY = request.PositionY;
        table.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteTableAsync(int id)
    {
        var table = await _db.WeddingTables
            .Include(t => t.Guests)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (table is null) return false;

        var affectedRsvpIds = table.Guests.Select(g => g.RsvpId).Distinct().ToList();

        _db.WeddingTables.Remove(table);
        await _db.SaveChangesAsync();

        foreach (var rsvpId in affectedRsvpIds)
            await SyncRsvpStatusAsync(rsvpId);

        return true;
    }

    public async Task<List<GuestDto>> GenerateGuestsForRsvpAsync(int rsvpId)
    {
        var rsvp = await _db.Rsvps
            .Include(r => r.Guests)
            .FirstOrDefaultAsync(r => r.Id == rsvpId);

        if (rsvp is null)
            throw new ArgumentException($"RSVP {rsvpId} not found.");

        if (!rsvp.Attending)
            throw new InvalidOperationException("Cannot generate guests for a non-attending RSVP.");

        // Idempotent: if guests already exist, return them
        if (rsvp.Guests.Count > 0)
            return rsvp.Guests.OrderBy(g => g.SortOrder).Select(ToGuestDto).ToList();

        var now = DateTime.UtcNow;
        var guests = new List<Guest>();

        for (var i = 0; i < rsvp.GuestCount; i++)
        {
            var name = i == 0
                ? rsvp.Name
                : $"{rsvp.Name} (ผู้ติดตามคนที่ {i})";

            guests.Add(new Guest
            {
                RsvpId = rsvp.Id,
                Name = name,
                SortOrder = i + 1,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        _db.Guests.AddRange(guests);
        await _db.SaveChangesAsync();

        // Re-load to get the Rsvp nav property for DTO mapping
        foreach (var g in guests) g.Rsvp = rsvp;
        return guests.Select(ToGuestDto).ToList();
    }

    public async Task<List<GuestDto>> GenerateAllGuestsAsync()
    {
        var rsvps = await _db.Rsvps
            .Include(r => r.Guests)
            .Where(r => r.Attending)
            .ToListAsync();

        var newGuests = new List<Guest>();
        foreach (var rsvp in rsvps)
        {
            if (rsvp.Guests.Count > 0) continue; // already generated

            var now = DateTime.UtcNow;
            for (var i = 0; i < rsvp.GuestCount; i++)
            {
                var name = i == 0
                    ? rsvp.Name
                    : $"{rsvp.Name} (ผู้ติดตามคนที่ {i})";

                var guest = new Guest
                {
                    RsvpId = rsvp.Id,
                    Name = name,
                    SortOrder = i + 1,
                    CreatedAt = now,
                    UpdatedAt = now
                };
                _db.Guests.Add(guest);
                guest.Rsvp = rsvp;
                newGuests.Add(guest);
            }
        }

        await _db.SaveChangesAsync();
        // Map to DTOs after SaveChanges so IDs are populated
        return newGuests.Select(ToGuestDto).ToList();
    }

    public async Task<GuestDto?> UpdateGuestAsync(int id, GuestUpdateRequest request)
    {
        var guest = await _db.Guests
            .Include(g => g.Rsvp)
            .FirstOrDefaultAsync(g => g.Id == id);
        if (guest is null) return null;

        if (request.Name is not null)
            guest.Name = request.Name.Trim();

        if (request.TableId.HasValue)
        {
            var table = await _db.WeddingTables
                .Include(t => t.Guests)
                .FirstOrDefaultAsync(t => t.Id == request.TableId.Value);

            if (table is null)
                throw new ArgumentException($"Table {request.TableId.Value} not found.");

            if (table.Guests.Count >= table.Capacity)
                throw new InvalidOperationException("Table is at full capacity.");

            guest.TableId = table.Id;
        }

        guest.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await SyncRsvpStatusAsync(guest.RsvpId);

        return ToGuestDto(guest);
    }

    public async Task<bool> UnassignGuestAsync(int id)
    {
        var guest = await _db.Guests.FirstOrDefaultAsync(g => g.Id == id);
        if (guest is null) return false;

        guest.TableId = null;
        guest.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await SyncRsvpStatusAsync(guest.RsvpId);

        return true;
    }

    public async Task DeleteGuestsByRsvpAsync(int rsvpId)
    {
        var guests = await _db.Guests.Where(g => g.RsvpId == rsvpId).ToListAsync();
        if (guests.Count > 0)
        {
            _db.Guests.RemoveRange(guests);
            await _db.SaveChangesAsync();
        }
    }

    public async Task<List<GuestDto>> RegenerateGuestsForRsvpAsync(int rsvpId)
    {
        await DeleteGuestsByRsvpAsync(rsvpId);
        var guests = await GenerateGuestsForRsvpAsync(rsvpId);
        await SyncRsvpStatusAsync(rsvpId);
        return guests;
    }

    private async Task SyncRsvpStatusAsync(int rsvpId)
    {
        var rsvp = await _db.Rsvps
            .Include(r => r.Guests)
            .FirstOrDefaultAsync(r => r.Id == rsvpId);
        if (rsvp is null) return;

        var allSeated = rsvp.Guests.Count > 0 && rsvp.Guests.All(g => g.TableId != null);
        var newStatus = allSeated ? "confirmed" : "pending";
        if (rsvp.Status != newStatus)
        {
            rsvp.Status = newStatus;
            rsvp.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    public async Task<List<GuestSearchResponseDto>> SearchGuestsAsync(string name)
    {
        var trimmed = name.Trim();
        if (string.IsNullOrEmpty(trimmed))
            return [];

        var matchingGuests = await _db.Guests
            .Include(g => g.Table!)
                .ThenInclude(t => t.Guests)
            .Where(g => g.Name.Contains(trimmed))
            .OrderBy(g => g.SortOrder)
            .ToListAsync();

        return matchingGuests.Select(g => new GuestSearchResponseDto(
            g.Name,
            g.Table is null
                ? null
                : new TableSearchResultDto(
                    g.Table.Name,
                    g.Table.Guests.OrderBy(tg => tg.SortOrder).Select(tg => tg.Name).ToList())
        )).ToList();
    }

    private static WeddingTableDto ToTableDto(WeddingTable t) =>
        new(t.Id, t.Name, t.Capacity, t.Shape, t.PositionX, t.PositionY,
            t.Guests.OrderBy(g => g.SortOrder).Select(ToGuestDto).ToList());

    private static GuestDto ToGuestDto(Guest g) =>
        new(g.Id, g.RsvpId, g.TableId, g.Name, g.SortOrder, g.Rsvp.Name);
}
