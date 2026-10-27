namespace WeddingApi.Dtos;

public record GiftNoticeCreateRequest(string? Giver, DateTimeOffset? TransferredAt, decimal? Amount, Guid? SlipId);

public record GiftNoticeUpdateRequest(decimal? Amount, bool Verified);

public record GiftSlipDto(Guid SlipId);

public record GiftNoticeDto(
    Guid Id,
    string Giver,
    DateTime TransferredAt,
    decimal? Amount,
    bool HasSlip,
    /// <summary>Short-lived signed URL — admin responses only</summary>
    string? SlipUrl,
    bool Verified,
    DateTime CreatedAt
);
