namespace WeddingApi.Entities;

public class Guest
{
    public int Id { get; set; }
    public int RsvpId { get; set; }
    public int? TableId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public Rsvp Rsvp { get; set; } = null!;
    public WeddingTable? Table { get; set; }
}
