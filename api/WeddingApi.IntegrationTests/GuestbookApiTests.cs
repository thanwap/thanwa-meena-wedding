using System.Net;
using System.Net.Http.Json;
using WeddingApi.Dtos;

namespace WeddingApi.IntegrationTests;

/// <summary>
/// End-to-end HTTP tests for the public guestbook: multipart form → controller → service → real PostgreSQL.
/// </summary>
public class GuestbookApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;

    public GuestbookApiTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private static MultipartFormDataContent Form(string name, string message, string? postcardId, string? hp = null)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(name), "name" },
            { new StringContent(message), "message" },
        };
        if (postcardId is not null) form.Add(new StringContent(postcardId), "postcardId");
        if (hp is not null) form.Add(new StringContent(hp), "hpWebsite");
        return form;
    }

    [Fact]
    public async Task Post_WithPostcard_Returns201_AndListsIt()
    {
        var response = await _client.PostAsync("/api/guestbook", Form("Integration & Co", "ยินดีด้วยนะ", "7"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<GuestbookDto>();
        Assert.NotNull(created);
        Assert.Equal(7, created.PostcardId);
        Assert.Equal("Integration & Co", created.Name);

        var listed = await _client.GetFromJsonAsync<List<GuestbookDto>>("/api/guestbook");
        var entry = Assert.Single(listed!, e => e.Id == created.Id);
        Assert.Equal(7, entry.PostcardId);
        Assert.Equal("ยินดีด้วยนะ", entry.Message);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("0")]
    [InlineData("abc")]
    public async Task Post_WithoutValidPostcard_Returns400(string? postcardId)
    {
        var response = await _client.PostAsync("/api/guestbook", Form("Guest", "hi", postcardId));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_WithOverlongName_Returns400_NotServerError()
    {
        var response = await _client.PostAsync("/api/guestbook", Form(new string('x', 121), "hi", "1"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Post_WithNulByte_Returns201_NotServerError()
    {
        var response = await _client.PostAsync("/api/guestbook", Form("Guest", "before\0after", "1"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<GuestbookDto>();
        Assert.Equal("beforeafter", created!.Message);
    }

    [Fact]
    public async Task Post_WithHoneypot_Returns400()
    {
        var response = await _client.PostAsync("/api/guestbook", Form("Bot", "spam", "1", hp: "http://spam.example.com"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }
}
