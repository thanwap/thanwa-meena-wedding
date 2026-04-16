using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingApi.Dtos;
using WeddingApi.Services;

namespace WeddingApi.Controllers;

[ApiController]
[Route("api/rsvps")]
[Authorize]
public class RsvpController : ControllerBase
{
    private readonly IRsvpService _service;

    public RsvpController(IRsvpService service)
    {
        _service = service;
    }

    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("rsvp-post")]
    public async Task<IActionResult> Create([FromBody] RsvpCreateRequest request)
    {
        // Honeypot check
        if (!string.IsNullOrEmpty(request.HpWebsite))
            return BadRequest(new { error = "rejected" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required." });

        if (request.GuestCount < 1 || request.GuestCount > 10)
            return BadRequest(new { error = "GuestCount must be between 1 and 10." });

        try
        {
            var created = await _service.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex) when (ex.Message == "rejected")
        {
            return BadRequest(new { error = "rejected" });
        }
    }

    [HttpPost("admin")]
    public async Task<IActionResult> AdminCreate([FromBody] AdminRsvpCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required." });

        if (request.GuestCount < 1 || request.GuestCount > 10)
            return BadRequest(new { error = "GuestCount must be between 1 and 10." });

        var created = await _service.AdminCreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? status = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _service.ListPagedAsync(page, pageSize, search, status);
        return Ok(result);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var stats = await _service.GetStatsAsync();
        return Ok(stats);
    }

    [HttpGet("export.csv")]
    public async Task<IActionResult> ExportCsv()
    {
        var csv = await _service.ExportCsvAsync();
        return File(System.Text.Encoding.UTF8.GetBytes(csv), "text/csv", "rsvps.csv");
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var rsvp = await _service.GetAsync(id);
        return rsvp is null ? NotFound() : Ok(rsvp);
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] RsvpUpdateRequest request)
    {
        var updated = await _service.UpdateStatusAsync(id, request);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("batch-status")]
    public async Task<IActionResult> BatchUpdateStatus([FromBody] BatchUpdateStatusRequest request)
    {
        var validStatuses = new[] { "pending", "confirmed", "cancelled" };
        if (!validStatuses.Contains(request.Status))
            return BadRequest(new { error = "Invalid status." });
        if (request.Ids is null || request.Ids.Count == 0)
            return BadRequest(new { error = "No IDs provided." });

        var count = await _service.BatchUpdateStatusAsync(request.Ids, request.Status);
        return Ok(new { updated = count });
    }

    [HttpDelete("batch")]
    public async Task<IActionResult> BatchDelete([FromBody] BatchDeleteRequest request)
    {
        if (request.Ids is null || request.Ids.Count == 0)
            return BadRequest(new { error = "No IDs provided." });

        var count = await _service.BatchDeleteAsync(request.Ids);
        return Ok(new { deleted = count });
    }
}
