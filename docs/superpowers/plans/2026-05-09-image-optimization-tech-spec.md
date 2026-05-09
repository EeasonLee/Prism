# 图片渐进式加载优化 — 技术实施文档

> 状态：待实施 | 日期：2026-05-09 | 版本：v1.0
> 关联 PRD：`2026-05-09-image-optimization-PRD.md`

---

## 📋 摘要（给人看）

**改什么**：只改 `libs/ui/src/components/OptimizedImage.tsx` 一个文件，新增 blur-up 加载效果。

**怎么改**：

1. 新增 `resolveBlurSrc()` 函数——利用 CDN 80px 缩略图或 Strapi `formats.thumbnail` 生成占位图 URL
2. 新增加载状态机——`loading → loaded → error` 三态
3. 改造渲染层——双图叠加（底层模糊缩略图 + 顶层主图渐变）

**不改什么**：

- Props 接口完全兼容，40+ 处引用零改动
- `resolveImageUrl()` / `getOptimalCdnSize()` 等纯函数不动
- 错误处理、回退逻辑保留
- `next.config.js` 不动

**风险控制**：

- 所有改动在一个文件内，出问题直接 git revert
- 新增 `disableBlurUp` prop 可全局关闭
- 每个 URL 类型分支都有明确的 fallback 路径

---

## 1. 架构设计

### 1.1 组件内部模块化

```
OptimizedImage.tsx
│
├── [新增] resolveBlurSrc()
│   ├── 输入：StrapiImage | string | null | undefined
│   ├── 输出：string | null（80px 缩略图 URL 或 null）
│   └── 纯函数，零副作用
│
├── [新增] useImageLoadingState()
│   ├── 管理 loading → loaded → error 状态
│   ├── 监听 src 变化自动重置
│   └── 导出 { isLoading, isLoaded, hasError, markLoaded, markError }
│
├── [已有，不动] 现有逻辑
│   ├── resolveImageUrl() — 主图 URL
│   ├── shouldDisableImageOptimization() — unoptimized 判断
│   ├── error 回退 (useOriginalAbsoluteUrl)
│   └── fallback / placeholder 降级
│
└── [改造] 渲染部分
    └── 双图叠加容器
        ├── 缩略图层：<img> + CSS blur
        ├── 主图层：<Image> + opacity transition
        └── 错误层：fallback / DefaultPlaceholder
```

### 1.2 数据流

```
props.src
  │
  ├──→ resolveImageUrl() ──→ 主图 URL (existing)
  │
  ├──→ resolveBlurSrc()  ──→ 缩略图 URL | null (new)
  │
  └──→ useImageLoadingState() (new)
       │
       ├─ isLoading + blurSrc != null → 渲染模糊层
       ├─ isLoading + blurSrc == null → 主图 opacity:0
       ├─ isLoaded → 主图 fade-in
       └─ hasError → fallback
```

---

## 2. 详细设计

### 2.1 `resolveBlurSrc()` 实现逻辑

```ts
function resolveBlurSrc(
  src: StrapiImage | string | null | undefined,
  options?: { baseUrl?: string; preferredFormat?: string }
): string | null;
```

**决策树**：

```
src 是什么？
  │
  ├─ StrapiImage 对象
  │   ├─ formats.thumbnail?.url 存在 → 返回 thumbnail URL ★ 零额外请求
  │   ├─ formats.small?.url 存在    → 返回 small URL（次选）
  │   └─ 无 formats                 → 用 url 尝试 CDN 80px
  │
  ├─ 字符串（相对路径 /uploads/... 等）
  │   ├─ detectPathInfo() 可识别    → resolveImageUrl(src, { size: 80, baseUrl })
  │   ├─ /images/ 或 /_next/        → null（本地静态图）
  │   └─ 无法识别                   → null（无 CDN 路径，降级至 fade-in）
  │
  ├─ 字符串（完整 URL http://...）
  │   ├─ detectPathInfo() 可识别    → resolveImageUrl(src, { size: 80 })
  │   ├─ SVG (.svg 结尾)            → null
  │   └─ 外部域名                   → null（无法 CDN 尺寸处理）
  │
  └─ null / undefined               → null
```

**关键约束**：

- 函数必须是纯同步的（SSR safe）
- 所有 CDN 图片尺寸常量使用 `CDN_IMAGE_SIZES[0]`（=80），不硬编码
- 返回值 null 时，组件退化为纯 fade-in（不渲染缩略图层）

### 2.2 加载状态机

```ts
type ImageLoadingState = 'loading' | 'loaded' | 'error';

function useImageLoadingState(rawUrl: string | null): {
  state: ImageLoadingState;
  markLoaded: () => void;
  markError: () => void;
};
```

- `rawUrl` 变化时自动重置为 `'loading'`
- `markLoaded()` 由主图 `onLoad` 回调调用
- `markError()` 由主图 `onError` 回调调用
- 注意：这里只用原始的主图 URL 作为 key（`rawUrl`），不依赖 `resolvedImageUrl`（后者可能因 fallback 逻辑变化）

### 2.3 渲染结构

```tsx
// 伪代码结构
return (
  <div className="relative" style={containerStyle}>
    {/* 层1：模糊占位 */}
    {state === 'loading' && blurSrc && (
      <img
        src={blurSrc}
        alt=""
        aria-hidden="true"
        className={blurPlaceholderClasses}
        onError={() => setBlurSrc(null)} // 缩略图失败 → 静默移除
      />
    )}

    {/* 层2：主图 */}
    <Image
      src={resolvedImageUrl}
      alt={alt}
      className={cn(
        imageProps.className,
        'transition-opacity duration-400',
        state === 'loaded' ? 'opacity-100' : 'opacity-0'
      )}
      onLoad={markLoaded}
      onError={handleError}
      {...restImageProps}
    />

    {/* 层3：错误 fallback */}
    {hasError && (fallback || <DefaultPlaceholder />)}
  </div>
);
```

**CSS 类定义**：

缩略图层固定使用以下 Tailwind 类组合：

```
absolute inset-0 w-full h-full object-cover scale-110 blur-[20px]
transition-opacity duration-300
```

当 `state === 'loaded'` 时追加 `opacity-0`。

主图层：

```
transition-opacity duration-400 ease-in
opacity-0 → opacity-100 (state === 'loaded')
```

### 2.4 关键实现细节

#### 2.4.1 缩略图失敗静默处理

缩略图加载失败不应触发主图的 error 逻辑。用独立的 `onError` 处理：

```ts
// 缩略图失败 → 设置 blurSrc=null，组件自动退化为纯主图 fade-in
<img onError={() => setBlurSrc(null)} />
```

#### 2.4.2 与 `priority` 属性协作

`priority` 属性仅应用于主图 `<Image>`（已有行为不变），缩略图 `<img>` 不需要 priority——它是低优先级的辅助视觉。

#### 2.4.3 与 `fill` 模式协作

当使用 `fill` 模式时，父容器需要有明确的 `position: relative` 和尺寸。当前 `OptimizedImage` 在不是 fill 时不添加 wrapper，但 blur-up 需要 wrapper（双图叠加）。

**方案**：无论是否 fill，都添加一个 `relative` 的 wrapper div：

- fill 模式：wrapper 继承父级尺寸（已有的行为）
- 非 fill 模式：wrapper 尺寸由 `width/height` props 或图片自然尺寸决定

> ⚠️ **关键**：非 fill 模式下，wrapper 不能改变外部传入的 `width/height` 行为。需要把 `width`/`height` 传给 wrapper，或者用 `style={{ width, height }}` 设置 wrapper 尺寸。

#### 2.4.4 快速加载跳过模糊

如主图在 200ms 内完成加载（如浏览器缓存命中），跳过 blur 显示，直接展示清晰图。实现方式：

```ts
const [showBlur, setShowBlur] = useState(true);
useEffect(() => {
  const timer = setTimeout(() => setShowBlur(true), 150);
  return () => clearTimeout(timer);
}, [rawUrl]);
// 如果 150ms 内主图已 loaded，则 blur 层不显示
```

> 如果实现复杂可先跳过此优化，标记为 TODO。

#### 2.4.5 现有 `placeholder` prop 兼容

现有 `placeholder` 被重定义为 ReactNode（图片不存在时用），与 Next.js 的 `placeholder="blur"` 无关。保持这个语义不变。

---

## 3. 文件变更清单

| 文件                                        | 变更类型     | 说明                                                   |
| ------------------------------------------- | ------------ | ------------------------------------------------------ |
| `libs/ui/src/components/OptimizedImage.tsx` | 改造         | 核心改动：+resolveBlurSrc、+状态机、+双图渲染          |
| `libs/ui/src/index.ts`                      | 可能新增导出 | 如果新增了公开类型（如 `ImageLoadingState`），需要导出 |
| 其他 40+ 引用文件                           | **零变更**   | 接口完全兼容                                           |

---

## 4. 实施步骤

### Step 1：新增 `resolveBlurSrc()` 纯函数

在 `OptimizedImage.tsx` 文件顶部（组件外）定义，依赖现有的 `resolveImageUrl`、`detectPathInfo`（需要从 `@prism/shared` 导入或内联引用）。

实际上 `detectPathInfo` 是 `resolveImageUrl` 的内部函数，不对外导出。因此 `resolveBlurSrc` 的实现方式：

```ts
function resolveBlurSrc(
  src: StrapiImage | string | null | undefined
): string | null {
  if (!src) return null;

  // Strapi 对象：优先 thumbnail
  if (typeof src === 'object') {
    const thumbUrl = src.formats?.thumbnail?.url;
    if (thumbUrl) return thumbUrl;
    const smallUrl = src.formats?.small?.url;
    if (smallUrl) return smallUrl;
  }

  // 字符串：尝试用 resolveImageUrl({ size: 80 })
  // resolveImageUrl 已处理 CDN 路径识别，size: 80 即 CDN_IMAGE_SIZES[0]
  // ...
}
```

### Step 2：新增加载状态管理

用 `useState` + `useEffect` 实现轻量状态机，不引入额外依赖：

```ts
const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>(
  'loading'
);

useEffect(() => {
  setImageState('loading');
}, [rawUrl]);
```

### Step 3：改造渲染层

- 将外层从直接渲染 `<Image>` 改为 wrapper div + 两层图片
- 添加 CSS transition class
- 保留所有现有 props 透传

### Step 4：验证

依次运行：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

---

## 5. 测试矩阵

### 5.1 场景覆盖

| #   | 场景                       | 涉及文件                                                | 验证点                                            |
| --- | -------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| 1   | 首屏轮播（CDN 字符串 URL） | `HeroCarousel`                                          | blur-up 生效，首张 priority 正常                  |
| 2   | 首页 CMS 轮播              | `HeroBanner`, `DealBanner`                              | blur-up 生效，轮播切换正常                        |
| 3   | 商品卡片（lazy loading）   | `ProductCard`, `DealProductCard`, `CategoryProductCard` | 懒加载触发后 blur-up 生效                         |
| 4   | 商品详情主图               | `ProductImageGallery`                                   | blur-up 与现有切换动画不冲突                      |
| 5   | 商品图无图片（null src）   | 各处                                                    | fallback/DefaultPlaceholder 显示                  |
| 6   | Strapi 对象图片            | Blog `ArticleDetail`, Recipe `RecipeDetail`             | 正确提取 thumbnail                                |
| 7   | 外部 URL（非 CDN）         | Blog 搜索结果图                                         | 跳过 blur，正常显示                               |
| 8   | Logo 图片                  | `HeaderClient`, `MobileNavBar`                          | 不变，正常显示                                    |
| 9   | CMS 分类横幅               | `CategoryTemplate`                                      | 不变，正常显示                                    |
| 10  | 评論区缩略图               | `ReviewImagePreview`                                    | 注意：此文件用原生 `<img>`，不经过 OptimizedImage |

### 5.2 边界测试

| #   | 边界                          | 预期行为                              |
| --- | ----------------------------- | ------------------------------------- |
| 1   | 极慢网络（3G 模拟）           | 模糊缩略图持续显示直到主图加载完毕    |
| 2   | 快速网络 + 缓存命中           | 主图几乎瞬时显示                      |
| 3   | CDN 缩略图 404                | 静默移除缩略图层，仅主图 fade-in      |
| 4   | 主图 404（CDN 尺寸 URL 错误） | 回退到原始 URL，再失败则显示 fallback |
| 5   | src 频繁切换（轮播自动播放）  | 状态正确重置，无闪烁                  |
| 6   | SVG 图片                      | 跳过 blur，无异常                     |
| 7   | 本地 `/images/` 静态图        | 跳过 blur                             |

---

## 6. 风险控制

### 6.1 防御性编程

1. **缩略图加载失败** → 独立 `onError`，静默移除模糊层
2. **缩略图 URL 生成异常** → 所有分支都有 null 返回，回到纯 fade-in
3. **布局不变** → wrapper 尺寸由外部 props 控制，缩略图用 `absolute inset-0`
4. **状态一致性** → `rawUrl` 变化时重置所有状态

### 6.2 性能保障

- `resolveBlurSrc()` 是纯函数，SSR 安全，无水合不匹配
- 缩略图 `<img>` 不阻塞主图加载（浏览器并发请求）
- 不引入额外 JS bundle 依赖
- CSS 用 Tailwind utility class，不需要自定义 keyframes

### 6.3 回滚方案

```bash
git revert <commit-hash>
```

或通过环境变量开关（未来可选）：

```ts
// 可在 providers 层注入 disableBlurUp 全局关闭
<ImageConfigProvider value={{ disableBlurUp: true }}>
```

---

## 7. 实施线索补充

### 7.1 `detectPathInfo` 的访问

`detectPathInfo` 在 `@prism/shared` 的 `image.ts` 中是内部函数，未导出。`resolveBlurSrc` 可以通过调用 `resolveImageUrl(src, { size: 80 })` 来判断——如果返回值与输入不同且非空，说明 URL 被 CDN 处理了，可以使用该返回值作为 blurSrc。

简化方案：直接用 `resolveImageUrl(src, { size: 80 })` 的结果作为 blurSrc，如果返回值与主图 URL（同尺寸）相同则说明是外部 URL，返回 null。

### 7.2 主图 URL 与缩略图 URL 去重

如果 `resolveImageUrl(src, { size: 80 })` 返回的 URL 和主图的 `resolveImageUrl(src, { size: derivedCdnSize })` 相同（即主图本身也被要求用 80px），则不需要渲染缩略图层——直接等主图加载。

---

## 8. 附录：完整组件骨架（伪代码）

```tsx
'use client';

import Image from 'next/image';
import {
  useState,
  useEffect,
  useMemo,
  type ReactNode,
  type ComponentProps,
} from 'react';
import {
  resolveImageUrl,
  shouldDisableImageOptimization,
  getOptimalCdnSize,
  extractImageUrl,
  type StrapiImage,
  type ProductImageSize,
} from '@prism/shared';
import { useImageConfig } from './image-config-context';

// ─── 类型 ──────────────────────────────
type ImageState = 'loading' | 'loaded' | 'error';

export interface OptimizedImageProps
  extends Omit<
    ComponentProps<typeof Image>,
    'src' | 'alt' | 'unoptimized' | 'placeholder' | 'onError'
  > {
  src: StrapiImage | string | null | undefined;
  alt: string;
  fallback?: ReactNode;
  placeholder?: ReactNode;
  preferredFormat?: 'large' | 'medium' | 'small' | 'thumbnail' | 'original';
  onImageError?: (error: Error) => void;
  forceUnoptimized?: boolean;
  maxDisplayWidth?: number;
  cdnSize?: ProductImageSize;
  pixelRatio?: number;
  disableBlurUp?: boolean; // 新增可选 prop
}

// ─── 工具函数（新增）──────────────────

function resolveBlurSrc(
  src: StrapiImage | string | null | undefined,
  baseUrl?: string
): string | null {
  if (!src) return null;

  // Strapi 对象：直接用 thumbnail（已在 API 响应中）
  if (typeof src === 'object') {
    const thumbUrl = src.formats?.thumbnail?.url;
    if (thumbUrl) return thumbUrl;
  }

  // 字符串：尝试生成 80px CDN URL
  // resolveImageUrl 会自动处理 /images/、SVG、外部 URL 等回退场景
  const blurUrl = resolveImageUrl(src, { size: 80, baseUrl });

  // 如果生成的 80px URL 与不带 size 的 URL 相同 → 非 CDN 图片 → 跳过
  const originalUrl = resolveImageUrl(src, { baseUrl });
  if (blurUrl === originalUrl || !blurUrl) return null;

  // SVG 不 blur
  if (blurUrl.endsWith('.svg')) return null;

  return blurUrl;
}

// ─── 默认占位（已有，不动）────────────

function DefaultPlaceholder() {
  /* 保持不变 */
}

// ─── 主组件（改造）────────────────────

export function OptimizedImage({
  src,
  alt,
  fallback,
  placeholder,
  preferredFormat,
  onImageError,
  forceUnoptimized = false,
  maxDisplayWidth,
  cdnSize,
  pixelRatio,
  disableBlurUp = false,
  ...imageProps
}: OptimizedImageProps) {
  const { baseUrl } = useImageConfig();
  const [hasError, setHasError] = useState(false);
  const [useOriginalAbsoluteUrl, setUseOriginalAbsoluteUrl] = useState(false);

  // ── 新增状态 ──
  const [imageState, setImageState] = useState<ImageState>('loading');
  const [blurSrc, setBlurSrc] = useState<string | null>(null);

  // ── 已有逻辑（不变）──
  let rawUrl: string | null = null;
  if (typeof src === 'string') {
    rawUrl = src.trim() || null;
  } else if (src && typeof src === 'object') {
    rawUrl = extractImageUrl(src, preferredFormat);
  }

  const derivedCdnSize = useMemo(() => {
    if (maxDisplayWidth)
      return getOptimalCdnSize(maxDisplayWidth, pixelRatio ?? 2);
    return cdnSize;
  }, [maxDisplayWidth, cdnSize, pixelRatio]);

  const imageUrl = resolveImageUrl(src, {
    format: preferredFormat,
    size: derivedCdnSize,
    baseUrl,
  });

  // ── 新增：计算 blur URL ──
  useEffect(() => {
    if (disableBlurUp) {
      setBlurSrc(null);
      return;
    }
    setBlurSrc(resolveBlurSrc(src, baseUrl));
  }, [src, baseUrl, disableBlurUp]);

  // ── 状态重置 ──
  useEffect(() => {
    setHasError(false);
    setUseOriginalAbsoluteUrl(false);
    setImageState('loading');
  }, [rawUrl, imageUrl]);

  // ── 错误状态 ──
  if (!resolvedImageUrl || hasError) {
    if (hasError && fallback) return fallback as React.ReactElement;
    return (placeholder || <DefaultPlaceholder />) as React.ReactElement;
  }

  const unoptimized =
    forceUnoptimized || shouldDisableImageOptimization(resolvedImageUrl);
  const isLoading = imageState === 'loading';

  // ── 渲染 ──
  return (
    <div
      className="relative"
      style={{
        // 传递外部尺寸约束
        width: imageProps.fill ? undefined : imageProps.width,
        height: imageProps.fill ? undefined : imageProps.height,
      }}
    >
      {/* 模糊占位层 */}
      {isLoading && blurSrc && (
        <img
          src={blurSrc}
          alt=""
          aria-hidden="true"
          className={cn(
            'absolute inset-0 h-full w-full object-cover',
            'scale-110 blur-[20px]',
            'transition-opacity duration-300'
          )}
          onError={() => setBlurSrc(null)}
        />
      )}

      {/* 主图层 */}
      <Image
        src={resolvedImageUrl}
        alt={alt}
        unoptimized={unoptimized}
        className={cn(
          imageProps.className,
          'transition-opacity duration-400 ease-in',
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setImageState('loaded')}
        onError={handleError}
        {...imageProps}
      />
    </div>
  );
}
```
