using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IGuestbookService
{
    Task<GuestbookDto> CreateAsync(GuestbookCreateFormRequest request);
    Task<List<GuestbookDto>> ListPublicAsync(int count = 0);
    Task<PagedResult<GuestbookAdminDto>> ListAdminPagedAsync(int page, int pageSize, string? search);
    Task<bool> DeleteAsync(int id);
}
