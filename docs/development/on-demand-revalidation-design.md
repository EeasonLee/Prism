# On-Demand Revalidation 架构设计（Recipe + Blog CMS）

## 目标

Strapi 后台更新并发布内容后，前台详情与列表**立即**可见最新内容；未触发 On-Demand 时由 ISR 兜底（合理时间后更新）。

## 方案选型：Path 还是 Tag

| 维度     | Path 方案                                                             | Tag 方案                                                           |
| -------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **做法** | Strapi 按实体解析出 URL 路径，调用 `/api/revalidate` 传 `paths`       | Next 端 fetch 使用 `next.tags`，Strapi 只传 `tags`                 |
| **优点** | 不改 Next 端 fetch 入参；Strapi 已有 category/slug，路径明确；易排查  | 一次 tag 可失效多条相关请求；不依赖前端 URL 规则                   |
| **缺点** | 需在 Strapi 维护与 Next 路由一致的路径规则                            | 需在 Next 所有相关 fetch 上增加 tags，Strapi 与 Next 约定 tag 命名 |
| **选型** | **采用**：与当前 Recipe 实现一致，Blog 复用同一模式，实现简单、可维护 | 预留：API 已支持 tags，后续列表/聚合页可考虑按 tag 批量失效        |

**结论**：统一使用 **Path 失效**。列表 + 当前详情路径由 Strapi 在发布时计算并调用 revalidate。

## Revalidate 时间

- **On-Demand**：发布/更新时立即失效对应 path，为主要更新手段。
- **ISR 兜底**：`revalidate = 3600`（1 小时）。未配置或 On-Demand 未触发时，最多 1 小时后自动重新验证。

页面与 fetch 的 `revalidate` 统一为 **3600 秒**。

## 路径约定（与 Next 路由一致）

| 内容类型 | 列表/入口  | 分类页                | 详情页                         |
| -------- | ---------- | --------------------- | ------------------------------ |
| Recipe   | `/recipes` | （列表内筛选）        | `/recipes/:categorySlug/:slug` |
| Blog     | `/blog`    | `/blog/:categorySlug` | `/blog/:categorySlug/:slug`    |

Strapi 触发时至少包含：列表 path + 详情 path（有分类时含分类 path）。

## Strapi 实现要点

- **工具**：`utils/next-revalidate.js` 已提供 `triggerRevalidate({ paths, tags })`，供各 content-type 复用。
- **Document Service 中间件**：Strapi 5 的「发布」走 Document Service，不触发 entity 的 afterUpdate。在 `strapi.documents.use()` 中，对 publish/update(已发布)/create(已发布) 延后执行 revalidate：先 `await next()` 拿到 result，再用 **短延时（约 400ms）** 调用 helper，避免 (1) 事务未提交时 Next 拉到旧数据并再次缓存，(2) 用户首刷早于 revalidate 导致需刷新两次。
- **Recipe / Article**：路径与调用逻辑在 `utils/next-revalidate-helpers.js`（`revalidateRecipePages`、`revalidateArticlePages`）；lifecycles 仍可调用同一 helper 以覆盖非 Document Service 的发布路径。

## 环境变量（Strapi）

- `NEXT_REVALIDATE_URL`：Next 站点根 URL（如 `https://www.example.com`）
- `REVALIDATE_SECRET`：与 Next 端 `REVALIDATE_SECRET` 一致

未配置时仅打日志，不影响发布流程。
