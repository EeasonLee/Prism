const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

// Design Token 主题扩展从 libs/tokens/ 统一引入
// 修改主题 Token：只改 libs/tokens/src/tailwind-preset.js
const tokensPreset = require('../../libs/tokens/src/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    join(
      __dirname,
      '{app,pages,components}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  presets: [tokensPreset],
  plugins: [require('@tailwindcss/typography')],
};
