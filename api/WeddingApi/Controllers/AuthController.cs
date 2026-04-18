using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingApi.Dtos;
using WeddingApi.Services;

namespace WeddingApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;

    public AuthController(IAuthService service)
    {
        _service = service;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _service.LoginAsync(request);
        return result is null ? Unauthorized() : Ok(result);
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var username = User.Identity?.Name;
        if (string.IsNullOrEmpty(username)) return Unauthorized();

        var ok = await _service.ChangePasswordAsync(username, request);
        return ok ? NoContent() : BadRequest(new { error = "Invalid current password" });
    }

    [HttpGet("users")]
    [Authorize]
    public async Task<IActionResult> ListUsers()
    {
        var users = await _service.ListUsersAsync();
        return Ok(users);
    }

    [HttpPost("users")]
    [Authorize(Roles = "super_admin")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest(new { error = "Username is required." });

        var result = await _service.CreateUserAsync(request.Username, request.Role);
        if (result is null)
            return Conflict(new { error = "Username already exists." });

        return Ok(result);
    }

    [HttpPatch("users/{username}/role")]
    [Authorize(Roles = "super_admin")]
    public async Task<IActionResult> ChangeRole(string username, [FromBody] ChangeRoleRequest request)
    {
        var currentUser = User.Identity?.Name;
        if (string.Equals(currentUser, username, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Cannot change your own role." });

        var result = await _service.ChangeRoleAsync(username, request.Role);
        if (result is null)
            return NotFound(new { error = "User not found or invalid role." });

        return Ok(result);
    }

    [HttpPost("users/{username}/reset-password")]
    [Authorize(Roles = "super_admin")]
    public async Task<IActionResult> ResetPassword(string username)
    {
        var result = await _service.ResetPasswordAsync(username);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpDelete("users/{username}")]
    [Authorize(Roles = "super_admin")]
    public async Task<IActionResult> DeleteUser(string username)
    {
        var currentUser = User.Identity?.Name;
        if (string.Equals(currentUser, username, StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { error = "Cannot delete your own account." });

        var deleted = await _service.DeleteUserAsync(username);
        return deleted ? NoContent() : NotFound();
    }
}
