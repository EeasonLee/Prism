# 响应式设计规范

Mobile-First，全尺寸适配。本文档定义断点策略、布局规则和组件适配模式。

---

## 核心原则：Mobile-First

**默认样式 = 手机，向上增强，不向下覆盖。**

```tsx
// ✅ Mobile-First：从小屏出发，逐步增强
<div className="
  grid grid-cols-1      // 手机：单列
  sm:grid-cols-2        // ≥640px：两列
  lg:grid-cols-3        // ≥1024px：三列
">

// ❌ Desktop-First（禁止）：先写桌面再覆盖
<div className="
  grid grid-cols-3      // 默认三列
  max-md:grid-cols-1    // 强行覆盖移动端
">
```

为什么 Mobile-First 更好？

- CSS 加载更少（移动端不加载桌面样式）
- 逻辑更清晰（从简单到复杂）
- 避免"用桌面思维做移动端"的布局错误

---

## 断点系统

使用 Tailwind 默认断点，团队统一记忆：

| 前缀   | 最小宽度 | 目标设备                   |
| ------ | -------- | -------------------------- |
| 无前缀 | 0px      | 手机竖屏（基准，320px ～） |
| `sm:`  | 640px    | 大手机横屏 / 小平板        |
| `md:`  | 768px    | 平板竖屏                   |
| `lg:`  | 1024px   | 平板横屏 / 小桌面          |
| `xl:`  | 1280px   | 桌面                       |
| `2xl:` | 1536px   | 大桌面（可选，按需使用）   |

**编写顺序约定：** 始终按 `默认 → sm: → md: → lg: → xl:` 顺序编写，不允许跳序。

---

## 布局系统

### PageContainer — 唯一的页面容器

所有页面的最外层都必须经过 `PageContainer`，禁止在页面中重复写容器样式：

```tsx
// ✅ 正确
<PageContainer>
  <YourContent />
</PageContainer>

// ❌ 禁止在页面里手写容器
<div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-[50px]">
```

`PageContainer` 内置：

- 最大宽度：`max-w-[1720px]`
- 水平内边距：`px-4 sm:px-6 lg:px-[50px]`（16px / 24px / 50px）
- 自动居中：`mx-auto`

### 栅格模式参考

| 场景          | Mobile             | Tablet           | Desktop                    |
| ------------- | ------------------ | ---------------- | -------------------------- |
| 卡片列表      | `grid-cols-1`      | `sm:grid-cols-2` | `lg:grid-cols-3`           |
| 产品展示      | `grid-cols-2`      | `sm:grid-cols-3` | `lg:grid-cols-4`           |
| 内容 + 侧边栏 | 单列（侧边栏收起） | 单列             | `lg:grid-cols-[256px,1fr]` |
| 左右两栏      | 单列               | 单列             | `lg:grid-cols-[1fr,1fr]`   |

### 间距模式参考

| 场景       | Mobile      | Desktop            |
| ---------- | ----------- | ------------------ |
| 区块之间   | `gap-8`     | `gap-12 lg:gap-16` |
| 卡片内部   | `p-4`       | `p-6`              |
| 列表项间距 | `space-y-4` | `space-y-6`        |

---

## 字体尺寸

使用 `clamp()` 实现流式字体，一套代码适配所有屏幕，不需要在每个断点单独写字号：

```css
/* globals.css — 不需要手动维护，直接用类名 */
.heading-1 {
  font-size: clamp(2.5rem, 5vw, 5rem);
} /* 40px → 80px */
.heading-2 {
  font-size: clamp(2.125rem, 4.2vw, 4rem);
} /* 34px → 64px */
.heading-3 {
  font-size: clamp(1.5rem, 2.5vw, 2rem);
} /* 24px → 32px */
.heading-4 {
  font-size: clamp(1.125rem, 1.5vw, 1.375rem);
} /* 18px → 22px */
.body-text {
  font-size: clamp(0.9375rem, 1.2vw, 1.125rem);
} /* 15px → 18px */
```

> 正文 ≥ 15px 是关键：低于此值 iOS Safari 会自动放大输入框（导致布局跳动）。

---

## 触控优先

### 最小触控区域

所有可点击/可聚焦元素，触控区域必须 ≥ 44×44px（WCAG 2.1 SC 2.5.5）：

```tsx
// ✅ 使用 min-h-touch min-w-touch Token
<button className="min-h-touch min-w-touch flex items-center justify-center p-2">
  <SearchIcon className="h-5 w-5" />
</button>

// ✅ 图标按钮用 IconButton 组件（内置 h-10 w-10）
<IconButton label="Search">
  <SearchIcon />
</IconButton>

// ❌ 触控区域不足
<button className="p-1">
  <SearchIcon className="h-4 w-4" />
</button>
```

### 禁止仅依赖 Hover

移动端没有 hover，所有关键交互必须有 click/tap 或键盘等效操作：

```tsx
// ❌ hover 唯一触发（移动端不可用）
<div className="group">
  <div className="invisible group-hover:visible">展开内容</div>
</div>;

// ✅ 用 click 控制状态
const [open, setOpen] = useState(false);
<div>
  <button onClick={() => setOpen(!open)}>展开</button>
  {open && <div>展开内容</div>}
</div>;
```

---

## 组件适配模式

### Header / Nav

| 状态   | 方案                            |
| ------ | ------------------------------- |
| `< md` | 汉堡菜单，点击展开全屏/抽屉菜单 |
| `≥ md` | 水平导航 + 下拉菜单             |

菜单展开时锁定 `body` 滚动（`overflow-hidden` on `body`）。

### 筛选面板

| 状态   | 方案                                        |
| ------ | ------------------------------------------- |
| `< lg` | 「Filters」按钮 → Sheet（从底部或侧边滑出） |
| `≥ lg` | 左侧固定侧边栏 + `sticky top-[73px]`        |

```tsx
// 推荐模式（由 lg: 断点切换）
<div className="lg:hidden">
  <Button onClick={openFiltersSheet}>Filters</Button>
  <Sheet>{/* FiltersPanel */}</Sheet>
</div>
<aside className="hidden lg:block w-64">
  <FiltersPanel />
</aside>
```

### 卡片 / 列表

- 移动端：图片宽度占满，文字在图片下方
- 桌面端：可切换为横向布局（图左文右）
- 图片统一用 `Next/Image` + `sizes` 属性声明响应式尺寸

```tsx
<Image
  src={src}
  alt={alt}
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### 弹层 / Sheet / Modal

- 移动端：从底部滑出（bottom sheet），比侧边抽屉更符合单手操作习惯
- 桌面端：侧边抽屉或居中 Modal
- 弹层内容区域设置 `max-h-[80vh] overflow-y-auto`，防止内容超出视口

---

## iOS 安全区

适用于有固定底部栏或全屏模式的页面：

```css
/* 固定底部 CTA 栏 */
.fixed-bottom-bar {
  padding-bottom: max(1rem, env(safe-area-inset-bottom));
}

/* 或用 Tailwind spacing token */
.fixed-bottom-bar {
  @apply pb-safe-bottom;
}
```

---

## 测试标准

每个新功能上线前，在以下视口宽度各检查一次：

| 宽度   | 代表设备                 |
| ------ | ------------------------ |
| 375px  | iPhone SE / 主流手机竖屏 |
| 768px  | iPad 竖屏                |
| 1024px | iPad 横屏 / 小桌面       |
| 1440px | 标准桌面                 |

**快速测试工具：**

- Chrome DevTools → Toggle device toolbar（快捷键 Ctrl+Shift+M）
- 选择 Responsive 模式，手动拖动宽度测试流畅度
