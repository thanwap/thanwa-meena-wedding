namespace WeddingApi.Services;

/// <summary>Object storage for the public "photos" bucket (service-role access).</summary>
public interface IPhotoStorage
{
    Task UploadAsync(string path, byte[] data, string contentType, CancellationToken ct = default);

    /// <summary>Best-effort delete — never throws on storage failure.</summary>
    Task DeleteAsync(IEnumerable<string> paths, CancellationToken ct = default);

    string PublicUrl(string path);
}
