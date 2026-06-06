using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IPhotoService
{
    Task<PhotoPagedResult> GetPhotosAsync(string? cursor, int limit, string? deviceId);
    Task<PhotoDto> UploadPhotoAsync(IFormFile full, IFormFile thumb, string deviceId, string displayName, string filterName);
    Task<bool> DeletePhotoByOwnerAsync(Guid id, string deviceId);
    Task<AdminPhotoPagedResult> GetPhotosAdminAsync(string? cursor, int limit);
    Task<int> BulkDeleteAsync(List<Guid> ids);
}
