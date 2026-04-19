using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WeddingApi.Data;
using WeddingApi.Dtos;
using BC = BCrypt.Net.BCrypt;

namespace WeddingApi.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == request.Username);
        if (user is null) return null;
        if (!BC.Verify(request.Password, user.PasswordHash)) return null;

        var token = IssueToken(user.Username, user.Role);
        return new LoginResponse(token, user.Username, user.Role);
    }

    public async Task<bool> ChangePasswordAsync(string username, ChangePasswordRequest request)
    {
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return false;
        if (!BC.Verify(request.CurrentPassword, user.PasswordHash)) return false;

        user.PasswordHash = BC.HashPassword(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<AdminUserDto>> ListUsersAsync()
    {
        var users = await _db.AdminUsers
            .OrderBy(u => u.Username)
            .ToListAsync();
        return users.Select(u => new AdminUserDto(u.Username, u.Role, u.UpdatedAt)).ToList();
    }

    public async Task<CreateUserResponse?> CreateUserAsync(string username, string role)
    {
        var normalizedUsername = username.Trim().ToLower();
        var exists = await _db.AdminUsers.AnyAsync(u => u.Username == normalizedUsername);
        if (exists) return null;

        var validRoles = new[] { "super_admin", "viewer" };
        var validRole = validRoles.Contains(role) ? role : "viewer";

        var password = GeneratePassword();
        var user = new Entities.AdminUser
        {
            Username = normalizedUsername,
            PasswordHash = BC.HashPassword(password),
            Role = validRole,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.AdminUsers.Add(user);
        await _db.SaveChangesAsync();
        return new CreateUserResponse(user.Username, password, user.Role);
    }

    public async Task<AdminUserDto?> ChangeRoleAsync(string username, string role)
    {
        var validRoles = new[] { "super_admin", "viewer" };
        if (!validRoles.Contains(role)) return null;

        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return null;

        user.Role = role;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new AdminUserDto(user.Username, user.Role, user.UpdatedAt);
    }

    public async Task<ResetPasswordResponse?> ResetPasswordAsync(string username)
    {
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return null;

        var password = GeneratePassword();
        user.PasswordHash = BC.HashPassword(password);
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return new ResetPasswordResponse(user.Username, password);
    }

    public async Task<bool> DeleteUserAsync(string username)
    {
        var user = await _db.AdminUsers.FirstOrDefaultAsync(u => u.Username == username);
        if (user is null) return false;
        _db.AdminUsers.Remove(user);
        await _db.SaveChangesAsync();
        return true;
    }

    private static string GeneratePassword(int length = 16)
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        var sb = new System.Text.StringBuilder(length);
        for (var i = 0; i < length; i++)
            sb.Append(chars[System.Security.Cryptography.RandomNumberGenerator.GetInt32(chars.Length)]);
        return sb.ToString();
    }

    private string IssueToken(string username, string role)
    {
        var key = _config["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured");
        var issuer = _config["Jwt:Issuer"] ?? "wedding-api";
        var audience = _config["Jwt:Audience"] ?? "wedding-web";

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, username),
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
