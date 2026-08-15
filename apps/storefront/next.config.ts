import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@smartecommerce/shared'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
};

export default config;
