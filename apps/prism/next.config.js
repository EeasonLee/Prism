const { withNx } = require('@nx/next/plugins/with-nx');
const { readFileSync } = require('fs');
const { join } = require('path');

// 读取环境变量
const useApiProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const magentoApiUrl = process.env.NEXT_PUBLIC_MAGENTO_API_URL;
const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL;

function createRemotePattern(url, pathname = '/**') {
  if (!url) return null;

  const parsedUrl = new URL(url);
  return {
    protocol: parsedUrl.protocol.replace(':', ''),
    hostname: parsedUrl.hostname,
    ...(parsedUrl.port ? { port: parsedUrl.port } : {}),
    pathname,
  };
}

const configuredImagePattern = createRemotePattern(imageBaseUrl);
const imageRemotePatterns = [
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
    hostname: 'd2s2mafqv46idp.cloudfront.net',
    pathname: '/joydeem/media/pages/**',
  },
  configuredImagePattern,
].filter(Boolean);

const extraRemotePatterns = [
  {
    protocol: 'http',
    hostname: '192.168.50.4',
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
    hostname: '**',
  },
  {
    protocol: 'https',
    hostname: 'fellowproducts.com',
  },
];

const remotePatterns = [...imageRemotePatterns, ...extraRemotePatterns];

// 构建时注入版本号，单一来源：apps/prism/package.json（用 fs 读取避免 tsconfig 将 package.json 纳入项目）
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
  experimental: {
    instrumentationHook: true,
  },
  eslint: {
    ignoreDuringBuilds: false, // 构建时进行 ESLint 检查
  },
  typescript: {
    ignoreBuildErrors: true, // 部署构建时跳过类型检查 (typedRoutes 与外部链接冲突)
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns,
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
