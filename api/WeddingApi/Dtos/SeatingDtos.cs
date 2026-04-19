namespace WeddingApi.Dtos;

public record GuestDto(
    int Id,
    int RsvpId,
    int? TableId,
    string Name,
    int SortOrder,
    string RsvpName);

public record WeddingTableDto(
    int Id,
    string Name,
    int Capacity,
    string Shape,
    double PositionX,
    double PositionY,
    List<GuestDto> Guests);

public record SeatingOverviewDto(
    List<WeddingTableDto> Tables,
    List<GuestDto> UnassignedGuests);

public record WeddingTableCreateRequest(
    string Name,
    int Capacity,
    string Shape = "circle");

public record WeddingTableUpdateRequest(
    string? Name,
    int? Capacity,
    string? Shape);

public record WeddingTablePositionRequest(
    double PositionX,
    double PositionY);

public record GuestGenerateRequest(int RsvpId);

public record GuestUpdateRequest(
    string? Name,
    int? TableId);

// Public DTOs (no auth required)
public record TableSearchResultDto(
    string TableName,
    List<string> Guests);

public record GuestSearchResponseDto(
    string GuestName,
    TableSearchResultDto? Table);
