# libs/ui Storybook Architecture Design

**Date:** 2026-05-06
**Status:** Approved
**Scope:** `libs/ui/src/stories/`

## 1. Problem

`libs/ui/src/stories/` 当前存在三组问题：

### 1.1 数据重复

- `TokensOverview.stories.tsx` 内联定义了颜色 Token 数据（SYSTEM/BRAND/INK/SURFACE/STATUS 5 组）
- `foundation/foundation-data.ts` 重复定义了同批颜色数据（品牌色/文本层级/背景层级/状态色 4 组），结构更详细但内容高度重合
- 排版、间距、海拔数据只存在于 foundation 中，TokensOverview 没有覆盖

### 1.2 UI 原语重复

- `TokensOverview` 内联了 `Section` 和 `Swatch` 组件
- `foundation/foundation-primitives.tsx` 定义了 `FoundationPage`、`FoundationSection`、`FoundationCard`
- 两套组件功能等价但命名和实现各自独立

### 1.3 概念模糊

- "Design Tokens" 和 "基础规范(foundation)" 这两个 Storybook 分组的职责边界不清
- "foundation" 目录混合了 Token 展示（颜色/排版/间距/海拔）、设计哲学、组件样式示范、Do/Don't、响应式行为、Agent 提示词——没有统一分类逻辑
- 开发者来了不知道该先看哪个

## 2. Design Goals

1. **数据唯一** — 每份 Token 数据只定义一次，Storybook 页面从统一数据源引用
2. **UI 原语唯一** — 共享的展示组件只写一套
3. **分类清晰** — 按"是什么"（Token 参考）和"怎么用"（设计指南）两个维度组织
4. **紧凑优先** — Token 展示页紧凑，开发者快速扫描即可复制类名
5. **Agent 友好** — Agent 能读 Design Tokens 页面知道有哪些变量可用，读 Design Guide 知道约束规则

## 3. Target Architecture

### 3.1 Storybook 侧边栏

```
Design Tokens/
└── Overview              ← 全部语义 Token 一览（颜色/排版/间距/阴影/圆角/触控），紧凑卡片

Design Guide/
├── 设计原则               ← 设计哲学 + 留白原则 + 信息密度
├── 布局与响应式            ← 栅格/间距尺度/断点/响应式模式
├── 组件样式               ← 按钮/卡片/输入框/导航的标准样式与状态
├── Do / Don't            ← 正反示例对照
└── Agent 指令模板         ← Agent 提示词模板和颜色速查

Components/
├── Button
├── PageContainer
├── ...（不变）
```

### 3.2 文件结构

```
stories/
├── tokens-data.ts             ← 唯一 Token 展示数据源
│   ├── colorGroups             ← 颜色分组（SYSTEM/BRAND/INK/SURFACE/STATUS）
│   ├── typographyRows          ← 排版层级
│   ├── spacingScaleRows        ← 间距尺度
│   ├── elevationRows           ← 海拔/阴影层级
│   └── breakpoints             ← 响应式断点
│
├── guide-data.ts              ← Design Guide 数据源
│   ├── designPrinciples        ← 设计哲学/密度/原则
│   ├── layoutPrinciples        ← 布局原则
│   ├── responsivePatterns      ← 响应式模式
│   ├── dosAndDonts            ← Do/Don't 对照表
│   └── agentPromptGuide       ← Agent 提示词模板
│
├── shared-primitives.tsx      ← 共享展示组件（只一套）
│   ├── Page                    ← 页面容器（替换 FoundationPage 和 TokensPage 内联结构）
│   ├── Section                 ← 内容区块（替换 FoundationSection 和 Section）
│   ├── Card                    ← 通用卡片（替换 FoundationCard）
│   └── ColorSwatch            ← 颜色色块（替换 Swatch）
│
├── TokensOverview.stories.tsx  ← 引用 tokens-data.ts + shared-primitives.tsx
│
└── guide/
    ├── 01-Principles.stories.tsx       ← 合并原 00 + 04 留白哲学
    ├── 02-LayoutResponsive.stories.tsx ← 合并原 04 栅格 + 07 响应式
    ├── 03-ComponentStylings.stories.tsx← 原 03
    ├── 04-DosDonts.stories.tsx         ← 原 06
    └── 05-AgentPrompts.stories.tsx     ← 原 08
```

### 3.3 删除清单

| 文件                                           | 原因                                                 |
| ---------------------------------------------- | ---------------------------------------------------- |
| `foundation/foundation-data.ts`                | 数据迁至 `tokens-data.ts` + `guide-data.ts`          |
| `foundation/foundation-primitives.tsx`         | UI 原语迁至 `shared-primitives.tsx`                  |
| `foundation/foundation-utils.ts`               | 颜色工具函数迁至 `shared-primitives.tsx`             |
| `foundation/00-ThemeAtmosphere.stories.tsx`    | 合并至 `guide/01-Principles.stories.tsx`             |
| `foundation/01-ColorPaletteRoles.stories.tsx`  | 合并至 `TokensOverview.stories.tsx`                  |
| `foundation/02-TypographyRules.stories.tsx`    | 合并至 `TokensOverview.stories.tsx`                  |
| `foundation/03-ComponentStylings.stories.tsx`  | 迁至 `guide/03-ComponentStylings.stories.tsx`        |
| `foundation/04-LayoutPrinciples.stories.tsx`   | 拆分至 `TokensOverview`（间距） + `guide/02`（布局） |
| `foundation/05-DepthElevation.stories.tsx`     | 合并至 `TokensOverview.stories.tsx`                  |
| `foundation/06-DosDonts.stories.tsx`           | 迁至 `guide/04-DosDonts.stories.tsx`                 |
| `foundation/07-ResponsiveBehavior.stories.tsx` | 合并至 `guide/02-LayoutResponsive.stories.tsx`       |
| `foundation/08-AgentPromptGuide.stories.tsx`   | 迁至 `guide/05-AgentPrompts.stories.tsx`             |
| `TokensOverview.stories.tsx` 内联数据/组件     | 数据迁至数据文件，组件用 shared-primitives           |

## 4. Token Data Contract

`tokens-data.ts` 是展示适配层，Token 真相源仍在 `libs/tokens/src/tokens.css`。

### 4.1 颜色 Token 结构（紧凑版）

```ts
interface ColorTokenItem {
  token: string; // CSS 变量名，如 '--brand'
  className: string; // Tailwind 类名，如 'bg-brand'
  description: string; // 一句话中文说明，如 '品牌主色'
  lightHsl: string; // 浅色 HSL 值，用于渲染色块
}
```

不在卡片上展示 `semanticName`、`role`、`darkHsl`、`hex`——保持紧凑。

### 4.2 排版 Token 结构

```ts
interface TypographyRow {
  name: string;
  className: string; // heading-1 / body-text / micro-text
  preview: string; // 预览文案
  family: string;
  weight: string;
  size: string;
  lineHeight: string;
  useCase: string;
}
```

### 4.3 间距 Token 结构

```ts
interface SpacingRow {
  token: string; // 'space-4'
  className: string; // 'gap-4'
  px: string; // '16px'
  previewWidth: string; // '16px' — 可视化条宽度
  usage: string;
}
```

### 4.4 Token 分组顺序

Colors → Typography → Spacing → Elevation → Radius & Touch

## 5. Storybook Title 命名

```
Design Tokens/Overview          ← 原 'Design Tokens/Overview'
Design Guide/设计原则            ← 原 '基础规范/00 视觉主题与氛围'
Design Guide/布局与响应式        ← 原 '基础规范/04 布局原则' + '基础规范/07 响应式行为'
Design Guide/组件样式            ← 原 '基础规范/03 组件样式规范'
Design Guide/Do Don't           ← 原 '基础规范/06 建议与禁忌'
Design Guide/Agent 指令模板      ← 原 '基础规范/08 Agent 提示词指南'
```

## 6. Design Guide 各页面内容

### 6.1 设计原则

- 产品气质（温暖可信赖、高可读性、重实用、触控优先）
- 信息密度（舒适浏览、紧凑元信息）
- 设计哲学（Mobile-First、语义 Token、Token 唯一真相源、复用组件变体）

### 6.2 布局与响应式

- 间距尺度可视化（space-2 到 space-12/16）
- 栅格与 PageContainer 演示
- 响应式断点表（base/sm/md/lg/xl/2xl）
- 常见响应式模式（导航、筛选、商品栅格、内容+侧栏）

### 6.3 组件样式

- 按钮（默认/悬浮/焦点/禁用，brand/outline/ghost）
- 卡片（标准卡 shadow-card-sm vs 强调卡 shadow-card）
- 输入框（默认/错误状态）
- 导航（激活/未激活）

### 6.4 Do / Don't

- 颜色使用、响应式顺序、触达面积、布局一致性——每项都有 Do 和 Don't 对照卡

### 6.5 Agent 指令模板

- 颜色速查（常用 Token 组合）
- 提示词模板（构建商品卡片、响应式筛选、内容区块、重构组件）

## 7. Implementation Steps

1. **创建 `tokens-data.ts`** — 从 `foundation-data.ts` 和 `TokensOverview.stories.tsx` 提取合并 Token 数据，统一数据结构
2. **创建 `guide-data.ts`** — 从 `foundation-data.ts` 提取非 Token 数据
3. **创建 `shared-primitives.tsx`** — 合并两套 UI 原语为 `Page`/`Section`/`Card`/`ColorSwatch`
4. **重写 `TokensOverview.stories.tsx`** — 引用新数据文件和共享原语，覆盖颜色+排版+间距+海拔+圆角+触控
5. **创建 `guide/01-Principles.stories.tsx`** — 合并原 00 + 04 留白哲学
6. **创建 `guide/02-LayoutResponsive.stories.tsx`** — 合并原 04 栅格 + 07 响应式
7. **迁移 `guide/03-ComponentStylings.stories.tsx`** — 从 foundation/03 迁出
8. **迁移 `guide/04-DosDonts.stories.tsx`** — 从 foundation/06 迁出
9. **迁移 `guide/05-AgentPrompts.stories.tsx`** — 从 foundation/08 迁出
10. **删除 `foundation/` 目录**
11. **验证** — 运行 `pnpm storybook`，确认所有 story 渲染正常，数据一致

## 8. Non-Goals

- 不改动 `libs/tokens/` 下的 CSS 变量定义
- 不改动现有组件（Button、PageContainer 等）的实现
- 不新增组件 Story（组件 Story 正常放在 `components/` 下各自维护）
