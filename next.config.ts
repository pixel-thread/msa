import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['attire-uselessly-recast.ngrok-free.dev'],
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://msa-8t3t.onrender.com/api/v1:path*',
      },
    ];
  },
};

export default nextConfig;
