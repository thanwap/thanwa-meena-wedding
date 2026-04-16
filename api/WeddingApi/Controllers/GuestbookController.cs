using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingApi.Dtos;
using WeddingApi.Services;

namespace WeddingApi.Controllers;

[ApiController]
[Route("api/guestbook")]
[Authorize]
public class GuestbookController : ControllerBase
{
    private readonly IGuestbookService _service;

    public GuestbookController(IGuestbookService service)
    {
        _service = service;
    }

    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("guestbook-post")]
    public async Task<IActionResult> Create([FromForm] GuestbookCreateFormRequest request)
    {
        if (!string.IsNullOrEmpty(request.HpWebsite))
            return BadRequest(new { error = "rejected" });

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required." });

        if (string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new { error = "Message is required." });

        if ((request.Images?.Count ?? 0) > 3)
            return BadRequest(new { error = "Maximum 3 images allowed." });

        try
        {
            var created = await _service.CreateAsync(request);
            return StatusCode(201, created);
        }
        catch (InvalidOperationException ex) when (ex.Message == "rejected")
        {
            return BadRequest(new { error = "rejected" });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List()
    {
        var entries = await _service.ListPublicAsync();
        return Ok(entries);
    }

    [HttpGet("admin")]
    public async Task<IActionResult> AdminList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await _service.ListAdminPagedAsync(page, pageSize, search);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _service.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
