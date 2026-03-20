# PDP：Mock 区块与真实数据来源

本文档与 `apps/prism/app/products/[sku]/` 下的 **`ProductPageCms`** 类型对齐，便于后续 Strapi / Magento 接入迭代。

## 产品决策：评价区

- **Hero** 已在有数据时展示 Magento 的星级条（`rating_percentage`）与 `review_count`。
- **无评论列表数据时**（`cms.reviews` 为空）：**不渲染**下方 `ProductReviews` 大区块，避免与 Hero 重复，且 Magento 侧通常不提供与 mock 一致的 `review_summary.distribution`。

## 区块与数据来源对照

| Mock / 区块                           | 建议数据来源                             | Strapi 现状                                              | Next 现状                                                                       |
| ------------------------------------- | ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Hero 文案与图库                       | Strapi + Magento                         | `product-enrichment` 已有展示名、副标题、短/长描述、图等 | `UnifiedProduct`（`fetchUnifiedProductBySku`）                                  |
| 视频                                  | Strapi `videos`                          | 已有字段                                                 | 未并入 `UnifiedProduct`，PDP 未展示                                             |
| SellingPoints / Guarantees            | CMS                                      | **无**对应组件化字段                                     | Mock：`ProductPageCms`；真实 SKU 暂为 `null`                                    |
| PDP「Details」富文本                  | Strapi `product_detail_html`（商品详情） | **有**                                                   | `UnifiedProduct.product_detail_html`，prose 渲染；**不用** `RichDetailSections` |
| RichDetailSections（图文交替块）      | Mock / 未来 CMS 组件                     | **无** Strapi 等价                                       | 仅 Mock，且当存在 `product_detail_html` 时不展示                                |
| Reviews 列表与分布                    | Magento Review API 或第三方              | **无**                                                   | Mock 列表 + summary；真实仅 Hero 摘要，无列表则不渲染区块                       |
| Recommended                           | Magento `product_links` 或规则           | 视 API                                                   | Mock；`product_links` 未映射                                                    |
| Cross-sell add-ons / 营销 BundleDeals | Magento 链接或运营 CMS                   | **无**（营销 bundle 非 `bundle_options`）                | Mock；与 `ProductDetailClient` 内 Magento **bundle** 配置不是同一 UI            |
| Recipes / Blog                        | Strapi 按 SKU 关联或标签查询             | **无** product 侧关联                                    | Mock                                                                            |

## 相关代码

- `ProductDetailPageData`：`{ product: UnifiedProduct; cms: ProductPageCms \| null }`
- Mock SKU：`mock-data.ts` 中 `MOCK_PRODUCT_SKU`，`cms` 来自 `mockProductExtras`
- 融合层：`lib/api/unified-product.ts`、Strapi：`lib/api/strapi/product-enrichment.ts`

分阶段接入见 `docs/project-plan.md`（PDP / CMS 相关小节）。
