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

/// <summary>
/// What guests see. No device id — it is the only proof of ownership for deleting a photo,
/// so publishing it would let anyone delete everyone's photos.
/// </summary>
public record GuestPhotoDto(
    Guid Id,
    string DisplayName,
    string FilterName,
    string FullUrl,
    string ThumbUrl,
    DateTime CreatedAt,
    bool IsMine
);

public record PhotoPagedResult(
    List<GuestPhotoDto> Photos,
    string? NextCursor
);

public record AdminPhotoPagedResult(
    List<PhotoDto> Photos,
    string? NextCursor,
    int Total
);

public record PhotoDeleteRequest(string DeviceId);

public record AdminBulkDeleteRequest(List<Guid> Ids);
