# Design Tokens 手册

Token 是设计系统的语言。本文档解释每个 Token 的**语义**（什么时候用），Token 的**值**（具体颜色/大小）活在代码里，不在这里重复。

> 查看实际值：`apps/prism/app/globals.css` `:root { ... }` 段落

---

## 颜色 Token

### 品牌色（Brand）

| Token                | Tailwind 类               | 使用场景                         |
| -------------------- | ------------------------- | -------------------------------- |
| `--brand`            | `bg-brand` / `text-brand` | CTA 按钮、激活状态、强调徽章     |
| `--brand-foreground` | `text-brand-foreground`   | 放在 `bg-brand` 上的文字（白色） |
| `--brand-light`      | `bg-brand-light`          | 品牌色悬停背景、选中项浅色底     |

**使用原则：**

- `brand` 是视觉重心，每个屏幕区域内最多出现 1 ～ 2 次
- 悬停效果用 `hover:bg-brand/90`（90% 不透明度），而非另一个颜色
- 不要用 `brand` 替代所有橙色，只用于**可操作的主要入口**

```tsx
// ✅ 正确
<Button variant="brand">Shop Now</Button>
<span className="bg-brand text-brand-foreground rounded-full px-2">New</span>

// ❌ 错误 - 装饰性元素不应用 brand
<div className="border-brand">...</div>
```

---

### 墨水色（Ink）— 文字层级

| Token         | Tailwind 类      | 使用场景                       |
| ------------- | ---------------- | ------------------------------ |
| `--ink`       | `text-ink`       | 标题、正文主文字               |
| `--ink-muted` | `text-ink-muted` | 说明文字、元数据、副标题       |
| `--ink-faint` | `text-ink-faint` | 占位文字、禁用状态、分割线标注 |

**使用原则：**

- 文字层级必须严格遵守：标题 → `ink`，说明 → `ink-muted`，占位 → `ink-faint`
- 不要用 `gray-500` 等 Tailwind 灰色，统一用 `ink-*`

```tsx
// ✅ 清晰的文字层级
<h2 className="text-ink heading-2">Recipe Title</h2>
<p className="text-ink-muted body-text">15 min · Easy</p>
<span className="text-ink-faint micro-text">Optional</span>

// ❌ 混用 Tailwind 灰色
<p className="text-gray-600">说明文字</p>
```

---

### 背景色（Surface）— 界面层级

| Token             | Tailwind 类        | 使用场景                  |
| ----------------- | ------------------ | ------------------------- |
| `--surface`       | `bg-surface`       | 卡片背景、内容区米色背景  |
| `--surface-muted` | `bg-surface-muted` | Header、Nav、分割区域背景 |

**与 shadcn 系统的关系：**

| shadcn Token    | 含义             | 本项目对应        |
| --------------- | ---------------- | ----------------- |
| `background`    | 页面底色（白色） | 页面 `<body>`     |
| `card`          | 卡片背景（白色） | 纯白卡片          |
| `surface`       | 品牌米色背景     | 内容区 cream 背景 |
| `surface-muted` | 浅灰背景         | Header / Nav      |

```tsx
// ✅ 区分背景层级
<header className="bg-surface-muted">...</header>   // 浅灰 nav
<section className="bg-surface">...</section>        // cream 内容区
<div className="bg-background">...</div>             // 纯白页面底
<div className="bg-card">...</div>                   // 纯白卡片
```

---

### shadcn 语义色（系统级）

这些 Token 来自 shadcn/ui，用于组件内部状态，**不要覆盖，不要在业务代码里直接使用：**

| Token         | 场景                                 |
| ------------- | ------------------------------------ |
| `primary`     | 与 `brand` 对齐，Button default 变体 |
| `secondary`   | 次要按钮、标签                       |
| `muted`       | 禁用、次要背景                       |
| `accent`      | 悬停、选中高亮                       |
| `destructive` | 错误、危险操作（红色）               |
| `border`      | 分割线、输入框边框                   |
| `ring`        | 焦点环                               |

---

## 排版 Token

排版用**语义类名**，不用 Tailwind 的 `text-3xl` 等工具类。

### 标题系统（Montserrat 字族）

| 类名         | 字号范围                           | 场景                     |
| ------------ | ---------------------------------- | ------------------------ |
| `.heading-1` | `clamp(2.5rem, 5vw, 5rem)`         | 页面主标题（Hero 区）    |
| `.heading-2` | `clamp(2.125rem, 4.2vw, 4rem)`     | 区块标题（Section 标题） |
| `.heading-3` | `clamp(1.5rem, 2.5vw, 2rem)`       | 卡片标题、副标题         |
| `.heading-4` | `clamp(1.125rem, 1.5vw, 1.375rem)` | 小标题、侧边栏标题       |

**为什么用 `clamp` 而非断点：**
`clamp(min, preferred, max)` 在任意宽度下平滑缩放，不需要为每个断点写一个字号，维护成本极低。

### 正文系统（Inter 字族）

| 类名          | 字号范围                            | 场景                   |
| ------------- | ----------------------------------- | ---------------------- |
| `.body-text`  | `clamp(0.9375rem, 1.2vw, 1.125rem)` | 文章正文、产品描述     |
| `.micro-text` | `0.75rem` (固定)                    | 标签、元数据、版权信息 |

> 移动端正文最小 15px，符合 iOS 不自动放大的 16px 阈值。

### 使用规范

```tsx
// ✅ 用语义排版类
<h1 className="heading-1 text-ink">Discover Our Recipes</h1>
<h2 className="heading-2 text-ink">Featured Products</h2>
<p className="body-text text-ink-muted">Fresh ingredients...</p>
<span className="micro-text text-ink-faint">5 MIN READ</span>

// ❌ 禁止用 Tailwind 字号工具类
<h1 className="text-5xl font-bold">...</h1>
<p className="text-base leading-relaxed">...</p>
```

### 字体变量

```tsx
// 在组件中引用字体变量
<div className="font-heading">Montserrat 字族</div>
<div className="font-sans">Inter 字族（默认）</div>
```

---

## 间距 Token

### 触控最小尺寸

| Token | Tailwind 类   | 值   | 场景                     |
| ----- | ------------- | ---- | ------------------------ |
| —     | `min-h-touch` | 44px | 所有可点击元素的最小高度 |
| —     | `min-w-touch` | 44px | 所有可点击元素的最小宽度 |

**来源：** WCAG 2.1 Success Criterion 2.5.5，Apple HIG，Google Material。

```tsx
// ✅ 保证触控区域
<button className="min-h-touch min-w-touch flex items-center justify-center">
  <Icon />
</button>

// 或者用 IconButton 封装（已内置 h-10 w-10 = 40px，接近标准）
```

### iOS 安全区

用于有固定底部栏或全面屏设备的适配：

| Token | Tailwind 类      | 场景                      |
| ----- | ---------------- | ------------------------- |
| —     | `pb-safe-bottom` | 固定底部 Tab 栏、CTA 栏   |
| —     | `pt-safe-top`    | 全屏 Header（透明状态栏） |

```css
/* 在需要的组件中 */
.fixed-bottom-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 页面容器（不要直接用间距，用 PageContainer）

```
移动端：px-4   (16px)
平板：  px-6   (24px)
桌面：  px-[50px]
最大宽：max-w-[1720px] mx-auto
```

> 直接用 `<PageContainer>` 组件，不要手写这些值。

---

## 阴影 Token

| Token | Tailwind 类      | 场景                     |
| ----- | ---------------- | ------------------------ |
| —     | `shadow-card-sm` | 轻微悬浮感，卡片默认状态 |
| —     | `shadow-card`    | 标准卡片阴影             |
| —     | `shadow-card-lg` | 突出展示，弹层底层阴影   |

```tsx
// ✅ 用阴影 Token
<div className="rounded-lg shadow-card">卡片内容</div>

// ❌ 不要硬编码阴影
<div style={{ boxShadow: '0 18px 50px rgba(0,0,0,0.1)' }}>
```

---

## 圆角 Token

shadcn/ui 圆角系统，基于 `--radius` CSS 变量：

| Token      | Tailwind 类  | 值                 |
| ---------- | ------------ | ------------------ |
| `--radius` | `rounded-lg` | 0.5rem (8px)       |
| —          | `rounded-md` | calc(0.5rem - 2px) |
| —          | `rounded-sm` | calc(0.5rem - 4px) |

全圆角（pill 形态）用 `rounded-full`，适用于 Badge、品牌按钮。

---

## 动效 Token

| 场景             | 推荐写法                            |
| ---------------- | ----------------------------------- |
| 颜色/背景过渡    | `transition-colors duration-200`    |
| 位移/缩放        | `transition-transform duration-200` |
| 全量过渡（慎用） | `transition-all duration-200`       |
| 悬停上移         | `hover:-translate-y-0.5`            |
| 弹性感           | `active:scale-95`                   |

**注意：** 系统设置了 `prefers-reduced-motion` 全局覆盖，减少动画用户不会看到过渡效果，无需在每个组件单独处理。

---

## Token 完整速查

```
颜色 Token
├── brand           CTA 按钮、强调
├── brand-foreground 品牌色上的文字
├── brand-light     品牌色浅背景
├── ink             主文字
├── ink-muted       次要文字
├── ink-faint       占位/禁用文字
├── surface         内容区背景（米色）
├── surface-muted   Header/Nav 背景（浅灰）
└── [shadcn 系统色] background/card/border/ring...

排版类
├── heading-1 ~ heading-4  标题（Montserrat）
├── body-text               正文（Inter）
└── micro-text              小号标签（Inter）

间距/尺寸
├── min-h-touch / min-w-touch  触控最小尺寸（44px）
└── safe-top/bottom/left/right  iOS 安全区

阴影
└── shadow-card-sm / card / card-lg

字体族
├── font-sans     Inter（正文）
└── font-heading  Montserrat（标题）
```
