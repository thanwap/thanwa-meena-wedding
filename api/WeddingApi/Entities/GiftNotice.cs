namespace WeddingApi.Entities;

/// <summary>A guest's note about a gift transfer: who it is from and when it was sent.</summary>
public class GiftNotice
{
    public Guid Id { get; set; }
    public string Giver { get; set; } = string.Empty;
    public DateTime TransferredAt { get; set; }
    public decimal? Amount { get; set; }
    /// <summary>Object path in the private "slips" bucket; null when no slip was sent or it was deleted.</summary>
    public string? SlipPath { get; set; }
    public bool Verified { get; set; }
    public DateTime CreatedAt { get; set; }
}
