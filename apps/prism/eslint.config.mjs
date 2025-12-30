import { fileURLToPath } from 'url';
import { dirname } from 'path';
import nextPlugin from '@next/eslint-plugin-next';
import nx from '@nx/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import baseConfig from '../../eslint.config.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      'vite.config.ts',
      'vitest.config.ts',
      '*.config.ts',
      '*.config.js',
    ],
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      // 排除配置文件，它们不在 tsconfig.app.json 中
      '!**/*.config.ts',
      '!**/*.config.js',
      '!vite.config.ts',
      '!vitest.config.ts',
      '!playwright.config.ts',
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.app.json',
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // Next.js specific rules
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'error',
      '@next/next/no-async-client-component': 'error',
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // TypeScript rules - 更严格的类型检查
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',
      // 需要类型信息的规则暂时设为 warn，后续优化配置后再改为 error
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/await-thenable': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    plugins: {
      '@next/next': nextPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      // Next.js specific rules
      '@next/next/no-html-link-for-pages': 'off',
      '@next/next/no-img-element': 'error',
      '@next/next/no-async-client-component': 'error',
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // 确保导入的模块被使用
      'no-unused-vars': 'off', // 关闭基础规则，使用 TypeScript 版本
    },
  },
  {
    files: ['**/next-env.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
];
