using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Services;

namespace WeddingApi.UnitTests;

public class RsvpServiceTests
{
    private static AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task CreateAsync_WithValidData_ReturnsDto_WithStatusPending()
    {
        using var db = CreateInMemoryDb();
        var service = new RsvpService(db);

        var request = new RsvpCreateRequest(
            Attending: true,
            Name: "Thanwa P",
            GuestCount: 2,
            Dietary: null,
            Message: "Looking forward to it!",
            HpWebsite: null);

        var result = await service.CreateAsync(request);

        Assert.NotNull(result);
        Assert.True(result.Id > 0);
        Assert.Equal("Thanwa P", result.Name);
        Assert.Equal(2, result.GuestCount);
        Assert.Equal("pending", result.Status);
        Assert.True(result.Attending);
    }

    [Fact]
    public async Task CreateAsync_WithHoneypotFilled_ThrowsInvalidOperationException()
    {
        using var db = CreateInMemoryDb();
        var service = new RsvpService(db);

        var request = new RsvpCreateRequest(
            Attending: true,
            Name: "Bot",
            GuestCount: 1,
            Dietary: null,
            Message: null,
            HpWebsite: "http://spam.example.com");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => service.CreateAsync(request));
    }

    [Fact]
    public async Task DeleteAsync_SoftDeletes_SetsDeletedAt()
    {
        using var db = CreateInMemoryDb();
        var service = new RsvpService(db);

        // Create an RSVP directly in the DB
        var rsvp = new WeddingApi.Entities.Rsvp
        {
            Name = "Meena T",
            GuestCount = 1,
            Attending = true,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        db.Rsvps.Add(rsvp);
        await db.SaveChangesAsync();

        var result = await service.DeleteAsync(rsvp.Id);

        Assert.True(result);

        // Use IgnoreQueryFilters to bypass the soft-delete filter and verify DeletedAt was set
        var deleted = await db.Rsvps.IgnoreQueryFilters().FirstOrDefaultAsync(r => r.Id == rsvp.Id);
        Assert.NotNull(deleted);
        Assert.NotNull(deleted.DeletedAt);
    }

    [Fact]
    public void GetStats_ComputesCorrectTotals_FromMixedList()
    {
        using var db = CreateInMemoryDb();
        var service = new RsvpService(db);

        var rsvps = new List<RsvpDto>
        {
            new(1, true,  "Alice", 2, null, null, "confirmed", DateTime.UtcNow, DateTime.UtcNow),
            new(2, true,  "Bob",   3, null, null, "pending",   DateTime.UtcNow, DateTime.UtcNow),
            new(3, false, "Carol", 1, null, null, "cancelled", DateTime.UtcNow, DateTime.UtcNow),
            new(4, true,  "Dave",  1, null, null, "pending",   DateTime.UtcNow, DateTime.UtcNow),
        };

        var stats = service.GetStats(rsvps);

        Assert.Equal(4, stats.Total);
        Assert.Equal(3, stats.Attending);
        Assert.Equal(1, stats.Declining);
        Assert.Equal(6, stats.TotalGuests);  // Alice(2) + Bob(3) + Dave(1) = 6 (Carol not attending)
        Assert.Equal(2, stats.Pending);
        Assert.Equal(1, stats.Confirmed);
        Assert.Equal(1, stats.Cancelled);
    }
}
