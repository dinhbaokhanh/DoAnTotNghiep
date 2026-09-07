import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Cloudinary (used by media-service)
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        // Allow any https image source for avatars
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
