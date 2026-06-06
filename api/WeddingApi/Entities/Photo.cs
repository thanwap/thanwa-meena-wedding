namespace WeddingApi.Entities;

public class Photo
{
    public Guid Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string ThumbPath { get; set; } = string.Empty;
    public string FilterName { get; set; } = "none";
    public DateTime CreatedAt { get; set; }
}
