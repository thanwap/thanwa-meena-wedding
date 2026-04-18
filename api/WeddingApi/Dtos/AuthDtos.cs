namespace WeddingApi.Dtos;

public record LoginRequest(string Username, string Password);

public record LoginResponse(string Token, string Username, string Role);

public record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public record CreateUserRequest(string Username, string Role = "viewer");

public record CreateUserResponse(string Username, string Password, string Role);

public record AdminUserDto(string Username, string Role, DateTime UpdatedAt);

public record ResetPasswordResponse(string Username, string Password);

public record ChangeRoleRequest(string Role);
