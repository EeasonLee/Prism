# ADR-001: Magento + Strapi 商品数据融合架构

**状态：** 已接受  
**日期：** 2026-03-16  
**决策者：** 前端团队  
**相关 ADR：** 无

---

## 上下文

系统正从纯 Magento 架构向 Magento + Strapi + Next.js 混合架构迁移。核心需求：

- Magento 负责**核心电商字段**：SKU、价格、库存、商品类型、可配置选项
- Strapi 负责**内容管理字段**：图片（高质量）、展示标题、促销文案、富文本描述、SEO
- Next.js 前端需要**同时消费两侧数据**并统一渲染

关键约束：

- 两侧数据**更新频率差异大**：Magento 价格/库存需分钟级刷新，Strapi 内容可小时级缓存
- Strapi 服务不可用时，**商品页面必须仍可访问**（降级到 Magento 数据）
- 字段尚不明确，需要快速迭代验证

## 决策

**在 Next.js Server Components 层进行数据融合（而非 SSO 代理层）。**

采用 `sku` 作为两侧数据的联结键，在服务端组件中并发拉取两侧数据，合并后输出统一的 `UnifiedProduct` 类型给前端渲染。

## 理由

### 备选方案对比

| 维度         | SSO 代理层聚合            | **Next.js 层聚合（选定）**             |
| ------------ | ------------------------- | -------------------------------------- |
| 独立缓存 TTL | ❌ 统一缓存，无法差异化   | ✅ Magento 5min / Strapi 1h            |
| 服务降级     | ❌ 任一失败则整个响应失败 | ✅ Strapi 失败 → 展示 Magento 基础数据 |
| 迭代速度     | ❌ 修改字段需部署 SSO     | ✅ 只改 Next.js，无需动 SSO            |
| 类型安全     | ❌ 跨服务边界，类型丢失   | ✅ 端到端 TypeScript                   |
| 本地开发     | ❌ 需要 SSO 服务          | ✅ Mock 数据即可                       |
| 复杂度       | ❌ SSO 耦合两个业务系统   | ✅ SSO 只做认证/购物车代理             |

### 选定方案优势详解

**1. 差异化缓存（性能核心）**

```
Magento fetch → next: { tags: ['products'], revalidate: 300 }   // 5分钟
Strapi fetch  → next: { tags: ['product-enrichments'], revalidate: 3600 } // 1小时
```

价格库存变化 → 仅 invalidate `products` tag，不影响内容缓存。
Strapi 内容更新 → webhook 触发 `revalidateTag('product-enrichments')`。

**2. 优雅降级（稳定性核心）**

```typescript
// Strapi 失败只影响富文本字段，不影响商品可访问性
const enrichmentMap = await fetchProductEnrichments(skus).catch(
  () => new Map()
); // 失败返回空 Map，商品展示 Magento 基础数据
```

**3. 并发拉取（性能保障）**

```typescript
// 商品列表：Magento + Strapi 并发，不串行
const [productList, enrichmentMap] = await Promise.all([
  fetchProducts(params),
  fetchProductEnrichments(skus),
]);
```

服务端间调用延迟 < 10ms（同一 VPC/数据中心），并发拉取总延迟约等于较慢的那个。

## 数据融合策略

### 字段优先级

```
展示名称    = Strapi.display_name         ?? Magento.name
图片列表    = Strapi.images (如有)        ?: Magento.media_gallery
缩略图      = Strapi.thumbnail_url        ?? unified_images[0] ?? Magento.thumbnail_url
短描述      = Strapi.short_description_html ?? Magento.short_description
详情描述    = Strapi.description_html     ?? Magento.description
促销标签    = Strapi.promotion_label      （Magento 无此字段）
是否精选    = Strapi.is_featured          （Magento 无此字段）
价格/库存   = Magento（Strapi 不介入）
配置选项    = Magento（Strapi 不介入）
```

### 合并规则

- Strapi 字段**覆盖** Magento 对应字段（有则覆盖）
- Strapi 字段**补充**不存在于 Magento 的字段（如 promotion_label）
- Magento 核心商业字段（价格、库存、选项）**永远不被 Strapi 覆盖**

## 实施阶段

### Phase 1：Mock 跑通（当前）

- 定义 `UnifiedProduct` 类型和 `mergeProduct` 函数
- `fetchProductEnrichments` 返回空 Map（mock）
- 全链路代码跑通，UI 可渲染 `UnifiedProduct`

### Phase 2：字段设计

- 运行 `/api/admin/catalog-inspect` 分析真实 Magento 商品数据
- 根据实际字段设计 Strapi `product-enrichment` Content Type
- 人工导入少量测试数据验证 UI 展示效果

### Phase 3：同步管道

- `/api/sync/products`：Magento → Strapi upsert（增量同步，不覆盖已编辑内容）
- `/api/revalidate/products`：Strapi webhook → `revalidateTag`
- Meilisearch 商品索引同步

## 后果

### 正面影响

- Strapi 内容编辑不依赖 SSO 部署，迭代速度快
- 价格/库存缓存时间短、内容缓存时间长，性能和实时性兼顾
- Strapi 宕机不影响用户购物主流程

### 负面影响

- 每个商品页面发起 2 次服务端请求（Magento + Strapi）
  - **缓解**：Next.js fetch cache + ISR，大部分请求命中缓存
- 首次实现成本略高于单一数据源

### 需要采取的行动

- [x] ADR 文档撰写
- [ ] 实现 `unified-product.ts`（Phase 1 Mock）
- [ ] 更新所有商品相关 UI 组件接受 `UnifiedProduct`
- [ ] 设计 Strapi Content Type 字段（Phase 2）
- [ ] 实现同步管道（Phase 3）

## 文件结构

```
apps/prism/lib/api/
├── magento/
│   ├── catalog.ts          # Magento 商品 API（已有）
│   └── types.ts            # Magento 类型（已有）
├── strapi/
│   └── product-enrichment.ts  # Strapi 富文本 API（新增）
└── unified-product.ts         # 融合层：类型 + 合并函数（新增）

apps/prism/app/
├── shop/
│   ├── page.tsx            # 使用 fetchUnifiedProducts（修改）
│   ├── [categoryId]/page.tsx  # 使用 fetchUnifiedProducts（修改）
│   └── components/
│       └── ProductCard.tsx # 接受 UnifiedProduct（修改）
└── products/[sku]/
    └── page.tsx            # 使用 fetchUnifiedProductBySku（修改）
```
