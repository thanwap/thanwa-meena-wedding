using System.Net.Http.Headers;

namespace WeddingApi.Services;

public class SupabaseStorageService : IStorageService
{
    private const string Bucket = "guestbook-photos";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _baseUrl;
    private readonly string _serviceKey;

    public SupabaseStorageService(IConfiguration config, IHttpClientFactory httpClientFactory)
    {
        _baseUrl = (config["Supabase:Url"]
            ?? throw new InvalidOperationException("Supabase:Url is not configured")).TrimEnd('/');
        _serviceKey = config["Supabase:ServiceKey"]
            ?? throw new InvalidOperationException("Supabase:ServiceKey is not configured");
        _httpClientFactory = httpClientFactory;
    }

    public async Task<string> UploadAsync(Stream stream, string filename, string mimeType)
    {
        var ext = Path.GetExtension(filename).ToLowerInvariant();
        var uniqueName = $"{Guid.NewGuid()}{ext}";

        using var content = new StreamContent(stream);
        content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            $"{_baseUrl}/storage/v1/object/{Bucket}/{uniqueName}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceKey);
        request.Headers.Add("apikey", _serviceKey);
        request.Content = content;

        var client = _httpClientFactory.CreateClient();
        var response = await client.SendAsync(request);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"Supabase Storage upload failed ({response.StatusCode}): {error}");
        }

        return $"{_baseUrl}/storage/v1/object/public/{Bucket}/{uniqueName}";
    }
}
