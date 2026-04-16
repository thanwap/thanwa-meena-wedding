using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IGuestbookService
{
    Task<GuestbookDto> CreateAsync(GuestbookCreateFormRequest request);
    Task<List<GuestbookDto>> ListPublicAsync();
    Task<PagedResult<GuestbookAdminDto>> ListAdminPagedAsync(int page, int pageSize, string? search);
    Task<bool> DeleteAsync(int id);
}
