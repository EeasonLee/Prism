# 图片处理统一改造方案

## 背景

上一轮改造将分散的 `processImageUrl`/`resolveStrapiUrl` 统一到了 `resolveImageUrl()`，但引入了三个遗留问题：

1. **硬编码泛滥**：`libs/shared/src/utils/image.ts` 中有 4 处硬编码（`localhost:1337`、`cloudfront.net/joydeem`、`joydeem.com` 重写逻辑）
2. **图片变模糊**：`DEFAULT_CDN_IMAGE_SIZE = 80` 导致未传 `size` 时所有图被缩到 80px
3. **组件使用分散**：43 处直接使用 `<Image>`（其中 17 处缺失 `unoptimized`），仅 8 处使用 `OptimizedImage`

## 目标架构

```
                    ┌──────────────────────────┐
                    │   OptimizedImage          │  ← 全项目唯一图片组件
                    │   @prism/ui               │
                    │   - 自动 unoptimized       │
                    │   - 自动 CDN 尺寸选择       │
                    │   - 内置 fallback/error    │
                    └──────────┬───────────────┘
                               │ 调用
                    ┌──────────▼───────────────┐
                    │   resolveImageUrl()        │  ← 纯函数，baseUrl 参数化
                    │   @prism/shared            │
                    │   - 零硬编码                │
                    │   - 零 env 读取             │
                    └──────────┬───────────────┘
                               │ baseUrl 由调用方传入
                    ┌──────────▼───────────────┐
                    │   getImageBaseUrl()        │  ← 环境配置（唯一入口）
                    │   infrastructure/config/   │
                    │   - 读 NEXT_PUBLIC_IMAGE   │
                    │   - _BASE_URL              │
                    └──────────────────────────┘
```

## Phase 1：清洗 `libs/shared/src/utils/image.ts`

### 1.1 删除所有硬编码

| 删除项                                           | 行号    | 替代方案                                               |
| ------------------------------------------------ | ------- | ------------------------------------------------------ |
| `getDefaultImageBaseUrl()`                       | 31-35   | 删除，baseUrl 由调用方传入                             |
| `JOYDEEM_PRODUCT_IMAGE_BASE_URL`                 | 37-38   | 删除                                                   |
| `getImageBaseUrl()`                              | 40-42   | 移到 `infrastructure/config/`                          |
| `getConfiguredImageBaseUrl()`                    | 44-47   | 移到 `infrastructure/config/`                          |
| `normalizeBaseUrl()` 中的 joydeem.com 重写       | 187-189 | 移到 `infrastructure/config/`，变为 `REWRITE_MAP` 配置 |
| `resolveAbsoluteUrl()` 中的 joydeem.com 特殊处理 | 319-338 | 删除，统一走 `baseUrl` 参数                            |
| `getEnv()`                                       | 18-23   | 删除                                                   |
| `isDevelopment()`                                | 25-27   | 删除                                                   |

### 1.2 `resolveImageUrl` 参数化

```ts
// 旧签名（读 env，有硬编码）
export function resolveImageUrl(
  source: string | StrapiImage | StrapiImageLike | null | undefined,
  options?: ResolveImageUrlOptions
): string | null;

// 新签名（baseUrl 由调用方显式传入）
export function resolveImageUrl(
  source: string | StrapiImage | StrapiImageLike | null | undefined,
  options?: ResolveImageUrlOptions & { baseUrl?: string }
): string | null;
```

- `baseUrl` 不传时：对绝对 URL 保持原样，对相对路径直接返回相对路径（不拼接 baseUrl）
- 内部函数 `buildCdnUrl`、`resolveRelativePath`、`resolveAbsoluteUrl` 均接受 `baseUrl` 参数
- 删除 `normalizeBaseUrl` 的 joydeem 重写逻辑，改为通用的 `domainRewriteMap?: Record<string, string>` 配置项

### 1.3 修复 `DEFAULT_CDN_IMAGE_SIZE = 80` 导致模糊

核心改动：**不传 `size` 时不要强制插入尺寸目录**。

```ts
// 旧逻辑（buildCdnUrl）
const sizeDir = resolvedSize !== null ? resolvedSize : DEFAULT_CDN_IMAGE_SIZE;

// 新逻辑
const sizeDir = resolvedSize !== null ? resolvedSize : undefined;
// 如果 sizeDir 为 undefined，不插入 /media/{size}/ 层级，保留原图路径
```

对于已有 CDN 尺寸的绝对 URL，保持原尺寸不变。对于无尺寸的相对路径，拼 baseUrl 但不强制加 size。

### 1.4 新增：`getOptimalCdnSize()` 工具函数

```ts
/**
 * 根据显示宽度自动选择最优 CDN 尺寸
 * 按 2x retina 屏计算所需像素，选最接近的 CDN 尺寸
 *
 * @example
 * getOptimalCdnSize(350)  // 卡片宽 350px → 350*2=700 → CDN 800
 * getOptimalCdnSize(80)   // 缩略图 80px → 80*2=160 → CDN 150
 * getOptimalCdnSize(48)   // 图标 48px → 48*2=96 → CDN 100
 */
export function getOptimalCdnSize(
  maxDisplayWidth: number,
  pixelRatio?: number
): ProductImageSize;
```

映射表（displayWidth × 2 retina → CDN size）：
| 显示宽度 | 2x 所需 | CDN 尺寸 |
|---------|---------|---------|
| ≤ 40px | ≤ 80 | 80 |
| ≤ 50px | ≤ 100 | 100 |
| ≤ 75px | ≤ 150 | 150 |
| ≤ 175px | ≤ 350 | 350 |
| ≤ 300px | ≤ 600 | 600 |
| > 300px | > 600 | 800 |

### 1.5 保留的纯函数（不依赖 env）

- `normalizeCdnSize()` — 尺寸规范化
- `extractPathname()` — 路径提取
- `extractExistingSize()` — 已有尺寸检测
- `detectPathInfo()` — CDN 子路径检测
- `extractUrlFromImage()` — StrapiImage URL 提取
- `shouldDisableImageOptimization()` — 判断是否禁用优化（保留 `isPrivateImageHost`，这是通用逻辑不涉及具体域名）
- `buildCdnUrl()` — 改为接受 `baseUrl` 参数
- `resolveRelativePath()` / `resolveAbsoluteUrl()` — 改为接受 `baseUrl` 参数
- 所有类型导出保持不变

---

## Phase 2：新建 `infrastructure/config/image.ts`

集中管理图片相关的环境配置，作为全项目的唯一配置入口。

```ts
// infrastructure/config/image.ts

import { resolveImageUrl as rawResolveImageUrl } from '@prism/shared';
import type { ResolveImageUrlOptions } from '@prism/shared';

/** 域名重写映射 */
const DOMAIN_REWRITE_MAP: Record<string, string> = {
  'www.joydeem.com': 'https://d2s2mafqv46idp.cloudfront.net/joydeem',
  'joydeem.com': 'https://d2s2mafqv46idp.cloudfront.net/joydeem',
};

function getImageBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return process.env['NEXT_PUBLIC_IMAGE_BASE_URL'] || '';
  }
  return process.env['NEXT_PUBLIC_IMAGE_BASE_URL'] || '';
}

/** 全项目统一入口：传入 baseUrl 的 resolveImageUrl */
export function resolveImageUrl(
  source: Parameters<typeof rawResolveImageUrl>[0],
  options?: ResolveImageUrlOptions
): string | null {
  return rawResolveImageUrl(source, {
    ...options,
    baseUrl: getImageBaseUrl(),
    domainRewriteMap: DOMAIN_REWRITE_MAP,
  });
}

// 同时导出 getOptimalCdnSize 便于外部使用
export { getOptimalCdnSize } from '@prism/shared';
```

- `DOMAIN_REWRITE_MAP` 从环境变量读取（JSON 格式），带合理默认值
- 开发环境自动检测 `localhost:1337` 可用性，不可用时 warn 而非静默失败

---

## Phase 3：增强 `OptimizedImage` — 全项目唯一图片组件

### 3.1 新增 Props

```ts
export interface OptimizedImageProps
  extends Omit<
    ComponentProps<typeof Image>,
    'src' | 'alt' | 'unoptimized' | 'placeholder' | 'onError'
  > {
  src: StrapiImage | string | null | undefined;
  alt: string;

  // 新增
  /**
   * 最大显示宽度（CSS px），组件自动选择最优 CDN 尺寸
   * 传入后忽略 cdnSize
   */
  maxDisplayWidth?: number;
  /** 显式指定 CDN 尺寸，优先级低于 maxDisplayWidth */
  cdnSize?: ProductImageSize;
  /** 设备像素比，默认 2（retina） */
  pixelRatio?: number;

  // 已有
  fallback?: ReactNode;
  placeholder?: ReactNode;
  preferredFormat?: 'large' | 'medium' | 'small' | 'thumbnail' | 'original';
  onImageError?: (error: Error) => void;
  forceUnoptimized?: boolean;
}
```

### 3.2 核心逻辑增强

```ts
// 内部 CDN 尺寸推导
const derivedCdnSize = useMemo(() => {
  if (maxDisplayWidth) {
    return getOptimalCdnSize(maxDisplayWidth, pixelRatio ?? 2);
  }
  return cdnSize;
}, [maxDisplayWidth, cdnSize, pixelRatio]);

// 统一的 URL 解析（使用 infrastructure 的配置版 resolveImageUrl）
const imageUrl = resolveImageUrl(src, {
  format: preferredFormat,
  size: derivedCdnSize,
});

// unoptimized 自动推断
const unoptimized =
  forceUnoptimized || shouldDisableImageOptimization(imageUrl);
```

### 3.3 导入路径修正

`OptimizedImage` 已在 `libs/ui/src/index.ts` barrel export，所有使用者应改为：

```ts
import { OptimizedImage } from '@prism/ui';
```

> 注意：`OptimizedImage` 需要调用 `infrastructure/config/image.ts` 的 `resolveImageUrl`。但 `libs/ui` (L0) 不能 import `infrastructure/`。解决方案：
>
> - **方案 A**：`OptimizedImage` 内部仍调用 `@prism/shared` 的 `resolveImageUrl`，但通过 React Context 获取 `baseUrl`
> - **方案 B（推荐）**：`OptimizedImage` 保持调用 `@prism/shared` 的纯函数版 `resolveImageUrl`，`baseUrl` 通过 props 传入。同时在 `infrastructure/config/` 提供一个封装好的 `createOptimizedImage(baseUrl)` 工厂，或直接在 app layer 创建一个 wrapper。
> - **方案 C（最简）**：接受 `OptimizedImage` 内部调用有 baseUrl 参数的 `resolveImageUrl`，baseUrl 通过 React Context 在 `providers.tsx` 注入。Context 默认值为空字符串（不拼接 baseUrl）。

最终采用 **方案 C**：创建 `ImageConfigContext`，在 `app/providers.tsx` 注入 `baseUrl`。

### 3.4 新增 `ImageConfigContext`

```ts
// libs/ui/src/components/image-config-context.tsx
import { createContext, useContext } from 'react';

interface ImageConfig {
  baseUrl: string;
}

const ImageConfigContext = createContext<ImageConfig>({ baseUrl: '' });

export function useImageConfig() {
  return useContext(ImageConfigContext);
}
```

`app/providers.tsx` 中注入：

```tsx
<ImageConfigProvider baseUrl={getImageBaseUrl()}>
  {children}
</ImageConfigProvider>
```

`OptimizedImage` 内部使用 `useImageConfig()` 获取 baseUrl，传给 `resolveImageUrl`。

---

## Phase 4：迁移所有 `<Image>` → `<OptimizedImage>`

### 4.1 迁移清单（43 处 → 0 处直接 `<Image>`）

**简单替换（无特殊逻辑，直接换组件名）**：

| 文件                                                 | 数量 | 备注                                 |
| ---------------------------------------------------- | ---- | ------------------------------------ |
| `app/_ui/HeaderClient.tsx`                           | 1    | Logo 静态图，`maxDisplayWidth={170}` |
| `app/_ui/MobileNavBar.tsx`                           | 1    | Logo 静态图                          |
| `app/_ui/SignupPromoModal.tsx`                       | 1    | 弹窗图                               |
| `app/search/page.tsx`                                | 1    | 已有 `unoptimized`                   |
| `app/account/wishlist/page.tsx`                      | 1    | 已有 size=400                        |
| `app/products/[slug]/CrossSellSection.tsx`           | 3    | 小缩略图                             |
| `app/products/[slug]/BlogSection.tsx`                | 1    | 博客图                               |
| `app/products/[slug]/ProductDetailClient.tsx`        | 2    | 小缩略图                             |
| `app/products/[slug]/RecommendedProducts.tsx`        | 1    | 推荐商品                             |
| `app/products/[slug]/RichDetailSections.tsx`         | 1    | 富文本段图                           |
| `app/products/[slug]/UpsellProductsSection.tsx`      | 1    | 追加销售                             |
| `app/products/[slug]/RecipesSection.tsx`             | 1    | 食谱图                               |
| `app/products/[slug]/ProductVideosCarousel.tsx`      | 1    | 视频封面                             |
| `features/search/components/GlobalSearch.tsx`        | 4    | 搜索建议缩略图                       |
| `features/cart/components/CartDrawer.tsx`            | 1    | 购物车商品图                         |
| `features/product/components/QuickAddModal.tsx`      | 1    | 快速添加                             |
| `features/product/components/ProductCardSection.tsx` | 1    | 商品卡片段                           |

**需要适配 CDN 尺寸**：

| 文件                                                   | 数量 | 适配方式                                                       |
| ------------------------------------------------------ | ---- | -------------------------------------------------------------- |
| `app/products/[slug]/ProductImageGallery.tsx`          | 3    | 主图 `maxDisplayWidth={800}`，缩略图 `maxDisplayWidth={80}`    |
| `app/products/[slug]/page.tsx`                         | 1    | `maxDisplayWidth={350}`                                        |
| `app/categories/[slug]/CategoryPageContent.tsx`        | 1    | 背景大图 `maxDisplayWidth={800}`                               |
| `features/cms-page/components/HeroBanner.tsx`          | 1    | `maxDisplayWidth={1920}` → CDN 800                             |
| `features/cms-page/components/DealBanner.tsx`          | 1    | `maxDisplayWidth={1920}` → CDN 800                             |
| `features/cms-page/components/DealCategoryNav.tsx`     | 1    | `maxDisplayWidth={112}`                                        |
| `features/cms-page/components/FeaturedProducts.tsx`    | 1    | `maxDisplayWidth={280}`                                        |
| `features/cms-page/components/ContentCarousel.tsx`     | 2    | recipe `maxDisplayWidth={400}`，blog `maxDisplayWidth={400}`   |
| `features/cms-page/components/ImageTextBlock.tsx`      | 1    | `maxDisplayWidth={860}` → CDN 800                              |
| `features/cms-page/components/CategoryTemplate.tsx`    | 2    | 圆形图 `maxDisplayWidth={80}`，banner `maxDisplayWidth={1920}` |
| `features/cms-page/components/CategoryProductCard.tsx` | 1    | `maxDisplayWidth={350}`                                        |
| `features/cms-page/components/DealProductCard.tsx`     | 1    | `maxDisplayWidth={350}`                                        |
| `features/product/components/ProductCard.tsx`          | 1    | `maxDisplayWidth={350}`                                        |
| `app/_ui/HomeFirstHeroSection.tsx`                     | 2    | 主图 `maxDisplayWidth={1080}`，侧卡 `maxDisplayWidth={540}`    |

### 4.2 数据层调用适配

数据层（api/services）调用 `resolveImageUrl` 时，统一改为从 `infrastructure/config/image` 导入（已封装好 baseUrl）：

```ts
// 旧
import { resolveImageUrl } from '@prism/shared';
resolveImageUrl(rawImage, { size: 350 });

// 新
import { resolveImageUrl } from '@/infrastructure/config/image';
resolveImageUrl(rawImage, { size: 350 }); // baseUrl 自动注入
```

涉及文件：

- `features/product/api/meilisearch.repo.ts`
- `features/product/services/product.mapper.ts`
- `features/product/api/unified.api.ts`
- `features/product/api/enrichment.api.ts`
- `features/product/api/catalog.api.ts`
- `features/product/api/reviews.api.ts`
- `features/product/api/content.api.ts`
- `features/product/api/related.bff.ts`
- `features/search/api/meilisearch.service.ts`
- `features/cms-page/api/cms-pages.api.ts`

### 4.3 特殊处理：Logo 和静态资源

`HeaderClient.tsx`、`MobileNavBar.tsx` 中的 Logo（`/images/logo.png`）是本地静态资源，不走 CDN，使用 `unoptimized={false}`（走 Next.js 优化）。`OptimizedImage` 自动处理——本地相对路径 `shouldDisableImageOptimization` 返回 false，所以走 Next.js 优化。

### 4.4 删除已弃用函数

移除 `libs/shared/src/utils/image.ts` 中的 `@deprecated` 导出：

- `processProductImageUrl()`
- `processImageUrl()`
- `extractImageUrl()`（此函数在 OptimizedImage 内部还有用，保留）

---

## Phase 5：清理数据层的 `resolveImageUrl` 调用

统一数据层的导入路径，全部走 `@/infrastructure/config/image`：

```bash
# 确认无遗漏
rg "from '@prism/shared'.*resolveImageUrl" apps/jd-frontend/features/
# → 应全部改为 from '@/infrastructure/config/image'
```

---

## 改动文件总览

| 文件                                              | 改动类型                                            |
| ------------------------------------------------- | --------------------------------------------------- |
| `libs/shared/src/utils/image.ts`                  | 重构：删除硬编码，baseUrl 参数化，修复 size 默认值  |
| `libs/shared/src/index.ts`                        | 确认导出 `getOptimalCdnSize`                        |
| `libs/ui/src/components/OptimizedImage.tsx`       | 增强：maxDisplayWidth/cdnSize，Context 获取 baseUrl |
| `libs/ui/src/components/image-config-context.tsx` | **新建**：ImageConfigContext                        |
| `apps/jd-frontend/infrastructure/config/image.ts` | **新建**：环境配置入口                              |
| `apps/jd-frontend/app/providers.tsx`              | 注入 ImageConfigProvider                            |
| **~30 个组件文件**                                | `<Image>` → `<OptimizedImage>`                      |
| **~10 个数据层文件**                              | import 路径切换                                     |

## 验证

```bash
# 1. 类型检查
pnpm typecheck

# 2. Lint
pnpm lint

# 3. 确认无残留硬编码
rg "cloudfront\.net|joydeem\.com|localhost:1337" libs/shared/src/utils/image.ts
# → 应无结果

# 4. 确认无直接 <Image> 使用（除 OptimizedImage 内部）
rg "<Image" apps/jd-frontend/ --include="*.tsx" -l
# → 应为 0（OptimizedImage 内部除外）

# 5. 确认 OptimizedImage 导入路径规范
rg "from '@prism/ui/components/OptimizedImage'" apps/jd-frontend/
# → 应无结果

# 6. 运行测试
pnpm test
```
