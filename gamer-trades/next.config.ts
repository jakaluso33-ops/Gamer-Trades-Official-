import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/Gamer-Trades-Official-" : "",
  assetPrefix: isProd ? "/Gamer-Trades-Official-/" : "",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
