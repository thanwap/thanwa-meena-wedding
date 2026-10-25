using Microsoft.EntityFrameworkCore;
using Moq;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;
using WeddingApi.Services;

namespace WeddingApi.UnitTests;

public class PreweddingPhotoServiceTests
{
    private readonly Mock<IImageProcessor> _processor = new();
    private readonly Mock<IPhotoStorage> _storage = new();

    public PreweddingPhotoServiceTests()
    {
        _processor.Setup(p => p.ToWebpAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ProcessedImage([1], [2], 2400, 1600));
        _storage.Setup(s => s.PublicUrl(It.IsAny<string>()))
            .Returns<string>(path => $"https://cdn.test/{path}");
    }

    private static AppDbContext CreateInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private PreweddingPhotoService CreateService(AppDbContext db) =>
        new(db, _processor.Object, _storage.Object);

    private static PreweddingPhoto Seed(AppDbContext db, int sortOrder)
    {
        var photo = new PreweddingPhoto
        {
            Id = Guid.NewGuid(),
            FullPath = $"prewedding/full/{sortOrder}.webp",
            ThumbPath = $"prewedding/thumb/{sortOrder}.webp",
            Width = 100,
            Height = 100,
            SortOrder = sortOrder,
            CreatedAt = DateTime.UtcNow,
        };
        db.PreweddingPhotos.Add(photo);
        db.SaveChanges();
        return photo;
    }

    [Fact]
    public async Task Upload_StoresBothWebpVariants_AndAppendsToEnd()
    {
        using var db = CreateInMemoryDb();
        Seed(db, 0);
        Seed(db, 1);
        var service = CreateService(db);

        var dto = await service.UploadAsync(new MemoryStream([0]), "  Golden hour ", "");

        Assert.Equal(2, dto.SortOrder);
        Assert.Equal("Golden hour", dto.Title);
        Assert.Null(dto.Caption);
        Assert.Equal(2400, dto.Width);
        Assert.Equal($"https://cdn.test/prewedding/full/{dto.Id}.webp", dto.FullUrl);
        Assert.Equal($"https://cdn.test/prewedding/thumb/{dto.Id}.webp", dto.ThumbUrl);
        _storage.Verify(s => s.UploadAsync($"prewedding/full/{dto.Id}.webp", It.IsAny<byte[]>(), "image/webp", It.IsAny<CancellationToken>()));
        _storage.Verify(s => s.UploadAsync($"prewedding/thumb/{dto.Id}.webp", It.IsAny<byte[]>(), "image/webp", It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Upload_WhenProcessorRejects_StoresNothing()
    {
        using var db = CreateInMemoryDb();
        _processor.Setup(p => p.ToWebpAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new UnsupportedImageException("nope"));
        var service = CreateService(db);

        await Assert.ThrowsAsync<UnsupportedImageException>(
            () => service.UploadAsync(new MemoryStream([0]), null, null));

        _storage.Verify(s => s.UploadAsync(It.IsAny<string>(), It.IsAny<byte[]>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
        Assert.Empty(db.PreweddingPhotos);
    }

    [Fact]
    public async Task GetAll_ReturnsInSortOrder()
    {
        using var db = CreateInMemoryDb();
        var b = Seed(db, 1);
        var a = Seed(db, 0);
        var service = CreateService(db);

        var all = await service.GetAllAsync();

        Assert.Equal([a.Id, b.Id], all.Select(p => p.Id));
    }

    [Fact]
    public async Task Reorder_RewritesSortOrder()
    {
        using var db = CreateInMemoryDb();
        var a = Seed(db, 0);
        var b = Seed(db, 1);
        var c = Seed(db, 2);
        var service = CreateService(db);

        await service.ReorderAsync([c.Id, a.Id, b.Id]);

        var all = await service.GetAllAsync();
        Assert.Equal([c.Id, a.Id, b.Id], all.Select(p => p.Id));
    }

    [Fact]
    public async Task Update_SetsFields_AndClearsBlankOnes()
    {
        using var db = CreateInMemoryDb();
        var photo = Seed(db, 0);
        var service = CreateService(db);

        var dto = await service.UpdateAsync(photo.Id, new PreweddingPhotoUpdateRequest("Beach", " ", "large"));

        Assert.NotNull(dto);
        Assert.Equal("Beach", dto.Title);
        Assert.Null(dto.Caption);
        Assert.Equal("large", dto.TileSize);
    }

    [Fact]
    public async Task Update_WithInvalidTileSize_Throws()
    {
        using var db = CreateInMemoryDb();
        var photo = Seed(db, 0);
        var service = CreateService(db);

        await Assert.ThrowsAsync<ArgumentException>(
            () => service.UpdateAsync(photo.Id, new PreweddingPhotoUpdateRequest(null, null, "huge")));
    }

    [Fact]
    public async Task Update_UnknownId_ReturnsNull()
    {
        using var db = CreateInMemoryDb();
        var service = CreateService(db);

        Assert.Null(await service.UpdateAsync(Guid.NewGuid(), new PreweddingPhotoUpdateRequest(null, null, null)));
    }

    [Fact]
    public async Task Delete_RemovesRow_AndStorageObjects()
    {
        using var db = CreateInMemoryDb();
        var photo = Seed(db, 0);
        var service = CreateService(db);

        Assert.True(await service.DeleteAsync(photo.Id));

        Assert.Empty(db.PreweddingPhotos);
        _storage.Verify(s => s.DeleteAsync(
            It.Is<IEnumerable<string>>(p => p.SequenceEqual(new[] { photo.FullPath, photo.ThumbPath })),
            It.IsAny<CancellationToken>()));
    }

    [Fact]
    public async Task Delete_UnknownId_ReturnsFalse()
    {
        using var db = CreateInMemoryDb();
        var service = CreateService(db);

        Assert.False(await service.DeleteAsync(Guid.NewGuid()));
    }
}
