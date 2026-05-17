import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["attire-uselessly-recast.ngrok-free.dev"],
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
