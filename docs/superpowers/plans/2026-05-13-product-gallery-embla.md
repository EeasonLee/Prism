# ProductImageGallery 改造为 Embla Carousel 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `ProductImageGallery` 从手写触摸/状态管理迁移到 `embla-carousel-react`，提升滑动体验和性能

**Architecture:** 使用 `useEmblaCarousel` hook 替换手写触摸手势和 activeIndex 状态管理。缩略图通过 `api.scrollTo()` 跳转，通过 `api.on('select')` 同步高亮。保留现有布局（桌面左侧竖栏 + 移动端底部横条）。

**Tech Stack:** embla-carousel-react ^8.6.0, React 19, next/image, OptimizedImage

**Spec:** `docs/superpowers/specs/2026-05-13-product-gallery-embla-design.md`

---

## 文件结构

| 文件                                                           | 操作     | 职责                       |
| -------------------------------------------------------------- | -------- | -------------------------- |
| `apps/jd-frontend/app/products/[slug]/ProductImageGallery.tsx` | **修改** | 唯一改动文件，替换内部实现 |

无需新建文件，无需修改调用方。

---

### Task 1: 初始化 Embla 并替换主图渲染

**Files:**

- Modify: `apps/jd-frontend/app/products/[slug]/ProductImageGallery.tsx`

- [ ] **Step 1: 添加 Embla import 并初始化 hook**

在文件顶部添加 `useEmblaCarousel` import，在组件内初始化：

```typescript
import useEmblaCarousel from 'embla-carousel-react';

// 在组件函数内：
const [emblaRef, api] = useEmblaCarousel({
  loop: false,
  align: 'start',
  containScroll: 'trimSnaps',
});
```

- [ ] **Step 2: 用 Embla 容器替换主图区域**

将现有的手写 opacity 切换逻辑替换为 Embla 的 slide 结构：

```tsx
{
  /* 主图 */
}
<div className="order-1 w-full lg:order-2 lg:flex-1">
  <div
    ref={mainMediaRef}
    className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-background"
  >
    <div ref={emblaRef} className="h-full">
      <div className="flex h-full">
        {mediaItems.map((item, idx) => (
          <div
            key={idx}
            className="relative min-w-0 shrink-0 grow-0 basis-full"
          >
            {item.type === 'image' ? (
              <OptimizedImage
                src={item.url}
                alt={item.alt}
                fill
                {...(idx === 0
                  ? { priority: true }
                  : { loading: 'lazy' as const })}
                maxDisplayWidth={800}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : item.type === 'video' && idx === activeIndex ? (
              <video
                src={item.url}
                poster={item.poster}
                className="h-full w-full object-cover"
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={`${productName} product video`}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
    {/* 箭头和 badge 保持不变 */}
  </div>
</div>;
```

- [ ] **Step 3: 用 api 同步 activeIndex**

替换手写的 `goTo` 函数，通过 Embla 事件同步：

```typescript
// 删除 goTo、handleTouchStart、handleTouchEnd
// 替换为：
useEffect(() => {
  if (!api) return;

  const onSelect = () => {
    setActiveIndex(api.selectedScrollSnap());
  };

  onSelect();
  api.on('select', onSelect);
  api.on('reInit', onSelect);

  return () => {
    api.off('select', onSelect);
    api.off('reInit', onSelect);
  };
}, [api]);
```

- [ ] **Step 4: 更新箭头按钮**

将 `onClick={() => goTo(activeIndex - 1)}` 改为 `onClick={() => api?.scrollPrev()}`，`onClick={() => goTo(activeIndex + 1)}` 改为 `onClick={() => api?.scrollNext()}`。`disabled` 条件改为 `!api?.canScrollPrev()` / `!api?.canScrollNext()`。

- [ ] **Step 5: 运行 typecheck 和 lint**

```bash
pnpm check
```

Expected: 0 errors（现有的 4 个 warning 不相关）

- [ ] **Step 6: 启动开发服务器验证基础功能**

```bash
pnpm dev
```

访问任意商品详情页，验证：

- 图片正确显示
- 鼠标拖拽可切换
- 左右箭头可切换
- 图片计数 badge 正确更新

- [ ] **Step 7: Commit**

```bash
git add apps/jd-frontend/app/products/\[slug\]/ProductImageGallery.tsx
git commit -m "refactor(product): 用 Embla Carousel 替换手写主图轮播"
```

---

### Task 2: 缩略图同步 + 变体切换重置

**Files:**

- Modify: `apps/jd-frontend/app/products/[slug]/ProductImageGallery.tsx`

- [ ] **Step 1: 缩略图点击跳转**

将缩略图按钮的 `onClick={() => goTo(idx)}` 改为 `onClick={() => api?.scrollTo(idx)}`。

- [ ] **Step 2: 变体切换时重置到第一张**

当 `images` props 变化时（变体切换），重置 Embla 到第一张：

```typescript
// 用 ref 记住上一次的 images 引用
const prevImagesRef = useRef(images);

useEffect(() => {
  if (prevImagesRef.current !== images) {
    prevImagesRef.current = images;
    api?.scrollTo(0);
  }
}, [images, api]);
```

- [ ] **Step 3: 保留缩略图高度同步**

确认 ResizeObserver 逻辑（同步缩略图栏高度为主图容器高度）仍然正常工作。Embla 容器使用 `h-full` 类，`mainMediaRef` 应该能正确获取高度。

- [ ] **Step 4: 运行 typecheck**

```bash
pnpm check
```

- [ ] **Step 5: 验证缩略图和变体切换**

在开发服务器中验证：

- 桌面端：点击缩略图，主图切换到对应图片
- 移动端：点击底部缩略图横条，主图切换
- 可配置商品：选择不同变体，画廊重置到第一张并显示变体图片
- 缩略图高亮跟随主图同步

- [ ] **Step 6: Commit**

```bash
git add apps/jd-frontend/app/products/\[slug\]/ProductImageGallery.tsx
git commit -m "feat(product): 缩略图同步和变体切换重置"
```

---

### Task 3: 键盘导航 + 清理

**Files:**

- Modify: `apps/jd-frontend/app/products/[slug]/ProductImageGallery.tsx`

- [ ] **Step 1: 添加键盘导航**

在主图容器上添加 `onKeyDown` 处理：

```typescript
const handleKeyDown = useCallback(
  (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      api?.scrollPrev();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      api?.scrollNext();
    }
  },
  [api]
);
```

在主图容器 div 上添加 `tabIndex={0}` 和 `onKeyDown={handleKeyDown}`。

- [ ] **Step 2: 清理不再需要的代码**

删除：

- `touchStartXRef` / `touchStartYRef` refs
- `handleTouchStart` / `handleTouchEnd` 函数
- 主图容器上的 `onTouchStart` / `onTouchEnd` props
- `goTo` 函数（已被 `api.scrollTo` / `api.scrollPrev` / `api.scrollNext` 替代）

- [ ] **Step 3: 运行完整检查**

```bash
pnpm check
```

- [ ] **Step 4: 最终验证**

在开发服务器中完整验证：

- 桌面端：鼠标拖拽、箭头点击、缩略图点击、键盘左右箭头
- 移动端：触摸滑动、缩略图横条跟随
- 可配置商品变体切换
- 视频 slide 播放/暂停
- 空图片状态显示占位 SVG
- 单张图片时不显示箭头和计数 badge
- 缩略图竖栏高度与主图同步（桌面端）

- [ ] **Step 5: Commit**

```bash
git add apps/jd-frontend/app/products/\[slug\]/ProductImageGallery.tsx
git commit -m "refactor(product): 添加键盘导航并清理手写触摸代码"
```

---

## 验证清单

- [ ] 桌面端：鼠标拖拽切换图片
- [ ] 桌面端：左右箭头按钮
- [ ] 桌面端：缩略图竖栏点击跳转
- [ ] 桌面端：键盘 ArrowLeft/ArrowRight
- [ ] 桌面端：缩略图竖栏高度与主图同步
- [ ] 移动端：触摸滑动
- [ ] 移动端：底部缩略图横条跟随高亮
- [ ] 可配置商品变体切换后画廊重置
- [ ] 视频 slide 正确播放
- [ ] 单张图片无箭头/无计数
- [ ] 空图片显示占位 SVG
- [ ] `pnpm check` 通过
- [ ] Lighthouse Performance 不下降
