import type { NextConfig } from "next";

const nextConfig = {
  // Next.js 16 Cache Components: data is uncached by default and excluded from
  // prerenders unless explicitly marked with `use cache`. Enables the
  // `use cache` directive together with cacheLife / cacheTag and PPR.
  cacheComponents: true,
  // Product image uploads allow up to 2 MB per file via Server Actions.
  // Cast: Next 16 typings omit `serverActions` even though the runtime supports it.
  serverActions: {
    bodySizeLimit: "3mb",
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
} as NextConfig;

export default nextConfig;
