实现商品详情页相关的 BFF API（Next.js App Router）

目标：
为商品详情页（PDP）提供完整数据接口，包括：

- 商品详情
- SKU 变体
- 实时库存
- 相关商品

技术栈：

- Next.js App Router（route.ts）
- TypeScript
- BFF 架构（禁止透传 Magento）
- 数据来源：
  - Magento GraphQL（商品详情 / variants）
  - Magento REST 或自定义（库存）
  - Meilisearch（相关商品，可选）

---

统一返回格式：

{
success: boolean,
data: any,
error: null | { code: string, message: string }
}

---

需要实现以下接口：

---

1️⃣ GET /api/products/:sku（商品详情）

返回结构：

{
id: number,
sku: string,
name: string,
description: string,
shortDescription: string,
price: number,
originalPrice: number,
currency: string,
images: string[],
inStock: boolean,
stockStatus: "IN_STOCK" | "OUT_OF_STOCK",
lowStock: boolean,
onlyXLeft?: number,
rating: number,
reviewCount: number,
categories: [
{ id: number, name: string }
],
isConfigurable: boolean
}

要求：

- 从 Magento GraphQL 获取数据
- 必须转换字段：
  - price_range → price
  - thumbnail/media_gallery → images[]
- 不允许返回 Magento 原始字段
- inStock 来自 stock_status
- description 使用 html
- 支持缓存（revalidate: 300）

---

2️⃣ GET /api/products/:sku/variants（变体）

返回：

{
options: [
{
code: string,
label: string,
values: [
{ label: string, value: string }
]
}
],
variants: [
{
sku: string,
attributes: Record<string, string>,
price: number,
inStock: boolean
}
]
}

要求：

- 支持 configurable product
- 从 Magento variants 转换
- attributes 结构扁平化
- 每个 variant 必须包含 inStock

---

3️⃣ GET /api/products/:sku/stock（实时库存）

返回：

{
sku: string,
inStock: boolean,
stockStatus: string,
qty: number,
onlyXLeft?: number,
isLowStock: boolean
}

要求：

- 不使用缓存或 TTL ≤ 10s
- 用于：
  - 加入购物车前校验
  - checkout 前校验
- 不允许从 GraphQL 获取（GraphQL 不提供 qty）
- 使用 REST 或自定义接口

---

4️⃣ GET /api/products/:sku/related（相关商品）

返回：

{
items: [
{
sku: string,
name: string,
price: number,
image: string,
inStock: boolean
}
]
}

实现方式：

- 优先使用 Meilisearch：
  - 基于 category / tags 推荐
- fallback：Magento related products

---

---

文件结构要求：

app/api/products/[sku]/route.ts
app/api/products/[sku]/variants/route.ts
app/api/products/[sku]/stock/route.ts
app/api/products/[sku]/related/route.ts

lib/services/magento/product.service.ts
lib/services/search/meilisearch.service.ts

lib/mappers/product.mapper.ts

---

架构约束（必须遵守）：

1. 不允许在 route.ts 写业务逻辑
2. 必须使用 mapper 层转换数据
3. 不允许返回 Magento 原始字段：

   - price_range
   - \_\_typename
   - uid

4. 必须将：
   - price 扁平化
   - images 数组化
   - stock 状态标准化

---

缓存策略：

- detail：revalidate 300
- variants：revalidate 300
- related：revalidate 120
- stock：不缓存（或极短缓存）

---

额外要求（重要）：

- variants 和 detail 必须数据一致（否则视为错误实现）
- stock 不能影响缓存数据
- 所有接口必须可独立调用

---

目标：

为商品详情页提供完整数据支持（Next.js /product/:sku 页面），
避免前端直接依赖 Magento GraphQL。
