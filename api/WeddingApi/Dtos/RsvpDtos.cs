namespace WeddingApi.Dtos;

public record RsvpCreateRequest(
    bool Attending,
    string Name,
    int GuestCount,
    string? Dietary,
    string? Message,
    string? HpWebsite);

public record RsvpUpdateRequest(string Status);

public record RsvpDto(
    int Id,
    bool Attending,
    string Name,
    int GuestCount,
    string? Dietary,
    string? Message,
    string Status,
    DateTime CreatedAt,
    DateTime UpdatedAt);

public record RsvpStatsDto(
    int Total,
    int Attending,
    int Declining,
    int TotalGuests,
    int Pending,
    int Confirmed,
    int Cancelled);
