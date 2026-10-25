using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;

namespace WeddingApi.Services;

public class PreweddingPhotoService : IPreweddingPhotoService
{
    public static readonly string[] TileSizes = ["large", "tall", "wide", "small"];

    private readonly AppDbContext _db;
    private readonly IImageProcessor _processor;
    private readonly IPhotoStorage _storage;

    public PreweddingPhotoService(AppDbContext db, IImageProcessor processor, IPhotoStorage storage)
    {
        _db = db;
        _processor = processor;
        _storage = storage;
    }

    public async Task<List<PreweddingPhotoDto>> GetAllAsync()
    {
        var rows = await _db.PreweddingPhotos
            .AsNoTracking()
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.CreatedAt)
            .ToListAsync();
        return rows.Select(ToDto).ToList();
    }

    public async Task<PreweddingPhotoDto> UploadAsync(
        Stream image, string? title, string? caption, CancellationToken ct = default)
    {
        var processed = await _processor.ToWebpAsync(image, ct);

        var id = Guid.NewGuid();
        var fullPath = $"prewedding/full/{id}.webp";
        var thumbPath = $"prewedding/thumb/{id}.webp";

        await Task.WhenAll(
            _storage.UploadAsync(fullPath, processed.Full, "image/webp", ct),
            _storage.UploadAsync(thumbPath, processed.Thumb, "image/webp", ct));

        var maxOrder = await _db.PreweddingPhotos.MaxAsync(p => (int?)p.SortOrder, ct) ?? -1;

        var photo = new PreweddingPhoto
        {
            Id = id,
            FullPath = fullPath,
            ThumbPath = thumbPath,
            Width = processed.Width,
            Height = processed.Height,
            Title = Clean(title),
            Caption = Clean(caption),
            SortOrder = maxOrder + 1,
            CreatedAt = DateTime.UtcNow,
        };
        _db.PreweddingPhotos.Add(photo);

        try
        {
            await _db.SaveChangesAsync(ct);
        }
        catch
        {
            // Roll back storage on DB failure
            await _storage.DeleteAsync([fullPath, thumbPath], CancellationToken.None);
            throw;
        }

        return ToDto(photo);
    }

    public async Task<PreweddingPhotoDto?> UpdateAsync(Guid id, PreweddingPhotoUpdateRequest request)
    {
        var tileSize = Clean(request.TileSize);
        if (tileSize is not null && !TileSizes.Contains(tileSize))
            throw new ArgumentException($"tileSize must be one of: {string.Join(", ", TileSizes)}");

        var photo = await _db.PreweddingPhotos.FindAsync(id);
        if (photo is null) return null;

        photo.Title = Clean(request.Title);
        photo.Caption = Clean(request.Caption);
        photo.TileSize = tileSize;
        await _db.SaveChangesAsync();
        return ToDto(photo);
    }

    public async Task ReorderAsync(List<Guid> ids)
    {
        var photos = await _db.PreweddingPhotos
            .Where(p => ids.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        for (var i = 0; i < ids.Count; i++)
        {
            if (photos.TryGetValue(ids[i], out var photo))
                photo.SortOrder = i;
        }
        await _db.SaveChangesAsync();
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var photo = await _db.PreweddingPhotos.FindAsync(id);
        if (photo is null) return false;

        _db.PreweddingPhotos.Remove(photo);
        await _db.SaveChangesAsync();
        await _storage.DeleteAsync([photo.FullPath, photo.ThumbPath]);
        return true;
    }

    private static string? Clean(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private PreweddingPhotoDto ToDto(PreweddingPhoto p) => new(
        p.Id,
        _storage.PublicUrl(p.FullPath),
        _storage.PublicUrl(p.ThumbPath),
        p.Width,
        p.Height,
        p.Title,
        p.Caption,
        p.TileSize,
        p.SortOrder,
        p.CreatedAt
    );
}
