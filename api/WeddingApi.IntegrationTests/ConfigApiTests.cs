using System.Net;
using System.Net.Http.Json;
using WeddingApi.Dtos;

namespace WeddingApi.IntegrationTests;

/// <summary>
/// Full end-to-end HTTP tests: request → controller → service → real PostgreSQL → response.
/// Each test uses a unique Key to avoid interference with other tests sharing the same DB.
/// </summary>
public class ConfigApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public ConfigApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Post_CreatesConfig_Returns201WithBody()
    {
        var request = new ConfigRequest("marry_date", "2026-12-26", "date");

        var response = await _client.PostAsJsonAsync("/api/configs", request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<ConfigDto>();
        Assert.NotNull(created);
        Assert.True(created.Id > 0);
        Assert.Equal("marry_date", created.Key);
        Assert.Equal("2026-12-26", created.Value);
        Assert.Equal("date", created.Type);
    }

    [Fact]
    public async Task Get_ReturnsCreatedConfig()
    {
        // Arrange — create a config first
        var request = new ConfigRequest("venue_name", "The Cop Seminar and Resort, Pattaya", "location");
        await _client.PostAsJsonAsync("/api/configs", request);

        // Act
        var response = await _client.GetAsync("/api/configs");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var configs = await response.Content.ReadFromJsonAsync<List<ConfigDto>>();
        Assert.NotNull(configs);
        Assert.Contains(configs, c => c.Key == "venue_name");
    }

    [Fact]
    public async Task GetById_ReturnsCorrectConfig()
    {
        // Arrange
        var request = new ConfigRequest("wedding_theme", "Garden", "string");
        var postResponse = await _client.PostAsJsonAsync("/api/configs", request);
        var created = await postResponse.Content.ReadFromJsonAsync<ConfigDto>();

        // Act
        var response = await _client.GetAsync($"/api/configs/{created!.Id}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var config = await response.Content.ReadFromJsonAsync<ConfigDto>();
        Assert.Equal("wedding_theme", config!.Key);
        Assert.Equal("Garden", config.Value);
    }

    [Fact]
    public async Task Put_UpdatesConfig_Returns200()
    {
        // Arrange
        var createRequest = new ConfigRequest("dress_code", "Formal", "string");
        var postResponse = await _client.PostAsJsonAsync("/api/configs", createRequest);
        var created = await postResponse.Content.ReadFromJsonAsync<ConfigDto>();

        // Act
        var updateRequest = new ConfigRequest("dress_code", "Semi-Formal", "string");
        var putResponse = await _client.PutAsJsonAsync($"/api/configs/{created!.Id}", updateRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        var updated = await putResponse.Content.ReadFromJsonAsync<ConfigDto>();
        Assert.Equal("Semi-Formal", updated!.Value);
        Assert.Equal(created.Id, updated.Id);
    }

    [Fact]
    public async Task Delete_SoftDeletes_ThenGetByIdReturns404()
    {
        // Arrange
        var request = new ConfigRequest("temp_config", "temp_value", "string");
        var postResponse = await _client.PostAsJsonAsync("/api/configs", request);
        var created = await postResponse.Content.ReadFromJsonAsync<ConfigDto>();

        // Act — soft delete
        var deleteResponse = await _client.DeleteAsync($"/api/configs/{created!.Id}");

        // Assert — delete succeeded
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        // Assert — subsequent GET returns 404 (global query filter excludes soft-deleted rows)
        var getResponse = await _client.GetAsync($"/api/configs/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }
}
