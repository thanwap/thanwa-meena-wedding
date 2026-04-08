namespace WeddingApi.Dtos;

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token, string Username);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
