const { withNx } = require('@nx/next/plugins/with-nx');
const { readFileSync } = require('fs');
const { join } = require('path');

const prismPkg = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8')
);

const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: prismPkg.version,
  },
  reactStrictMode: true,
  typedRoutes: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  nx: {
    svgr: false,
  },
};

module.exports = withNx(nextConfig);
