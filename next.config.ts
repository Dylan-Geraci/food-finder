import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mongoose + mongodb-memory-server run only on the server; keep them
  // out of the client bundle and let Node require them natively.
  serverExternalPackages: ["mongoose", "mongodb-memory-server"],
};

export default nextConfig;
