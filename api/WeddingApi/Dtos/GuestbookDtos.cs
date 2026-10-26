namespace WeddingApi.Dtos;

public class GuestbookCreateFormRequest
{
    public string Name { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int? PostcardId { get; set; }
    public string? HpWebsite { get; set; }
}

public class GuestbookDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int? PostcardId { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class GuestbookAdminDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int? PostcardId { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
