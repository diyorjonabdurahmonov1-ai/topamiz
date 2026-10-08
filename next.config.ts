import type { NextConfig } from "next";

// Sent on every response. No Content-Security-Policy yet: the analytics
// snippets, map tiles and R2 video host would all need allow-listing first,
// and a wrong CSP silently breaks pages.
const securityHeaders = [
  // Nobody may load the site inside a frame (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The site is HTTPS-only (auth cookies are `secure`), so browsers should
  // never try plain http:// again.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  // geoip-lite reads its data files from disk relative to its own package
  // directory at runtime — bundling it breaks that path resolution, so it
  // needs to stay a plain Node `require` instead.
  serverExternalPackages: ["geoip-lite"],
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
