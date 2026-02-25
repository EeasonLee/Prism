/**
 * Storybook 专用 Tailwind 配置
 * 与 apps/prism/tailwind.config.js 共享同一个 token preset，
 * 确保 Storybook 中渲染的组件样式与 app 完全一致。
 */
const tokensPreset = require('./libs/tokens/src/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    // 扫描所有 UI 组件和 stories
    './libs/**/*.{ts,tsx,mdx}',
    // 同时扫描 app 组件（供 Storybook 预览时引用）
    './apps/prism/app/**/*.{ts,tsx}',
  ],
  presets: [tokensPreset],
  plugins: [require('@tailwindcss/typography')],
};
