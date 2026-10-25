namespace WeddingApi.Services;

/// <summary>Full-size and thumbnail WebP encodings of one uploaded image.</summary>
public record ProcessedImage(byte[] Full, byte[] Thumb, int Width, int Height);

public class UnsupportedImageException(string message) : Exception(message);

public interface IImageProcessor
{
    /// <summary>
    /// Validates the input is a JPEG or PNG, applies EXIF orientation, strips metadata
    /// and encodes a full-size and a thumbnail WebP.
    /// </summary>
    /// <exception cref="UnsupportedImageException">Input is not a decodable JPEG/PNG, or is too large.</exception>
    Task<ProcessedImage> ToWebpAsync(Stream input, CancellationToken ct = default);
}
