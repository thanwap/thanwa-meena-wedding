/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Dev only: lets a local stand-in for Supabase Storage serve images
    const devImg = process.env.NODE_ENV === "development" ? " http://localhost:*" : ""
    const csp = [
      "default-src 'self'",
      // Next.js requires unsafe-inline for hydration scripts
      "script-src 'self' 'unsafe-inline'",
      // Tailwind / shadcn inline styles
      "style-src 'self' 'unsafe-inline'",
      // next/font/google serves fonts locally from /_next/static/
      "font-src 'self'",
      // Guestbook photos served from Supabase public bucket
      `img-src 'self' data: blob: https://*.supabase.co${devImg}`,
      // .NET API calls from the browser (if any)
      "connect-src 'self' https://*.supabase.co",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; ")

    return [
      {
        // Gift QR "save" button: Vercel serves public files as inline, which
        // makes Safari/Firefox open the image in a tab instead of saving it
        source: "/promptpay-qr.jpg",
        headers: [
          { key: "Content-Disposition", value: 'attachment; filename="thanwa-meena-promptpay.jpg"' },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=*" },
        ],
      },
    ]
  },
}

export default nextConfig
