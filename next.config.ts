import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@aurora-studio/sdk", "@aurora-studio/starter-core"],
  eslint: { ignoreDuringBuilds: true },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }
    return config;
  },
};

export default nextConfig;
