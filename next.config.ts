import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  transpilePackages: ["@appbuilder/react", "agora-rtc-sdk-ng"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
} as any;

export default nextConfig;
