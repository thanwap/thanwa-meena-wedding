using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IRsvpService
{
    Task<RsvpDto> CreateAsync(RsvpCreateRequest request);
    Task<RsvpDto> AdminCreateAsync(AdminRsvpCreateRequest request);
    Task<PagedResult<RsvpDto>> ListPagedAsync(int page, int pageSize, string? search, string? status);
    Task<RsvpDto?> GetAsync(int id);
    Task<RsvpDto?> UpdateStatusAsync(int id, RsvpUpdateRequest request);
    Task<RsvpDto?> UpdateGuestCountAsync(int id, int guestCount);
    Task<bool> DeleteAsync(int id);
    Task<int> BatchUpdateStatusAsync(List<int> ids, string status);
    Task<int> BatchDeleteAsync(List<int> ids);
    Task<RsvpStatsDto> GetStatsAsync();
    Task<string> ExportCsvAsync();
}
