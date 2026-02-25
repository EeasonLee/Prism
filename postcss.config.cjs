/**
 * 根目录 PostCSS 配置（供 Storybook 使用）
 * Storybook 的 Vite 会从根目录读取此文件。
 */
module.exports = {
  plugins: {
    tailwindcss: {
      config: require('path').join(__dirname, 'tailwind.config.storybook.cjs'),
    },
    autoprefixer: {},
  },
};
