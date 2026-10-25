namespace WeddingApi.Entities;

public class PreweddingPhoto
{
    public Guid Id { get; set; }
    public string FullPath { get; set; } = string.Empty;
    public string ThumbPath { get; set; } = string.Empty;
    public int Width { get; set; }
    public int Height { get; set; }
    public string? Title { get; set; }
    public string? Caption { get; set; }
    public string? TileSize { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}
