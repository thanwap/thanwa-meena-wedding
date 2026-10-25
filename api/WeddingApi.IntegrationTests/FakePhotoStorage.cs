using System.Collections.Concurrent;
using WeddingApi.Services;

namespace WeddingApi.IntegrationTests;

/// <summary>In-memory stand-in for Supabase Storage so tests don't need network or keys.</summary>
public class FakePhotoStorage : IPhotoStorage
{
    public ConcurrentDictionary<string, (byte[] Data, string ContentType)> Objects { get; } = new();

    public Task UploadAsync(string path, byte[] data, string contentType, CancellationToken ct = default)
    {
        Objects[path] = (data, contentType);
        return Task.CompletedTask;
    }

    public Task DeleteAsync(IEnumerable<string> paths, CancellationToken ct = default)
    {
        foreach (var path in paths) Objects.TryRemove(path, out _);
        return Task.CompletedTask;
    }

    public string PublicUrl(string path) => $"https://storage.test/{path}";
}
