namespace WeddingApi.Services;

/// <summary>
/// Object storage for the private "slips" bucket. Slips show bank details, so nothing in
/// it is ever public — admins read them through short-lived signed URLs.
/// </summary>
public interface ISlipStorage
{
    Task UploadAsync(string path, byte[] data, string contentType, CancellationToken ct = default);

    /// <summary>Signed URLs keyed by path; paths that can't be signed are left out.</summary>
    Task<IReadOnlyDictionary<string, string>> SignedUrlsAsync(
        IReadOnlyCollection<string> paths, TimeSpan expiresIn, CancellationToken ct = default);

    /// <summary>Best-effort delete — never throws on storage failure.</summary>
    Task DeleteAsync(IEnumerable<string> paths, CancellationToken ct = default);

    /// <summary>Every object in the bucket, including slips whose notice was never sent.</summary>
    Task<IReadOnlyList<string>> ListAllAsync(CancellationToken ct = default);
}
