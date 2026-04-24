# Product Data Flow Audit

## Unified Entry (After Refactor)

- Single entry: `lib/application/product/product-query-facade.ts`
- Query contract: `lib/domain/product/query.ts`
- Data source adapters:
  - `lib/infrastructure/product/meilisearch-product-repo.ts`
  - `lib/infrastructure/product/strapi-category-repo.ts`

## Supported Query Paths

1. SKU query
   - Input: `sku`
   - Flow: `ProductQueryFacade.queryProducts` -> `searchProductBySkuFromMeilisearch`
2. Strapi category ID query
   - Input: `strapiCategoryId`
   - Flow: `ProductQueryFacade` -> `resolveMagentoCategoryIdFromStrapiCategoryId` -> `searchProductsFromMeilisearch`
3. Strapi category slug query
   - Input: `strapiCategorySlug` (or legacy `categoryUrlKey`)
   - Flow: `ProductQueryFacade` -> `resolveMagentoCategoryIdFromStrapiCategorySlug` -> `searchProductsFromMeilisearch`
4. Magento category ID query
   - Input: `magentoCategoryId`
   - Flow: `ProductQueryFacade` -> `searchProductsFromMeilisearch`

## Consolidation Changes

- Consolidated duplicated search logic from:
  - `app/shop/lib/meilisearch.ts`
  - `app/search/lib/meilisearch.ts`
  - `lib/api/bff/product/meilisearch.ts`
- Refactored API routes to unified query entry:
  - `app/api/deal-products/route.ts`
  - `app/api/categories/[slug]/route.ts`
  - `app/api/search/route.ts`
  - `app/api/products/route.ts`

## Parameter Semantics (Canonical)

- `sku`: product SKU, exact match path
- `strapiCategoryId`: Strapi product-category primary key
- `magentoCategoryId`: Magento category ID used for final filtering
- `filters`: `brand/size/stockStatus/category/priceMin/priceMax`

## Removed Ambiguity

- Removed category identity confusion in unified route contract:
  - no canonical usage of `categoryUrlKey` for product filtering
  - no canonical usage of `categorySlug` for product filtering
- Product filtering now uses category ID semantics only (`magentoCategoryId`)

## Debug Checklist

1. Confirm incoming query fields (`sku`, `strapiCategoryId`, `magentoCategoryId`)
2. If `strapiCategoryId` used, verify it maps to a valid `magentoCategoryId`
3. Verify Meilisearch filter payload contains expected category ID expression
4. Validate pagination and filter values (`page`, `pageSize`, `priceMin`, `priceMax`)
5. Check returned `resolvedMagentoCategoryId` in unified result

## Resilience

- Meilisearch requests retry **without** `facets` if the faceted request fails (e.g. field not configured as facet).
- Search / global-search paths set `includeFacets: false` so catalog misconfiguration does not empty product results.
- Numeric `strapiCategoryId` with no Strapi→Magento mapping falls back to treating the number as a **Magento category id** (legacy CMS values).
