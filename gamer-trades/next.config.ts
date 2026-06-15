import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/gamer-trades-official-" : "",
  assetPrefix: isProd ? "/gamer-trades-official-/" : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
