using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingApi.Security;
using WeddingApi.Dtos;
using WeddingApi.Services;

namespace WeddingApi.Controllers;

[ApiController]
[Route("api/prewedding-photos")]
[Authorize]
public class PreweddingPhotosController : ControllerBase
{
    private const long MaxFileBytes = 15 * 1024 * 1024;
    private const int MaxTextLength = 200;

    private readonly IPreweddingPhotoService _service;

    public PreweddingPhotosController(IPreweddingPhotoService service)
    {
        _service = service;
    }

    // ── Public ─────────────────────────────────────────────────────────────────

    [HttpGet]
    [AllowAnonymous]
    [GuestRateLimit("photos-get")]
    public async Task<IActionResult> List() => Ok(await _service.GetAllAsync());

    // ── Admin ──────────────────────────────────────────────────────────────────

    [HttpPost]
    [RequestSizeLimit(MaxFileBytes + 64 * 1024)]
    public async Task<IActionResult> Upload([FromForm] PreweddingPhotoUploadForm form, CancellationToken ct)
    {
        if (form.File is null || form.File.Length == 0)
            return BadRequest(new { error = "file is required" });

        if (form.File.Length > MaxFileBytes)
            return BadRequest(new { error = "File too large (max 15 MB)" });

        if (form.Title?.Length > MaxTextLength || form.Caption?.Length > MaxTextLength)
            return BadRequest(new { error = $"title and caption must be at most {MaxTextLength} characters" });

        try
        {
            await using var stream = form.File.OpenReadStream();
            var dto = await _service.UploadAsync(stream, form.Title, form.Caption, ct);
            return StatusCode(201, dto);
        }
        catch (UnsupportedImageException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PreweddingPhotoUpdateRequest request)
    {
        if (request.Title?.Length > MaxTextLength || request.Caption?.Length > MaxTextLength)
            return BadRequest(new { error = $"title and caption must be at most {MaxTextLength} characters" });

        try
        {
            var dto = await _service.UpdateAsync(id, request);
            return dto is null ? NotFound() : Ok(dto);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPut("order")]
    public async Task<IActionResult> Reorder([FromBody] PreweddingPhotoOrderRequest request)
    {
        if (request.Ids is null || request.Ids.Count == 0)
            return BadRequest(new { error = "ids is required" });

        await _service.ReorderAsync(request.Ids);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await _service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}

public record PreweddingPhotoUploadForm
{
    public IFormFile? File { get; init; }
    public string? Title { get; init; }
    public string? Caption { get; init; }
}
