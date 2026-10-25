namespace WeddingApi.Dtos;

public record PreweddingPhotoDto(
    Guid Id,
    string FullUrl,
    string ThumbUrl,
    int Width,
    int Height,
    string? Title,
    string? Caption,
    string? TileSize,
    int SortOrder,
    DateTime CreatedAt
);

public record PreweddingPhotoUpdateRequest(string? Title, string? Caption, string? TileSize);

public record PreweddingPhotoOrderRequest(List<Guid> Ids);
