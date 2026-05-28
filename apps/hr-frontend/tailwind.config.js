const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

const tokensPreset = require('./ui/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    join(__dirname, '{app,ui,features}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  presets: [tokensPreset],
  plugins: [require('@tailwindcss/typography')],
};
