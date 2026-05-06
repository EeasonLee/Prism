# Post-Refactor Architecture Cleanup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate all code redundancy, architectural debt, and naming inconsistencies identified in the jg branch refactor audit, producing a clean `features/`/`core/`/`shared/` architecture with zero legacy `lib/` dependencies.

**Architecture:** Three-phase execution: P0 removes byte-level duplicates (auth routes, cart handlers, debounce) for immediate wins; P1 completes the `lib/` → `core/`/`features/` migration and fixes reverse dependencies; P2 splits the 30-file `features/product/` god module, adds barrel exports, and normalizes naming.

**Tech Stack:** Next.js 15 App Router, TypeScript, Nx monorepo, React Server Components

**Reference docs:** `docs/restructuring-audit.md`, `docs/app-api-audit.md`

---

## P0 — Eliminate Byte-Level Duplicates (3 tasks)

### Task 1: Remove 6 duplicate `/api/v1/auth/*` routes

**Files:**

- Delete: `app/api/v1/auth/guest/route.ts`
- Delete: `app/api/v1/auth/login/route.ts`
- Delete: `app/api/v1/auth/logout/route.ts`
- Delete: `app/api/v1/auth/refresh/route.ts`
- Delete: `app/api/v1/auth/register/route.ts`
- Delete: `app/api/v1/auth/session/route.ts`
- Create: `app/api/v1/auth/guest/route.ts` (rewrite as redirect)
- Create: `app/api/v1/auth/login/route.ts` (rewrite as redirect)
- Create: `app/api/v1/auth/logout/route.ts` (rewrite as redirect)
- Create: `app/api/v1/auth/refresh/route.ts` (rewrite as redirect)
- Create: `app/api/v1/auth/register/route.ts` (rewrite as redirect)
- Create: `app/api/v1/auth/session/route.ts` (rewrite as redirect)
- Search: all client-side code referencing `/api/v1/auth/` to update to `/api/auth/`

- [ ] **Step 1: Search for all client-side references to `/api/v1/auth/`**

```bash
grep -r "api/v1/auth" apps/jd-frontend/ --include="*.ts" --include="*.tsx" -l
```

- [ ] **Step 2: Update all client-side calls from `/api/v1/auth/` to `/api/auth/`**

Update each found file to use `/api/auth/` instead of `/api/v1/auth/`.

- [ ] **Step 3: Rewrite each `/api/v1/auth/*/route.ts` as a 301 redirect**

Replace each file content with:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace('/api/v1/auth/', '/api/auth/');
  return NextResponse.redirect(url, 301);
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace('/api/v1/auth/', '/api/auth/');
  return NextResponse.redirect(url, 307);
}
```

- [ ] **Step 4: Run typecheck to verify**

```bash
pnpm typecheck
```

Expected: PASS with no new errors.

- [ ] **Step 5: Commit**

```bash
git add apps/jd-frontend/app/api/v1/auth/ apps/jd-frontend/app/api/auth/
# also add any client-side files that were updated
git commit -m "fix(api): replace duplicate v1/auth routes with 301 redirects to /api/auth"
```

---

### Task 2: Remove duplicate `api/v1/cart/items` GET handler

**Files:**

- Modify: `app/api/v1/cart/items/route.ts` — remove GET handler, keep POST

- [ ] **Step 1: Read current file**

Read `apps/jd-frontend/app/api/v1/cart/items/route.ts` to understand the structure.

- [ ] **Step 2: Remove the GET export function from the file**

Remove only the `export async function GET(...)` block, keeping the existing `POST` handler intact.

- [ ] **Step 3: Verify no client code calls `GET /api/v1/cart/items`**

```bash
grep -r "cart/items" apps/jd-frontend/ --include="*.ts" --include="*.tsx" | grep -v "POST\|PATCH\|DELETE\|add\|\[id\]"
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/jd-frontend/app/api/v1/cart/items/route.ts
git commit -m "fix(api): remove duplicate GET handler from cart/items, use /api/v1/cart instead"
```

---

### Task 3: Remove duplicate `shared/utils/debounce.ts`

**Files:**

- Delete: `shared/utils/debounce.ts`
- Modify: all files importing from `@/shared/utils/debounce`

- [ ] **Step 1: Find all imports of the duplicate debounce**

```bash
grep -r "from '@/shared/utils/debounce'" apps/jd-frontend/ -l
```

- [ ] **Step 2: Replace imports with `@prism/shared`**

For each file found, replace:

```typescript
import { debounce } from '@/shared/utils/debounce';
```

with:

```typescript
import { debounce } from '@prism/shared';
```

- [ ] **Step 3: Delete the file**

```bash
rm apps/jd-frontend/shared/utils/debounce.ts
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add apps/jd-frontend/shared/utils/debounce.ts
git commit -m "fix: remove duplicate debounce, use @prism/shared version"
```

---

## P1 — Complete lib/ Migration & Fix Reverse Dependencies (9 tasks)

### Task 4: Move `app/search/types.ts` → `features/search/types.ts`

**Files:**

- Create: `features/search/types.ts` (if not exists, or rename existing file)
- Modify: `app/search/types.ts` — re-export from feature
- Modify: all imports from `@/app/search/types`

- [ ] **Step 1: Check if `features/search/types.ts` already exists**

```bash
ls apps/jd-frontend/features/search/types.ts 2>/dev/null
```

- [ ] **Step 2: Copy content**

If no existing `features/search/types.ts`, move content from `app/search/types.ts` to `features/search/types.ts`.

If `features/search/types.ts` already exists, merge the types from `app/search/types.ts` into it.

- [ ] **Step 3: Find all imports from `app/search/types`**

```bash
grep -r "from '@/app/search/types'" apps/jd-frontend/ -l
```

- [ ] **Step 4: Update all imports to `@/features/search/types`**

Replace `@/app/search/types` with `@/features/search/types` in all found files.

- [ ] **Step 5: Rewrite `app/search/types.ts` as re-export**

```typescript
export type {
  SearchSeo,
  SearchSortOption,
  SearchLayoutType,
  SearchCategory,
  SearchPriceRange,
  ProductCardItem,
  ProductSearchQuery,
  SearchAppliedFilter,
  SearchAvailableFilter,
  SearchPagination,
  ProductSearchResult,
} from '@/features/search/types';
```

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor: move search types from app/ to features/search"
```

---

### Task 5: Move `app/products/[slug]/product-page-types.ts` → `features/product/`

**Files:**

- Modify: `features/product/bff-types.ts` — absorb PDP CMS types
- Modify: `app/products/[slug]/product-page-types.ts` — re-export from feature
- Modify: `features/product/content.api.ts` — fix reverse import
- Modify: `features/product/detail.bff.ts` — fix reverse import

- [ ] **Step 1: Merge PDP CMS types into `features/product/bff-types.ts`**

Move `ProductVideoCard`, `BlogPost`, `CrossSellAddon`, `BundleDeal`, `ProductPageExtras`, `ProductPageCms`, `RecommendedProduct` (and supporting types `KeyPoint`, `Guarantee`, `DetailSection`, `Review`) from `app/products/[slug]/product-page-types.ts` into `features/product/bff-types.ts`.

Note: The `Recipe` type in `product-page-types.ts` conflicts with `features/recipe/types.ts`. Rename it to `PdpRecipeCard` (already defined in `content.api.ts`) or `RecipeCard` in the merged location.

- [ ] **Step 2: Update `features/product/content.api.ts`**

Change line 6:

```typescript
// Before
import {
  BlogPost,
  ProductVideoCard,
} from '@/app/products/[slug]/product-page-types';
// After
import type { BlogPost, ProductVideoCard } from '@/features/product/bff-types';
```

- [ ] **Step 3: Update `features/product/detail.bff.ts`**

Change line 28:

```typescript
// Before
import type { ProductPageCms } from '@/app/products/[slug]/product-page-types';
// After
import type { ProductPageCms } from '@/features/product/bff-types';
```

- [ ] **Step 4: Update `app/products/[slug]/` page files**

Redirect imports in all 22 files under `app/products/[slug]/` that reference `./product-page-types` to the new location.

```bash
grep -r "from './product-page-types'" apps/jd-frontend/app/products/ -l
grep -r "from '@/app/products/\[slug\]/product-page-types'" apps/jd-frontend/ -l
```

Update to `@/features/product/bff-types`.

- [ ] **Step 5: Rewrite or remove `product-page-types.ts`**

Either:

- Delete it and have all consumers import from `@/features/product/bff-types`, OR
- Rewrite as re-export barrel pointing to `@/features/product/bff-types`

- [ ] **Step 6: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor: move PDP CMS types from app/ to features/product/bff-types"
```

---

### Task 6: Split `lib/api/magento/types.ts` and migrate to features

**Files:**

- Modify: `features/cart/types.ts` (create if not exists) — absorb cart types
- Modify: `features/auth/types.ts` — absorb auth types
- Modify: `features/product/bff-types.ts` — absorb product catalog types
- Delete: `lib/api/magento/types.ts` (after migration)
- Modify: all 18 files that import from `@/lib/api/magento/types`

- [ ] **Step 1: Read the full `lib/api/magento/types.ts` to catalog all exports**

```bash
grep "^export" apps/jd-frontend/lib/api/magento/types.ts
```

- [ ] **Step 2: Create/migrate cart types to `features/cart/types.ts`**

Move: `CartMoney`, `CartItem`, `CartTotals`, `CartItemsResponse`, `AddCartItemParams`, `CartRedirectResponse`, `MagentoResponse`, `MagentoErrorBody` (these are BFF response shapes used by cart).

```typescript
// features/cart/types.ts (new)
export interface CartMoney {
  value: number;
  currency: string;
}

export interface CartItem {
  // ... from lib/api/magento/types.ts
}

export interface CartTotals {
  // ... from lib/api/magento/types.ts
}

export interface AddCartItemParams {
  sku: string;
  qty: number;
  product_option?: { extension_attributes: { customizable_options: Array<{...}> } };
}

// Re-export BFF response wrapper (used by cart API routes)
export interface MagentoResponse<T> { success: boolean; data: T; error: MagentoErrorBody | null; }
export interface MagentoErrorBody { code: string; message: string; details: unknown | null; request_id: string; }
```

- [ ] **Step 3: Migrate auth types to `features/auth/types.ts`**

Move: `AuthTokens`, `AuthUser` — these are auth-domain types.

- [ ] **Step 4: Migrate product catalog types to `features/product/bff-types.ts`**

Move: `MagentoProduct`, `MagentoCategoryTree`, `MagentoCategoryBreadcrumb`, `MagentoCustomizableOption`, `MagentoProductImage`, `MagentoProductPrice` — these are Magento catalog domain types.

- [ ] **Step 5: Update all 18 import sites**

```bash
grep -r "from '@/lib/api/magento/types'" apps/jd-frontend/ -l
```

Update each:

- `features/cart/*` → `from '@/features/cart/types'`
- `features/auth/*` → `from '@/features/auth/types'`
- `features/product/*` → `from '@/features/product/bff-types'`
- `app/api/*` → `from '@/features/cart/types'` or `from '@/features/product/bff-types'`

- [ ] **Step 6: Delete `lib/api/magento/types.ts`**

```bash
rm apps/jd-frontend/lib/api/magento/types.ts
```

- [ ] **Step 7: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 8: Commit**

```bash
git commit -m "refactor: split lib/api/magento/types into feature-specific type files"
```

---

### Task 7: Migrate `lib/api/magento/cart.ts` → merge into `features/cart/`

**Files:**

- Modify: `features/cart/cart-rest.service.ts` — absorb cart actions
- Delete: `lib/api/magento/cart.ts`
- Modify: `app/cart/page.tsx` — update imports
- Modify: `features/cart/CartDrawer.tsx` — update imports
- Modify: `features/cart/cart.context.tsx` — update imports

- [ ] **Step 1: Read `lib/api/magento/cart.ts` to understand exported functions**

- [ ] **Step 2: Merge functions into `features/cart/cart-rest.service.ts`**

Move `formatCartMoney`, `formatCartLineTotal`, and all exported cart action functions (`getCart`, `addToCart`, `removeCartItem`, `updateCartItemWishlist`, `applyCoupon`, `removeCoupon`) into `features/cart/cart-rest.service.ts` or a new `features/cart/cart-actions.ts`.

The merged file already imports from `@/core/api/clients/bff`, so this is a clean consolidation.

- [ ] **Step 3: Update all imports from `@/lib/api/magento/cart`**

```bash
grep -r "from '@/lib/api/magento/cart'" apps/jd-frontend/ -l
```

Update each to `from '@/features/cart/cart-rest.service'`.

- [ ] **Step 4: Delete `lib/api/magento/cart.ts`**

```bash
rm apps/jd-frontend/lib/api/magento/cart.ts
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor: merge lib/api/magento/cart into features/cart/cart-rest.service"
```

---

### Task 8: Migrate `lib/api/adapters/server-adapter.ts` → `core/api/clients/`

**Files:**

- Create: `core/api/clients/strapi-server.ts`
- Delete: `lib/api/adapters/server-adapter.ts`
- Delete: `lib/api/adapters/client-adapter.ts` (check if unused)
- Modify: `features/category/category.service.ts` — update import
- Modify: `features/navigation/header-menu.bff.ts` — update import

- [ ] **Step 1: Check if `client-adapter.ts` is used anywhere**

```bash
grep -r "client-adapter" apps/jd-frontend/ --include="*.ts" --include="*.tsx"
```

If unused, mark for deletion.

- [ ] **Step 2: Move `server-adapter.ts` to `core/api/clients/strapi-server.ts`**

Copy the file, then update its internal imports to use `@/core/` paths instead of relative paths (it already imports from `@/core/config/env` and `@/core/config/api-config`, so this should be clean).

- [ ] **Step 3: Update the 2 consumers**

```typescript
// features/category/category.service.ts:2
// Before: import { serverRequest } from '@/lib/api/adapters/server-adapter';
// After:  import { serverRequest } from '@/core/api/clients/strapi-server';

// features/navigation/header-menu.bff.ts:1
// Before: import { serverRequest } from '@/lib/api/adapters/server-adapter';
// After:  import { serverRequest } from '@/core/api/clients/strapi-server';
```

- [ ] **Step 4: Delete `lib/api/adapters/`**

```bash
rm -rf apps/jd-frontend/lib/api/adapters/
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor: move server-adapter from lib/ to core/api/clients/strapi-server"
```

---

### Task 9: Migrate `lib/api/bff/refresh-lock.ts` → `core/api/`

**Files:**

- Create: `core/api/refresh-lock.ts`
- Delete: `lib/api/bff/refresh-lock.ts`
- Modify: `features/auth/require-auth.ts` — update import

- [ ] **Step 1: Read `lib/api/bff/refresh-lock.ts`**

Note: It currently imports `AuthTokens` from `../magento/types` (relative). This import must be updated.

- [ ] **Step 2: Create `core/api/refresh-lock.ts`**

Copy content, update the `AuthTokens` import:

```typescript
// Before
import type { AuthTokens } from '../magento/types';
// After
import type { AuthTokens } from '@/features/auth/types';
```

- [ ] **Step 3: Update `features/auth/require-auth.ts`**

```typescript
// Before
import { withRefreshLock } from '@/lib/api/bff/refresh-lock';
// After
import { withRefreshLock } from '@/core/api/refresh-lock';
```

- [ ] **Step 4: Delete `lib/api/bff/`**

```bash
rm -rf apps/jd-frontend/lib/api/bff/
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 6: Commit**

```bash
git commit -m "refactor: move refresh-lock from lib/api/bff to core/api"
```

---

### Task 10: Migrate `lib/api/interceptors/` → `core/api/`

**Files:**

- Create: `core/api/interceptors/request-logger.ts`
- Delete: `lib/api/interceptors/index.ts`
- Delete: `lib/api/interceptors/request-logger.ts`
- Modify: any consumers of the interceptor

- [ ] **Step 1: Check if interceptors are used anywhere**

```bash
grep -r "interceptors" apps/jd-frontend/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
grep -rn "from '@/lib/api/interceptors'" apps/jd-frontend/
```

- [ ] **Step 2: Move files or delete if unused**

If interceptors are used, move to `core/api/interceptors/`. If unused, delete.

- [ ] **Step 3: Delete `lib/api/interceptors/`**

```bash
rm -rf apps/jd-frontend/lib/api/interceptors/
```

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: move interceptors from lib/api to core/api"
```

---

### Task 11: Fix `forgot-password` / `reset-password` to use auth service

**Files:**

- Modify: `app/api/auth/forgot-password/route.ts`
- Modify: `app/api/auth/reset-password/route.ts`
- Modify: `features/auth/auth.service.ts` — add forgotPassword/resetPassword if missing

- [ ] **Step 1: Read current auth service to see available methods**

```bash
grep "export.*function\|export.*async.*function" apps/jd-frontend/features/auth/auth.service.ts
```

- [ ] **Step 2: Add `forgotPassword` and `resetPassword` to auth service if not present**

```typescript
// In features/auth/auth.service.ts
export async function forgotPassword(
  email: string
): Promise<{ success: boolean }> {
  const client = await getMagentoClient();
  const response = await client.put('customers/password', { email });
  return { success: true };
}

export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<{ success: boolean }> {
  const client = await getMagentoClient();
  const response = await client.post('customers/resetPassword', {
    email,
    resetToken: token,
    newPassword,
  });
  return { success: true };
}
```

- [ ] **Step 3: Rewrite route handlers to use auth service**

Replace direct `magentoClient` calls with `forgotPassword()` / `resetPassword()` from `@/features/auth/auth.service`.

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(api): route forgot-password/reset-password through auth service"
```

---

### Task 12: Delete `lib/` directory

**Files:**

- Delete: `lib/` (entire directory)

- [ ] **Step 1: Verify zero remaining imports from `@/lib/`**

```bash
grep -r "from '@/lib/" apps/jd-frontend/ --include="*.ts" --include="*.tsx"
```

Expected: no output. If any remain, fix them first.

- [ ] **Step 2: Delete the directory**

```bash
rm -rf apps/jd-frontend/lib/
```

- [ ] **Step 3: Run full check**

```bash
pnpm check
```

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor: delete legacy lib/ directory, migration complete"
```

---

## P2 — Normalization & God Module Split (6 tasks)

### Task 13: Add barrel exports to all features

**Files:**

- Create: `features/account/index.ts`
- Create: `features/auth/index.ts`
- Create: `features/cart/index.ts`
- Create: `features/category/index.ts`
- Create: `features/cms-page/index.ts`
- Create: `features/navigation/index.ts`
- Create: `features/product/index.ts`
- Create: `features/recipe/index.ts`
- Create: `features/search/index.ts`

- [ ] **Step 1: Create barrel for each feature**

Each barrel follows this pattern — only export public API:

```typescript
// features/account/index.ts
export {
  AccountService,
  type AccountProfile,
  type AccountAddress,
} from './account.service';
export { useAccount } from './use-account';
export type { AccountState } from './types';
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git commit -m "feat: add barrel exports to all feature directories"
```

---

### Task 14: Split `features/product/` into sub-domains

**Files:**

- Create: `features/product/catalog/` sub-directory with ~7 files
- Create: `features/product/social/` sub-directory with ~4 files
- Create: `features/product/related/` sub-directory with ~4 files
- Move: files from `features/product/` into sub-directories
- Create: `features/product/index.ts` as unified barrel

- [ ] **Step 1: Create sub-directory structure**

```bash
mkdir -p apps/jd-frontend/features/product/catalog
mkdir -p apps/jd-frontend/features/product/social
mkdir -p apps/jd-frontend/features/product/related
```

- [ ] **Step 2: Move catalog/Meilisearch files**

Move to `features/product/catalog/`:

- `catalog.api.ts`
- `enrichment.api.ts`
- `query-facade.ts`
- `query.model.ts`
- `meilisearch.repo.ts`
- `meilisearch.bff.ts`
- `category.repo.ts` (or move to `shared/mapping/`)

- [ ] **Step 3: Move social/reviews/QA/content files**

Move to `features/product/social/`:

- `reviews.api.ts`
- `qa.api.ts`
- `content.api.ts`
- `blog-bridge.api.ts`

- [ ] **Step 4: Move related products BFF files**

Move to `features/product/related/`:

- `related.bff.ts`
- `upsell.bff.ts`
- `stock.bff.ts`
- `variants.bff.ts`

- [ ] **Step 5: Keep in `features/product/` (core)**

Remaining files:

- `types.ts` (merged bff-types + PDP CMS types)
- `unified.api.ts`, `unified-utils.ts`
- `product.mapper.ts`
- `product-graphql.service.ts`
- `detail.bff.ts`, `list.bff.ts`
- `AddToCartButton.tsx`, `ProductCard.tsx`, `ProductCardSkeleton.tsx`, `QuickAddModal.tsx`, `CustomizableOptionsSection.tsx`
- `ProductCardSection.tsx` (rename export later)

- [ ] **Step 6: Create barrel exports for each sub-domain and root**

`features/product/index.ts` re-exports from core + sub-domains.
`features/product/catalog/index.ts` re-exports catalog APIs.
`features/product/social/index.ts` re-exports social APIs.
`features/product/related/index.ts` re-exports related BFFs.

- [ ] **Step 7: Update all cross-feature imports for the new paths**

```bash
grep -rn "from '@/features/product/" apps/jd-frontend/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
```

Update to use new sub-directory paths or go through the barrel.

- [ ] **Step 8: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 9: Commit**

```bash
git commit -m "refactor(product): split 30-file god module into core/catalog/social/related sub-domains"
```

---

### Task 15: Unify API route version strategy (all v1)

**Files:**

- Create: `app/api/v1/products/`, `app/api/v1/reviews/`, etc.
- Modify: existing v0 routes → 301 redirect to v1
- Modify: all client-side code calling v0 routes

- [ ] **Step 1: Move v0 routes to v1**

Move route files from:

- `app/api/products/` → `app/api/v1/products/`
- `app/api/reviews/` → `app/api/v1/reviews/`
- `app/api/categories/` → `app/api/v1/categories/`
- `app/api/recipes/` → `app/api/v1/recipes/`
- `app/api/deal-products/` → `app/api/v1/deal-products/`
- `app/api/global-search/` → `app/api/v1/global-search/`
- `app/api/header-menu/` → `app/api/v1/header-menu/`
- `app/api/product-qa/` → `app/api/v1/product-qa/`
- `app/api/search/recipes/` → `app/api/v1/search/recipes/`

- [ ] **Step 2: Rewrite v0 paths as redirects**

```typescript
// app/api/products/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace('/api/products', '/api/v1/products');
  return NextResponse.redirect(url, 301);
}

export async function POST(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = url.pathname.replace('/api/products', '/api/v1/products');
  return NextResponse.redirect(url, 307);
}
```

- [ ] **Step 3: Update all client-side API calls**

```bash
grep -rn "/api/products\|/api/reviews\|/api/categories\|/api/recipes\|/api/deal-products\|/api/global-search\|/api/header-menu\|/api/product-qa\|/api/search/recipes" apps/jd-frontend/ --include="*.ts" --include="*.tsx" | grep -v "/api/v1/\|node_modules\|route.ts"
```

Update all to use `/api/v1/...`.

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(api): unify all API routes under /api/v1/ namespace"
```

---

### Task 16: Fix naming, barrel completion, and remaining conventions

**Files:**

- Modify: `features/product/ProductCardSection.tsx` — rename exported component
- Modify: `shared/utils/index.ts` — complete barrel

- [ ] **Step 1: Rename export in `ProductCardSection.tsx`**

Change the exported function name from `ProductCard` to `ProductCardCompact` and update all imports.

- [ ] **Step 2: Complete `shared/utils/index.ts` barrel**

Add exports for all utility modules:

```typescript
export { cn } from '@prism/shared';
export { formatPrice } from './format-price';
export { debounce } from './debounce'; // or from @prism/shared after Task 3
export { notifyError, notifySuccess } from './notify';
export { sendDiscordAlert } from './alert';
export { buildStaticMetadata, absoluteUrl } from './seo';
export { validateEmail, sanitizeEmail } from './email-validation';
export { verifyTurnstileToken } from './cloudflare-turnstile';
export { HOME_ANIMATIONS_ENABLED } from './animations';
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git commit -m "fix: rename ProductCardSection export to ProductCardCompact, complete shared/utils barrel"
```

---

### Task 17: Eliminate product ↔ category bidirectional dependency

**Files:**

- Move: `features/product/category.repo.ts` → `shared/mapping/category-mapping.ts`
- Modify: `features/product/detail.bff.ts` — update import
- Modify: `features/cms-page/cms-pages.api.ts` — update import (if needed)

- [ ] **Step 1: Check all imports of `category.repo.ts`**

```bash
grep -rn "category.repo" apps/jd-frontend/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: Move to `shared/mapping/category-mapping.ts`**

Create `shared/mapping/` directory, move `category.repo.ts` there, update the import of `categoryService` (already through `@/features/category/category.service`).

- [ ] **Step 3: Update consumers**

Change imports from `@/features/product/category.repo` to `@/shared/mapping/category-mapping`.

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor: move category.repo to shared/mapping, break product↔category bidirectional dependency"
```

---

### Task 18: Final verification pass

- [ ] **Step 1: Verify zero `@/lib/` imports**

```bash
grep -r "from '@/lib/" apps/jd-frontend/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 2: Verify zero `@/app/` imports from `features/` or `shared/`**

```bash
grep -r "from '@/app/" apps/jd-frontend/features/ apps/jd-frontend/shared/ apps/jd-frontend/core/ --include="*.ts" --include="*.tsx"
```

- [ ] **Step 3: Run full check suite**

```bash
pnpm check
```

- [ ] **Step 4: Run tests**

```bash
pnpm test
```

- [ ] **Step 5: Build verification**

```bash
pnpm build
```

- [ ] **Step 6: Commit final state**

```bash
git commit -m "chore: final verification - all lint/typecheck/tests pass"
```

---

## Execution Order

```
P0: Task 1 → Task 2 → Task 3          (independent, can run in parallel)
           ↓
P1: Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9 → Task 10 → Task 11 → Task 12
     (sequential — each depends on previous import migrations completing)
           ↓
P2: Task 13 → Task 14 → Task 15 → Task 16 → Task 17
     (Task 13/14 can be parallel, Task 15 independent after P1, Task 16/17 depend on 13/14)
           ↓
     Task 18 (final verification)
```

## Risk Mitigation

- **Each commit is a revertible checkpoint** — if typecheck fails, only one small change to revert
- **P0 tasks are pure deletions/redirects** — zero behavioral change, perfectly safe
- **P1 migration uses find-and-replace patterns** — grep-before and grep-after verifies completeness
- **Task 14 (product split) is highest-risk** — sub-directories change file paths; barrel exports shield consumers
- **Never skip typecheck between tasks** — `pnpm typecheck` is the gate for every commit
