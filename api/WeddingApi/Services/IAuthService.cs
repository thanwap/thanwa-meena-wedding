using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<bool> ChangePasswordAsync(string username, ChangePasswordRequest request);
    Task<List<AdminUserDto>> ListUsersAsync();
    Task<CreateUserResponse?> CreateUserAsync(string username, string role);
    Task<AdminUserDto?> ChangeRoleAsync(string username, string role);
    Task<ResetPasswordResponse?> ResetPasswordAsync(string username);
    Task<bool> DeleteUserAsync(string username);
}
