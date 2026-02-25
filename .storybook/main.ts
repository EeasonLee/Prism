import type { StorybookConfig } from '@storybook/react-vite';
import { join } from 'path';

/**
 * Storybook 主配置
 *
 * - Tailwind/PostCSS 通过根目录 postcss.config.cjs 自动注入
 * - @prism/* 路径别名通过 viteFinal 的 resolve.alias 注入
 */
const config: StorybookConfig = {
  // 扫描 libs/ 下所有 stories 文件（TSX 和 TS 格式）
  stories: ['../libs/**/*.stories.@(ts|tsx)'],

  addons: [
    // addon-essentials 已包含 addon-docs，不要重复添加（会导致 MDX indexer 跳过）
    '@storybook/addon-essentials',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {
    // 所有带 autodocs tag 的 story 自动生成 Props 文档页
    autodocs: 'tag',
  },

  viteFinal: async config => {
    // 注入 @prism/* TypeScript 路径别名，让 Storybook Vite 能找到 monorepo 内的包
    const root = join(__dirname, '..');
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      '@prism/shared': join(root, 'libs/shared/src/index.ts'),
      '@prism/ui': join(root, 'libs/ui/src/index.ts'),
      '@prism/blog': join(root, 'libs/blog/src/index.ts'),
      '@prism/tokens': join(root, 'libs/tokens/src/index.ts'),
    };
    return config;
  },
};

export default config;
