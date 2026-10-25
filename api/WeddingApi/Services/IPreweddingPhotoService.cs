using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IPreweddingPhotoService
{
    Task<List<PreweddingPhotoDto>> GetAllAsync();
    Task<PreweddingPhotoDto> UploadAsync(Stream image, string? title, string? caption, CancellationToken ct = default);
    Task<PreweddingPhotoDto?> UpdateAsync(Guid id, PreweddingPhotoUpdateRequest request);
    Task ReorderAsync(List<Guid> ids);
    Task<bool> DeleteAsync(Guid id);
}
