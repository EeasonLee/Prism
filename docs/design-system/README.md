# Design System

Prism 项目的设计系统文档。本目录是设计系统的**说明层**，代码才是**真相层**。

## 文档索引

| 文档                                 | 说明                                                |
| ------------------------------------ | --------------------------------------------------- |
| [tokens.md](./tokens.md)             | 所有设计 Token 的语义手册（颜色、排版、间距、动效） |
| [responsive.md](./responsive.md)     | 移动端优先规范与全尺寸适配指南                      |
| [contributing.md](./contributing.md) | 开发新页面/组件时的 3 步规范 + Checklist            |

---

## 核心架构

设计系统遵循**单一真相源**原则，所有视觉规范从一个地方定义，逐层传递：

```
CSS Variables (globals.css)   ← 唯一真相源，改这里全局生效
        ↓
Tailwind Config               ← 映射为 bg-brand / text-ink 等工具类
        ↓
CVA + libs/ui 组件库          ← 封装 variant="brand" 等变体
        ↓
App 页面 / 业务组件            ← 只消费，不定义
```

**核心原则：改一个地方，全局生效。** 修改 `--brand` 颜色，整个项目（含 Storybook）同步更新，无需手动更新任何文档。

---

## Token 三层模型

```
Primitive（原始层）
  具体 HSL 值，写在 globals.css 注释里
  开发者不直接使用此层
       ↓
Semantic（语义层）          ← 开发者日常使用这一层
  --brand / --ink / --surface
  描述"用途"，而非"颜色值"
       ↓
Component（组件层）
  variant="brand" / className="heading-1"
  最终消费语义 Token
```

---

## 快速上手

### 写颜色

```tsx
// ✅ 用语义 Token
<p className="text-ink">主文字</p>
<p className="text-ink-muted">说明文字</p>
<div className="bg-surface">内容区背景</div>
<button className="bg-brand text-brand-foreground">CTA 按钮</button>

// ❌ 禁止硬编码
<p className="text-[#1a1a1a]">...</p>
<div className="bg-[#F6F6F2]">...</div>
<button style={{ backgroundColor: '#D94F25' }}>...</button>
```

### 写响应式布局

```tsx
// ✅ Mobile-First：默认手机，往上增强
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

// ❌ 禁止 Desktop-First（先桌面再覆盖移动端）
<div className="grid grid-cols-3 max-md:grid-cols-1">
```

### 写页面布局

```tsx
// ✅ 所有页面最外层必须用 PageContainer
import { PageContainer } from '@prism/ui';

export default function Page() {
  return (
    <PageContainer>
      {/* 内容 */}
    </PageContainer>
  );
}

// ❌ 不要在页面里单独写 px- / max-w-
<div className="px-4 sm:px-6 lg:px-[50px] max-w-[1720px] mx-auto">
```

### 用组件变体

```tsx
import { Button } from '@prism/ui';

// ✅ 使用预定义变体
<Button variant="brand" size="lg">Shop Now</Button>
<Button variant="outline">Learn More</Button>

// ❌ 不要在 Button 上叠加颜色覆盖
<Button className="bg-[#D94F25]">Shop Now</Button>
```

---

## 文件位置速查

| 内容                 | 文件                            |
| -------------------- | ------------------------------- |
| CSS 变量（Token 值） | `apps/prism/app/globals.css`    |
| Tailwind 主题扩展    | `apps/prism/tailwind.config.js` |
| 基础组件库           | `libs/ui/src/components/`       |
| 工具函数（cn）       | `libs/shared/src/utils/cn.ts`   |
| 设计系统文档         | `docs/design-system/`           |

---

## 跨项目复用

Token 层（CSS 变量）零框架依赖，可在任何项目中使用：

1. 复制 `globals.css` 中 `:root { ... }` 的变量定义到新项目
2. 引入 `libs/ui/` 组件（Nx 工作区内直接依赖）
3. CSS Variables 在 React / Vue / Svelte / 原生 HTML 中同样有效

未来可将 `libs/tokens/` 和 `libs/ui/` 发布为独立 npm 包，实现零成本跨仓库复用。
