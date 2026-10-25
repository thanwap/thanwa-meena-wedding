using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace WeddingApi.Services;

public class SupabasePhotoStorage : IPhotoStorage
{
    private const string Bucket = "photos";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _supabaseUrl;
    private readonly string _serviceRoleKey;

    public SupabasePhotoStorage(IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
        _supabaseUrl = (config["Supabase:Url"]
            ?? throw new InvalidOperationException("Supabase:Url is not configured")).TrimEnd('/');
        _serviceRoleKey = config["Supabase:ServiceRoleKey"]
            ?? throw new InvalidOperationException("Supabase:ServiceRoleKey is not configured");
    }

    public async Task UploadAsync(string path, byte[] data, string contentType, CancellationToken ct = default)
    {
        using var content = new ByteArrayContent(data);
        content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{_supabaseUrl}/storage/v1/object/{Bucket}/{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        // Paths are unique per upload, so objects never change — let CDNs cache for a year
        request.Headers.Add("cache-control", "max-age=31536000");
        request.Content = content;

        var client = _httpClientFactory.CreateClient();
        var response = await client.SendAsync(request, ct);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException(
                $"Storage upload failed ({response.StatusCode}): {error}");
        }
    }

    public async Task DeleteAsync(IEnumerable<string> paths, CancellationToken ct = default)
    {
        var body = JsonSerializer.Serialize(new { prefixes = paths });
        using var content = new StringContent(body, Encoding.UTF8, "application/json");

        using var request = new HttpRequestMessage(
            HttpMethod.Delete,
            $"{_supabaseUrl}/storage/v1/object/{Bucket}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        request.Content = content;

        try
        {
            var client = _httpClientFactory.CreateClient();
            await client.SendAsync(request, ct);
        }
        catch (HttpRequestException)
        {
            // best-effort — orphaned objects are harmless
        }
    }

    public string PublicUrl(string path) =>
        $"{_supabaseUrl}/storage/v1/object/public/{Bucket}/{path}";
}
