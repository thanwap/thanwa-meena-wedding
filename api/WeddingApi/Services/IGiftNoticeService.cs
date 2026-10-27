using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IGiftNoticeService
{
    /// <summary>Stores a slip ahead of its notice, so the upload runs while the guest is still typing.</summary>
    /// <exception cref="UnsupportedImageException">Not a JPEG, or an unreasonable size.</exception>
    Task<GiftSlipDto> UploadSlipAsync(Stream image, CancellationToken ct = default);

    /// <exception cref="ArgumentException">Invalid input — the message is safe to show.</exception>
    Task<GiftNoticeDto> CreateAsync(GiftNoticeCreateRequest request, CancellationToken ct = default);

    Task<List<GiftNoticeDto>> ListAsync(CancellationToken ct = default);
    Task<GiftNoticeDto?> UpdateAsync(Guid id, GiftNoticeUpdateRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);

    /// <summary>Deletes every slip image (notices stay). Returns how many objects were removed.</summary>
    Task<int> DeleteAllSlipsAsync(CancellationToken ct = default);

    Task<string> ExportCsvAsync(CancellationToken ct = default);
}
