using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingApi.Security;
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
    [GuestRateLimit("photos-get")]
    public async Task<IActionResult> List(
        [FromQuery] string? cursor,
        [FromQuery] int limit = 24,
        [FromQuery] string? deviceId = null,
        [FromQuery] bool mine = false)
    {
        if (deviceId is not null && !IsDeviceId(deviceId))
            return BadRequest(new { error = "Invalid deviceId" });
        if (mine && deviceId is null)
            return BadRequest(new { error = "deviceId is required" });

        limit = Math.Clamp(limit, 1, 50);
        var result = await _service.GetPhotosAsync(cursor, limit, deviceId, mine);
        return Ok(result);
    }

    [HttpPost("upload")]
    [AllowAnonymous]
    [GuestRateLimit("photos-upload")]
    [RequestSizeLimit(20 * 1024 * 1024)] // 20 MB max
    public async Task<IActionResult> Upload([FromForm] PhotoUploadFormRequest request)
    {
        if (!IsDeviceId(request.DeviceId))
            return BadRequest(new { error = "deviceId is required" });

        var displayName = GuestText.Clean(request.DisplayName);
        if (!GuestText.HasVisibleText(displayName))
            return BadRequest(new { error = "displayName is required" });
        if (displayName.Length > DisplayNameMaxLength)
            return BadRequest(new { error = $"displayName must be {DisplayNameMaxLength} characters or fewer" });

        var filterName = request.FilterName ?? "none";
        if (!Filters.Contains(filterName))
            return BadRequest(new { error = "Unknown filterName" });

        if (request.Full is null || request.Thumb is null)
            return BadRequest(new { error = "full and thumb files are required" });

        if (request.Full.Length > 10 * 1024 * 1024 || request.Thumb.Length > 2 * 1024 * 1024)
            return BadRequest(new { error = "File too large" });

        // Files go to a public bucket — accept only real JPEGs, whatever the client claims
        if (!await IsJpegAsync(request.Full) || !await IsJpegAsync(request.Thumb))
            return BadRequest(new { error = "Photos must be JPEG" });

        try
        {
            var dto = await _service.UploadPhotoAsync(
                request.Full,
                request.Thumb,
                request.DeviceId,
                displayName,
                filterName);
            return StatusCode(201, dto);
        }
        catch (InvalidOperationException ex) when (ex.Message == "Photo limit reached")
        {
            return BadRequest(new { error = "Photo limit reached (10 photos per person)" });
        }
    }

    [HttpDelete("{id:guid}")]
    [AllowAnonymous]
    [GuestRateLimit("photos-delete")]
    public async Task<IActionResult> DeleteOwn(Guid id, [FromBody] PhotoDeleteRequest request)
    {
        if (!IsDeviceId(request.DeviceId))
            return BadRequest(new { error = "deviceId is required" });

        var deleted = await _service.DeletePhotoByOwnerAsync(id, request.DeviceId);
        return deleted ? NoContent() : NotFound();
    }

    private const int DisplayNameMaxLength = 40;

    /// <summary>The photo booth's filters (web/lib/image-filters.ts).</summary>
    private static readonly HashSet<string> Filters = ["none", "warm-vintage", "cool-film", "bw-classic"];

    private static async Task<bool> IsJpegAsync(IFormFile file)
    {
        var header = new byte[3];
        await using var stream = file.OpenReadStream();
        return await stream.ReadAtLeastAsync(header, 3, throwOnEndOfStream: false) == 3
            && header is [0xFF, 0xD8, 0xFF];
    }

    /// <summary>Device ids are browser-generated UUIDs (crypto.randomUUID) — reject anything else.</summary>
    private static bool IsDeviceId(string? value) => Guid.TryParseExact(value, "D", out _);

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
