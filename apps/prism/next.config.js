const { withNx } = require('@nx/next/plugins/with-nx');

const nextConfig = {
  reactStrictMode: true,
  nx: {
    svgr: false,
  },
};

module.exports = withNx(nextConfig);

