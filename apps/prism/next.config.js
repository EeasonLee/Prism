const { withNx } = require('@nx/next/plugins/with-nx');

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  nx: {
    svgr: false,
  },
};

module.exports = withNx(nextConfig);
