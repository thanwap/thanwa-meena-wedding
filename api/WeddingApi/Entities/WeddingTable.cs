namespace WeddingApi.Entities;

public class WeddingTable
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Shape { get; set; } = "circle";
    public double PositionX { get; set; }
    public double PositionY { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Guest> Guests { get; set; } = new List<Guest>();
}
