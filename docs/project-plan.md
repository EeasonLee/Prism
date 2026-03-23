# 跨境电商重构 — 项目计划书

> **目标**：逐步从纯 Magento 迁移到高性能跨境电商平台。
> **策略**：Magento 负责核心商务（订单、支付、库存）；Strapi 负责内容管理；SSO 负责认证聚合与 Magento 能力代理；Next.js 负责前端渲染，并逐步承担上层 BFF 聚合职责。
> **原则**：快速迭代验证，无前期产品原型 — 以 mock 商品详情页（`/products/JD-AF550`）作为字段参考。

---

## 系统架构

```
浏览器
  └── Next.js (apps/prism) — 前端渲染，BFF 候选
        ├── SSO (D:\WORK\Sso) — 认证 + Magento API 代理
        │     └── Magento 2.4.6 (https://magento.test) — 订单、支付、库存、购物车
        └── Strapi (D:\WORK\helpcenter\backend) — 内容、商品富文本、博客、食谱
              └── Meilisearch — 博客 + 食谱全文搜索
```

**数据关联键**：`sku`（Magento SKU = Strapi 商品富文本标识符）

---

## 当前完成情况

### 已完成 ✅

- SSO 对接了 Magento 购物车、分类、商品列表/详情、库存、客户同步
- 登录 → 加入购物车 → 跳转 Magento 结算页 全流程打通
- Magento + Strapi 商品数据融合（`lib/api/unified-product.ts`）
- Strapi 已完成商品分层基础建模：`magento-products`、`magento-categories`、`product-enrichments`
- `product-enrichments` 已具备基础商品维护字段，并扩展了主图、轮播图、角度图、视频、SEO、内容状态等内容字段
- Strapi 侧已存在直接从 Magento 拉取并写入本地模型的早期同步脚本，可作为现状参考，但尚未与当前系统边界统一
- Mock 商品详情页 `/products/JD-AF550` 作为参考原型，并已实现部分模块
- 博客和食谱已在 Strapi 中实现，并接入 Meilisearch 搜索

### 待完成 ⏳

- Magento → Strapi 正式同步方案收口（以 SSO / Strapi / Magento 官方字段为依据统一最终边界）
- 商品列表多维度筛选（分类、商品属性、价格等）
- 超级搜索（商品 + 博客 + 食谱全局搜索）

---

## 待决策问题

### Q1：BFF 架构选型

**问题**：Next.js 是否应该在保留 SSO 的前提下演进为上层 BFF（Backend for Frontend）？

**现状**：Next → SSO → Magento（同时 Next → Strapi）

**边界说明**：这里的 "Next 作为 BFF" 是指 Next 在服务端聚合 SSO + Strapi 的数据，统一向页面和客户端组件提供数据；不表示当前阶段由 Next 直接替代 SSO，也不表示默认改为 Next 直连 Magento。

**方案对比**：

- A）维持现状：SSO 作为 Magento 代理，Next 分别调用 SSO 和 Strapi
- B）Next 作为上层 BFF：保留 SSO 作为认证与 Magento 能力层，Next 服务端聚合 SSO + Strapi，向客户端暴露统一数据
- C）独立 BFF 服务：单独建一个聚合层服务

**建议**：方案 B — Next.js App Router 的 Server Components 天然适合作为上层 BFF。短期保持 `Next -> SSO -> Magento` 链路不变，由 Next 服务端并发调用 SSO + Strapi，将融合后的数据传给客户端组件，无需额外服务。

**迁移原则**：后续只评估是否将少量“页面聚合/展示编排”能力前移到 Next，不默认迁移认证、购物车、结算、客户态接口，也不默认让 Next 直接对接 Magento。

### Q2：Magento ↔ Strapi 数据同步

**问题**：如何保持 Strapi 中的商品/分类数据与 Magento 同步？

**现阶段判断**：`prism` 仍不应承担正式同步实现；但 `Strapi` 侧的双层模型已经完成基础落地，当前前置工作应调整为：

- 先调研 `SSO` 当前如何对接 Magento，确认已有商品/分类接口、返回字段与可复用同步能力
- 再结合 Magento 官方文档，梳理哪些字段属于核心商品字段，哪些只是当前脚本或代理层附加字段
- 基于已落地的 Strapi 模型，收口最终字段边界与同步方向

**候选方向**：

- A）SSO → Strapi 推送：由 SSO 读取 Magento 并推送到 Strapi
- B）Strapi 定时拉取：由 Strapi 定时从 SSO 拉取 Magento 数据并写入本地模型
- C）按需手动触发：仅作为开发期和联调用临时方案

**当前建议**：先不要预设 A 或 B。当前已确认 `SSO` 具备商品/分类 GraphQL 代理和库存 REST 代理两层能力，因此 1.1 阶段下一步应先结合 Magento 官方文档收口字段边界，再根据 `SSO` 的现有封装深度、定时任务能力、幂等/重试/日志实现成本来决定是“SSO 推”还是“Strapi 拉”。

---

## 任务拆分

### 阶段一：数据基础（优先级：高）

#### 1.1 Magento → Strapi 同步方案

- 调研 `D:\WORK\Sso` 当前 Magento 对接方式，确认商品/分类/库存接口、返回字段和可复用能力
- 结合 Magento 官方文档，整理商品核心字段候选清单，并与 SSO 当前 GraphQL / Inventory 接口字段做对照收口
- 在 Strapi 中完成双层模型基础落地：`magento-products` / `magento-categories` 作为 Magento 镜像层，`product-enrichments` 作为内容维护层
- 输出最终商品字段边界表：哪些字段同步到镜像层，哪些字段由 Strapi 维护，哪些字段由 Next 聚合展示
- 结合 `SSO` 现状与 Strapi 已有同步脚本，决定正式同步方向是“SSO 推送”还是“Strapi 定时拉取”
- 将现有手动/脚本同步能力收敛为开发联调工具，不作为正式生产方案

#### 1.2 商品详情页 — 完整打通 ✅

- 在 `product-enrichments` 中落地基础商品维护字段，并补充主图、轮播图、角度图、视频、SEO、内容状态等内容字段 （已完成）
- strapi 已实现 `/products/JD-AF550` mock 里面的部分模块
- 已完成：接入食谱模块。保留旧 `products -> api::product.product` 关系不动，在 `recipe` 中新增 `magento_products -> api::magento-product.magento-product` 关系，并通过 `GET /api/recipes/by-product-sku/:sku` 向 PDP 提供卡片数据
- 已完成：接入相关文章模块。保留旧 `products -> api::product.product` 关系不动，在 `article` 中新增 `magento_products -> api::magento-product.magento-product` 关系，并通过 `GET /api/articles/by-product-sku/:sku?locale=en` 向 PDP 提供卡片数据

### 阶段二：商品评价模块（优先级：高）✅

- 已完成：采用 Strapi 独立 `product-review` / `product-review-summary` 模型承接商品评价与汇总
- 已完成：Next.js 新增 `/api/reviews/[sku]` BFF 路由，支持登录用户提交评价
- 已完成：商品详情页接入真实评价列表、评分汇总与分页展示
- 已完成：评价默认以 `pending` 状态写入，并在 Strapi Admin 中通过 `review_status` 完成审批
- 暂未完成：`verified purchase` 仍为预留字段，一期未接 Magento 订单校验

### 阶段三：商品列表与筛选（优先级：高）

- 实现分类页 `/shop/[categoryId]`，接入真实 Magento 数据
- 多维度筛选面板：分类树、商品属性（尺寸、颜色）、价格区间
- 筛选状态管理（URL 参数，支持分享和收藏）
- 分页或无限滚动
- 排序选项（价格、最新、热度）
- 移动端响应式筛选抽屉

### 阶段四：超级搜索（优先级：中）

- 将商品数据接入 Meilisearch 索引（目前仅博客 + 食谱）
- 设计统一搜索结果类型（商品 | 文章 | 食谱）
- 实现全局搜索 API 接口
- 构建搜索 UI：统一结果展示，带类型标识
- 键盘导航、最近搜索、搜索建议

### 阶段五：BFF 整合（优先级：中）

- 评估当前 `Next -> SSO -> Magento` 调用链的性能与职责边界
- 将商品详情、分类页、搜索等页面级数据获取逐步收敛到 Next.js Server Components（服务端并发聚合 SSO + Strapi）
- 识别 SSO 接口中哪些属于“认证/交易能力”必须保留，哪些属于“页面聚合能力”可考虑前移到 Next
- 在不破坏现有登录、购物车、结算链路的前提下，评估是否需要补充 Next 的 BFF API Route 或 Server Action
- 整理并记录最终数据流架构，明确长期边界：SSO 保留认证与 Magento 能力代理，Next 负责上层聚合与页面编排

---

## 关键文件索引

| 功能                | 文件路径                                          |
| ------------------- | ------------------------------------------------- |
| 商品数据融合        | `apps/prism/lib/api/unified-product.ts`           |
| Magento API 客户端  | `apps/prism/lib/api/magento/client.ts`            |
| Strapi 商品富文本   | `apps/prism/lib/api/strapi/product-enrichment.ts` |
| Mock 商品详情数据   | `apps/prism/app/products/[sku]/mock-data.ts`      |
| 商品详情页          | `apps/prism/app/products/[sku]/page.tsx`          |
| 商品评价表单        | `apps/prism/app/products/[sku]/ReviewForm.tsx`    |
| 商品评价 BFF        | `apps/prism/app/api/reviews/[sku]/route.ts`       |
| 商品评价 Strapi API | `apps/prism/lib/api/strapi/reviews.ts`            |
| 商品分类列表页      | `apps/prism/app/shop/[categoryId]/page.tsx`       |
| 认证上下文          | `apps/prism/lib/auth/context.tsx`                 |
| 购物车上下文        | `apps/prism/lib/cart/context.tsx`                 |
| 环境变量配置        | `apps/prism/lib/env.ts`                           |

---

## 多项目路径

| 项目         | 路径                                   | 职责                |
| ------------ | -------------------------------------- | ------------------- |
| Next.js 前端 | `D:\WORK\prism`                        | 前端 + BFF          |
| Strapi CMS   | `D:\WORK\helpcenter\backend`           | 内容管理            |
| SSO 服务     | `D:\WORK\Sso`                          | 认证 + Magento 代理 |
| Magento      | `https://magento.test`（192.168.50.4） | 核心商务            |

---

_最后更新：2026-03-19_
