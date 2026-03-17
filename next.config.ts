import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "static.tvmaze.com" },
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "images.metahub.space" },
    ],
  },
};

export default nextConfig;
