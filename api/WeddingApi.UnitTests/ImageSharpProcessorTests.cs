using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using SixLabors.ImageSharp.PixelFormats;
using WeddingApi.Services;

namespace WeddingApi.UnitTests;

public class ImageSharpProcessorTests
{
    private readonly ImageSharpProcessor _processor = new();

    private static MemoryStream MakeImage(int width, int height, Func<Image, Stream, Task> save, ExifProfile? exif = null)
    {
        using var image = new Image<Rgba32>(width, height, new Rgba32(200, 150, 120));
        if (exif is not null) image.Metadata.ExifProfile = exif;
        var ms = new MemoryStream();
        save(image, ms).GetAwaiter().GetResult();
        ms.Position = 0;
        return ms;
    }

    private static MemoryStream Jpeg(int w, int h, ExifProfile? exif = null) =>
        MakeImage(w, h, (img, s) => img.SaveAsJpegAsync(s), exif);

    private static MemoryStream Png(int w, int h) =>
        MakeImage(w, h, (img, s) => img.SaveAsPngAsync(s));

    private static void AssertWebp(byte[] bytes) =>
        Assert.IsType<WebpFormat>(Image.DetectFormat(bytes));

    [Fact]
    public async Task Jpeg_IsConvertedToWebp_AndShrunkToMaxEdges()
    {
        var result = await _processor.ToWebpAsync(Jpeg(3600, 2400));

        AssertWebp(result.Full);
        AssertWebp(result.Thumb);
        Assert.Equal(2400, result.Width);
        Assert.Equal(1600, result.Height);

        var thumb = Image.Identify(result.Thumb);
        Assert.Equal(900, thumb.Width);
        Assert.Equal(600, thumb.Height);
    }

    [Fact]
    public async Task Png_IsConvertedToWebp()
    {
        var result = await _processor.ToWebpAsync(Png(1200, 1600));

        AssertWebp(result.Full);
        Assert.Equal(1200, result.Width);
        Assert.Equal(1600, result.Height);
    }

    [Fact]
    public async Task SmallImage_IsNotUpscaled()
    {
        var result = await _processor.ToWebpAsync(Jpeg(640, 480));

        Assert.Equal(640, result.Width);
        Assert.Equal(480, Image.Identify(result.Thumb).Height);
    }

    [Fact]
    public async Task ExifOrientation_IsApplied_AndExifIsStripped()
    {
        var exif = new ExifProfile();
        exif.SetValue(ExifTag.Orientation, (ushort)6); // rotate 90° CW
        exif.SetValue(ExifTag.GPSLatitudeRef, "N");

        var result = await _processor.ToWebpAsync(Jpeg(800, 400, exif));

        // Landscape source with orientation 6 becomes portrait
        Assert.Equal(400, result.Width);
        Assert.Equal(800, result.Height);
        Assert.Null(Image.Identify(result.Full).Metadata.ExifProfile);
    }

    [Fact]
    public async Task Gif_IsRejected()
    {
        var gif = MakeImage(100, 100, (img, s) => img.SaveAsGifAsync(s));

        await Assert.ThrowsAsync<UnsupportedImageException>(() => _processor.ToWebpAsync(gif));
    }

    [Fact]
    public async Task NonImageBytes_AreRejected()
    {
        var text = new MemoryStream("definitely not an image"u8.ToArray());

        await Assert.ThrowsAsync<UnsupportedImageException>(() => _processor.ToWebpAsync(text));
    }
}
