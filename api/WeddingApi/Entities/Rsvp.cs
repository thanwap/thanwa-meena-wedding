namespace WeddingApi.Entities;

public class Rsvp
{
    public int Id { get; set; }
    public bool Attending { get; set; }
    public string Name { get; set; } = string.Empty;
    public int GuestCount { get; set; }
    public string? Dietary { get; set; }
    public string? Message { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
}
