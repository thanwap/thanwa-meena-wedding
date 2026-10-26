namespace WeddingApi.Entities;

public class GuestbookEntry
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? ImageUrls { get; set; }
    /// <summary>Which pre-wedding postcard the guest wrote on; null for entries from before the postcard guestbook.</summary>
    public int? PostcardId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
