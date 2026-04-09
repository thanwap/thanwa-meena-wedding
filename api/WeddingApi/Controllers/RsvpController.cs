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

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var rsvps = await _service.ListAsync();
        return Ok(rsvps);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var rsvps = await _service.ListAsync();
        var stats = _service.GetStats(rsvps);
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
}
