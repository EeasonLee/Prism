# libs/ui Storybook Architecture Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `libs/ui/src/stories/` — extract shared data/primitives, merge duplicate Token content, reorganize into clean "Design Tokens" + "Design Guide" structure, delete `foundation/` directory.

**Architecture:** This is a pure file-level reorganization with no new business logic. Two data files (`tokens-data.ts`, `guide-data.ts`) become the single source of truth. One shared primitives file (`shared-primitives.tsx`) replaces two sets of duplicate UI components. Story files under `guide/` migrate from `foundation/` with updated imports and Storybook titles.

**Tech Stack:** React, TypeScript, Storybook, Tailwind CSS, CVA

**Spec:** `docs/superpowers/specs/2026-05-06-libs-ui-storybook-architecture-design.md`

---

## File Map

| Action      | File                                                         |
| ----------- | ------------------------------------------------------------ |
| **Create**  | `libs/ui/src/stories/tokens-data.ts`                         |
| **Create**  | `libs/ui/src/stories/guide-data.ts`                          |
| **Create**  | `libs/ui/src/stories/shared-primitives.tsx`                  |
| **Rewrite** | `libs/ui/src/stories/TokensOverview.stories.tsx`             |
| **Create**  | `libs/ui/src/stories/guide/01-Principles.stories.tsx`        |
| **Create**  | `libs/ui/src/stories/guide/02-LayoutResponsive.stories.tsx`  |
| **Create**  | `libs/ui/src/stories/guide/03-ComponentStylings.stories.tsx` |
| **Create**  | `libs/ui/src/stories/guide/04-DosDonts.stories.tsx`          |
| **Create**  | `libs/ui/src/stories/guide/05-AgentPrompts.stories.tsx`      |
| **Delete**  | `libs/ui/src/stories/foundation/` (entire directory)         |

---

### Task 1: Create `shared-primitives.tsx`

**Why first:** Everything else depends on it.

**Files:**

- Create: `libs/ui/src/stories/shared-primitives.tsx`

- [ ] **Step 1: Write `shared-primitives.tsx`**

Merge `foundation/foundation-primitives.tsx` structure with `TokensOverview.stories.tsx`'s inline `Swatch` into a single file. Remove the `Foundation` prefix — the domain is clear from context.

```tsx
import type { ReactNode } from 'react';

import { cn } from '@prism/shared';

export function Page({
  title,
  description,
  children,
}: {
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background p-6 sm:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 space-y-2">
          <h1 className="heading-3 text-ink">{title}</h1>
          <div className="body-text text-ink-muted">{description}</div>
        </header>
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="heading-4 text-ink">{title}</h2>
        <p className="body-text text-ink-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-4 shadow-card-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ColorSwatch({
  token,
  className,
  description,
  lightHsl,
}: {
  token: string;
  className: string;
  description: string;
  lightHsl: string;
}) {
  return (
    <Card className="space-y-3">
      <div
        className="h-14 rounded-md border border-border"
        style={{ backgroundColor: `hsl(var(${token}))` }}
      />
      <div className="space-y-1">
        <p className="micro-text text-ink">{token}</p>
        <p className="micro-text text-ink-faint">{className}</p>
        <p className="body-text text-ink-muted">{description}</p>
      </div>
      <p className="micro-text text-ink-faint">浅色 HSL: {lightHsl}</p>
    </Card>
  );
}
```

- [ ] **Step 2: Run typecheck to verify**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/shared-primitives.tsx
git commit -m "feat(ui): add shared Storybook primitives (Page/Section/Card/ColorSwatch)"
```

---

### Task 2: Create `tokens-data.ts`

**Files:**

- Create: `libs/ui/src/stories/tokens-data.ts`

Extract all token data from `foundation/foundation-data.ts` (color groups, typography, spacing, elevation, breakpoints) into a single file. Merge with the TokensOverview inline color groups, keeping the more detailed `lightHsl` field from foundation-data.

- [ ] **Step 1: Write `tokens-data.ts`**

```ts
export interface ColorTokenItem {
  token: string;
  className: string;
  description: string;
  lightHsl: string;
}

export interface ColorTokenGroup {
  title: string;
  description: string;
  items: ColorTokenItem[];
}

export const colorGroups: ColorTokenGroup[] = [
  {
    title: 'SYSTEM（shadcn 语义色）',
    description: '组件基础语义色，建议优先通过组件变体消费。',
    items: [
      {
        token: '--background',
        className: 'bg-background',
        description: '页面底色',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--foreground',
        className: 'text-foreground',
        description: '基础前景文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--card',
        className: 'bg-card',
        description: '卡片背景',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--card-foreground',
        className: 'text-card-foreground',
        description: '卡片文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--popover',
        className: 'bg-popover',
        description: '浮层背景',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--popover-foreground',
        className: 'text-popover-foreground',
        description: '浮层文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--primary',
        className: 'bg-primary',
        description: '主操作背景',
        lightHsl: '15 71% 50%',
      },
      {
        token: '--primary-foreground',
        className: 'text-primary-foreground',
        description: '主操作文字',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--secondary',
        className: 'bg-secondary',
        description: '次级操作背景',
        lightHsl: '210 40% 96.1%',
      },
      {
        token: '--secondary-foreground',
        className: 'text-secondary-foreground',
        description: '次级操作文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--muted',
        className: 'bg-muted',
        description: '弱强调背景',
        lightHsl: '210 40% 96.1%',
      },
      {
        token: '--muted-foreground',
        className: 'text-muted-foreground',
        description: '弱强调文字',
        lightHsl: '0 0% 42%',
      },
      {
        token: '--accent',
        className: 'bg-accent',
        description: '高亮背景',
        lightHsl: '15 71% 95%',
      },
      {
        token: '--accent-foreground',
        className: 'text-accent-foreground',
        description: '高亮文字',
        lightHsl: '15 71% 40%',
      },
      {
        token: '--destructive',
        className: 'bg-destructive',
        description: '危险背景',
        lightHsl: '0 84.2% 60.2%',
      },
      {
        token: '--destructive-foreground',
        className: 'text-destructive-foreground',
        description: '危险文字',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--border',
        className: 'border-border',
        description: '边框与分隔线',
        lightHsl: '214.3 31.8% 91.4%',
      },
      {
        token: '--input',
        className: 'border-input',
        description: '输入框边框',
        lightHsl: '214.3 31.8% 91.4%',
      },
      {
        token: '--ring',
        className: 'ring-ring',
        description: '焦点环',
        lightHsl: '15 71% 50%',
      },
    ],
  },
  {
    title: 'BRAND',
    description: '品牌语义色。',
    items: [
      {
        token: '--brand',
        className: 'bg-brand',
        description: '品牌主色',
        lightHsl: '15 71% 50%',
      },
      {
        token: '--brand-foreground',
        className: 'text-brand-foreground',
        description: '品牌色上的文字',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--brand-light',
        className: 'bg-brand-light',
        description: '品牌浅底',
        lightHsl: '15 71% 95%',
      },
    ],
  },
  {
    title: 'INK',
    description: '文本层级。',
    items: [
      {
        token: '--ink',
        className: 'text-ink',
        description: '主文本',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--ink-muted',
        className: 'text-ink-muted',
        description: '次文本',
        lightHsl: '0 0% 42%',
      },
      {
        token: '--ink-faint',
        className: 'text-ink-faint',
        description: '弱文本',
        lightHsl: '0 0% 60%',
      },
    ],
  },
  {
    title: 'SURFACE',
    description: '背景层级。',
    items: [
      {
        token: '--surface',
        className: 'bg-surface',
        description: '内容区背景',
        lightHsl: '60 11% 96%',
      },
      {
        token: '--surface-muted',
        className: 'bg-surface-muted',
        description: '导航区背景',
        lightHsl: '0 0% 95%',
      },
    ],
  },
  {
    title: 'STATUS',
    description: '业务状态语义色。',
    items: [
      {
        token: '--success',
        className: 'bg-success',
        description: '成功反馈',
        lightHsl: '142 71% 45%',
      },
      {
        token: '--success-foreground',
        className: 'text-success-foreground',
        description: '成功文字',
        lightHsl: '0 0% 100%',
      },
      {
        token: '--warning',
        className: 'bg-warning',
        description: '警告反馈',
        lightHsl: '38 92% 50%',
      },
      {
        token: '--warning-foreground',
        className: 'text-warning-foreground',
        description: '警告文字',
        lightHsl: '0 0% 10%',
      },
      {
        token: '--info',
        className: 'bg-info',
        description: '信息反馈',
        lightHsl: '213 94% 55%',
      },
      {
        token: '--info-foreground',
        className: 'text-info-foreground',
        description: '信息文字',
        lightHsl: '0 0% 100%',
      },
    ],
  },
];

export interface TypographyRow {
  name: string;
  className: string;
  family: string;
  weight: string;
  size: string;
  lineHeight: string;
  useCase: string;
}

export const typographyRows: TypographyRow[] = [
  {
    name: '标题 1',
    className: 'heading-1',
    family: 'Montserrat',
    weight: '800',
    size: 'clamp(2.5rem, 5vw, 5rem)',
    lineHeight: '1',
    useCase: '首屏主标题与活动主标题',
  },
  {
    name: '标题 2',
    className: 'heading-2',
    family: 'Montserrat',
    weight: '800',
    size: 'clamp(2.125rem, 4.2vw, 4rem)',
    lineHeight: '1',
    useCase: '区块标题',
  },
  {
    name: '标题 3',
    className: 'heading-3',
    family: 'Montserrat',
    weight: '700',
    size: 'clamp(1.5rem, 2.5vw, 2rem)',
    lineHeight: '1.1',
    useCase: '卡片/功能模块标题',
  },
  {
    name: '标题 4',
    className: 'heading-4',
    family: 'Montserrat',
    weight: '600',
    size: 'clamp(1.125rem, 1.5vw, 1.375rem)',
    lineHeight: '1.2',
    useCase: '子区块标题',
  },
  {
    name: '正文字体',
    className: 'body-text',
    family: 'Inter',
    weight: '400',
    size: 'clamp(0.9375rem, 1.2vw, 1.125rem)',
    lineHeight: '1.55',
    useCase: '段落与商品描述',
  },
  {
    name: '微文案',
    className: 'micro-text',
    family: 'Inter',
    weight: '500',
    size: '0.75rem',
    lineHeight: '1.2',
    useCase: '标签、辅助信息、眉题',
  },
];

export interface SpacingRow {
  token: string;
  className: string;
  px: string;
  previewWidth: string;
  usage: string;
}

export const spacingScaleRows: SpacingRow[] = [
  {
    token: 'space-2',
    className: 'gap-2',
    px: '8px',
    previewWidth: '8px',
    usage: '图标与小标签的紧凑间距',
  },
  {
    token: 'space-3',
    className: 'gap-3',
    px: '12px',
    previewWidth: '12px',
    usage: '行内控件分组间距',
  },
  {
    token: 'space-4',
    className: 'gap-4',
    px: '16px',
    previewWidth: '16px',
    usage: '卡片默认内间距',
  },
  {
    token: 'space-6',
    className: 'gap-6',
    px: '24px',
    previewWidth: '24px',
    usage: '桌面端卡片内间距',
  },
  {
    token: 'space-8',
    className: 'gap-8',
    px: '32px',
    previewWidth: '32px',
    usage: '移动端区块间距',
  },
  {
    token: 'space-12/16',
    className: 'gap-12 lg:gap-16',
    px: '48px / 64px',
    previewWidth: '64px',
    usage: '桌面端区块间距',
  },
];

export interface ElevationRow {
  level: string;
  className: string;
  token: string;
  usage: string;
}

export const elevationRows: ElevationRow[] = [
  {
    level: '基础层',
    className: 'shadow-none',
    token: 'none',
    usage: '页面默认区域与低强调区块',
  },
  {
    level: '小卡片层',
    className: 'shadow-card-sm',
    token: '0 4px 16px rgba(0, 0, 0, 0.06)',
    usage: '小信息卡与标签块',
  },
  {
    level: '标准卡片层',
    className: 'shadow-card',
    token: '0 18px 50px rgba(0, 0, 0, 0.10)',
    usage: '核心内容卡片',
  },
  {
    level: '高强调卡片层',
    className: 'shadow-card-lg',
    token: '0 24px 64px rgba(0, 0, 0, 0.14)',
    usage: '重点推荐面板与弹层主体',
  },
];

export interface Breakpoint {
  prefix: string;
  minWidth: string;
  role: string;
}

export const breakpoints: Breakpoint[] = [
  { prefix: 'base', minWidth: '0px', role: '手机竖屏基线' },
  { prefix: 'sm', minWidth: '640px', role: '大手机 / 小平板' },
  { prefix: 'md', minWidth: '768px', role: '平板竖屏' },
  { prefix: 'lg', minWidth: '1024px', role: '平板横屏 / 小桌面' },
  { prefix: 'xl', minWidth: '1280px', role: '桌面端' },
  { prefix: '2xl', minWidth: '1536px', role: '大屏桌面' },
];
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/tokens-data.ts
git commit -m "feat(ui): add unified token data source for Storybook"
```

---

### Task 3: Create `guide-data.ts`

**Files:**

- Create: `libs/ui/src/stories/guide-data.ts`

Extract non-token data from `foundation/foundation-data.ts`: design atmosphere, layout principles, responsive patterns, dos/donts, agent prompt guide.

- [ ] **Step 1: Write `guide-data.ts`**

```ts
export const visualThemeAtmosphere = {
  mood: [
    '温暖且可信赖',
    '高可读性优先',
    '重实用，轻装饰',
    '触控优先的交互体验',
  ],
  density: [
    '电商浏览场景下默认使用舒适密度',
    '仅在信息层级需要时使用紧凑的元信息样式',
  ],
  designPhilosophy: [
    '布局遵循 Mobile-First 递进增强',
    '优先使用语义 Token，避免硬编码',
    '以 Token 变量作为唯一真相源',
    '优先复用组件变体，避免页面临时样式',
  ],
};

export const layoutPrinciples = [
  {
    principle: '页面容器唯一来源',
    implementation: '统一使用 PageContainer',
    guardrail: '不要在每个页面手写 max-width 与左右内边距',
  },
  {
    principle: '断点递进增强',
    implementation: 'base -> sm -> md -> lg -> xl',
    guardrail: '避免 max-md:* 这类 desktop-first 反向覆盖',
  },
  {
    principle: '先用留白建立层级',
    implementation: '优先用间距尺度，再考虑边框和阴影',
    guardrail: '不要仅靠颜色饱和度区分层级',
  },
  {
    principle: '可预期的栅格适配',
    implementation: '移动端 1 列，平板 2 列，桌面 3 列及以上',
    guardrail: '避免相邻断点出现突兀结构跳变',
  },
];

export const responsivePatterns = [
  {
    pattern: '头部导航',
    mobile: '汉堡菜单 + 抽屉',
    desktop: '横向导航 + 下拉菜单',
  },
  {
    pattern: '筛选面板',
    mobile: '按钮打开底部/侧边抽屉',
    desktop: '左侧粘性筛选栏',
  },
  {
    pattern: '商品栅格',
    mobile: 'grid-cols-2',
    desktop: 'sm:grid-cols-3 lg:grid-cols-4',
  },
  {
    pattern: '内容 + 侧栏',
    mobile: '单列布局',
    desktop: 'lg:grid-cols-[256px,1fr]',
  },
];

export const dosAndDonts = [
  {
    topic: '颜色使用',
    doText: '使用 text-ink、bg-brand 等语义 Token。',
    dontText: '不要写 text-[#1a1a1a] 这类硬编码颜色。',
  },
  {
    topic: '响应式顺序',
    doText: '先写 base，再用 sm/md/lg 逐级增强。',
    dontText: '不要先写桌面再用 max-md 回补移动端。',
  },
  {
    topic: '交互触达面积',
    doText: '可操作控件至少保持 44x44。',
    dontText: '不要上线触达面积过小的纯图标操作。',
  },
  {
    topic: '布局一致性',
    doText: '所有页面顶层统一使用 PageContainer。',
    dontText: '不要在页面里重复手写容器类。',
  },
];

export const agentPromptGuide = {
  colorReference: [
    '主 CTA：bg-brand text-brand-foreground',
    '可读正文：text-ink-muted body-text',
    '区块背景分层：bg-surface / bg-surface-muted',
    '错误提示文本：text-destructive',
  ],
  promptTemplates: [
    '请基于 Mobile-First 构建商品卡片，只使用语义 Token，并保证最小触达面积 44px。',
    '请实现响应式筛选面板：lg 以下使用抽屉，lg 及以上使用左侧粘性栏。',
    '请设计一个内容区块，使用标题层级和 body-text，不要出现硬编码颜色。',
    '请重构此组件，移除 max-md 的 desktop-first 写法，按 base->sm->md->lg 顺序组织。',
  ],
};
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/guide-data.ts
git commit -m "feat(ui): add guide data source for Storybook"
```

---

### Task 4: Rewrite `TokensOverview.stories.tsx`

**Files:**

- Modify: `libs/ui/src/stories/TokensOverview.stories.tsx`

Replace inline data and components with imports from `tokens-data.ts` and `shared-primitives.tsx`. Expand to cover typography, spacing, elevation, and radius/touch sections.

- [ ] **Step 1: Rewrite `TokensOverview.stories.tsx`**

```tsx
import type { Meta, StoryObj } from '@storybook/react';

import { Page, Section, Card, ColorSwatch } from './shared-primitives';
import {
  colorGroups,
  typographyRows,
  spacingScaleRows,
  elevationRows,
} from './tokens-data';

function TokensPage() {
  return (
    <Page
      title="Design Tokens"
      description={
        <>
          Token 真相源位于{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 text-sm">
            libs/tokens/src/tokens.css
          </code>
          ，Tailwind 映射位于 <code className="rounded bg-surface px-1.5 py-0.5 text-sm">
            libs/tokens/src/tailwind-preset.js
          </code>。
        </>
      }
    >
      {/* ─── Colors ─── */}
      {colorGroups.map(group => (
        <Section
          key={group.title}
          title={group.title}
          description={group.description}
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.items.map(item => (
              <ColorSwatch key={item.token} {...item} />
            ))}
          </div>
        </Section>
      ))}

      {/* ─── Typography ─── */}
      <Section
        title="TYPOGRAPHY"
        description="直接使用语义字号类，避免临时拼接字号样式。"
      >
        <div className="space-y-3">
          {typographyRows.map(row => (
            <Card key={row.name} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="body-text text-ink">{row.name}</p>
                <p className="micro-text text-ink-faint">{row.className}</p>
              </div>
              <p className={row.className}>
                快速预览这套排版在真实界面中的层级表现。
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="micro-text text-ink-faint">字体：{row.family}</p>
                <p className="micro-text text-ink-faint">字重：{row.weight}</p>
                <p className="micro-text text-ink-faint">字号：{row.size}</p>
                <p className="micro-text text-ink-faint">
                  行高：{row.lineHeight}
                </p>
              </div>
              <p className="body-text text-ink-muted">
                使用场景：{row.useCase}
              </p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── Spacing ─── */}
      <Section title="SPACING" description="区块与卡片应使用统一的间距节奏。">
        <div className="space-y-3">
          {spacingScaleRows.map(row => (
            <Card key={row.token} className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="body-text text-ink">{row.token}</p>
                <p className="micro-text text-ink-faint">{row.className}</p>
              </div>
              <div
                className="h-3 rounded bg-brand/20"
                style={{ width: row.previewWidth }}
              />
              <p className="micro-text text-ink-faint">{row.px}</p>
              <p className="body-text text-ink-muted">{row.usage}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── Elevation ─── */}
      <Section
        title="ELEVATION"
        description="通过阴影系统建立可预期的视觉深度。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {elevationRows.map(row => (
            <Card key={row.level} className="space-y-3">
              <p className="body-text text-ink">{row.level}</p>
              <div
                className={`rounded-lg border border-border bg-card p-5 ${row.className}`}
              >
                <p className="body-text text-ink">预览面板</p>
              </div>
              <p className="micro-text text-ink-faint">{row.className}</p>
              <p className="micro-text text-ink-faint">{row.token}</p>
              <p className="body-text text-ink-muted">{row.usage}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* ─── Radius & Touch ─── */}
      <Section
        title="RADIUS / SHADOW / TOUCH"
        description="关键非颜色 token 预览。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <p className="micro-text text-ink mb-2">rounded-sm</p>
            <div className="h-10 rounded-sm bg-surface border border-border" />
          </Card>
          <Card>
            <p className="micro-text text-ink mb-2">
              rounded-lg (var(--radius))
            </p>
            <div className="h-10 rounded-lg bg-surface border border-border" />
          </Card>
          <Card>
            <p className="micro-text text-ink mb-2">shadow-card</p>
            <div className="h-10 rounded-lg bg-card shadow-card" />
          </Card>
        </div>
        <div className="mt-4">
          <Card>
            <p className="micro-text text-ink mb-2">
              min-h-touch / min-w-touch
            </p>
            <button className="min-h-touch min-w-touch rounded-full bg-brand px-4 text-brand-foreground micro-text">
              44px 最小触控区
            </button>
          </Card>
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Tokens/Overview',
  component: TokensPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <TokensPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <TokensPage />
    </div>
  ),
};
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/TokensOverview.stories.tsx
git commit -m "feat(ui): rewrite TokensOverview with unified data and primitives"
```

---

### Task 5: Create `guide/01-Principles.stories.tsx`

**Files:**

- Create: `libs/ui/src/stories/guide/01-Principles.stories.tsx`

Merge content from `foundation/00-ThemeAtmosphere.stories.tsx` (theme atmosphere) and `foundation/04-LayoutPrinciples.stories.tsx` (留白哲学 / layout principles). Import from `guide-data.ts` and `shared-primitives.tsx`.

Storybook title: `'Design Guide/设计原则'`

- [ ] **Step 1: Write the story**

```tsx
import type { Meta, StoryObj } from '@storybook/react';

import { visualThemeAtmosphere, layoutPrinciples } from '../guide-data';
import { Page, Section, Card } from '../shared-primitives';

function PrinciplesPage() {
  return (
    <Page
      title="设计原则"
      description="定义全站统一的产品气质、信息密度和设计哲学。"
    >
      <Section
        title="产品气质"
        description="用户在各类流程中应感受到的情绪基调。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.mood.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="信息密度"
        description="在电商浏览场景中保持可读与效率的平衡。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.density.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="设计哲学"
        description="开发与评审阶段必须遵守的核心原则。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {visualThemeAtmosphere.designPhilosophy.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="留白哲学"
        description="应先通过留白建立层级，再引入边框或阴影。"
      >
        <div className="space-y-3">
          {layoutPrinciples.map(rule => (
            <Card key={rule.principle} className="space-y-2">
              <p className="body-text text-ink">{rule.principle}</p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">推荐实现：</span>{' '}
                {rule.implementation}
              </p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">约束边界：</span> {rule.guardrail}
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Guide/设计原则',
  component: PrinciplesPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <PrinciplesPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <PrinciplesPage />
    </div>
  ),
};
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/guide/01-Principles.stories.tsx
git commit -m "feat(ui): add Design Guide - 设计原则 story"
```

---

### Task 6: Create `guide/02-LayoutResponsive.stories.tsx`

**Files:**

- Create: `libs/ui/src/stories/guide/02-LayoutResponsive.stories.tsx`

Merge content from `foundation/04-LayoutPrinciples.stories.tsx` (grid/container demo) and `foundation/07-ResponsiveBehavior.stories.tsx` (breakpoints, touch targets, fold strategies). Import from `tokens-data.ts` (breakpoints), `guide-data.ts` (responsive patterns), and `shared-primitives.tsx`.

Storybook title: `'Design Guide/布局与响应式'`

- [ ] **Step 1: Write the story**

```tsx
import type { Meta, StoryObj } from '@storybook/react';

import { PageContainer } from '../../components/PageContainer';
import { breakpoints } from '../tokens-data';
import { responsivePatterns } from '../guide-data';
import { Page, Section, Card } from '../shared-primitives';

function LayoutResponsivePage() {
  return (
    <Page
      title="布局与响应式"
      description="定义断点体系、栅格行为与组件折叠策略。"
    >
      <Section
        title="栅格与容器"
        description="页面级布局应始终从 PageContainer 开始。"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface-muted py-4">
            <PageContainer>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded bg-card p-4 text-center body-text text-ink">
                  第 1 列
                </div>
                <div className="rounded bg-card p-4 text-center body-text text-ink">
                  第 2 列
                </div>
                <div className="rounded bg-card p-4 text-center body-text text-ink">
                  第 3 列
                </div>
              </div>
            </PageContainer>
          </div>
          <p className="body-text text-ink-muted">
            该示例演示了单一容器来源，以及从移动端到桌面端的栅格递进增强。
          </p>
        </div>
      </Section>

      <Section
        title="断点体系"
        description="严格按递进增强顺序使用 Tailwind 默认断点。"
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {breakpoints.map(item => (
            <Card key={item.prefix} className="space-y-2">
              <p className="heading-4 text-ink">{item.prefix}</p>
              <p className="body-text text-ink-muted">
                最小宽度：{item.minWidth}
              </p>
              <p className="body-text text-ink-muted">{item.role}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="触达面积"
        description="交互控件必须保证最小 44x44 的触控区域。"
      >
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <button className="min-h-touch min-w-touch rounded-full bg-brand px-4 text-brand-foreground micro-text">
              符合 44px
            </button>
            <button className="rounded-full bg-surface px-2 py-1 micro-text text-ink">
              不符合
            </button>
          </div>
          <p className="body-text text-ink-muted">
            优先使用 min-h-touch/min-w-touch Token，避免硬编码尺寸。
          </p>
        </Card>
      </Section>

      <Section
        title="折叠策略"
        description="定义从移动端到桌面端的结构切换行为。"
      >
        <div className="space-y-3">
          {responsivePatterns.map(pattern => (
            <Card key={pattern.pattern} className="space-y-2">
              <p className="body-text text-ink">{pattern.pattern}</p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">移动端：</span> {pattern.mobile}
              </p>
              <p className="body-text text-ink-muted">
                <span className="font-medium">桌面端：</span> {pattern.desktop}
              </p>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Guide/布局与响应式',
  component: LayoutResponsivePage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <LayoutResponsivePage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <LayoutResponsivePage />
    </div>
  ),
};
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/guide/02-LayoutResponsive.stories.tsx
git commit -m "feat(ui): add Design Guide - 布局与响应式 story"
```

---

### Task 7: Create `guide/03-ComponentStylings.stories.tsx`

**Files:**

- Create: `libs/ui/src/stories/guide/03-ComponentStylings.stories.tsx`

Migrate from `foundation/03-ComponentStylings.stories.tsx`. Update imports to `shared-primitives.tsx`, update Storybook title.

- [ ] **Step 1: Write the story**

```tsx
import type { Meta, StoryObj } from '@storybook/react';

import { Button } from '../../components/button';
import { Page, Section, Card } from '../shared-primitives';

function ComponentStylingsPage() {
  return (
    <Page
      title="组件样式规范"
      description="沉淀按钮、卡片、输入框、导航等核心组件的状态样式。"
    >
      <Section
        title="按钮"
        description="主操作使用 brand 变体，并保证禁用态和焦点态清晰可见。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-3">
            <p className="micro-text text-ink-faint">
              默认态 / 悬浮态 / 焦点态
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="brand">立即购买</Button>
              <Button variant="outline">次级操作</Button>
              <Button variant="ghost">弱化操作</Button>
            </div>
            <p className="body-text text-ink-muted">
              Hover 与 Focus 通过组件变体和 ring Token 统一管理。
            </p>
          </Card>
          <Card className="space-y-3">
            <p className="micro-text text-ink-faint">禁用态</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="brand" disabled>
                处理中
              </Button>
              <Button variant="outline" disabled>
                不可用
              </Button>
            </div>
            <p className="body-text text-ink-muted">
              禁用态应保持布局稳定并避免误触。
            </p>
          </Card>
        </div>
      </Section>

      <Section
        title="卡片"
        description="卡片应基于 surface 与 elevation Token，而非随意边框样式。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4 shadow-card-sm">
            <p className="heading-4 text-ink">标准卡片</p>
            <p className="body-text text-ink-muted mt-2">
              用于商品摘要与简洁信息展示。
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <p className="heading-4 text-ink">强调卡片</p>
            <p className="body-text text-ink-muted mt-2">
              仅在需要强调层级时使用更强阴影。
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="输入框"
        description="输入控件必须保证可读字号与清晰焦点反馈。"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-2">
            <label
              className="micro-text text-ink-faint"
              htmlFor="default-input"
            >
              默认状态
            </label>
            <input
              id="default-input"
              className="h-10 w-full rounded-md border border-input bg-background px-3 body-text text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="搜索商品"
            />
          </Card>
          <Card className="space-y-2">
            <label className="micro-text text-ink-faint" htmlFor="error-input">
              错误状态
            </label>
            <input
              id="error-input"
              className="h-10 w-full rounded-md border border-destructive bg-background px-3 body-text text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              defaultValue="输入值无效"
            />
          </Card>
        </div>
      </Section>

      <Section
        title="导航"
        description="导航需通过语义色清晰区分激活态与未激活态。"
      >
        <Card>
          <nav className="flex flex-wrap gap-2">
            <button className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground">
              当前页
            </button>
            <button className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-brand-light">
              菜单项
            </button>
            <button className="rounded-full bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-brand-light">
              菜单项
            </button>
          </nav>
        </Card>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Guide/组件样式',
  component: ComponentStylingsPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <ComponentStylingsPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <ComponentStylingsPage />
    </div>
  ),
};
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/guide/03-ComponentStylings.stories.tsx
git commit -m "feat(ui): add Design Guide - 组件样式 story"
```

---

### Task 8: Create `guide/04-DosDonts.stories.tsx`

**Files:**

- Create: `libs/ui/src/stories/guide/04-DosDonts.stories.tsx`

Migrate from `foundation/06-DosDonts.stories.tsx`. Update imports.

- [ ] **Step 1: Write the story**

```tsx
import type { Meta, StoryObj } from '@storybook/react';

import { dosAndDonts } from '../guide-data';
import { Page, Section, Card } from '../shared-primitives';

function DosDontsPage() {
  return (
    <Page
      title="Do / Don't"
      description="通过正反示例统一实现质量，减少样式回退。"
    >
      <Section
        title="设计护栏"
        description="每个主题都给出推荐做法与常见反模式。"
      >
        <div className="space-y-4">
          {dosAndDonts.map(item => (
            <Card key={item.topic} className="space-y-3">
              <p className="heading-4 text-ink">{item.topic}</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-success/30 bg-success/10 p-3">
                  <p className="micro-text text-success">建议</p>
                  <p className="body-text text-ink mt-1">{item.doText}</p>
                </div>
                <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
                  <p className="micro-text text-destructive">禁忌</p>
                  <p className="body-text text-ink mt-1">{item.dontText}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: "Design Guide/Do / Don't",
  component: DosDontsPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <DosDontsPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <DosDontsPage />
    </div>
  ),
};
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/guide/04-DosDonts.stories.tsx
git commit -m "feat(ui): add Design Guide - Do / Don't story"
```

---

### Task 9: Create `guide/05-AgentPrompts.stories.tsx`

**Files:**

- Create: `libs/ui/src/stories/guide/05-AgentPrompts.stories.tsx`

Migrate from `foundation/08-AgentPromptGuide.stories.tsx`. Update imports.

- [ ] **Step 1: Write the story**

```tsx
import type { Meta, StoryObj } from '@storybook/react';

import { agentPromptGuide } from '../guide-data';
import { Page, Section, Card } from '../shared-primitives';

function AgentPromptsPage() {
  return (
    <Page
      title="Agent 指令模板"
      description="提供可直接复用的规范速查与提示词模板，提升 AI 协作效率。"
    >
      <Section
        title="颜色速查"
        description="编写实现提示词时可直接复用这些约定。"
      >
        <div className="space-y-3">
          {agentPromptGuide.colorReference.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        title="提示词模板"
        description="模板内已约束语义 Token、响应式规则和交互护栏。"
      >
        <div className="space-y-3">
          {agentPromptGuide.promptTemplates.map(item => (
            <Card key={item}>
              <p className="body-text text-ink">{item}</p>
            </Card>
          ))}
        </div>
      </Section>
    </Page>
  );
}

const meta: Meta = {
  title: 'Design Guide/Agent 指令模板',
  component: AgentPromptsPage,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Light: Story = {
  render: () => <AgentPromptsPage />,
};

export const Dark: Story = {
  render: () => (
    <div className="dark">
      <AgentPromptsPage />
    </div>
  ),
};
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add libs/ui/src/stories/guide/05-AgentPrompts.stories.tsx
git commit -m "feat(ui): add Design Guide - Agent 指令模板 story"
```

---

### Task 10: Delete `foundation/` directory

**Files:**

- Delete: `libs/ui/src/stories/foundation/` (entire directory)

All content has been migrated. Verify typecheck passes after deletion.

- [ ] **Step 1: Delete the directory**

```bash
rm -rf libs/ui/src/stories/foundation
```

- [ ] **Step 2: Run typecheck to confirm no broken imports**

```bash
pnpm nx typecheck ui
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git rm -r libs/ui/src/stories/foundation
git commit -m "refactor(ui): remove foundation/ directory, content migrated to guide/"
```

---

### Task 11: Verification

- [ ] **Step 1: Run full typecheck**

```bash
pnpm typecheck
```

Expected: PASS

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: PASS (0 errors, existing warnings OK)

- [ ] **Step 3: Verify Storybook builds**

```bash
pnpm storybook --no-open &
# Wait for startup, then check the console for errors
```

Expected: No build errors, all stories load

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore(ui): final verification fixes for Storybook migration"
```
