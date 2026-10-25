using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using WeddingApi.Dtos;

namespace WeddingApi.IntegrationTests;

/// <summary>
/// End-to-end HTTP tests for pre-wedding gallery endpoints against real PostgreSQL
/// (storage is the in-memory <see cref="FakePhotoStorage"/>).
/// </summary>
public class PreweddingPhotosApiTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PreweddingPhotosApiTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    private static byte[] JpegBytes(int width, int height)
    {
        using var image = new Image<Rgba32>(width, height, new Rgba32(180, 200, 170));
        using var ms = new MemoryStream();
        image.SaveAsJpeg(ms);
        return ms.ToArray();
    }

    private async Task<HttpResponseMessage> UploadAsync(byte[] bytes, string fileName, string? title = null)
    {
        using var form = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
        form.Add(file, "file", fileName);
        if (title is not null) form.Add(new StringContent(title), "title");
        return await _client.PostAsync("/api/prewedding-photos", form);
    }

    private async Task<PreweddingPhotoDto> UploadOkAsync(string? title = null)
    {
        var res = await UploadAsync(JpegBytes(3000, 2000), "photo.jpg", title);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        return (await res.Content.ReadFromJsonAsync<PreweddingPhotoDto>())!;
    }

    [Fact]
    public async Task Upload_Jpeg_Returns201_AndStoresWebp()
    {
        var dto = await UploadOkAsync("Sunset");

        Assert.Equal("Sunset", dto.Title);
        Assert.Equal(2400, dto.Width);
        Assert.Equal(1600, dto.Height);
        Assert.EndsWith(".webp", dto.FullUrl);

        var stored = _factory.PhotoStorage.Objects[$"prewedding/full/{dto.Id}.webp"];
        Assert.Equal("image/webp", stored.ContentType);
    }

    [Fact]
    public async Task Upload_NonImage_Returns400()
    {
        var res = await UploadAsync("hello"u8.ToArray(), "notes.jpg");

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Upload_WithoutFile_Returns400()
    {
        using var form = new MultipartFormDataContent { { new StringContent("x"), "title" } };

        var res = await _client.PostAsync("/api/prewedding-photos", form);

        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Reorder_Update_Delete_RoundTrip()
    {
        var a = await UploadOkAsync("A");
        var b = await UploadOkAsync("B");

        var reorder = await _client.PutAsJsonAsync("/api/prewedding-photos/order",
            new PreweddingPhotoOrderRequest([b.Id, a.Id]));
        Assert.Equal(HttpStatusCode.NoContent, reorder.StatusCode);

        var list = await _client.GetFromJsonAsync<List<PreweddingPhotoDto>>("/api/prewedding-photos");
        var ours = list!.Where(p => p.Id == a.Id || p.Id == b.Id).Select(p => p.Id).ToList();
        Assert.Equal([b.Id, a.Id], ours);

        var patch = await _client.PatchAsJsonAsync($"/api/prewedding-photos/{a.Id}",
            new PreweddingPhotoUpdateRequest("A2", "Pattaya", "tall"));
        Assert.Equal(HttpStatusCode.OK, patch.StatusCode);
        var updated = await patch.Content.ReadFromJsonAsync<PreweddingPhotoDto>();
        Assert.Equal("tall", updated!.TileSize);

        var badPatch = await _client.PatchAsJsonAsync($"/api/prewedding-photos/{a.Id}",
            new PreweddingPhotoUpdateRequest(null, null, "giant"));
        Assert.Equal(HttpStatusCode.BadRequest, badPatch.StatusCode);

        var delete = await _client.DeleteAsync($"/api/prewedding-photos/{a.Id}");
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.False(_factory.PhotoStorage.Objects.ContainsKey($"prewedding/full/{a.Id}.webp"));

        var deleteAgain = await _client.DeleteAsync($"/api/prewedding-photos/{a.Id}");
        Assert.Equal(HttpStatusCode.NotFound, deleteAgain.StatusCode);
    }
}
