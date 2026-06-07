import nx from '@nx/eslint-plugin';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/.next',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
      '**/next-env.d.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['scope:shared', 'type:ui', 'type:lib'],
            },
            {
              sourceTag: 'type:lib',
              onlyDependOnLibsWithTags: ['type:lib', 'scope:shared'],
            },
            {
              sourceTag: 'scope:frontend',
              onlyDependOnLibsWithTags: ['scope:frontend', 'scope:shared', 'scope:ui', 'type:lib', 'type:ui'],
            },
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // React Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // TypeScript rules - 检测未使用的变量和导入
      // 封禁已删除的旧 HTTP 客户端路径
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/lib/api/client', '*/lib/api/client'],
              message: 'Use strapiClient from @/core/api/clients/strapi instead.',
            },
            {
              group: ['@/lib/api/magento/client', '*/lib/api/magento/client'],
              message: 'Use magentoClient from @/core/api/clients/magento and error types from @/core/api/errors instead.',
            },
            {
              group: ['@/lib/api/bff/magento-rest-client', '*/lib/api/bff/magento-rest-client'],
              message: 'Use magentoClient from @/core/api/clients/magento instead.',
            },
            {
              group: ['@/lib/api/bff/magento-server', '*/lib/api/bff/magento-server'],
              message: 'Use magentoServerClient from @/core/api/clients/magento-server instead.',
            },
            {
              group: ['@/lib/services/magento-graphql.client', '*/lib/services/magento-graphql.client'],
              message: 'Use magentoGraphQLClient from @/core/api/clients/magento-graphql instead.',
            },
            {
              group: ['@/lib/api/magento/auth-api', '*/lib/api/magento/auth-api'],
              message: 'Use bffClient from @/core/api/clients/bff instead.',
            },
          ],
        },
      ],
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
      // 需要类型信息的规则暂时关闭，避免在 lint-staged 中出错
      // 这些规则在 apps/jd-frontend/eslint.config.mjs 中已配置（仅对 TypeScript 文件）
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/await-thenable': 'off',
    },
  },
  // ============================================================
  // 架构依赖方向规则 (docs/architecture/file-layout-spec.md)
  // ============================================================

  // 规则 2：基础设施层禁止引用业务层
  {
    files: ['apps/jd-frontend/infrastructure/**/*.ts', 'apps/jd-frontend/infrastructure/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/*'],
            message: 'infrastructure/ cannot reference features/ — it violates the architecture dependency direction',
          },
          {
            group: ['@/app/*'],
            message: 'infrastructure/ cannot reference app/',
          },
        ],
      }],
    },
  },

  // 规则 3：跨 feature 引用必须通过 index.ts 出口
  {
    files: ['apps/jd-frontend/features/**/*.ts', 'apps/jd-frontend/features/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/*/components/*', '@/features/*/api/*', '@/features/*/services/*', '@/features/*/hooks/*'],
            message: "Cross-feature imports must go through index.ts barrel export. Use: import { X } from '@/features/<name>'",
          },
        ],
      }],
    },
  },

  // 规则 4：Feature 内部边界 - services/ 不能引用 UI 层
  {
    files: ['apps/jd-frontend/features/*/services/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['../components/*', '*/components/*'], message: 'services/ cannot reference components/ (UI layer)' },
          { group: ['../hooks/*', '*/hooks/*'], message: 'services/ cannot reference hooks/ (React layer)' },
        ],
      }],
    },
  },

  // 规则 4b：Feature 内部边界 - api/ 不能引用 UI 层
  {
    files: ['apps/jd-frontend/features/*/api/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['../components/*', '*/components/*'], message: 'api/ cannot reference components/ (UI layer)' },
        ],
      }],
    },
  },

  // 规则 5：app/_ui/ 边界 - 布局壳只能引用领域组件，不能引用 api/services
  {
    files: ['apps/jd-frontend/app/_ui/**/*.ts', 'apps/jd-frontend/app/_ui/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@/features/*/api/*', '@/features/*/services/*'],
            message: 'app/_ui/ cannot reference features api/ or services/. Layout shell components can only use domain components.',
          },
          {
            group: ['*/api/*', '*/services/*'],
            message: 'app/_ui/ cannot directly reference features api/ or services/',
          },
        ],
      }],
    },
  },

  // Prettier 配置必须放在最后，以覆盖所有格式化相关的规则
  prettier,
];
