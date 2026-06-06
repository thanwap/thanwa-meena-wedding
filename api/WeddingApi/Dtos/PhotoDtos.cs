namespace WeddingApi.Dtos;

public record PhotoDto(
    Guid Id,
    string DeviceId,
    string DisplayName,
    string FilterName,
    string FullUrl,
    string ThumbUrl,
    DateTime CreatedAt
);

public record PhotoPagedResult(
    List<PhotoDto> Photos,
    string? NextCursor
);

public record AdminPhotoPagedResult(
    List<PhotoDto> Photos,
    string? NextCursor,
    int Total
);

public record PhotoDeleteRequest(string DeviceId);

public record AdminBulkDeleteRequest(List<Guid> Ids);
