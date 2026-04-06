using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IConfigService
{
    Task<List<ConfigDto>> GetAllAsync();
    Task<ConfigDto?> GetByIdAsync(int id);
    Task<ConfigDto> CreateAsync(ConfigRequest request);
    Task<ConfigDto?> UpdateAsync(int id, ConfigRequest request);

    /// <returns>true if found and soft-deleted; false if not found.</returns>
    Task<bool> DeleteAsync(int id);
}
