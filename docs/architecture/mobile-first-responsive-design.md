# Mobile-First Responsive Design 架构方案

## 一、目标与原则

### 1.1 目标

- **以移动端为基准**：先保证小屏（320px ～ 428px）布局、交互、性能达标，再通过断点向上适配 tablet / desktop。
- **全尺寸适配**：在 mobile / tablet / desktop 上布局不错乱、交互合理、可维护。
- **大厂标准**：设计系统统一、可访问性达标、性能与安全可控、开发与回归高效。

### 1.2 设计原则

| 原则             | 说明                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------- |
| **Mobile First** | 默认样式针对小屏写，再用 `sm:` / `md:` / `lg:` 增强大屏，避免「先写桌面再修移动端」。 |
| **单源设计系统** | 断点、间距、字号、触控尺寸等在 Tailwind / CSS 变量层统一，组件只引用 token。          |
| **触控优先**     | 可点击/可滑动区域满足最小触控尺寸（约 44×44px），避免 hover 唯一关键操作。            |
| **渐进增强**     | 核心功能在无 JS 或弱网下可用（如列表、链接、基础表单）；高级交互为增强。              |
| **安全与可维护** | 不引入不可控第三方脚本；组件职责清晰，便于单测与 E2E。                                |

---

## 二、现状简要分析

- **技术栈**：Next.js + React + Tailwind + `@prism/ui`（含 shadcn 系组件）。
- **已有基础**：部分组件已用 `sm:`/`md:`/`lg:`、移动端汉堡菜单、Pagination 的移动端简化显示；`PageContainer` 统一内边距与最大宽度。
- **主要问题**：
  - 断点使用不统一，存在「先桌面后移动」的写法。
  - 筛选面板（FiltersPanel）在移动端为侧边栏占位，缺少抽屉/全屏等更适合小屏的交互。
  - 部分文案/按钮仍为中文（如「清除全部」），需统一为英文以符合站点规范。
  - 未形成统一的断点与间距 token，不利于后续维护与设计协作。

---

## 三、架构分层

```
┌─────────────────────────────────────────────────────────────────┐
│  Page / Route (Layout 与页面级布局)                                │
├─────────────────────────────────────────────────────────────────┤
│  Feature Components (RecipesClient, Blog 列表/详情, Header, …)    │
├─────────────────────────────────────────────────────────────────┤
│  Design Tokens (断点、间距、字号、触控尺寸、z-index)               │
│  → Tailwind theme.extend + globals.css 变量                        │
├─────────────────────────────────────────────────────────────────┤
│  Primitives (PageContainer, Sheet/Drawer, TouchTarget, …)        │
│  → libs/ui 或 app/components 下的可复用组件                        │
└─────────────────────────────────────────────────────────────────┘
```

- **Design Tokens**：唯一真相源，所有响应式与主题都从这里来。
- **Primitives**：与业务解耦的布局/交互基元（如响应式容器、抽屉、触控友好按钮）。
- **Feature Components**：只使用 tokens + primitives，不散落魔法数字与重复断点逻辑。

---

## 四、设计 Token 规范（Tailwind + CSS 变量）

### 4.1 断点（与 Tailwind 默认对齐，便于团队记忆）

| Token | 宽度       | 用途              |
| ----- | ---------- | ----------------- |
| 默认  | &lt; 640px | 手机竖屏（基准）  |
| `sm`  | ≥ 640px    | 大手机/小平板横屏 |
| `md`  | ≥ 768px    | 平板竖屏          |
| `lg`  | ≥ 1024px   | 平板横屏/小桌面   |
| `xl`  | ≥ 1280px   | 桌面              |
| `2xl` | ≥ 1536px   | 大桌面（可选）    |

约定：**默认 class 写移动端，再按 sm → md → lg 顺序增强**。例如：

- 内边距：`p-4 md:p-6 lg:p-8`
- 栅格：`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- 显示/隐藏：`hidden md:flex`、`md:hidden`

### 4.2 间距与安全区

- **页面水平内边距**：统一用 `PageContainer`（内部已用 `px-4 sm:px-6 lg:px-[50px]`），避免各页面再写一套。
- **底部安全区**：若有固定底栏或 CTA，在 `globals.css` 中增加 `env(safe-area-inset-bottom)` 的 padding，避免与刘海/横条重叠。

### 4.3 触控与可访问性

- **最小触控尺寸**：按钮、导航项、筛选 chip 等至少约 **44×44px**（可用 `min-h-[44px] min-w-[44px]` 或封装为 `TouchTarget` 组件）。
- **焦点与高对比**：保持 `focus-visible:outline` 与现有 focus 样式，确保键盘与辅助技术可用。

在 **tailwind.config.js** 的 `theme.extend` 中可增加（可选）：

```js
// 示例：触控最小尺寸
minTouchTarget: '44px',
```

组件中统一使用 `min-h-[var(--min-touch)]` 或 `min-h-touch`（若在 theme 中定义）。

### 4.4 字号与行高（移动端可读性）

- 正文：移动端不小于 16px，避免 iOS 自动放大输入框。
- 标题层级：在 `globals.css` 或 typography 插件中统一 `h1`～`h4` 的 responsive 字号（例如 `text-2xl md:text-4xl` 等），避免各页面随意写。

---

## 五、关键交互与组件策略

### 5.1 全局布局

- **Header**：
  - 移动端：已有汉堡菜单 + 下拉菜单；保证 logo、菜单按钮、账户等触控区域 ≥ 44px；下拉展开时可考虑禁止 body 滚动（防止背景滚动）。
  - 桌面端：保持现有水平 nav + dropdown。
- **Footer**：
  - 当前已用 `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`，移动端单列即可；链接与文字保持可点、可读性良好。

### 5.2 Recipes 列表页

- **筛选（FiltersPanel）**：
  - **移动端**：不占左侧固定栏，改为「筛选」按钮 + **Sheet/Drawer**（从底部或侧边滑出），内部为 Accordion + Checkbox，与现有逻辑复用。
  - **Tablet/Desktop**：保持左侧 `lg:w-64` 固定栏 + sticky。
  - 实现方式：在 `RecipesClient` 中根据断点或容器宽度切换「内联侧栏」与「抽屉」两种展示；或使用同一 `FiltersPanel` 组件，由父级传入 `variant="sidebar" | "drawer"` 和抽屉状态。
- **搜索与排序**：
  - 移动端：搜索框全宽、按钮换行或与输入同行的现有做法可保留，确保按钮触控区域足够。
- **列表与分页**：
  - 列表已 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`，保持即可。
  - 分页已对移动端做简化（如「上一页 / 当前页/总页数 / 下一页」），可保留；必要时可再收拢「Show: 12/24/48」为下拉或底部 sheet 选择。

### 5.3 Recipes 详情页

- **Breadcrumb**：小屏可考虑单行省略或折叠为「Recipes > …」+ 当前页，避免换行错乱。
- **Hero 区**：已用 `grid gap-8 lg:grid-cols-[1fr,1fr]`，移动端单列；图片 `aspect-[7/5]` 与 `sizes` 已照顾移动端，保持即可。
- **正文两栏**：`lg:grid-cols-[0.8fr,1.6fr]` 在移动端单列；左侧 Ingredients 等在小屏可考虑折叠为 Accordion，减少首屏高度。
- **Prose 与图片**：`prose-img:w-full` 等已具备，确保无固定宽大图溢出视口。

### 5.4 Blog 与轮播

- **HeroCarousel**：移动端高度可适当降低（如 `h-[50vh] md:h-[600px]`），箭头/指示器触控区域加大。
- **Blog 列表/分类**：若存在多列卡片，与 Recipes 一致采用 `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` 等，并统一卡片内字号与内边距。

### 5.5 共享 UI 基元（建议落在 libs/ui）

- **PageContainer**：已存在，保持为「最大宽度 + 水平 padding」的唯一入口，如需安全区再在此扩展。
- **Sheet / Drawer**：用于移动端筛选、可选全局菜单等；可基于 Radix UI Dialog 或类似，实现从底部/侧边滑出、关闭时恢复 body 滚动。
- **TouchTarget**（可选）：包装按钮/链接，统一 `min-h-[44px] min-w-[44px]` 与 padding，便于无障碍与触控。

---

## 六、实施节奏建议（安全、可回滚）

### Phase 1：设计 Token 与规范（低风险）

1. 在 **tailwind.config.js** 的 `theme.extend` 中增加断点别名（若需）、`minTouchTarget`、以及可选的 spacing/radius 别名。
2. 在 **globals.css** 中增加 `--min-touch`、`--safe-area-bottom` 等变量（若用）。
3. 撰写 **响应式与无障碍 checklist**（见下节），放入 PR 或 Code Review 规范；新组件必须符合，旧组件在改动时逐步对齐。

### Phase 2：布局与全局组件

1. **Header/Footer**：按上述触控与安全区规范微调；如有中文文案改为英文。
2. **PageContainer**：确认所有页面都经此容器，并统一 padding；必要时增加 `fullWidth` 或 `withSafeArea` 等可选 prop。
3. **RecipesClient 布局**：在不改筛选逻辑的前提下，将「左侧栏 + main」改为移动端默认「仅 main」，为 Phase 3 的抽屉留好结构。

### Phase 3：筛选面板移动端交互

1. 在 **libs/ui** 引入或实现 **Sheet（Drawer）** 组件。
2. **FiltersPanel**：支持 `variant="sidebar" | "drawer"`；在 drawer 模式下内部结构复用现有 Accordion + Checkbox，仅外层由 Sheet 包裹。
3. **RecipesClient**：小屏显示「Filters」按钮，点击打开 Sheet；大屏保持左侧栏。可用 CSS 媒体查询或 `useMediaQuery`（如 `useBreakpoint('lg')`）切换，注意 SSR 时默认服务端与客户端一致（例如默认 desktop 布局，避免 hydration 闪烁）。

### Phase 4：详情页与 Blog 收尾

1. **RecipeDetail**：Breadcrumb 小屏省略/折叠；左侧 Ingredients 等在小屏可折叠。
2. **Blog**：列表与详情统一栅格与字号；轮播高度与触控区域按上述调整。
3. 全站扫一遍：中文文案 → 英文；aria-label 等为英文；焦点与对比度检查。

### Phase 5：文档与回归

1. 在 **docs/development** 下增加 **responsive-a11y-checklist.md**，并链接到 **code-organization** 或 **checklist**。
2. E2E：至少覆盖「移动端打开 Recipes → 打开筛选抽屉 → 选条件 → 列表更新」与「详情页滚动、点击面包屑」等关键路径；视需要上架真机或 BrowserStack。

---

## 七、响应式与无障碍 Checklist（摘要）

- [ ] 默认样式按移动端（&lt; 640px）编写，再用 `sm`/`md`/`lg` 增强。
- [ ] 可点击/可聚焦元素触控区域 ≥ 44×44px。
- [ ] 焦点可见（`focus-visible`），且不依赖仅颜色区分。
- [ ] 关键交互不依赖 hover 唯一（有 click/tap 或键盘可替代）。
- [ ] 文本与图标对比度符合 WCAG AA（含深色模式若有）。
- [ ] 弹层/抽屉打开时 body 滚动锁定；关闭时恢复。
- [ ] 用户可见文案与 aria 为英文，日期等使用 `en-US`。

---

## 八、风险与注意点

- **Hydration**：用 `useMediaQuery` 或 `window.innerWidth` 切换布局时，服务端与客户端初始状态要一致（如都用 `lg` 或都用移动布局），再在 `useEffect` 中根据实际宽度更新，避免闪烁或报错。
- **性能**：移动端优先意味着首屏 CSS/JS 要精简；大图用 `sizes` 与 Next Image 已具备，保持即可。
- **安全**：不引入不可信脚本；若有第三方嵌入，用 iframe + sandbox 或仅信任域。
- **回归**：每阶段合并前在 320px、375px、768px、1280px 各测一档；有条件的用 Lighthouse 与 axe 做可访问性与性能回归。

---

## 九、总结

- **设计层**：统一 Design Tokens（断点、间距、触控尺寸、安全区），Tailwind + CSS 变量单源。
- **组件层**：PageContainer、Sheet/Drawer、触控友好基元放在 libs/ui；业务组件只引用 token 与基元。
- **交互层**：移动端筛选用抽屉、列表/分页保持简洁触控；不依赖 hover 唯一。
- **流程层**：分阶段实施、每阶段可独立上线与回滚；Checklist 与 E2E 保证质量与安全。

按此方案执行，可以在「以移动端为准、适配全尺寸」的前提下，保持开发维护高效、行为可预期、且符合常见大厂前端标准。
