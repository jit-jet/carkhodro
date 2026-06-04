import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker: generates .next/standalone with a minimal server.js
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.imagin.studio",
        pathname: "/getImage**",
      },
    ],
  },
};

export default nextConfig;
