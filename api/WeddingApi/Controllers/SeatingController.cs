using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WeddingApi.Dtos;
using WeddingApi.Services;

namespace WeddingApi.Controllers;

[ApiController]
[Route("api/seating")]
[Authorize]
public class SeatingController : ControllerBase
{
    private readonly ISeatingService _service;

    public SeatingController(ISeatingService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetOverview()
    {
        var overview = await _service.GetOverviewAsync();
        return Ok(overview);
    }

    [HttpPost("tables")]
    public async Task<IActionResult> CreateTable([FromBody] WeddingTableCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { error = "Name is required." });

        if (request.Capacity < 1)
            return BadRequest(new { error = "Capacity must be at least 1." });

        if (request.Shape is not ("circle" or "rectangle"))
            return BadRequest(new { error = "Shape must be 'circle' or 'rectangle'." });

        var table = await _service.CreateTableAsync(request);
        return CreatedAtAction(nameof(GetOverview), table);
    }

    [HttpPatch("tables/{id:int}")]
    public async Task<IActionResult> UpdateTable(int id, [FromBody] WeddingTableUpdateRequest request)
    {
        var table = await _service.UpdateTableAsync(id, request);
        return table is null ? NotFound() : Ok(table);
    }

    [HttpPatch("tables/{id:int}/position")]
    public async Task<IActionResult> UpdateTablePosition(int id, [FromBody] WeddingTablePositionRequest request)
    {
        var updated = await _service.UpdateTablePositionAsync(id, request);
        return updated ? NoContent() : NotFound();
    }

    [HttpDelete("tables/{id:int}")]
    public async Task<IActionResult> DeleteTable(int id)
    {
        var deleted = await _service.DeleteTableAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [HttpPost("guests/generate")]
    public async Task<IActionResult> GenerateGuests([FromBody] GuestGenerateRequest request)
    {
        try
        {
            var guests = await _service.GenerateGuestsForRsvpAsync(request.RsvpId);
            return Ok(guests);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("guests/regenerate")]
    public async Task<IActionResult> RegenerateGuests([FromBody] GuestGenerateRequest request)
    {
        try
        {
            var guests = await _service.RegenerateGuestsForRsvpAsync(request.RsvpId);
            return Ok(guests);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("guests/generate-all")]
    public async Task<IActionResult> GenerateAllGuests()
    {
        var guests = await _service.GenerateAllGuestsAsync();
        return Ok(guests);
    }

    [HttpPatch("guests/{id:int}")]
    public async Task<IActionResult> UpdateGuest(int id, [FromBody] GuestUpdateRequest request)
    {
        try
        {
            var guest = await _service.UpdateGuestAsync(id, request);
            return guest is null ? NotFound() : Ok(guest);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPatch("guests/{id:int}/unassign")]
    public async Task<IActionResult> UnassignGuest(int id)
    {
        var unassigned = await _service.UnassignGuestAsync(id);
        return unassigned ? NoContent() : NotFound();
    }
}
