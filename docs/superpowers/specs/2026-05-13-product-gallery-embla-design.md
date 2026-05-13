# 商品详情页轮播图改为 Embla Carousel

## 概述

将 `ProductImageGallery` 从手写触摸/状态管理实现迁移到 `embla-carousel-react`，提升滑动流畅度、减少维护成本，同时保持现有布局和交互。

## 动机

当前实现存在以下问题：

- 手写触摸手势（deltaX >= 40px 阈值），滑动体验不如原生
- 预渲染所有图片（CSS opacity 控制），图片多时内存占用高
- 自行管理 activeIndex、缩略图滚动同步、ResizeObserver 等，代码复杂

Embla Carousel 已在项目中使用（L0 Carousel 组件 + HeroCarousel），零新增依赖。

## 技术方案

### 选择：直接使用 embla-carousel-react（非 L0 Carousel）

L0 Carousel 组件有固定的 `-ml-4` 间距、按钮定位在 `-left-12/-right-12`，与产品画廊的布局差异大。直接使用 `useEmbla-carousel` hook 可完全控制样式和行为。

### 核心改动

**文件**：`apps/jd-frontend/app/products/[slug]/ProductImageGallery.tsx`（原地替换实现，不改接口）

#### 1. 主图区域 → Embla Carousel

- 用 `useEmblaCarousel({ loop: false })` 替换 `useState(activeIndex)` + 手写触摸
- Embla 内置惯性滑动、边界回弹、触摸/鼠标拖拽
- 只渲染 Embla 管理的 slide 元素（DOM 中保留活跃 + 相邻 slide）

#### 2. 缩略图同步

- 监听 `api.on('select')` 获取 `api.selectedScrollSnap()` 更新 activeIndex
- 缩略图点击调用 `api.scrollTo(index)` 跳转
- 保持 `scrollIntoView({ block: 'nearest' })` 自动跟随

#### 3. 图片加载策略

- 第一张图：`priority: true`（next/image 预加载）
- 其余图片：`loading="lazy"`（浏览器原生懒加载）
- Embla 的 overflow-hidden 保证非可见 slide 不在视口中，lazy 生效

#### 4. 视频支持（保留）

- 视频作为第一个 slide
- 仅当 video slide 为 active 时渲染 `<video>` 元素（避免多视频同时播放）

#### 5. 布局（不变）

- 桌面端：左侧缩略图竖栏（5rem） + 右侧主图
- 移动端：上方主图 + 下方缩略图横条
- 响应式断点：`lg:` (1024px)

#### 6. 图片 CDN 尺寸（不变）

- 主图：`resolveImageUrl(url, { size: 800 })`，`sizes="(max-width: 1024px) 100vw, 50vw"`
- 缩略图：`resolveImageUrl(url, { size: 150 })`，`sizes="80px"`

### 不改动

- Props 接口 `ProductImageGalleryProps`
- 调用方 `ProductDetailContent`
- `UnifiedProductImage` 类型
- 缩略图按钮结构和样式
- 空状态占位 SVG
- 图片计数 badge

## 依赖

- `embla-carousel-react`（已安装 ^8.6.0）
- 无新增依赖

## 验证

- 桌面端：鼠标拖拽切换、左右箭头、缩略图点击跳转
- 移动端：触摸滑动、缩略图横条跟随
- 可配置商品切换变体后画廊图片正确更新
- 视频 slide 正确播放、切换后暂停
- Lighthouse Performance 分数不下降
