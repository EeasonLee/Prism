const { withNx } = require('@nx/next/plugins/with-nx');
const { readFileSync } = require('fs');
const { join } = require('path');

const useApiProxy = process.env.NEXT_PUBLIC_USE_API_PROXY === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const magentoApiUrl =
  process.env.NEXT_PUBLIC_MAGENTO_API_URL ?? process.env.MAGENTO_URL;
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
  configuredImagePattern,
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
    hostname: 'localhost',
    port: '1337',
    pathname: '/media/**',
  },
  {
    protocol: 'https',
    hostname: 'www.huarenstore.com',
  },
  {
    protocol: 'https',
    hostname: 'huarenstore.com',
  },
  {
    protocol: 'https',
    hostname: '**',
  },
].filter(Boolean);

const hrPkg = JSON.parse(
  readFileSync(join(__dirname, 'package.json'), 'utf-8')
);

const nextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_APP_VERSION: hrPkg.version,
    REQUIRE_LOGIN_FOR_CHECKOUT: process.env.REQUIRE_LOGIN_FOR_CHECKOUT,
  },
  reactStrictMode: true,
  typedRoutes: true,
  experimental: {
    instrumentationHook: true,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: imageRemotePatterns,
  },
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
  async redirects() {
    return [
      {
        source: '/customer/account/createPassword',
        destination: '/reset-password',
        permanent: true,
      },
      {
        source: '/customer/account/forgotpassword',
        destination: '/forgot-password',
        permanent: true,
      },
      {
        source: '/customer/account/:path*',
        destination: '/login',
        permanent: true,
      },
    ];
  },
  nx: {
    svgr: false,
  },
};

module.exports = withNx(nextConfig);
