import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@iantroisi/ui", "@iantroisi/sickmaps"],
  // Keep protobuf bindings as a Node require — avoids huge webpack chunks that break HMR (missing ./873.js).
  serverExternalPackages: ["gtfs-realtime-bindings"],
};

export default nextConfig;
