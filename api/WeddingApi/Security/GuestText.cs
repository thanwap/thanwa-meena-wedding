using System.Globalization;
using System.Text;

namespace WeddingApi.Security;

/// <summary>Normalises free text typed by guests before it is validated and stored.</summary>
public static class GuestText
{
    /// <summary>
    /// Drops characters nobody means to type into a form: control characters
    /// other than line breaks and tabs (a NUL makes Postgres reject the insert), and
    /// bidi overrides, which can make a name render backwards.
    /// </summary>
    public static string Clean(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        var sb = new StringBuilder(value.Length);
        foreach (var c in value)
        {
            if (char.IsControl(c) && c is not ('\n' or '\r' or '\t')) continue;
            if (c is (>= '‪' and <= '‮') or (>= '⁦' and <= '⁩')) continue;
            sb.Append(c);
        }
        return sb.ToString().Trim();
    }

    /// <summary>False for text that is only whitespace or invisible format characters (e.g. zero-width spaces).</summary>
    public static bool HasVisibleText(string value) =>
        value.Any(c => !char.IsWhiteSpace(c) && CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.Format);
}
