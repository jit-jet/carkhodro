import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 Cache Components: data is uncached by default and excluded from
  // prerenders unless explicitly marked with `use cache`. Enables the
  // `use cache` directive together with cacheLife / cacheTag and PPR.
  cacheComponents: true,
  // Product image uploads allow up to 2 MB per file via Server Actions.
  // In Next 16 this still lives under `experimental` (top-level is ignored).
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
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
