import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mongoose + mongodb-memory-server run only on the server; keep them
  // out of the client bundle and let Node require them natively.
  serverExternalPackages: ["mongoose", "mongodb-memory-server"],
  webpack: (config) => {
    // The embedded MongoDB persists under db/ and writes constantly;
    // without this the dev watcher rebuilds in an endless loop.
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/db/data/**", "**/db/mongodb-binaries/**"],
    };
    return config;
  },
};

export default nextConfig;
