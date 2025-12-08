import nextPlugin from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/react'],
  {
    ignores: [
      '.next/**/*',
      'node_modules/**/*',
      'dist/**/*',
      'build/**/*',
      '.turbo/**/*',
      '**/next-env.d.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // Next.js specific rules
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'error',
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['**/next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
];
