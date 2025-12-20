import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimize CSS for mobile browsers
  experimental: {
    optimizeCss: true,
  },
  // Ensure proper asset loading on mobile
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : undefined,
};

export default nextConfig;
