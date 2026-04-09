import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use webpack for builds to avoid Turbopack compatibility issues
  // with server-side packages like cheerio
  serverExternalPackages: ["cheerio", "crypto"],
  allowedDevOrigins: ["192.168.29.99"],
};

export default nextConfig;
