using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WeddingApi.Data;
using WeddingApi.Dtos;
using WeddingApi.Entities;

namespace WeddingApi.Services;

public class PhotoService : IPhotoService
{
    private const int MaxPhotosPerDevice = 10;
    private const string Bucket = "photos";

    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _supabaseUrl;
    private readonly string _serviceRoleKey;

    public PhotoService(AppDbContext db, IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _supabaseUrl = (config["Supabase:Url"]
            ?? throw new InvalidOperationException("Supabase:Url is not configured")).TrimEnd('/');
        _serviceRoleKey = config["Supabase:ServiceRoleKey"]
            ?? throw new InvalidOperationException("Supabase:ServiceRoleKey is not configured");
    }

    public async Task<PhotoPagedResult> GetPhotosAsync(string? cursor, int limit, string? deviceId)
    {
        var query = _db.Photos.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(deviceId))
            query = query.Where(p => p.DeviceId == deviceId);

        if (!string.IsNullOrEmpty(cursor) && DateTime.TryParse(cursor, null,
            System.Globalization.DateTimeStyles.RoundtripKind, out var cursorDt))
            query = query.Where(p => p.CreatedAt < cursorDt);

        var rows = await query
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit + 1)
            .ToListAsync();

        var hasMore = rows.Count > limit;
        var page = hasMore ? rows.Take(limit).ToList() : rows;
        var nextCursor = hasMore ? page.Last().CreatedAt.ToString("O") : null;

        return new PhotoPagedResult(page.Select(ToDto).ToList(), nextCursor);
    }

    public async Task<PhotoDto> UploadPhotoAsync(
        IFormFile full, IFormFile thumb,
        string deviceId, string displayName, string filterName)
    {
        var count = await _db.Photos.CountAsync(p => p.DeviceId == deviceId);
        if (count >= MaxPhotosPerDevice)
            throw new InvalidOperationException("Photo limit reached");

        var ts = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var fullPath = $"full/{deviceId}/{ts}.jpg";
        var thumbPath = $"thumb/{deviceId}/{ts}.jpg";

        await Task.WhenAll(
            UploadToStorageAsync(full, fullPath),
            UploadToStorageAsync(thumb, thumbPath)
        );

        var photo = new Photo
        {
            DeviceId = deviceId,
            DisplayName = displayName.Trim(),
            FilePath = fullPath,
            ThumbPath = thumbPath,
            FilterName = filterName,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Photos.Add(photo);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch
        {
            // Roll back storage on DB failure
            await DeleteFromStorageAsync([fullPath, thumbPath]);
            throw;
        }

        return ToDto(photo);
    }

    public async Task<bool> DeletePhotoByOwnerAsync(Guid id, string deviceId)
    {
        var photo = await _db.Photos.FindAsync(id);
        if (photo is null || photo.DeviceId != deviceId) return false;

        await DeleteFromStorageAsync([photo.FilePath, photo.ThumbPath]);
        _db.Photos.Remove(photo);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<AdminPhotoPagedResult> GetPhotosAdminAsync(string? cursor, int limit)
    {
        var total = await _db.Photos.CountAsync();

        var query = _db.Photos.AsNoTracking().AsQueryable();

        if (!string.IsNullOrEmpty(cursor) && DateTime.TryParse(cursor, null,
            System.Globalization.DateTimeStyles.RoundtripKind, out var cursorDt))
            query = query.Where(p => p.CreatedAt < cursorDt);

        var rows = await query
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit + 1)
            .ToListAsync();

        var hasMore = rows.Count > limit;
        var page = hasMore ? rows.Take(limit).ToList() : rows;
        var nextCursor = hasMore ? page.Last().CreatedAt.ToString("O") : null;

        return new AdminPhotoPagedResult(page.Select(ToDto).ToList(), nextCursor, total);
    }

    public async Task<int> BulkDeleteAsync(List<Guid> ids)
    {
        if (ids.Count == 0) return 0;

        var photos = await _db.Photos
            .Where(p => ids.Contains(p.Id))
            .ToListAsync();

        if (photos.Count == 0) return 0;

        var paths = photos.SelectMany(p => new[] { p.FilePath, p.ThumbPath }).ToList();
        await DeleteFromStorageAsync(paths);

        _db.Photos.RemoveRange(photos);
        await _db.SaveChangesAsync();
        return photos.Count;
    }

    // ── Storage helpers ────────────────────────────────────────────────────────

    private async Task UploadToStorageAsync(IFormFile file, string path)
    {
        using var stream = file.OpenReadStream();
        using var content = new StreamContent(stream);
        content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{_supabaseUrl}/storage/v1/object/{Bucket}/{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        request.Content = content;

        var client = _httpClientFactory.CreateClient();
        var response = await client.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"Storage upload failed ({response.StatusCode}): {error}");
        }
    }

    private async Task DeleteFromStorageAsync(IEnumerable<string> paths)
    {
        var body = JsonSerializer.Serialize(new { prefixes = paths });
        using var content = new StringContent(body, Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(
            HttpMethod.Delete,
            $"{_supabaseUrl}/storage/v1/object/{Bucket}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        request.Content = content;

        var client = _httpClientFactory.CreateClient();
        await client.SendAsync(request); // best-effort — don't throw on storage delete failure
    }

    private string PublicUrl(string path) =>
        $"{_supabaseUrl}/storage/v1/object/public/{Bucket}/{path}";

    private PhotoDto ToDto(Photo p) => new(
        p.Id,
        p.DeviceId,
        p.DisplayName,
        p.FilterName,
        PublicUrl(p.FilePath),
        PublicUrl(p.ThumbPath),
        p.CreatedAt
    );
}
