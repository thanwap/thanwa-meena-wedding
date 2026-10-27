using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingApi.Dtos;
using WeddingApi.Security;
using WeddingApi.Services;

namespace WeddingApi.Controllers;

[ApiController]
[Route("api/gift-notices")]
[Authorize]
public class GiftNoticesController : ControllerBase
{
    /// <summary>The browser sends ~200 KB; this only stops someone posting junk.</summary>
    private const long MaxSlipBytes = 5 * 1024 * 1024;

    private readonly IGiftNoticeService _service;

    public GiftNoticesController(IGiftNoticeService service)
    {
        _service = service;
    }

    // ── Public ─────────────────────────────────────────────────────────────────

    [HttpPost("slips")]
    [AllowAnonymous]
    [GuestRateLimit("gift-slip-upload")]
    [RequestSizeLimit(MaxSlipBytes + 64 * 1024)]
    public async Task<IActionResult> UploadSlip(IFormFile? file, CancellationToken ct)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { error = "file is required" });
        if (file.Length > MaxSlipBytes)
            return BadRequest(new { error = "File too large" });

        try
        {
            await using var stream = file.OpenReadStream();
            return StatusCode(201, await _service.UploadSlipAsync(stream, ct));
        }
        catch (UnsupportedImageException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost]
    [AllowAnonymous]
    [GuestRateLimit("gift-notice-post")]
    public async Task<IActionResult> Create([FromBody] GiftNoticeCreateRequest request, CancellationToken ct)
    {
        try
        {
            var created = await _service.CreateAsync(request, ct);
            // Guests get no read-back — the id is all they need
            return StatusCode(201, new { created.Id });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    // ── Admin ──────────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await _service.ListAsync(ct));

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] GiftNoticeUpdateRequest request, CancellationToken ct)
    {
        try
        {
            var updated = await _service.UpdateAsync(id, request, ct);
            return updated is null ? NotFound() : Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct) =>
        await _service.DeleteAsync(id, ct) ? NoContent() : NotFound();

    [HttpDelete("slips")]
    public async Task<IActionResult> DeleteAllSlips(CancellationToken ct) =>
        Ok(new { deleted = await _service.DeleteAllSlipsAsync(ct) });

    [HttpGet("export.csv")]
    public async Task<IActionResult> ExportCsv(CancellationToken ct)
    {
        // BOM so Excel opens the Thai names as UTF-8
        var bytes = System.Text.Encoding.UTF8.GetPreamble()
            .Concat(System.Text.Encoding.UTF8.GetBytes(await _service.ExportCsvAsync(ct)))
            .ToArray();
        return File(bytes, "text/csv; charset=utf-8", "gift-notices.csv");
    }
}
