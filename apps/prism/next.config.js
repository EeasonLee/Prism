const { withNx } = require('@nx/next/plugins/with-nx');

// 读取环境变量
const useApiProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const magentoApiUrl = process.env.NEXT_PUBLIC_MAGENTO_API_URL;

const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  eslint: {
    ignoreDuringBuilds: false, // 构建时进行 ESLint 检查
  },
  typescript: {
    ignoreBuildErrors: false, // 构建时进行 TypeScript 类型检查
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.50.244',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.50.240',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'magento.test',
      },
      {
        protocol: 'http',
        hostname: 'magento.test',
      },
      {
        protocol: 'https',
        hostname: '**', // 允许所有 HTTPS 域名（生产环境建议限制具体域名）
      },
    ],
  },
  // 配置 API 代理（仅当启用代理时）
  ...(useApiProxy
    ? {
        async rewrites() {
          const rules = [];
          if (apiUrl) {
            rules.push({
              source: '/api-proxy/:path*',
              destination: `${apiUrl}/:path*`,
            });
          }
          if (magentoApiUrl) {
            rules.push({
              source: '/magento-proxy/:path*',
              destination: `${magentoApiUrl}/:path*`,
            });
          }
          return rules;
        },
      }
    : {}),
  nx: {
    svgr: false,
  },
};

module.exports = withNx(nextConfig);
