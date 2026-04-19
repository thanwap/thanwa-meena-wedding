/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const csp = [
      "default-src 'self'",
      // Next.js requires unsafe-inline for hydration scripts
      "script-src 'self' 'unsafe-inline'",
      // Tailwind / shadcn inline styles
      "style-src 'self' 'unsafe-inline'",
      // next/font/google serves fonts locally from /_next/static/
      "font-src 'self'",
      // Guestbook photos served from Supabase public bucket
      "img-src 'self' data: blob: https://*.supabase.co",
      // .NET API calls from the browser (if any)
      "connect-src 'self' https://*.supabase.co",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join("; ")

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ]
  },
}

export default nextConfig
