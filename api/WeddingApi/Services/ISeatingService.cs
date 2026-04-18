using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface ISeatingService
{
    Task<SeatingOverviewDto> GetOverviewAsync();
    Task<WeddingTableDto> CreateTableAsync(WeddingTableCreateRequest request);
    Task<WeddingTableDto?> UpdateTableAsync(int id, WeddingTableUpdateRequest request);
    Task<bool> UpdateTablePositionAsync(int id, WeddingTablePositionRequest request);
    Task<bool> DeleteTableAsync(int id);
    Task<List<GuestDto>> GenerateGuestsForRsvpAsync(int rsvpId);
    Task<List<GuestDto>> GenerateAllGuestsAsync();
    Task<GuestDto?> UpdateGuestAsync(int id, GuestUpdateRequest request);
    Task<bool> UnassignGuestAsync(int id);
    Task DeleteGuestsByRsvpAsync(int rsvpId);
    Task<List<GuestDto>> RegenerateGuestsForRsvpAsync(int rsvpId);
}
