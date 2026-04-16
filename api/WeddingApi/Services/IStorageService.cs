namespace WeddingApi.Services;

public interface IStorageService
{
    Task<string> UploadAsync(Stream stream, string filename, string mimeType);
}
