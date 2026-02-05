# CMS 页面配置系统 · 开发实施指南

本文档在 [CMS Page.md](../CMS%20Page.md)（方案）与 [CMS Page QA.md](../CMS%20Page%20QA.md)（设计 Q&A）基础上，结合当前 Prism 项目结构，给出**可执行的开发清单与落位说明**。面向开发实施，不重复方案中的概念说明。

---

## 1. 现状与目标对齐

### 1.1 当前项目相关现状

| 模块     | 现状                                                          | 说明                                                           |
| -------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| 首页     | `app/page.tsx` 仅占位 "Hello World"                           | 待改为由 CMS Page Schema 驱动                                  |
| 布局     | `layout.tsx` 已含 Header + Footer                             | 保持不变，main 区域渲染 sections                               |
| 轮播     | `HeroCarousel.tsx` + `lib/api/carousel.ts`                    | 已有轮播组件与 Strapi 接口，可复用于 HeroBanner 或独立 Section |
| API 层   | `lib/api/client.ts` + server/client adapter                   | 支持 `next.revalidate`，已用 `STRAPI_API_TOKEN`                |
| 基础组件 | `libs/ui`：Button、Carousel、OptimizedImage、PageContainer 等 | Design System 基础层，Section 可依赖                           |
| 图片类型 | `libs/shared` / `apps/prism/lib` 已有 `StrapiImage`           | 与 Strapi 媒体兼容                                             |
| 路由     | 仅有 `/`、`/blog`、`/recipes` 等                              | 需增加首页 + 活动页（如 `/[slug]` 或 `/campaigns/[slug]`）     |

### 1.2 本阶段交付目标（MVP）

- **包含**：Page Schema 设计、6–8 个核心 Section、Strapi 页面配置能力、Next.js 按 Schema 渲染、首页 + 活动页落地。
- **不包含**：拖拽编辑器、自定义样式、页面级脚本注入、预览（可后续迭代）。

---

## 2. 与现有架构的映射

### 2.1 目录与职责

遵循 [directory-structure.md](../architecture/directory-structure.md)：

- **Page API（按 slug 拉取 Page）**：应用层，`apps/prism/lib/api/pages.ts`（或 `cms-pages.ts`），复用现有 `apiClient` + server adapter。
- **Domain Schema（Page / Section 类型与校验）**：应用层或共享层；若仅 CMS 页面使用，放在 `apps/prism/lib/api/` 下类型文件；若多应用复用，可考虑 `libs/shared`。MVP 建议放在 `apps/prism/lib/api/`。
- **Section 组件（HeroBanner、ProductCarousel 等）**：页面级模块，放在 `apps/prism/app/components/sections/`，与「页面特定 / 应用级组合」一致。
- **Block 注册表（blockMap）**：与页面渲染同处，即首页/活动页的 Server Component 内或同目录下的 `blockMap`/`renderSections` 工具。

### 2.2 三层 Schema 在本项目中的落位

| 层级              | 职责                                | 本项目落位                                                                                |
| ----------------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| **CMS Schema**    | Strapi 表单：字段、类型、枚举、说明 | Strapi 后台 Content-Type + Dynamic Zone 组件定义（非本仓库）                              |
| **Domain Schema** | 校验、版本冻结、防脏数据、解耦 CMS  | `apps/prism/lib/api/pages.ts` 或 `types/cms-page.ts` 中的 TypeScript 类型 + 可选 Zod 校验 |
| **React Props**   | Section 组件 API                    | 各 Section 组件文件内的 `interface XxxProps`                                              |

原则：**Strapi Schema ← Domain Schema ← React Props**，单向依赖；不因 Strapi 改字段而破坏 Domain/Props 约定，新能力用新 Section 版本（如 HeroBannerV2）。

### 2.3 数据流

```
Strapi (Page Content-Type, Dynamic Zone: sections)
  → GET /api/pages?slug=xxx 或 /api/cms-pages?slug=xxx（由后端/Strapi 提供）
  → apps/prism/lib/api/pages.ts 请求并返回 Page 数据
  → 首页/活动页 page.tsx 解析 sections → blockMap 映射 → 渲染 Section 组件
```

若 Strapi 尚未提供「按 slug 查单页」接口，需与后端约定接口形态，前端先定义 Domain Schema 与占位请求，再对接真实 endpoint。

---

## 3. 实施清单（按顺序可执行）

### 阶段一：Schema 与 API

- [ ] **3.1 Domain Schema 定义**
  - 在 `apps/prism/lib/api/` 下新增类型文件（如 `cms-page.types.ts` 或合并在 `pages.ts`）。
  - 定义：`Page`（id, slug, seo, sections, publishAt?, unpublishAt?）、`Section`（type, props, dataRefs?）、`SEO`。
  - 为第一期 6–8 个 Section 的 `type` 与 `props` 定义 TS 类型（HeroBanner, ImageTextBlock, ProductCarousel, PromoGrid, Countdown, FAQSection 等），与 [CMS Page.md](../CMS%20Page.md) 5.2 一致。
- [ ] **3.2 Page API**
  - 新增 `getPageBySlug(slug: string)`（或类似命名），请求 Strapi/后端「按 slug 获取单页」接口。
  - 使用现有 `apiClient.get`，服务端传入 `next: { revalidate: 60 }`（或按需配置），与 `carousel.ts` 用法一致。
  - 返回数据符合 Domain Schema；必要时在 API 层做一层转换（Strapi 响应 → Domain 类型）。
- [ ] **3.3 后端/Strapi 约定**
  - 确认 Content-Type：Page；字段：slug, seo, sections(Dynamic Zone), publishAt, unpublishAt。
  - 确认 Dynamic Zone 白名单与各组件字段；与 3.1 中类型一致。

### 阶段二：Section 组件与注册表

- [ ] **3.4 Section 组件目录**
  - 创建 `apps/prism/app/components/sections/`。
  - 每个 Section 一个文件（如 `HeroBanner.tsx`、`ProductCarousel.tsx`），Props 仅接收「该模块所需」字段，不接收整份 CMS 原始结构。
- [ ] **3.5 实现 6–8 个 Section**
  - HeroBanner、ImageTextBlock、ProductCarousel、PromoGrid、Countdown、FAQSection（与方案 5.2 对齐；可先做 4–5 个，再补全）。
  - 复用 `libs/ui` 的 Button/Carousel/OptimizedImage/PageContainer 等；图片统一用现有 Strapi 图片类型或 URL 字符串。
  - 文案、占位符、aria 等用户可见内容使用英文（符合项目规范）。
- [ ] **3.6 Block 注册表**
  - 在首页/活动页同目录或 `app/components/sections/` 旁，维护 `blockMap`：`Record<sectionType, React.ComponentType>`。
  - 渲染逻辑：`sections.map(section => { const Block = blockMap[section.type]; return Block ? <Block key={...} {...section.props} /> : null; })`，不做 `if (type === 'xxx')` 分支（见 [CMS Page QA.md](../CMS%20Page%20QA.md) Q5）。

### 阶段三：页面路由与渲染

- [ ] **3.7 首页**
  - 修改 `app/page.tsx`：`getPageBySlug('home')` 或约定首页 slug（如 `'/'` 对应 slug `'home'`），解析 `sections`，用 blockMap 渲染；无数据时保留简单占位或友好空状态。
- [ ] **3.8 活动页**
  - 新增路由，例如 `app/campaigns/[slug]/page.tsx` 或 `app/[slug]/page.tsx`（需避免与现有 `/blog`、`/recipes` 冲突）。根据 slug 调用 `getPageBySlug(slug)`，同样用 blockMap 渲染 sections。
  - 若 slug 与现有路由重叠，优先用 `/campaigns/[slug]` 或明确路由优先级规则。
- [ ] **3.9 SEO 与缓存**
  - 从 Page 的 `seo` 生成 `metadata`（title、description 等）；活动页用 `generateMetadata`。
  - 首页/活动页使用 ISR：在 fetch 或 getPageBySlug 中设置 `revalidate`（如 60）。

### 阶段四：联调与规范

- [ ] **3.10 与 Strapi 联调**
  - 使用真实 token（`STRAPI_API_TOKEN`）与接口，校验 sections 结构与枚举值；必要时做 Strapi 响应 → Domain 的字段映射。
- [ ] **3.11 文档与纪律**
  - 在代码或文档中注明：Section 版本化、禁止破坏性修改旧 Section、新增能力用新 Section 版本（见 QA Q12–Q15）。
  - 新 Section 在 blockMap 中注册；旧 Section 保持冻结，仅修 bug。

---

## 4. 文件/目录速查

| 用途             | 路径                                                                      |
| ---------------- | ------------------------------------------------------------------------- |
| Page API + 类型  | `apps/prism/lib/api/pages.ts`（及可选 `cms-page.types.ts`）               |
| Section 组件     | `apps/prism/app/components/sections/*.tsx`                                |
| Block 注册与渲染 | 首页/活动页内或 `app/components/sections/blockMap.tsx`                    |
| 现有 API 与 env  | `apps/prism/lib/api/client.ts`、`config.ts`、`env.ts`（STRAPI_API_TOKEN） |
| 基础组件         | `libs/ui`、`libs/shared`（StrapiImage 等）                                |

---

## 5. 设计原则（执行时遵守）

- **页面 = 结构化 Section 组合**：不做富文本自由排版、不开放自定义 CSS/HTML、不做拖拽画布（第一期）。
- **渲染层只做映射**：用 blockMap 按 `section.type` 渲染，不在页面或 Section 内写大量 `if (type === '...')` 或兼容历史脏数据。
- **Section 版本化**：新增能力用新组件（如 HeroBannerV2），旧版冻结；Strapi 侧对应新 Component，不修改旧 Component 结构。
- **单向依赖**：Strapi Schema ← Domain Schema ← React Props；Domain 为前端权威，不随 Strapi 随意改字段而破坏契约。

---

## 6. 参考资料

- 方案与模型：[CMS Page.md](../CMS%20Page.md)
- 设计 Q&A（Schema/版本/预览/三层职责）：[CMS Page QA.md](../CMS%20Page%20QA.md)
- 目录与模块边界：[directory-structure.md](../architecture/directory-structure.md)
- API 集成方式：[api-integration.md](./api-integration.md)
- 环境与 Strapi：[env-config.md](../env-config.md)

---

**文档维护**：实施过程中若新增 Section 类型、路由或 API 约定，请同步更新本清单与「文件/目录速查」表。
