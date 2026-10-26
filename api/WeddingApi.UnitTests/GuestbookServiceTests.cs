using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;
using WeddingApi.Services;

namespace WeddingApi.UnitTests;

public class GuestbookServiceTests
{
    private static AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private static GuestbookCreateFormRequest Letter(
        string name = "Fang", string message = "ยินดีด้วยนะ", int? postcardId = 3, string? hp = null) =>
        new() { Name = name, Message = message, PostcardId = postcardId, HpWebsite = hp };

    [Fact]
    public async Task CreateAsync_StoresPostcardAndTrimmedText()
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        var result = await service.CreateAsync(Letter(name: "  Fang  ", message: "  รักกันนาน ๆ  ", postcardId: 6));

        Assert.True(result.Id > 0);
        Assert.Equal("Fang", result.Name);
        Assert.Equal("รักกันนาน ๆ", result.Message);
        Assert.Equal(6, result.PostcardId);
        Assert.Equal(6, (await db.GuestbookEntries.SingleAsync()).PostcardId);
    }

    [Fact]
    public async Task CreateAsync_StoresTextAsTyped_NotHtmlEncoded()
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        var result = await service.CreateAsync(Letter(name: "Tom & Jerry", message: "<3 it's \"great\""));

        Assert.Equal("Tom & Jerry", result.Name);
        Assert.Equal("<3 it's \"great\"", result.Message);
        Assert.Equal("Tom & Jerry", (await db.GuestbookEntries.SingleAsync()).Name);
    }

    [Fact]
    public async Task ListPublicAsync_DecodesEntriesSavedHtmlEncoded()
    {
        using var db = CreateInMemoryDb();
        var now = DateTime.UtcNow;
        db.GuestbookEntries.Add(new GuestbookEntry
        {
            Name = "Tom &amp; Jerry", Message = "it&#x27;s &lt;3", CreatedAt = now, UpdatedAt = now,
        });
        await db.SaveChangesAsync();

        var entry = Assert.Single(await new GuestbookService(db).ListPublicAsync());

        Assert.Equal("Tom & Jerry", entry.Name);
        Assert.Equal("it's <3", entry.Message);
        Assert.Null(entry.PostcardId);
    }

    [Theory]
    [InlineData(null)]
    [InlineData(0)]
    [InlineData(100)]
    public async Task CreateAsync_WithoutValidPostcard_Throws(int? postcardId)
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Letter(postcardId: postcardId)));
    }

    [Theory]
    [InlineData("", "hi")]
    [InlineData("   ", "hi")]
    [InlineData("Fang", "")]
    public async Task CreateAsync_WithBlankNameOrMessage_Throws(string name, string message)
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Letter(name: name, message: message)));
    }

    [Fact]
    public async Task CreateAsync_WithOverlongText_Throws()
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(Letter(name: new string('ก', GuestbookService.NameMaxLength + 1))));
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateAsync(Letter(message: new string('ก', GuestbookService.MessageMaxLength + 1))));
    }

    [Fact]
    public async Task CreateAsync_StripsNulAndControlCharacters_KeepsLineBreaks()
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        var result = await service.CreateAsync(Letter(name: "Fa\0ng\u0007", message: "line one\nline\ttwo\0\u001B[2J"));

        Assert.Equal("Fang", result.Name);
        Assert.Equal("line one\nline\ttwo[2J", result.Message);
    }

    [Fact]
    public async Task CreateAsync_StripsBidiOverrides()
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        var result = await service.CreateAsync(Letter(name: "\u202Eanilam\u2066x\u2069"));

        Assert.Equal("anilamx", result.Name);
    }

    [Fact]
    public async Task CreateAsync_KeepsEmojiJoinersAndThaiMarks()
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        var result = await service.CreateAsync(Letter(name: "👩‍❤️‍👨", message: "ขอให้มีความสุขมาก ๆ ค่ะ"));

        Assert.Equal("👩‍❤️‍👨", result.Name);
        Assert.Equal("ขอให้มีความสุขมาก ๆ ค่ะ", result.Message);
    }

    [Theory]
    [InlineData("\u200B\u200B", "hi")]
    [InlineData("Fang", "\u200B\uFEFF \u2060")]
    [InlineData("\0\u0007", "hi")]
    public async Task CreateAsync_WithOnlyInvisibleText_Throws(string name, string message)
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        await Assert.ThrowsAsync<ArgumentException>(() => service.CreateAsync(Letter(name: name, message: message)));
    }

    [Fact]
    public async Task CreateAsync_WithHoneypotFilled_ThrowsAndSavesNothing()
    {
        using var db = CreateInMemoryDb();
        var service = new GuestbookService(db);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(Letter(hp: "http://spam")));
        Assert.Empty(db.GuestbookEntries);
    }
}
