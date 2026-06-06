using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingApi.Dtos;
using WeddingApi.Services;

namespace WeddingApi.Controllers;

[ApiController]
[Route("api/photos")]
[Authorize]
public class PhotosController : ControllerBase
{
    private readonly IPhotoService _service;

    public PhotosController(IPhotoService service)
    {
        _service = service;
    }

    // ── Public ─────────────────────────────────────────────────────────────────

    [HttpGet]
    [AllowAnonymous]
    [EnableRateLimiting("photos-get")]
    public async Task<IActionResult> List(
        [FromQuery] string? cursor,
        [FromQuery] int limit = 24,
        [FromQuery] string? deviceId = null)
    {
        limit = Math.Clamp(limit, 1, 50);
        var result = await _service.GetPhotosAsync(cursor, limit, deviceId);
        return Ok(result);
    }

    [HttpPost("upload")]
    [AllowAnonymous]
    [EnableRateLimiting("photos-upload")]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20 MB max
    public async Task<IActionResult> Upload([FromForm] PhotoUploadFormRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceId))
            return BadRequest(new { error = "deviceId is required" });

        if (string.IsNullOrWhiteSpace(request.DisplayName))
            return BadRequest(new { error = "displayName is required" });

        if (request.Full is null || request.Thumb is null)
            return BadRequest(new { error = "full and thumb files are required" });

        if (request.Full.Length > 10 * 1024 * 1024 || request.Thumb.Length > 2 * 1024 * 1024)
            return BadRequest(new { error = "File too large" });

        try
        {
            var dto = await _service.UploadPhotoAsync(
                request.Full,
                request.Thumb,
                request.DeviceId,
                request.DisplayName,
                request.FilterName ?? "none");
            return StatusCode(201, dto);
        }
        catch (InvalidOperationException ex) when (ex.Message == "Photo limit reached")
        {
            return BadRequest(new { error = "Photo limit reached (10 photos per person)" });
        }
    }

    [HttpDelete("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteOwn(Guid id, [FromBody] PhotoDeleteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DeviceId))
            return BadRequest(new { error = "deviceId is required" });

        var deleted = await _service.DeletePhotoByOwnerAsync(id, request.DeviceId);
        return deleted ? NoContent() : NotFound();
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    [HttpGet("admin")]
    public async Task<IActionResult> AdminList(
        [FromQuery] string? cursor,
        [FromQuery] int limit = 50)
    {
        limit = Math.Clamp(limit, 1, 100);
        var result = await _service.GetPhotosAdminAsync(cursor, limit);
        return Ok(result);
    }

    [HttpDelete("admin/bulk")]
    public async Task<IActionResult> AdminBulkDelete([FromBody] AdminBulkDeleteRequest request)
    {
        if (request.Ids is null || request.Ids.Count == 0)
            return BadRequest(new { error = "ids is required" });

        var count = await _service.BulkDeleteAsync(request.Ids);
        return Ok(new { deleted = count });
    }
}

public record PhotoUploadFormRequest
{
    public IFormFile? Full { get; init; }
    public IFormFile? Thumb { get; init; }
    public string? DeviceId { get; init; }
    public string? DisplayName { get; init; }
    public string? FilterName { get; init; }
}
