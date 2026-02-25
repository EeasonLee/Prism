# 开发规范指南

开发新页面或新组件时，遵循以下 3 步规范，确保与 Design System 保持一致。

---

## 3 步开发流程

### Step 1：颜色来自 Token

写任何颜色前，先查 [tokens.md](./tokens.md)，用语义 Token 而非硬编码值：

```tsx
// 查 tokens.md → 找到对应 Token → 使用 Tailwind 类

// 主文字        → text-ink
// 次要文字      → text-ink-muted
// 品牌色按钮    → bg-brand text-brand-foreground
// 页面区域背景  → bg-surface 或 bg-surface-muted
// 纯白卡片背景  → bg-card 或 bg-background
```

**没找到对应 Token 怎么办？**

1. 先问：这个颜色是否可以用现有 Token 近似表达？
2. 如果是新的语义（如"警告色"），在 `globals.css` 的 `:root` 里新增 CSS 变量，并同步更新 `tailwind.config.js`
3. 不要直接写 `text-[#xxx]`，这会绕过 Token 系统

### Step 2：布局经过 PageContainer

每个页面的顶层布局必须经过 `PageContainer`：

```tsx
import { PageContainer } from '@prism/ui';

export default function MyPage() {
  return (
    // ✅ 所有页面用 PageContainer 作为最外层
    <PageContainer>
      <section className="py-12">{/* 内容 */}</section>
    </PageContainer>
  );
}
```

布局写法遵循 Mobile-First，详见 [responsive.md](./responsive.md)。

### Step 3：可点击元素 ≥ 44px

所有按钮、链接、图标操作区域，触控尺寸不能小于 44×44px：

```tsx
// ✅ 使用 Button 组件（内置合理尺寸）
<Button variant="brand" size="lg">Shop Now</Button>

// ✅ 图标按钮用 min-h-touch min-w-touch
<button className="min-h-touch min-w-touch flex items-center justify-center rounded-full">
  <CloseIcon className="h-5 w-5" />
</button>

// ❌ 尺寸不足
<button className="p-1 text-sm">x</button>
```

---

## 新增组件规范

### 放在哪里？

| 类型                         | 位置                                       |
| ---------------------------- | ------------------------------------------ |
| 纯 UI 基础组件（无业务逻辑） | `libs/ui/src/components/`                  |
| 特定业务模块组件             | 对应 lib（如 `libs/blog/src/components/`） |
| 单页面专用组件               | `apps/prism/app/components/`               |

### 组件模板

```tsx
import { cn } from '@prism/shared';
import { cva, type VariantProps } from 'class-variance-authority';

// 1. 用 CVA 定义变体，不要在 className 里堆叠条件判断
const cardVariants = cva(
  // 基础样式（Mobile-First）
  'rounded-lg bg-card overflow-hidden transition-shadow duration-200',
  {
    variants: {
      shadow: {
        none: '',
        sm: 'shadow-card-sm',
        md: 'shadow-card',
        lg: 'shadow-card-lg',
      },
      padding: {
        none: '',
        sm: 'p-4',
        md: 'p-6',
      },
    },
    defaultVariants: {
      shadow: 'md',
      padding: 'md',
    },
  }
);

interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

// 2. 用 forwardRef + cn() 合并样式
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, shadow, padding, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ shadow, padding }), className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';
```

### 样式规范

```tsx
// ✅ 颜色用 Token
className="text-ink bg-surface"

// ✅ 响应式用 Mobile-First 断点顺序
className="text-sm sm:text-base lg:text-lg"

// ✅ 合并类名用 cn()
className={cn('base-class', condition && 'conditional-class', props.className)}

// ❌ 禁止硬编码颜色
className="text-[#1a1a1a] bg-[#F6F6F2]"

// ❌ 禁止用 style 写颜色
style={{ color: '#D94F25' }}

// ❌ 禁止 Desktop-First 断点
className="text-lg max-md:text-sm"
```

---

## 修改 Token

如果需要调整品牌色、圆角等全局样式：

### 修改现有 Token 值

只改 `globals.css` 中的 CSS 变量值，其他地方无需修改：

```css
/* apps/prism/app/globals.css */
:root {
  --brand: 200 80% 45%; /* 从橙色改为蓝色 */
}
```

全局所有使用 `bg-brand` / `text-brand` 的地方自动更新。

### 新增 Token

需要同步修改两个文件：

**Step 1：** 在 `globals.css` `:root` 中添加 CSS 变量：

```css
:root {
  --warning: 45 100% 51%; /* amber */
  --warning-foreground: 0 0% 10%;
}
```

**Step 2：** 在 `tailwind.config.js` `theme.extend.colors` 中添加映射：

```js
colors: {
  warning: {
    DEFAULT: 'hsl(var(--warning))',
    foreground: 'hsl(var(--warning-foreground))',
  },
}
```

之后就可以用 `bg-warning text-warning-foreground` 了。

### 修改排版

修改 `globals.css` 中的 `.heading-*` / `.body-text` 类定义，全局生效。

---

## PR Checklist

提交代码前，对照以下列表快速自查（2 分钟）：

### 颜色

- [ ] 所有颜色使用 Token（`text-ink`, `bg-brand` 等），无硬编码 `[#xxx]`
- [ ] 无内联 `style={{ color/background/borderColor }}`
- [ ] 无 Tailwind 具名颜色（`text-orange-500`, `bg-gray-100` 等）用于品牌/界面色

### 排版

- [ ] 标题使用 `.heading-1` ～ `.heading-4` 类
- [ ] 正文使用 `.body-text` 或 `.micro-text` 类
- [ ] 无裸用 `text-3xl font-bold` 等组合

### 布局

- [ ] 页面最外层使用 `<PageContainer>`
- [ ] 响应式按 Mobile-First 顺序（无前缀 → `sm:` → `md:` → `lg:`）
- [ ] 无 `max-md:` 等 Desktop-First 断点

### 交互

- [ ] 可点击元素触控区域 ≥ 44px
- [ ] 无仅依赖 hover 的关键交互
- [ ] 表单元素有 `focus-visible:` 样式

### 组件

- [ ] 新 UI 组件放在 `libs/ui/`，用 CVA 定义变体
- [ ] 使用 `cn()` 合并类名
- [ ] 导出时有 `displayName`

---

## 常见问题

**Q：想用一个颜色，但不知道用哪个 Token？**

按下面优先级查找：

1. 文字 → `text-ink` / `text-ink-muted` / `text-ink-faint`
2. 背景 → `bg-background` / `bg-card` / `bg-surface` / `bg-surface-muted`
3. 强调/CTA → `bg-brand` / `text-brand`
4. 状态 → `text-destructive`（错误）
5. 以上都不合适 → 新增 Token（参考上面"新增 Token"步骤）

**Q：能不能直接用 `orange-500`？**

不行。项目中"橙色"有统一语义，对应 `brand` Token，值通过 CSS 变量控制。直接用 `orange-500` 意味着：

- 品牌色改变时，这里不会自动更新
- 颜色可能与 `brand` 的实际值略有差异

**Q：组件已有 `className` prop，可以从外部覆盖样式吗？**

可以覆盖**布局和间距**（如 `mt-4`、`w-full`），不建议覆盖**颜色**（应通过 `variant` prop 控制）。
