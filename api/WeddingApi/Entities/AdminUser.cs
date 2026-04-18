namespace WeddingApi.Entities;

public class AdminUser
{
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "viewer";
    public DateTime UpdatedAt { get; set; }
}
