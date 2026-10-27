using System.Collections.Concurrent;
using WeddingApi.Services;

namespace WeddingApi.IntegrationTests;

/// <summary>In-memory stand-in for the private "slips" bucket.</summary>
public class FakeSlipStorage : ISlipStorage
{
    public ConcurrentDictionary<string, (byte[] Data, string ContentType)> Objects { get; } = new();

    public Task UploadAsync(string path, byte[] data, string contentType, CancellationToken ct = default)
    {
        Objects[path] = (data, contentType);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyDictionary<string, string>> SignedUrlsAsync(
        IReadOnlyCollection<string> paths, TimeSpan expiresIn, CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyDictionary<string, string>>(paths
            .Where(Objects.ContainsKey)
            .ToDictionary(p => p, p => $"https://storage.test/sign/{p}?expires={expiresIn.TotalSeconds}"));

    public Task DeleteAsync(IEnumerable<string> paths, CancellationToken ct = default)
    {
        foreach (var path in paths) Objects.TryRemove(path, out _);
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<string>> ListAllAsync(CancellationToken ct = default) =>
        Task.FromResult<IReadOnlyList<string>>(Objects.Keys.ToList());
}
