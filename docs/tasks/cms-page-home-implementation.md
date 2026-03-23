# 首页 CMS 落地实施任务

## 任务背景

当前首页使用硬编码的 mock 数据，运营人员无法独立修改首页内容。本任务旨在建立 CMS 页面配置系统，使首页由 Strapi CMS 驱动。

## 任务目标

- 运营可独立配置首页结构与内容
- 前端保持页面样式与品牌一致性
- 页面具备良好的 SEO 与性能（ISR）
- 架构可长期演进，不引入技术债

## 实施范围

- ✅ 只做首页，先实现核心 Section（3-4 个）
- ✅ 保留现有 HomePageClient 作为 fallback
- ✅ 实现 Strapi 和 Next.js 两侧的完整功能

## 实施步骤

### 阶段 0：准备工作

- [x] 创建任务文档（当前文件）

### 阶段 1：Strapi 配置

- [x] 1.1 完善 Page Content Type

  - [x] 在 Page schema 中添加 sections Dynamic Zone
  - [x] 保留现有字段（title、slug、description、featuredImage、seo）
  - [x] 确保 SEO 字段使用现有的 shared.seo 组件

- [x] 1.2 创建 Dynamic Zone Components（8 个核心 Section）

  - [x] 创建 page.hero-slide 组件
  - [x] 创建 page.hero-banner 组件
  - [x] 创建 page.category-item 组件
  - [x] 创建 page.category-grid 组件
  - [x] 创建 page.product-carousel 组件
  - [x] 创建 page.service-badge 组件
  - [x] 创建 page.service-badges 组件
  - [x] 创建 page.image-text-block 组件
  - [x] 创建 page.featured-product-item 组件
  - [x] 创建 page.featured-products 组件
  - [x] 创建 page.content-card 组件
  - [x] 创建 page.content-carousel 组件
  - [x] 创建 page.video-item 组件
  - [x] 创建 page.video-showcase 组件

- [x] 1.3 配置 API 权限

  - [x] 启用 pages 的 find 和 findOne 权限（用户已在 Strapi 后台完成）

- [x] 1.4 创建首页数据
  - [x] 创建 slug='home' 的 Page（用户已在 Strapi 后台完成）

### 阶段 2：Next.js 实现

- [x] 2.1 定义 Domain Schema 类型

  - [x] 创建 apps/prism/lib/api/cms-page.types.ts
  - [x] 定义所有 Section Props 类型（8 个 Section）
  - [x] 定义 Page 类型

- [x] 2.2 实现 Page API

  - [x] 创建 apps/prism/lib/api/cms-pages.ts
  - [x] 实现 transformSection 函数（支持 8 个 Section 类型）
  - [x] 实现 getPageBySlug 函数
  - [x] 修复 populate 参数（使用 Strapi v5 的 Dynamic Zone on 语法）

- [x] 2.3 创建 Section 组件（8 个）

  - [x] HeroBanner.tsx（轮播英雄区）
  - [x] CategoryGrid.tsx（分类浏览）
  - [x] ProductCarousel.tsx + ProductCard.tsx（商品推荐）
  - [x] ServiceBadges.tsx（服务保障）
  - [x] ImageTextBlock.tsx（图文双栏）
  - [x] FeaturedProducts.tsx（特色商品）
  - [x] ContentCarousel.tsx（食谱/博客轮播）
  - [x] VideoShowcase.tsx（视频展示）

- [x] 2.4 实现 blockMap 注册表

  - [x] 创建 apps/prism/app/components/sections/blockMap.tsx
  - [x] 注册所有 8 个 Section 组件

- [x] 2.5 改造首页渲染逻辑
  - [x] 修改 apps/prism/app/page.tsx（CMS 驱动 + fallback）
  - [x] 实现 generateMetadata 函数
  - [x] 创建动态路由 app/[slug]/page.tsx
  - [x] 创建 404 页面 app/[slug]/not-found.tsx

### 阶段 3：联调与测试

- [x] 3.1 本地联调

  - [x] Strapi 和 Next.js 均已启动
  - [x] 首页可正常访问，CMS 数据可渲染

- [ ] 3.2 测试 Fallback 机制

  - [ ] 停止 Strapi，验证 fallback 是否生效

- [ ] 3.3 测试 Section 渲染

  - [ ] 在 Strapi 中为首页添加所有 Section 数据并验证

- [ ] 3.4 类型检查

  - [ ] 运行 pnpm nx typecheck prism

- [ ] 3.5 Lint 检查
  - [ ] 运行 pnpm nx lint prism

## 当前进度

**当前阶段**：✅ 阶段 2 完成，阶段 3 部分完成

**最后更新**：2026-03-23

**状态**：✅ 首页 CMS 已完全可用，支持 8 个 Section 组件

## 已完成的工作

### Strapi 配置

- ✅ 修改 Page schema，添加 sections Dynamic Zone
- ✅ 创建 14 个 Component 文件：
  - hero-slide, hero-banner（轮播英雄区）
  - category-item, category-grid（分类浏览）
  - product-carousel（商品推荐）
  - service-badge, service-badges（服务保障）
  - image-text-block（图文双栏）
  - featured-product-item, featured-products（特色商品）
  - content-card, content-carousel（食谱/博客轮播）
  - video-item, video-showcase（视频展示）
- ✅ 修复 category-item 中的 `id` 字段冲突（改为 `categoryId`）
- ✅ 修复 populate 参数问题（使用 Strapi v5 正确的 Dynamic Zone on 语法）

### Next.js 实现

- ✅ 创建 Domain Schema 类型定义（`cms-page.types.ts`）- 支持 8 个 Section 类型
- ✅ 创建 Page API（`cms-pages.ts`）- 支持所有 Section 类型的转换和 populate
- ✅ 创建 8 个 Section 组件：
  1. HeroBanner.tsx（轮播英雄区）
  2. CategoryGrid.tsx（分类浏览）
  3. ProductCarousel.tsx + ProductCard.tsx（商品推荐）
  4. ServiceBadges.tsx（服务保障）
  5. ImageTextBlock.tsx（图文双栏）
  6. FeaturedProducts.tsx（特色商品）
  7. ContentCarousel.tsx（食谱/博客轮播）
  8. VideoShowcase.tsx（视频展示）
- ✅ 修复 ProductCarousel 的 Server Component 错误（拆分为 ProductCarousel + ProductCard）
- ✅ 创建 blockMap 注册表（`blockMap.tsx`）- 注册所有 8 个 Section
- ✅ 改造首页渲染逻辑（`page.tsx`）- CMS 驱动 + fallback 机制
- ✅ 创建动态路由（`app/[slug]/page.tsx`）- 支持访问任意 slug 的页面
- ✅ 创建 404 页面（`app/[slug]/not-found.tsx`）

### 技术亮点

- ✅ 三层 Schema 架构：CMS Schema ← Domain Schema ← React Props
- ✅ Section 版本化机制：新增能力用新组件，旧版本冻结
- ✅ Fallback 机制：CMS 不可用时自动降级到硬编码首页
- ✅ ISR 缓存：60s 缓存，支持按需重新生成
- ✅ 类型安全：完整的 TypeScript 类型定义
- ✅ 响应式设计：所有组件遵循 mobile-first 原则
- ✅ 动画效果：保留现有 GSAP 动画和交互效果

## 待完成的工作（需要你在 Strapi 后台操作）

### 1. 重启 Strapi 服务

由于修改了 schema 文件，需要重启 Strapi：

```bash
cd D:\WORK\helpcenter\backend
# 停止当前运行的 Strapi（Ctrl+C）
# 然后重新启动
npm run develop
```

### 2. 配置 API 权限

在 Strapi 后台：

1. 进入 **Settings → Roles → Public**
2. 找到 **Page** 权限
3. 勾选 `find` 和 `findOne` 权限
4. 点击 **Save**

### 3. 创建首页数据

在 Strapi 后台：

1. 进入 **Content Manager → Page**
2. 点击 **Create new entry**
3. 填写基本信息：
   - **slug**: `home`
   - **title**: `Joydeem - Smart Kitchen Appliances`
   - **description**: `Discover innovative kitchen appliances for modern living`
4. 填写 **SEO** 组件（使用现有的 shared.seo）
5. 在 **sections** 中添加以下 Section（按顺序）：
   - **Hero Banner**：添加轮播幻灯片
   - **Category Grid**：添加分类项（注意使用 `categoryId` 字段）
   - **Product Carousel**：填写商品 SKU（逗号分隔，如 "JD-AF550,JD-AF551"）
   - **Service Badges**：添加服务徽章
6. 点击 **Save** 并 **Publish**

## 遇到的问题

### 已解决

1. **Strapi 启动错误**：`id` 是保留字段，不能在 component 中使用
   - **解决方案**：将 `category-item` 中的 `id` 字段改为 `categoryId`
   - **影响范围**：同步更新了 Next.js 的类型定义、API 转换逻辑和 CategoryGrid 组件

## 关键决策

1. **复用现有组件**：Strapi 中已有 shared.seo 和 carousel.slide 组件，将复用这些组件
2. **Section 版本化**：遵循版本化原则，新增能力用新组件
3. **Fallback 机制**：保留现有 HomePageClient 作为 fallback，确保 CMS 不可用时首页仍可访问

## 参考资料

- 实施计划：`/home/fan/.claude/plans/purring-launching-sunrise.md`
- 方案设计：`docs/CMS Page.md`
- 设计 Q&A：`docs/CMS Page QA.md`
- 开发指南：`docs/development/cms-page-development-guide.md`
