import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for Docker: generates .next/standalone with a minimal server.js
  output: "standalone",
  // Next.js 16 Cache Components: data is uncached by default and excluded from
  // prerenders unless explicitly marked with `use cache`. Enables the
  // `use cache` directive together with cacheLife / cacheTag and PPR.
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.imagin.studio",
        pathname: "/getImage**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
    ],
  },
};

export default nextConfig;
