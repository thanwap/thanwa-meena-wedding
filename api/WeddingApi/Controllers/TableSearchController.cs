using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using WeddingApi.Services;

namespace WeddingApi.Controllers;

[ApiController]
[Route("api/table")]
public class TableSearchController : ControllerBase
{
    private readonly ISeatingService _service;

    public TableSearchController(ISeatingService service)
    {
        _service = service;
    }

    [HttpGet("search")]
    [EnableRateLimiting("table-search")]
    public async Task<IActionResult> Search([FromQuery] string? name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length < 2)
            return BadRequest(new { error = "กรุณาพิมพ์ชื่ออย่างน้อย 2 ตัวอักษร" });

        var results = await _service.SearchGuestsAsync(name);
        return Ok(results);
    }
}
