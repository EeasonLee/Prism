---
name: 商品问答模块设计
description: 跨前端复用的商品问答后端模块，支持官方 FAQ 与用户提问，以 SKU 为关联键
type: design
---

# 商品问答模块设计

> **实现状态（2026-03-30）：** Strapi（`helpcenter`）已通过 `product-question` 自定义路由提供 `GET /api/product-qa/by-sku/:sku`（聚合 `product-faq` + 已公开用户问答）与 `POST /api/product-qa/questions`；Prism 已提供 BFF、`product-qa.ts` 归一化（`ProductQuestion.kind`：`faq` \| `user_qa`）、PDP `ProductQA`（展示 **Official FAQ** / **Customer Q&A**）。遗留：端到端手工验收、后端仅用 token 校验身份的强化、自动化测试。

## 一、模块定位

这是一个 **跨前端复用的商品问答后端模块**，不是 Prism 专属前端功能。

### 职责分层

- **Strapi**

  - Q&A 主数据源
  - 管理 FAQ、用户提问、官方回答、发布状态、复用关系
  - 对外暴露统一 API contract

- **Prism / 其他前端项目**

  - 传入 SKU 查询问答内容
  - 调用提交问题接口
  - 自己决定页面样式和交互

- **Magento**
  - 不承接 Q&A 数据
  - 一期不参与问答流程

### 对前台消费者暴露的核心能力

- 按 `SKU` 获取该商品的可展示问答内容
- 同时支持：
  - 商品专属 FAQ
  - 公共 FAQ 复用到该商品
  - 由用户提问转公开的问答项
- 登录用户提交问题
- 未处理问题不对前台公开

### 一期边界

- 只复用 **后端数据能力**
- 不做跨站统一 UI 组件
- 不做搜索、筛选、标签体系
- 不做游客提问
- 不做图片附件
- 不做公开中的"待回答问题池"

---

## 二、Strapi 内容模型

### 1. `product-faq`

手工维护的 FAQ，可复用到多个商品。

**字段定义**

| 字段         | 类型     | 必填 | 说明                                                                 |
| ------------ | -------- | ---- | -------------------------------------------------------------------- |
| `title`      | String   | ✓    | 问题标题，最多 200 字                                                |
| `content`    | RichText | ✓    | 官方回答                                                             |
| `sku`        | String   | ✗    | 关联商品 SKU；为空表示公共 FAQ（Strapi schema 中 `required: false`） |
| `is_public`  | Boolean  | ✓    | 是否已发布（默认 false）                                             |
| `order`      | Integer  | ✓    | 排序权重，越小越靠前（默认 0）                                       |
| `created_at` | DateTime | 自动 | 创建时间                                                             |
| `updated_at` | DateTime | 自动 | 更新时间                                                             |

**验证规则**

- `title` 长度 3-200 字
- `content` 不为空
- `sku` 如果填写，必须是有效的 SKU 格式

---

### 2. `product-question`

收集用户提问。

**字段定义**

| 字段              | 类型     | 必填 | 说明                                                             |
| ----------------- | -------- | ---- | ---------------------------------------------------------------- |
| `sku`             | String   | ✓    | 提问商品 SKU                                                     |
| `content`         | Text     | ✓    | 用户提问内容，最多 500 字                                        |
| `author_name`     | String   | ✓    | 提问者名字（从登录用户取）                                       |
| `author_email`    | String   | ✓    | 提问者邮箱                                                       |
| `magento_user_id` | String   | ✓    | 用户 ID                                                          |
| `status`          | Enum     | ✓    | 处理状态：`pending` \| `answered` \| `published`（默认 pending） |
| `created_at`      | DateTime | 自动 | 创建时间                                                         |
| `updated_at`      | DateTime | 自动 | 更新时间                                                         |

**验证规则**

- `content` 长度 10-500 字
- `sku` 必须是有效的 SKU 格式
- `magento_user_id` 不为空

---

### 3. `product-question-answer`

后台对用户提问的回复。

**字段定义**

| 字段           | 类型     | 必填 | 说明                           |
| -------------- | -------- | ---- | ------------------------------ |
| `question`     | Relation | ✓    | 关联的提问（product-question） |
| `content`      | RichText | ✓    | 官方回答                       |
| `is_published` | Boolean  | ✓    | 是否公开（默认 false）         |
| `created_at`   | DateTime | 自动 | 创建时间                       |
| `updated_at`   | DateTime | 自动 | 更新时间                       |

**验证规则**

- `content` 不为空
- 一个 question 只能有一个 answer

---

## 三、API Contract

### 1. 查询商品问答内容

**请求**

```
GET /api/product-qa/by-sku/:sku?page=1&pageSize=10
```

**响应（200 OK）**

```json
{
  "sku": "JD-AF550",
  "items": [
    {
      "id": "faq-001",
      "type": "faq",
      "question": "这个产品能用多久？",
      "answer": "<p>正常使用可以用 3-5 年...</p>",
      "order": 1,
      "createdAt": "2026-01-15T10:00:00Z"
    },
    {
      "id": "qa-user-123",
      "type": "user_qa",
      "question": "有没有保修？",
      "answer": "<p>有 2 年保修...</p>",
      "authorName": "张三",
      "createdAt": "2026-02-20T14:30:00Z",
      "answeredAt": "2026-02-21T09:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 15,
    "pageCount": 2
  }
}
```

**说明**

- 返回该 SKU 的所有可展示内容
- 包含：商品专属 FAQ + 公共 FAQ + 已发布的问答对
- 按 `order` 和 `createdAt` 排序
- 分页：默认 10 条，支持 `?page=1&pageSize=10`

**Strapi 实际响应形状（`data` / `meta`）** 中每条为 snake_case，含 `item_type: "faq" | "user_qa"`、`question_text`、`answer_text` 等；Prism `product-qa.ts` 归一为 `ProductQuestion`（含 `kind`）。若只对接 Strapi，请以运行中的 `GET /api/product-qa/by-sku/:sku` 为准。

---

### 2. 提交问题

**请求**

```
POST /api/product-qa/questions
Authorization: Bearer <token>
Content-Type: application/json

{
  "sku": "JD-AF550",
  "content": "这个产品支持国际保修吗？"
}
```

**Prism BFF（`POST /api/product-qa/questions`）一期实现** 在 JSON 中额外要求 `authorName`、`authorEmail`、`magentoUserId`（来自 Magento 登录态），由 BFF 转写为 Strapi `data` 的 `author_name`、`author_email`、`magento_user_id`。理想情况下后端仅信任 token 解析出的身份，当前实现与前端字段一致以便联调。

**响应（201 Created）**

```json
{
  "success": true,
  "message": "问题已提交，感谢您的反馈",
  "questionId": "q-user-456"
}
```

**错误响应（400 Bad Request）**

```json
{
  "error": "content must be between 10 and 500 characters"
}
```

**说明**

- 需要 Bearer token（登录用户）
- 从 token 中提取 `magento_user_id` 和用户邮箱
- 问题默认状态为 `pending`
- 不对前台公开

---

## 四、后台处理流

### 用户提问生命周期

1. **提问进来** → `product-question` 状态为 `pending`
2. **运营在 Strapi Admin 中选择处理路径**

   **路径 A：整理成 FAQ**

   - 编辑提问内容（防止垃圾内容）
   - 在 `product-faq` 中新建 FAQ 项
   - 可选择是否关联原 SKU（复用到其他商品）
   - 发布 FAQ（`is_public: true`）
   - 原提问标记为 `answered`

   **路径 B：直接回复并公开**

   - 在 `product-question-answer` 中添加回答
   - 标记 `is_published: true`
   - 原提问标记为 `published`

3. **前台只消费已发布内容**
   - `is_public: true` 的 FAQ
   - `is_published: true` 的问答对

---

## 五、Prism 前端接入

### 实施清单（与仓库一致的路径）

1. **BFF 路由（只读 / 写入分离）**

   - `apps/prism/app/api/product-qa/by-sku/[sku]/route.ts` — GET，代理 Strapi 聚合列表，`revalidate` 由客户端 fetch 侧配置（5 分钟）
   - `apps/prism/app/api/product-qa/questions/route.ts` — POST，代理用户提问（需 `Authorization: Bearer`）

2. **Strapi 客户端** `apps/prism/lib/api/strapi/product-qa.ts`

   - `fetchProductQaBySku(sku, page, pageSize)` → 请求 Strapi `GET /api/product-qa/by-sku/:sku`（聚合 FAQ + 已公开用户问答）
   - `submitProductQuestion(input, accessToken)` → 请求 Strapi `POST /api/product-qa/questions`；body 除 `sku`、`content` 外包含由前端从登录态填写的 `author_name`、`author_email`、`magento_user_id`（与 Magento SSO 用户对象对齐；后端仍应视安全策略校验 token）

3. **PDP 组件** `apps/prism/app/products/[sku]/ProductQA.tsx` — 列表（Official FAQ / Customer Q&A，对应 `kind`）、分页、提问表单

4. **页面集成** `page.tsx` + `ProductDetailReviewShell.tsx` — 服务端首刷拉取 Q&A，置于 reviews 下方

5. **测试** `ProductQA.spec.tsx`、`product-qa-api.spec.ts`、`product-qa-route.spec.ts`

### Strapi 侧对应实现（helpcenter）

- 聚合读取：`GET /api/product-qa/by-sku/:sku` 在 `product-question` 自定义路由中注册，处理器 `findAggregatedBySku`（合并 `product-faq` 与已发布/已回答的 `product-question`，FAQ 在前按 `order`，用户问答在后按时间；分页在合并后切片，适用于总量可控的一期）。
- 仅用户问答列表（保留兼容）：`GET /api/product-qa/questions/by-sku/:sku`。
- 写入：`POST /api/product-qa/questions`，实现于 `product-question` 自定义 `create`。
- 聚合条目标记 `item_type: 'faq' | 'user_qa'`，并与 Prism `ProductQuestion.kind` 对应。

### 关键设计原则

- 不把 Strapi 模型结构暴露给前端
- 不把 Prism 的路由、样式、状态管理写进 API contract
- 其他前端项目只要按同一 contract 接入，就能独立实现自己的 UI

---

## 六、权限与审核规则

### 查询权限

- 无需认证，所有人可见已发布内容

### 提交权限

- 需要 Bearer token（登录用户）
- 从 token 中提取 `magento_user_id` 和用户邮箱
- 问题默认状态为 `pending`

### 后台审核权限

- 仅 Strapi Admin 用户可操作
- 可编辑问题内容（防止垃圾内容）
- 可添加官方回答
- 可选择发布或存档

---

## 七、后续可扩展的点

- 搜索与全文索引（接入 Meilisearch）
- 问题分类与标签体系
- 用户投票与有用度排序
- 问题评论与讨论
- 图片与视频附件
- 多语言支持
- 问答数据分析与运营报表

---

## 八、数据关系图

```
product-faq
├── title
├── content
├── sku (可为空，表示公共 FAQ)
├── is_public
└── order

product-question
├── sku
├── content
├── author_name
├── author_email
├── magento_user_id
├── status (pending | answered | published)
└── created_at

product-question-answer
├── question (relation → product-question)
├── content
├── is_published
└── created_at

前台展示逻辑：
GET /api/product-qa/by-sku/:sku
  ├── product-faq (is_public=true AND (sku=:sku OR sku=null))
  └── product-question-answer (is_published=true AND question.sku=:sku)
```

---

## 九、一期成功标准

- ✅ Strapi 建立 3 个 Content Type 并配置 API
- ✅ Prism 实现 ProductQA 组件与 BFF 路由
- ✅ 登录用户可提交问题
- ✅ 后台可审核与发布问答
- ✅ PDP 展示已发布的 FAQ 与问答
- ✅ 其他前端项目可按同一 API contract 接入

---

_设计完成时间：2026-03-30_
