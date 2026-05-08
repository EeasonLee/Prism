---
name: 首页性能优化
description: 以首页为案例的系统性性能优化，分两阶段推进：基础补齐 + 深度优化，产出可推广到其他页面的优化模式
type: design
---

# 首页性能优化 PRD

## 一、背景与目标

### 1.1 现状

项目处于未上线阶段，具备在开发阶段系统性优化性能的窗口。

首页（`app/page.tsx`）是流量入口，渲染 11 种 section 组件，数据从 Strapi CMS 获取。当前已具备一定基础设施（统一 HTTP 管线、集中式 cache-policy、Web Vitals 采集），但存在若干性能隐患：

| 问题                             | 影响                                                      |
| -------------------------------- | --------------------------------------------------------- |
| `sharp` 未安装                   | 生产环境图片优化回退到 squoosh WASM，处理速度慢           |
| `@next/bundle-analyzer` 未安装   | 无法量化 JS 体积，优化无数据依据                          |
| `getPageBySlug('home')` 重复调用 | `generateMetadata` + page body 各一次，同一请求发两次     |
| 首页无 `loading.tsx`             | 数据加载期间用户看白屏                                    |
| 7 个 Client Component 全量加载   | 非首屏交互组件也在首屏 JS bundle 中                       |
| Strapi populate 拉全量字段       | 服务端查询慢，响应体积大                                  |
| 服务端数据获取模式不统一         | `createHttpClient` 管线 vs 原生 `fetch()`，缓存行为不一致 |
| Web Vitals 无持久化              | 内存 buffer，无法做优化前后数据对比                       |

### 1.2 目标

- **第一阶段**：补齐基础设施，消除已知的性能浪费，产出度量基线
- **第二阶段**：以首页为案例深度优化，产出优化前后数据对比，形成可推广模式

---

## 二、第一阶段：基础补齐

### 2.1 安装 sharp

**现状**：项目使用 `<Image>` from `next/image`（强制规范），但 `sharp` 未安装。Next.js 15 在生产构建时自动检测——有 `sharp` 就用原生 binding，没有就回退到 `squoosh` WASM。

**变更**：

```bash
pnpm add sharp
```

**验收**：`pnpm build` 输出中不出现 "sharp is not installed" 相关警告。

### 2.2 安装 @next/bundle-analyzer

**现状**：无 bundle 分析工具。

**变更**：

```bash
pnpm add -D @next/bundle-analyzer
```

在 `next.config.js` 中接入：

```js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(
  withNx({
    /* 现有配置 */
  })
);
```

**验收**：运行 `ANALYZE=true pnpm build` 可在浏览器查看 bundle 构成。

### 2.3 去重 getPageBySlug('home') 重复请求

**现状**：首页 `generateMetadata` 和 `Page()` 各自调用一次 `getPageBySlug('home')`，发出两次相同 HTTP 请求。

**问题所在**：

- `generateMetadata` 需要 SEO 数据（title、description、keywords、OG image）
- `Page()` 需要 sections 数组渲染页面
- 两次调用返回相同数据，但 Next.js 的 `fetch` 缓存去重只对**相同 URL + 相同 options** 生效，而 `strapi-server.ts` 使用原生 `fetch`，不经过 React 的 `cache()`

**方案**：使用 React 的 `cache()` 包裹 `getPageBySlug`，同一渲染周期内自动去重：

```ts
// features/cms-page/api/cms-pages.api.ts
import { cache } from 'react';

export const getPageBySlug = cache(async (slug: string) => {
  // ... 现有实现
});
```

**验收**：

- 首页渲染时对 `/api/pages?filters[slug][$eq]=home` 仅发一次请求
- 可通过 tracer 面板或服务端日志确认

### 2.4 补充首页 loading.tsx

**现状**：首页无 `loading.tsx`，Next.js 渲染 `page.tsx` 期间用户看到的是 layout 中的 Header/Footer 空白区域。

**变更**：新建 `app/loading.tsx`，和 `app/page.tsx` 同级：

```tsx
// app/loading.tsx
import { PageContainer } from '@prism/ui';

export default function HomeLoading() {
  return (
    <PageContainer>
      <div className="space-y-8 py-8 animate-pulse">
        {/* 骨架：模拟 Hero Banner 高度 */}
        <div className="bg-surface-muted rounded-lg h-[400px]" />
        {/* 骨架：模拟 Category Grid 行 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface-muted rounded-lg h-[120px]" />
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
```

**验收**：首页首次加载时先展示骨架屏，数据就绪后替换为真实内容。

### 2.5 Web Vitals 数据持久化

**现状**：`app/reportWebVitals.ts` 采集 Core Web Vitals（LCP、FID、CLS、FCP、TTFB、INP）写入内存 buffer，无持久化。

**变更**：在 `reportWebVitals.ts` 中增加本地文件写入支持（仅 `NEXT_PUBLIC_VITALS_WRITE=true` 时启用），输出 JSON 文件到 `.vitals/` 目录。

```ts
// 核心改动：在 reportWebVitals.ts 中追加
if (process.env.NEXT_PUBLIC_VITALS_WRITE === 'true') {
  // POST 到本地 API Route 写入 .vitals/ 目录
  fetch('/api/vitals', {
    method: 'POST',
    body: JSON.stringify(metric),
    keepalive: true,
  });
}
```

同时也需要建立 Lighthouse 基线（合成监控，与上面的 RUM Web Vitals 持久化是互补的两种测量方式）：

```bash
# 通过 lhci 采集本地 dev server 基线（另行安装: npm i -g @lhci/cli）
lhci collect --url=http://localhost:3000 --collectCount=3
```

**验收**：

- `NEXT_PUBLIC_VITALS_WRITE=true pnpm dev` 后访问首页，`.vitals/` 目录生成指标文件
- `lhci` 命令可输出 Lighthouse 基线报告

### 2.6 统一服务端数据获取模式（P2 预研）

**现状**：项目同时存在两种服务端 fetch 模式：

| 模式                               | 使用位置                                       | 缓存行为                                       |
| ---------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `createHttpClient` 管线            | `clients/strapi.ts`、`clients/magento.ts` 等   | ISR 通过 `ReqOptions.next` 手动指定            |
| 原生 `fetch()` + `serverRequest()` | `clients/strapi-server.ts`、`cms-pages.api.ts` | ISR 通过 `serverRequest` 的 `nextOptions` 参数 |

两套模式的问题：

- 原生 `fetch` 不走管线（无 retry、无 trace、无统一错误映射）
- ISR 参数的传递方式不同，容易遗漏
- `strapi-server.ts` 的 `serverRequest` 是薄封装，与 `createHttpClient` 的 Strapi 客户端功能重叠

**第一阶段行动**（不做大改造，仅摸底）：

1. 列出所有使用 `serverRequest()` 的调用点
2. 列出所有使用 `strapiClient`（管线版）的调用点
3. 评估合并可行性和风险

**产出**：一份"服务端数据获取模式统一方案"的评估文档，作为第二阶段正式改造的输入。

### 第一阶段产出物

| 产出                         | 说明                                     |
| ---------------------------- | ---------------------------------------- |
| sharp 已安装                 | `pnpm build` 无警告                      |
| @next/bundle-analyzer 已接入 | `ANALYZE=true` 可查看 bundle 报告        |
| getPageBySlug 已去重         | `cache()` 包裹，同渲染周期单次请求       |
| 首页 loading.tsx             | 骨架屏                                   |
| 服务端 fetch 模式摸底报告    | 列出两套模式的所有调用点，评估合并方案   |
| **Lighthouse 基线报告**      | 首页 FCP / LCP / TBT / CLS / Speed Index |
| **Bundle 体积基线报告**      | 首页 First Load JS 及各 chunk 大小       |

---

## 三、第二阶段：首页深度优化

### 3.1 服务端数据获取优化

#### 3.1.1 审查 Strapi populate 查询

**现状**：`getPageBySlug('home')` 的 populate 参数覆盖全部 11 种 section 的所有关联字段。Strapi 需要执行大量 relation join，响应体积大且查询耗时长。

**行动**：

1. 与后端（Strapi 管理员）确认 `home` 页面实际使用了哪些 section 类型
2. 检查 populate 中每个 `populate.*` 是否对应的 section 确实存在
3. 剔除未使用的 section 的 populate 字段（如 `deal-banner`、`deal-category-nav`、`deal-product-blocks` 是否在 home 中使用？）
4. 对必要的 populate 做字段裁剪（只选渲染需要的字段，不拉全量）

**预期收益**：服务端查询时间降低 30-50%。

#### 3.1.2 服务端组件商品查询延后

**现状**：`ProductCarousel` 和 `FeaturedProducts` 是 async Server Component，各自在渲染时通过 `productQueryFacade.queryBySkus()` 查询 Meilisearch。由于它们作为 page.tsx 子组件同步渲染，其 await 会阻塞整个 page 的响应流。

**方案**：将这两个组件包裹在 `<Suspense>` 中，使其异步渲染不阻塞页面主体：

```tsx
// page.tsx 中
<Suspense fallback={<ProductCarouselSkeleton />}>
  <ProductCarousel skus={carouselSkus} />
</Suspense>
<Suspense fallback={<FeaturedProductsSkeleton />}>
  <FeaturedProducts skus={featuredSkus} />
</Suspense>
```

这样 Strapi 页面数据可以先流式输出，商品数据随后补全。

**不在本次范围**：`enrichImageTextBlockConfig()` 的 Meilisearch 调用改造属于产品查询链优化，作为独立任务处理（见 4.3）。

#### 3.1.3 缓存策略审视

- 首页 `revalidate = 60s` — 对于 SEO 重要页面，60s 合理
- Strapi fetch `tags: ['cms-page:home']` — 已支持 on-demand revalidation
- `cache-policy.ts` 中的 `REVALIDATE_SECONDS_CMS_PAGE = 60` — 设计合理

**无重大调整。**

### 3.2 组件懒加载

**现状**：首页 11 个 section 组件中，7 个是 Client Component。它们全部同步 import，即使部分不在首屏。

**首屏判定**（以 1920×1080 视口，Hero Banner 高度 400px 为参考）：

| 组件                | 类型           | 首屏内？        | 推荐                                                             |
| ------------------- | -------------- | --------------- | ---------------------------------------------------------------- |
| `HeroBanner`        | Client         | 是              | 同步加载                                                         |
| `CategoryGrid`      | Client         | 是（紧接 Hero） | 同步加载                                                         |
| `ServiceBadges`     | Server         | 是              | 同步加载                                                         |
| `ProductCarousel`   | Server (async) | 可能            | `<Suspense>` 包裹（见 3.1.2）                                    |
| `FeaturedProducts`  | Server (async) | 否              | `<Suspense>` 包裹（见 3.1.2）                                    |
| `ImageTextBlock`    | Client         | 否              | `next/dynamic`                                                   |
| `ContentCarousel`   | Client         | 否              | `next/dynamic`                                                   |
| `VideoShowcase`     | Client         | 否              | `next/dynamic`                                                   |
| `DealBanner`        | Client         | 否              | `next/dynamic`                                                   |
| `DealCategoryNav`   | Client         | 否              | `next/dynamic`                                                   |
| `DealProductBlocks` | Client         | 否              | 已有 IntersectionObserver lazy load，组件本身也可 `next/dynamic` |

**变更**：在 `blockMap.tsx` 中将非首屏 Client Component 改为 `dynamic()` 导入：

```tsx
import dynamic from 'next/dynamic';

const ImageTextBlock = dynamic(() => import('./ImageTextBlock'));
const ContentCarousel = dynamic(() => import('./ContentCarousel'));
const VideoShowcase = dynamic(() => import('./VideoShowcase'));
const DealBanner = dynamic(() => import('./DealBanner'));
const DealCategoryNav = dynamic(() => import('./DealCategoryNav'));
const DealProductBlocks = dynamic(() => import('./DealProductBlocks'));
```

**注意**：

- `ProductCarousel` 和 `FeaturedProducts` 是 async Server Component，不能直接 `next/dynamic` import。改为通过 `<Suspense>` 包裹（见 3.1.2）
- 需要给每个 lazy 组件配置 loading fallback（防止布局跳动）

**预期收益**：首屏 JS 体积减少 40-60%。

### 3.3 大 Client Component 拆分

**现状**：多个 Client Component 混合了交互逻辑和静态内容渲染，增加水合成本。

**待拆分的组件**（按优先级顺序，至少完成 1 个）：

| 优先级 | 组件              | 问题                                          | 方案                                                         |
| ------ | ----------------- | --------------------------------------------- | ------------------------------------------------------------ |
| 1      | `CategoryGrid`    | 从 `/api/products` 客户端 fetch + tab 状态    | 拆分：Server 壳渲染静态结构 + Client 芯处理 tab 切换和 fetch |
| 2      | `HeroBanner`      | 轮播逻辑（useEffect、touch events）+ 静态内容 | 拆分：Server 壳渲染首屏 banner + Client 芯接管轮播           |
| 3      | `ContentCarousel` | 切换 Recipes/Blog tab                         | 与 CategoryGrid 类似，Server 壳 + Client 芯                  |

**变更模式**（以 `CategoryGrid` 为例）：

```tsx
// 后台数据在服务端获取，作为 prop 传入
// CategoryGrid.tsx → Server Component
// CategoryGridClient.tsx → Client Component（仅 tab 状态 + 客户端按需 fetch）
```

**预期收益**：减少水合 JS 体积，加快 TTI。

### 3.4 资源优化

#### 3.4.1 图片格式与尺寸

**现状**：已配置 `images.formats = ['image/avif', 'image/webp']`，返回现代格式。但未对 Hero Banner 等大图配置 `priority`。

**变更**：

- 首屏大图（Hero Banner、OG Image）添加 `priority` 属性
- 非首屏图片使用 `loading="lazy"`（Next.js 默认行为，确保没被覆盖）
- Strapi 返回的图片 URL 确保走 CDN（`images.remotePatterns` 已配置 CloudFront）

#### 3.4.2 预连接

**变更**：在根布局中添加关键源的预连接。实际域名从以下 env 变量获取：

| 源         | env 变量                                                                    | 用途                  |
| ---------- | --------------------------------------------------------------------------- | --------------------- |
| CDN / 图片 | `NEXT_PUBLIC_IMAGE_CDN_URL` 或 `images.remotePatterns` 中的 CloudFront 域名 | Hero Banner、商品图等 |
| Strapi     | `STRAPI_URL` 或 `NEXT_PUBLIC_API_URL`                                       | CMS 数据              |

```tsx
// app/layout.tsx 中根据 env 动态生成 preconnect
```

**注意**：仅在确认对应域名确实被首页关键资源使用时才添加 preconnect，避免浪费连接数。

#### 3.4.3 字体优化

**现状**：需检查当前字体加载策略。

**行动**：确认字体是否通过 `next/font` 加载（自动 `font-display: swap` + 子集化）。如果使用外部字体，迁移到 `next/font`。

### 3.5 统一服务端数据获取模式（P2 执行）

基于第一阶段摸底报告的结论，按以下决策框架选择方案：

**决策规则**：

- 若 `serverRequest()` 调用点 ≤ 5 个 → 合并到 `createHttpClient` 管线
- 若 `serverRequest()` 调用点 > 5 个但场景单一（纯 GET + ISR 无重试需求）→ 保持两套模式，输出规范文档
- 若 `serverRequest()` 调用点 > 5 个且场景复杂 → 排入后续迭代，本次不强行合并

**推荐方案**：将 `strapi-server.ts` 的 `serverRequest` 改为使用 `createHttpClient` 创建的 Strapi 客户端 + 在 `ReqOptions` 中传入 `next.revalidate` 和 `next.tags`。这样所有服务端请求统一走管线（retry、trace、错误映射、ISR 控制）。

**备选方案**：保持两套模式但规范各自的适用场景（如：`serverRequest` 仅用于简单的 GET + ISR；`strapiClient` 用于需要认证/重试/复杂错误处理的场景）。

### 第二阶段产出物

| 产出                         | 说明                                                   |
| ---------------------------- | ------------------------------------------------------ |
| Strapi populate 优化后的首页 | 查询字段裁剪，响应更快                                 |
| 组件懒加载方案               | 4-7 个非首屏组件使用 `next/dynamic`                    |
| 混合渲染方案                 | 2-3 个大 Client Component 拆分为 Server 壳 + Client 芯 |
| 资源优化                     | 首屏图片 `priority`、预连接、字体审查                  |
| 服务端 fetch 模式统一        | 合并 `serverRequest` → 管线客户端                      |
| **优化后 Lighthouse 报告**   | 与基线对比，量化提升                                   |
| **优化后 Bundle 报告**       | 与基线对比，量化提升                                   |

---

## 四、风险与约束

### 4.1 风险

| 风险                                 | 等级 | 缓解措施                                           |
| ------------------------------------ | ---- | -------------------------------------------------- |
| `next/dynamic` 导致 CLS              | 中   | 为 lazy 组件提供与真实组件等高的 skeleton fallback |
| Client/Server 拆分引入水合不一致     | 中   | 拆分后重点测试每个组件的首屏渲染匹配               |
| Strapi populate 字段裁剪导致 UI 缺失 | 低   | 与后端确认实际 section 使用情况后再裁剪            |
| `sharp` 安装后构建行为变化           | 低   | 本地 build 验证通过后再合并                        |

### 4.2 约束

- 不改变首页视觉设计，纯技术优化
- 不修改 Strapi 后端代码（合约不变，但可沟通 populate 字段裁剪建议）
- 所有改动在 `apps/jd-frontend/` 范围内
- Phase 2 的 3.5（统一服务端数据获取模式）若第一阶段摸底发现远超预期，可选降级为"规范文档"而非"全面合并"

### 4.3 不做的事

- 不引入第三方性能监控服务（项目未上线）
- 不修改 SSO / Magento 客户端（与首页性能无直接关联）
- 不做 CDN / 运维层面优化
- 不做大范围架构重构（如迁移到 RSC-only 模式）
- 不优化 `enrichImageTextBlockConfig` 的 Meilisearch 调用（属于产品查询链优化，应作为独立任务）

---

## 五、验收标准

### 第一阶段验收

- [ ] `pnpm add sharp` 后 `pnpm build` 无 sharp 相关警告
- [ ] `ANALYZE=true pnpm build` 可打开 bundle 分析页面
- [ ] `generateMetadata` + `Page()` 同渲染周期内 `getPageBySlug` 仅调用一次
- [ ] 首页首次加载时有骨架屏，不再白屏
- [ ] Lighthouse 基线报告已产出
- [ ] Bundle 基线报告已产出
- [ ] 服务端 fetch 模式摸底报告已产出

### 第二阶段验收

- [ ] Strapi populate 查询字段已裁剪（如有可裁剪项）
- [ ] 至少 3 个非首屏 Client Component 改为 `next/dynamic` 导入，且无布局跳动
- [ ] 至少 1 个大 Client Component 完成 Server/Client 拆分
- [ ] 首屏大图已添加 `priority`
- [ ] 关键源预连接已添加
- [ ] 字体加载策略已审查
- [ ] 服务端 fetch 模式统一方案已执行
- [ ] Lighthouse: LCP 相对基线**降低 20%+**
- [ ] Bundle: 首屏 JS 体积相对基线**减少 25%+**
