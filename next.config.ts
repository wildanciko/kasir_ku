import type { NextConfig } from "next";

// ── Security headers ──────────────────────────────────────────────────────────
// Applied to every route via headers().
// CSP uses 'unsafe-inline' for styles because Tailwind v4 injects inline styles
// at build time. For a stricter policy, switch to nonces (see Next.js docs).

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options",  value: "nosniff" },

  // Disallow framing (clickjacking protection)
  { key: "X-Frame-Options",         value: "DENY" },

  // Control referrer information sent to external sites
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },

  // Restrict browser features not needed by this app
  {
    key:   "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },

  // HSTS — only effective when served over HTTPS; harmless over HTTP dev
  {
    key:   "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },

  // Content Security Policy
  // - script-src 'self' 'unsafe-inline': needed for Next.js hydration chunks
  // - img-src 'self' data: : allows base64 product images stored in localStorage
  // - font-src 'self' https://fonts.gstatic.com: Google Fonts
  // - style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data:",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

// ── Next.js config ────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  // Hide "X-Powered-By: Next.js" response header
  poweredByHeader: false,

  async headers() {
    return [
      {
        // Apply to every route
        source:  "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
