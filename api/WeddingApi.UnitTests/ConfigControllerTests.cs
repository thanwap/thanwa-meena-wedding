using Microsoft.AspNetCore.Mvc;
using Moq;
using WeddingApi.Controllers;
using WeddingApi.Dtos;
using WeddingApi.Services;

namespace WeddingApi.UnitTests;

public class ConfigControllerTests
{
    private readonly Mock<IConfigService> _serviceMock = new();
    private readonly ConfigController _controller;

    public ConfigControllerTests()
    {
        _controller = new ConfigController(_serviceMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithList()
    {
        var configs = new List<ConfigDto>
        {
            new(1, "marry_date", "2026-12-26", "date", DateTime.UtcNow, DateTime.UtcNow)
        };
        _serviceMock.Setup(s => s.GetAllAsync()).ReturnsAsync(configs);

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(configs, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenExists_ReturnsOk()
    {
        var config = new ConfigDto(1, "marry_date", "2026-12-26", "date", DateTime.UtcNow, DateTime.UtcNow);
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(config);

        var result = await _controller.GetById(1);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(config, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenMissing_ReturnsNotFound()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(99)).ReturnsAsync((ConfigDto?)null);

        var result = await _controller.GetById(99);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var request = new ConfigRequest("marry_date", "2026-12-26", "date");
        var created = new ConfigDto(1, "marry_date", "2026-12-26", "date", DateTime.UtcNow, DateTime.UtcNow);
        _serviceMock.Setup(s => s.CreateAsync(request)).ReturnsAsync(created);

        var result = await _controller.Create(request);

        var createdAt = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(201, createdAt.StatusCode);
        Assert.Equal(created, createdAt.Value);
    }

    [Fact]
    public async Task Update_WhenExists_ReturnsOk()
    {
        var request = new ConfigRequest("marry_date", "2026-12-27", "date");
        var updated = new ConfigDto(1, "marry_date", "2026-12-27", "date", DateTime.UtcNow, DateTime.UtcNow);
        _serviceMock.Setup(s => s.UpdateAsync(1, request)).ReturnsAsync(updated);

        var result = await _controller.Update(1, request);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(updated, ok.Value);
    }

    [Fact]
    public async Task Update_WhenMissing_ReturnsNotFound()
    {
        var request = new ConfigRequest("marry_date", "2026-12-27", "date");
        _serviceMock.Setup(s => s.UpdateAsync(99, request)).ReturnsAsync((ConfigDto?)null);

        var result = await _controller.Update(99, request);

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Delete_WhenExists_ReturnsNoContent()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _controller.Delete(1);

        Assert.IsType<NoContentResult>(result);
    }

    [Fact]
    public async Task Delete_WhenMissing_ReturnsNotFound()
    {
        _serviceMock.Setup(s => s.DeleteAsync(99)).ReturnsAsync(false);

        var result = await _controller.Delete(99);

        Assert.IsType<NotFoundResult>(result);
    }
}
