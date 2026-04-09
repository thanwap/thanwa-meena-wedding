using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IRsvpService
{
    Task<RsvpDto> CreateAsync(RsvpCreateRequest request);
    Task<List<RsvpDto>> ListAsync();
    Task<RsvpDto?> GetAsync(int id);
    Task<RsvpDto?> UpdateStatusAsync(int id, RsvpUpdateRequest request);
    Task<bool> DeleteAsync(int id);
    RsvpStatsDto GetStats(List<RsvpDto> rsvps);
    Task<string> ExportCsvAsync();
}
