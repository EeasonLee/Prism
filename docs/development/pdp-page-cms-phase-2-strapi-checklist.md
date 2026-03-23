# PDP Page CMS Phase 2 Strapi Checklist

## Goal

为 PDP Page CMS 第一阶段提供最小可用的 Strapi 数据结构，让真实 SKU 可以返回 `key_points` 和 `guarantees`，供当前前端直接渲染。

## Minimum Fields

### `key_points`

配置为可重复对象列表，每项至少包含：

- `icon`: string
- `title`: string
- `description`: string

### `guarantees`

配置为可重复对象列表，每项至少包含：

- `icon`: string
- `title`: string
- `description`: string

## Important Constraints

- 第一阶段不要给这两个字段增加图片、media、relation 或复杂嵌套组件。
- 保持纯文本对象数组，避免重新引入复杂 `populate[...]` 风险。
- 前端当前只消费这 3 个字符串字段，字段名应与前端契约保持一致。
- 空字符串或缺字段的条目会被前端归一化逻辑过滤掉。
- 不要把这两个字段做成自由 JSON 字段，也不要提前做成通用 Dynamic Zone；当前阶段更合适的是 `product-enrichment` 下的两个受控可重复对象列表。

## Frontend Contract

当前前端会在 `apps/prism/lib/api/strapi/product-enrichment.ts` 中按以下逻辑读取：

- `normalizeKeyPoints()`
- `normalizeGuarantees()`

每项必须同时具备：

- `icon`
- `title`
- `description`

否则该项不会显示。

## Validation Order

1. 在 Strapi 为一个测试 SKU 配置 `key_points` 和 `guarantees`
2. 确认 `product-enrichment` 返回中已包含这两个字段
3. 刷新真实 PDP 页面
4. 检查：

- `SellingPoints` 是否出现
- `ProductGuarantees` 是否出现
- `Features` 导航是否出现
- 既有 enrichment 数据是否仍正常显示

## Completion Standard

当以下条件同时成立时，才算 PDP 第一阶段真正完成：

- 前端页面正常显示 `key_points`
- 前端页面正常显示 `guarantees`
- 既有 `recipes` / `blog_posts` 无回归
- 既有 enrichment 数据链路无回归
