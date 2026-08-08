import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["officeparser", "ali-oss"],
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
