import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // geoip-lite reads its data files from disk relative to its own package
  // directory at runtime — bundling it breaks that path resolution, so it
  // needs to stay a plain Node `require` instead.
  serverExternalPackages: ["geoip-lite"],
};

export default nextConfig;
