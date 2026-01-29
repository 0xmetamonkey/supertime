import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  transpilePackages: ["@appbuilder/react", "agora-rtc-sdk-ng"],
};

export default nextConfig;
