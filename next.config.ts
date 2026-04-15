import type { NextConfig } from "next";

const securityHeaders = [
  // מניעת Clickjacking
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // מניעת MIME sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // מדיניות Referrer
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // הגנת DNS prefetch
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Permissions Policy
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Strict Transport Security (HTTPS בלבד)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js + Tailwind inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Scripts: self + Vercel analytics + Cloudflare Turnstile
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
      // Images: self + YouTube thumbnails + Sanity CDN
      "img-src 'self' data: blob: https://img.youtube.com https://cdn.sanity.io",
      // Frames: YouTube embeds בלבד
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://challenges.cloudflare.com",
      // Connect: Sanity API + external APIs
      "connect-src 'self' https://*.sanity.io https://vitals.vercel-insights.com",
      // Manifest
      "manifest-src 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Sanity Studio uses its own React internally — prevent bundling conflicts
  serverExternalPackages: ["sanity", "@sanity/ui", "@sanity/vision"],

  async headers() {
    return [
      {
        // Skip strict CSP for Sanity Studio (it needs blob: and unsafe-eval)
        source: "/studio/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/((?!studio).*)",
        headers: securityHeaders,
      },
    ];
  },

  // דחיית צרוף תמונות ממקורות מורשים
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },

  // מניעת חשיפת source maps ב-production
  productionBrowserSourceMaps: false,

  // הסתרת X-Powered-By header
  poweredByHeader: false,
};

export default nextConfig;
