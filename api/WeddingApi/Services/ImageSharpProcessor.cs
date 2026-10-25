using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace WeddingApi.Services;

public class ImageSharpProcessor : IImageProcessor
{
    public const int FullMaxEdge = 2400;
    public const int ThumbMaxEdge = 900;
    private const int MaxInputEdge = 12000; // guards against decompression bombs

    // Level4 (the default) — Level6 is several times slower for a few % smaller files
    private static readonly WebpEncoder FullEncoder = new()
    {
        FileFormat = WebpFileFormatType.Lossy,
        Quality = 82,
        Method = WebpEncodingMethod.Level4,
    };

    private static readonly WebpEncoder ThumbEncoder = new()
    {
        FileFormat = WebpFileFormatType.Lossy,
        Quality = 78,
        Method = WebpEncodingMethod.Level4,
    };

    // JPEG decodes straight at reduced scale instead of full resolution then resizing.
    // Only for oversized input — TargetSize would upscale smaller images.
    private static readonly DecoderOptions DownscaleOnDecode = new()
    {
        TargetSize = new Size(FullMaxEdge, FullMaxEdge),
    };

    public async Task<ProcessedImage> ToWebpAsync(Stream input, CancellationToken ct = default)
    {
        // Buffer so format detection, identify and decode can each rewind
        using var buffer = new MemoryStream();
        await input.CopyToAsync(buffer, ct);

        IImageFormat format;
        try
        {
            buffer.Position = 0;
            format = await Image.DetectFormatAsync(buffer, ct);
        }
        catch (Exception ex) when (ex is UnknownImageFormatException or InvalidImageContentException)
        {
            throw new UnsupportedImageException("File is not a supported image");
        }

        if (format is not JpegFormat && format is not PngFormat)
            throw new UnsupportedImageException("Only JPEG and PNG images are supported");

        buffer.Position = 0;
        var info = await Image.IdentifyAsync(buffer, ct);
        if (info.Width > MaxInputEdge || info.Height > MaxInputEdge)
            throw new UnsupportedImageException($"Image is larger than {MaxInputEdge}px");

        buffer.Position = 0;
        Image image;
        try
        {
            var oversized = info.Width > FullMaxEdge || info.Height > FullMaxEdge;
            image = await Image.LoadAsync(oversized ? DownscaleOnDecode : new DecoderOptions(), buffer, ct);
        }
        catch (InvalidImageContentException)
        {
            throw new UnsupportedImageException("Image data is corrupt");
        }

        using (image)
        {
            image.Mutate(x => x.AutoOrient());

            // Drop EXIF (incl. GPS), XMP and IPTC — nothing personal leaves the server
            image.Metadata.ExifProfile = null;
            image.Metadata.XmpProfile = null;
            image.Metadata.IptcProfile = null;

            image.Mutate(x => FitWithin(x, FullMaxEdge));
            using var thumb = image.Clone(x => FitWithin(x, ThumbMaxEdge));

            var fullBytes = Task.Run(() => EncodeAsync(image, FullEncoder, ct), ct);
            var thumbBytes = Task.Run(() => EncodeAsync(thumb, ThumbEncoder, ct), ct);

            return new ProcessedImage(
                await fullBytes,
                await thumbBytes,
                image.Width,
                image.Height);
        }
    }

    /// <summary>Shrinks to fit a maxEdge square, never upscales.</summary>
    private static void FitWithin(IImageProcessingContext ctx, int maxEdge)
    {
        var size = ctx.GetCurrentSize();
        if (size.Width <= maxEdge && size.Height <= maxEdge) return;
        ctx.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(maxEdge, maxEdge) });
    }

    private static async Task<byte[]> EncodeAsync(Image image, WebpEncoder encoder, CancellationToken ct)
    {
        using var output = new MemoryStream();
        await image.SaveAsync(output, encoder, ct);
        return output.ToArray();
    }
}
