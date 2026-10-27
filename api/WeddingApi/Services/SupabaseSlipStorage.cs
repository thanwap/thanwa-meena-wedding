using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

namespace WeddingApi.Services;

public class SupabaseSlipStorage : ISlipStorage
{
    private const string Bucket = "slips";
    private const int ListPageSize = 1000;

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly string _supabaseUrl;
    private readonly string _serviceRoleKey;

    public SupabaseSlipStorage(IConfiguration config, IHttpClientFactory httpClientFactory)
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

        using var request = Request(HttpMethod.Post, $"object/{Bucket}/{path}");
        request.Content = content;

        var response = await _httpClientFactory.CreateClient().SendAsync(request, ct);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            throw new InvalidOperationException($"Slip upload failed ({response.StatusCode}): {error}");
        }
    }

    public async Task<IReadOnlyDictionary<string, string>> SignedUrlsAsync(
        IReadOnlyCollection<string> paths, TimeSpan expiresIn, CancellationToken ct = default)
    {
        if (paths.Count == 0) return new Dictionary<string, string>();

        using var request = Request(HttpMethod.Post, $"object/sign/{Bucket}");
        request.Content = JsonContent.Create(new { expiresIn = (int)expiresIn.TotalSeconds, paths });

        var response = await _httpClientFactory.CreateClient().SendAsync(request, ct);
        if (!response.IsSuccessStatusCode) return new Dictionary<string, string>();

        var signed = await response.Content.ReadFromJsonAsync<List<SignedUrl>>(ct) ?? [];
        return signed
            .Where(s => s.Path is not null && s.SignedURL is not null && s.Error is null)
            .ToDictionary(s => s.Path!, s => $"{_supabaseUrl}/storage/v1{s.SignedURL}");
    }

    public async Task DeleteAsync(IEnumerable<string> paths, CancellationToken ct = default)
    {
        var list = paths.ToList();
        if (list.Count == 0) return;

        using var request = Request(HttpMethod.Delete, $"object/{Bucket}");
        request.Content = new StringContent(
            JsonSerializer.Serialize(new { prefixes = list }), Encoding.UTF8, "application/json");

        try
        {
            await _httpClientFactory.CreateClient().SendAsync(request, ct);
        }
        catch (HttpRequestException)
        {
            // best-effort — the admin can run "delete all slips" again
        }
    }

    public async Task<IReadOnlyList<string>> ListAllAsync(CancellationToken ct = default)
    {
        var names = new List<string>();
        for (var offset = 0; ; offset += ListPageSize)
        {
            using var request = Request(HttpMethod.Post, $"object/list/{Bucket}");
            request.Content = JsonContent.Create(new { prefix = "", limit = ListPageSize, offset });

            var response = await _httpClientFactory.CreateClient().SendAsync(request, ct);
            response.EnsureSuccessStatusCode();

            var page = await response.Content.ReadFromJsonAsync<List<StoredObject>>(ct) ?? [];
            // Slips sit at the bucket root; entries without an id are folders
            names.AddRange(page.Where(o => o.Id is not null && o.Name is not null).Select(o => o.Name!));
            if (page.Count < ListPageSize) return names;
        }
    }

    private HttpRequestMessage Request(HttpMethod method, string path)
    {
        var request = new HttpRequestMessage(method, $"{_supabaseUrl}/storage/v1/{path}");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apikey", _serviceRoleKey);
        return request;
    }

    private record SignedUrl(string? Path, string? SignedURL, string? Error);

    private record StoredObject(string? Name, string? Id);
}
