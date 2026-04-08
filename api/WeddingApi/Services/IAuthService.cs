using WeddingApi.Dtos;

namespace WeddingApi.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<bool> ChangePasswordAsync(string username, ChangePasswordRequest request);
}
