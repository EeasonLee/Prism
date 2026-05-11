# 图片处理架构规范

> **定位**：本文档是项目图片处理的唯一权威标准，涵盖 URL 解析、CDN 尺寸策略、组件使用规范、数据流。

---

## 一、架构总览

```
原始图片源 (Magento / Strapi / 用户上传)
      │
      ▼
resolveImageUrl()          ← URL 解析 & CDN 域名重写 & 尺寸选择
      │
      ▼
OptimizedImage 组件        ← 渐进加载 (blur-up) & 错误回退 & CDN 尺寸匹配
      │
      ▼
next/image                 ← 格式优化 (AVIF/WebP) & 响应式图片
```

### 关键文件

| 文件                                              | 职责                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| `libs/shared/src/utils/image.ts`                  | 核心工具函数：`resolveImageUrl`、`getOptimalCdnSize`、`StrapiImage` 类型 |
| `libs/ui/src/components/OptimizedImage.tsx`       | 统一图片组件：blur-up、容错、CDN 尺寸自动选择                            |
| `libs/ui/src/components/image-config-context.tsx` | 图片配置 Context：提供 `baseUrl`                                         |
| `infrastructure/config/image.ts`                  | 基础设施层包装：注入环境配置                                             |
| `apps/jd-frontend/next.config.js`                 | `images.remotePatterns` 配置                                             |

---

## 二、CDN 尺寸策略

### 可用尺寸

```
80px → 100px → 150px → 350px → 800px
```

常量定义：`libs/shared/src/utils/image.ts` → `CDN_IMAGE_SIZES`

### 尺寸选择算法

`getOptimalCdnSize(maxDisplayWidth, pixelRatio)`：

```
1. maxDisplayWidth > 800 → 返回 null（使用原图）
2. requiredPx = maxDisplayWidth × pixelRatio  (默认 pixelRatio = 2)
3. 从小到大遍历 CDN_IMAGE_SIZES
4. 返回第一个 >= requiredPx 的尺寸
5. 都没有 → 返回 800（CDN 最大尺寸）
```

**示例**：

- 商品卡片 280px → 280≤800 → 280×2=560 → CDN **800**
- 博客卡片 510px → 510≤800 → 510×2=1020 → CDN **800**
- 缩略图 80px → 80≤800 → 80×2=160 → CDN **150**
- 全屏 Banner 1080px → 1080>800 → **null** → 原图

### 全屏 Banner 特殊说明

全屏 banner（`maxDisplayWidth > 800`）不会插入 CDN 尺寸，直接请求原图。因为 CDN 最大 800px 无法满足全屏显示所需分辨率。

### 默认行为

未声明 `maxDisplayWidth` 时，默认使用 CDN 800。因为 CDN 尺寸只有五档（80/100/150/350/800），retina 下任何 >175px 的组件都会命中 800，默认值覆盖了绝大多数卡片场景。

### 组件层声明规范

```tsx
// 卡片/常规图片：不需要 maxDisplayWidth，默认就是 CDN 800
<OptimizedImage sizes="(max-width: 768px) 50vw, 33vw" />

// 缩略图（≤175px 渲染宽度）：需要显式声明
<OptimizedImage maxDisplayWidth={80} sizes="80px" />

// 全屏 Banner：显式声明 > 800，走原图
<OptimizedImage maxDisplayWidth={1920} sizes="100vw" />
```

### 已知限制：350→800 断层

CDN 在 350px 和 800px 之间没有中间尺寸。retina (2x) 下，渲染宽度 176-400px 的所有组件都会命中 800 而不是更合适的中间档。待 CDN 侧支持 500/600 后可缓解。

---

## 三、OptimizedImage 组件

### 核心能力

1. **模糊渐进加载 (blur-up)**：
   - Strapi 对象（有 `formats.thumbnail`）：始终启用（零额外请求）
   - 纯 URL 字符串 + `priority`：启用（LCP 值得额外请求）
   - 纯 URL 字符串无 `priority`：**禁用**（避免浪费请求）
2. **CDN 尺寸自动选择**：依据 `maxDisplayWidth` + `pixelRatio` 匹配最优 CDN 尺寸，超限返回原图
3. **错误回退**：CDN URL 加载失败时，自动回退到原始 URL 重试
4. **`unoptimized` 自动判断**：外部 CDN URL 跳过 Next.js 优化（已预优化），本地/私有主机走 Next.js 优化
5. **WebP 自动转换**：CDN URL 自动追加 `.webp` 后缀，利用 CDN 格式转换（JPG/PNG → WebP），SVG/GIF 除外
6. **三态管理**：`loading` → `loaded` → `error`

### Props

| Prop               | 类型                            | 说明                                      |
| ------------------ | ------------------------------- | ----------------------------------------- |
| `src`              | `string \| StrapiImage \| null` | 图片源，支持 URL 字符串或 Strapi 图片对象 |
| `alt`              | `string`                        | 替代文本，必填                            |
| `fill`             | `boolean`                       | 是否使用 fill 模式                        |
| `width` / `height` | `number`                        | 非 fill 模式下的显式尺寸                  |
| `maxDisplayWidth`  | `number`                        | 最大显示宽度，用于 CDN 尺寸选择           |
| `pixelRatio`       | `number`                        | 设备像素比，默认 2                        |
| `sizes`            | `string`                        | 响应式 sizes 属性，fill 模式下必填        |
| `priority`         | `boolean`                       | 是否为 LCP 图片                           |
| `disableBlurUp`    | `boolean`                       | 强制禁用 blur-up 渐进加载（默认 false）   |
| `className`        | `string`                        | 额外样式                                  |
| `loading`          | `'lazy' \| 'eager'`             | 加载策略                                  |

### 使用模式

```tsx
// fill 模式（最常用）— 配合 aspect 容器 + sizes
<div className="relative aspect-square overflow-hidden">
  <OptimizedImage
    src={product.image}
    alt={product.name}
    fill
    maxDisplayWidth={280}
    sizes="(max-width: 768px) 50vw, 33vw"
    className="object-cover rounded-2xl"
  />
</div>

// 非 fill 模式 — 小尺寸固定图标
<OptimizedImage
  src={thumbnail.url}
  alt={item.name}
  width={48}
  height={48}
  className="h-12 w-12 shrink-0 rounded object-contain"
/>

// 首屏 LCP 图片
<OptimizedImage
  src={product.gallery[0]}
  alt={product.name}
  fill
  priority
  maxDisplayWidth={800}
  sizes="(max-width: 1024px) 100vw, 50vw"
  className="object-cover"
/>
```

### 错误态展示

组件内置错误态，`errorFallback` 和 `onError` 由业务决定是否传入。未传入时，错误态显示为透明占位（保持尺寸）。

---

## 四、图片 URL 解析（resolveImageUrl）

### 函数签名

```ts
function resolveImageUrl(
  source: string | StrapiImage | null | undefined,
  options?: ResolveImageUrlOptions
): string | null;
```

### 处理流程

```
输入 → 空值检查 → 格式提取 → 域名重写 → CDN 路径构造 → 输出
```

### 域名重写

通过 `NEXT_PUBLIC_IMAGE_DOMAIN_REWRITE_MAP` 环境变量配置（默认值在 `infrastructure/config/image.ts`）：

| 原始域名      | 重写后                                  |
| ------------- | --------------------------------------- |
| `joydeem.com` | `d2s2mafqv46idp.cloudfront.net/joydeem` |

### CDN 路径构造

根据 URL 路径自动识别子路径，构造 CDN URL。所有位图格式（JPG/PNG/BMP/TIFF）自动追加 `.webp` 后缀利用 CDN 格式转换，SVG/GIF 保留原格式。

| 原始路径特征        | CDN 路径                               | 用途         |
| ------------------- | -------------------------------------- | ------------ |
| `/catalog/product/` | `/media/{size}/catalog/product/{file}` | 商品图片     |
| `/amasty/review/`   | `/media/{size}/amasty/review/{file}`   | 评价图片     |
| `/pages/`           | `/media/{size}/pages/{file}`           | CMS 页面图片 |

> **WebP 规则**：JPG/PNG/BMP/TIFF → 自动加 `.webp`；已为 WebP/AVIF/SVG/GIF → 保持原格式。

### Strapi 格式回退

当 `source` 为 `StrapiImage` 对象时，自动选择最优格式：

```
formats.large → formats.medium → formats.small → formats.thumbnail → url
```

### 本地路径保留

以下路径直接返回，不做 CDN 重写：

- 以 `/images/` 开头的本地静态资源
- 以 `/_next/` 开头的构建产物
- `/favicon.ico`

---

## 五、商品图片数据流

```
Magento media_gallery ──┐
                          ├──→ UnifiedProductImage ──→ display-mapper ──→ ProductCard / PDP Gallery
Strapi enrichment ──────┘
```

### 类型定义

```ts
// Magento 原始数据
interface MagentoProductImage {
  id: number;
  media_type: string;
  label: string | null;
  position: number;
  disabled: boolean;
  types: string[];
  file: string;
  url: string;
}

// 统一中间类型
interface UnifiedProductImage {
  url: string;
  alt: string;
  width?: number;
  height?: number;
}
```

### PDP 图库（ProductImageGallery）

- 支持图片 + 视频混排
- 桌面：左侧纵向缩略图列表 + 右侧主图
- 移动端：底部横向滚动缩略图
- 主图使用 `priority` 标记 LCP
- 主图 `maxDisplayWidth={800}`、缩略图 `maxDisplayWidth={80}`

### 商品卡片（ProductCard）

各变体统一使用 `aspect-square` + `object-cover`（除 Grid 变体为 `aspect-[3/4]`）。图片通过 `resolveImageUrl` 预处理。

---

## 六、Strapi 图片处理

### StrapiImage 类型

```ts
interface StrapiImage {
  id?: number;
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
  formats?: {
    small?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    thumbnail?: { url: string; width: number; height: number };
  };
}
```

### CMS 页面的 Strapi 图片

CMS 页面组件通过 `resolveImageUrlFromStrapi()`（实际是 `resolveImageUrl` 别名）处理图片，统一通过 `NEXT_PUBLIC_IMAGE_BASE_URL` + CDN 重写。

---

## 七、外部域名配置（next.config.js）

### remotePatterns 规则

`apps/jd-frontend/next.config.js` 中的 `images.remotePatterns`：

| 类别         | 域名                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| CDN 生产     | `d2s2mafqv46idp.cloudfront.net`（路径: `/joydeem/**`）                         |
| Strapi 开发  | `localhost:1337`、`192.168.50.244:1337` 等（路径: `/uploads/**`、`/media/**`） |
| 环境变量注入 | 通过 `NEXT_PUBLIC_IMAGE_BASE_URL` 动态配置                                     |
| 通用回退     | `https://**`（通配符，允许任意 HTTPS 域名）                                    |

### 输出格式

```js
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns,
}
```

---

## 八、图片配置 Context

### ImageConfigContext

```tsx
// providers.tsx 中设置
<ImageConfigProvider baseUrl={NEXT_PUBLIC_IMAGE_BASE_URL}>
  {children}
</ImageConfigProvider>
```

`OptimizedImage` 内部通过 `useImageConfig()` 获取 `baseUrl`，用于相对路径解析。

---

## 九、特殊场景

### 评价图片（ReviewImagePreview）

评价图片已统一使用 `OptimizedImage`（2026-05-11 修复）。缩略图使用 `maxDisplayWidth={80}`，灯箱大图使用 `fill` + `sizes`。评价图片走独立 CDN 路径 `/amasty/review/`。

### 视频混排

`ProductImageGallery` 和 `ProductVideosCarousel` 支持视频与图片在同一容器中展示。视频使用 `<video>` 标签，由 Strapi enrichment 提供 `video_url`。

---

## 十、编写新图片代码检查清单

| #   | 检查项                                 | 规范                                             |
| --- | -------------------------------------- | ------------------------------------------------ |
| 1   | 使用 `OptimizedImage` 而非 `<img>`     | 禁止原生 `<img>`，全项目统一                     |
| 2   | `fill` 模式必须配 `sizes`              | 避免浏览器选择错误的图片尺寸                     |
| 3   | 缩略图/小图标声明 `maxDisplayWidth`    | ≤175px 渲染宽度需显式声明，默认 800 对大图已够用 |
| 4   | 全屏 Banner 设 `maxDisplayWidth > 800` | 走原图，绕过 CDN 尺寸限制                        |
| 5   | 父容器设置 `aspect-*`                  | 防止布局偏移（CLS）                              |
| 6   | 首屏大图加 `priority`                  | 优化 LCP + 启用 blur-up（仅 LCP 有 blur-up）     |
| 7   | 列表图片使用 `loading="lazy"`          | 延迟加载非首屏图片                               |
| 8   | 外部 URL 用 `object-cover`             | 裁剪适配固定比例容器                             |
| 9   | `alt` 不能为空                         | 无障碍访问要求                                   |

---

## 十一、版本历史

| 日期       | 版本 | 变更                                                                                                |
| ---------- | ---- | --------------------------------------------------------------------------------------------------- |
| 2026-05-11 | v1.2 | 默认 CDN 尺寸 800、ReviewImagePreview 改用 OptimizedImage、文档修正                                 |
| 2026-05-11 | v1.1 | Banner 原图策略（maxDisplayWidth > 800 → 原图）、CDN URL 自动 WebP、blur-up 收缩（仅 LCP + Strapi） |
| 2026-05-11 | v1.0 | 初始版本。确立 CDN 尺寸策略、OptimizedImage 组件规范、图片数据流、Strapi 图片处理规范。             |
