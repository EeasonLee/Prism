import { withNx } from '@nx/next/plugins/with-nx.js';

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

export default withNx(nextConfig);
