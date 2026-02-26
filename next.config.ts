import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.public.blob.vercel-storage.com' },
      { hostname: 'tile.openstreetmap.org' },
    ],
  },
  // Extend serverless function timeout for Roboflow proxy
  serverExternalPackages: [],
};

export default nextConfig;
