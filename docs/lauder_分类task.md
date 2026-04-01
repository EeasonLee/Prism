# 🧠 一、总 Prompt（直接复制给 Claude Code）

```text
你是一个资深 Node.js / Next.js 工程师，正在重构一个 Magento + Next.js 项目的 BFF 层。

目标：
重构 /shop 页面相关的 BFF API，使其符合标准电商架构（categories + products + filters 分离），不再透传 Magento 原始数据。

参考现有代码风格：
/www/Sso/src/services/magento-cart.service.ts

要求：
- 使用 TypeScript
- 使用 Next.js App Router（route.ts）
- 使用 service 层调用 Magento GraphQL
- 使用 mapper 层进行数据转换（禁止返回 Magento 原始结构）
- 返回统一格式：
  {
    success: boolean,
    data: any,
    error: null | { code: string, message: string }
  }

禁止：
- 不允许直接返回 Magento GraphQL 原始字段
- 不允许使用 additionalProperties: true
- 不允许 JSON.stringify 手动返回

缓存：
- 使用 fetch + revalidate（60s）
- 后续可扩展 Redis（先预留结构）

现在实现分类相关 API：
```

---

# 🚀 二、分类 API Prompt（重点）

---

## ✅ 1️⃣ 分类树 `/api/categories`

```text
实现 GET /api/categories

数据来源：
Magento GraphQL categoryList / category tree

返回结构（必须转换）：
[
  {
    id: number,
    name: string,
    urlKey: string,
    children: Category[]
  }
]

要求：
- 递归处理 children
- 只保留必要字段（id, name, urlKey）
- 不返回 uid / path / raw Magento 字段
- 支持缓存（revalidate: 3600）

实现文件：
- app/api/categories/route.ts
- lib/services/category.service.ts
- lib/mappers/category.mapper.ts
```

---

## ✅ 2️⃣ 分类详情 `/api/categories/:id`

```text
实现 GET /api/categories/:id

参数：
- id: number

数据来源：
Magento GraphQL category

返回结构：
{
  id: number,
  name: string,
  description: string,
  image: string,
  productCount: number
}

要求：
- description 取 html
- image 转为完整 URL
- 不返回 Magento 原始字段
- 支持缓存（revalidate: 300）

实现文件：
- app/api/categories/[id]/route.ts
- service + mapper
```

---

## ✅ 3️⃣ 面包屑 `/api/categories/:id/breadcrumbs`

```text
实现 GET /api/categories/:id/breadcrumbs

返回结构：
[

    id: number,
    name: string,
    url: string
  }
]

数据来源：
Magento category breadcrumbs

要求：
- 转换为前端可用结构
- url 使用 /category/:urlKey
```

---

# 🧩 三、必须一起做（否则 /shop 跑不起来）

👉 Claude 必须同时实现 👇

---

## ✅ 4️⃣ 商品列表（分类页核心）

```text
实现 GET /api/products

支持参数：
- categoryId
- page
- limit
- sort
- filters（color / size / price）

数据来源：
Magento GraphQL products

返回结构：
{
  items: [
    {
      sku,
      name,
      price,
      image,
      inStock
    }
  ],
  pagination: {
    page,
    total,
    totalPages
  }
}

要求：
- price 从 price_range 转换
- image 从 thumbnail.url 提取
- inStock 从 stock_status 转换
```

---

## ✅ 5️⃣ filters（分类页左侧）

````text
实现 GET /api/products/filters

 先预留之后单独对接meilisearch

---

# ⚠️ 四、关键约束（必须加给 Claude）

👉 这一段非常关键，一定要放进去：

```text
关键约束：

1. /products 和 /products/filters 必须使用完全相同的 query 参数（categoryId / filters / q），否则视为错误实现

2. 不允许返回 Magento 原始字段，例如：
   - price_range
   - __typename
   - uid

3. 必须实现 mapper 层进行数据转换

4. 所有接口必须支持缓存（revalidate）

5. 代码结构必须清晰：
   - services 负责调用 Magento
   - mappers 负责数据转换
   - route 只负责参数解析和返回
````

---

# 🧱 五、/shop 页面调用流（Claude 必须理解）

```text
/shop 页面加载流程：

1. GET /api/categories
2. GET /api/products?categoryId=xxx
3. GET /api/products/filters?categoryId=xxx
4. GET /api/categories/:id/breadcrumbs

筛选操作：
- 重新调用 products + filters（带相同参数）

要求：
- API 设计必须支持该流程
```

---

目标：
将当前 Magento 直连结构，重构为标准 BFF 架构（categories + products + filters 分离），用于 /shop 页面。

你这套 Claude Prompt 做完，会得到：

✔ 分类树
✔ 分类详情
✔ 面包屑
✔ 商品列表（支持分类）
✔ filters（动态筛选）
