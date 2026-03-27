# Customer Reviews Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready, mobile-first Customer Reviews system that supports image/video attachments, lightweight helpful voting, half-star ratings, and explicit purchased-SKU association across Prism and Strapi.

**Architecture:** Extend Strapi review data models and endpoints first so Prism can consume a stable contract through its existing BFF boundary. Keep normalization and viewer-specific state resolution in Prism, while Strapi owns persistence, aggregation, dedupe, and upload-backed media relations.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, Testing Library, Nx, Strapi 5, PostgreSQL, Strapi Upload plugin, pnpm

---

## File Structure

### Prism files

- Modify: `apps/prism/app/products/[sku]/ProductDetailContent.tsx`
  Derive `ReviewTarget` from the selected variant state and pass it into the reviews module.
- Modify: `apps/prism/app/products/[sku]/ProductReviews.tsx`
  Render mobile-first review summary, sorting, helpful action, media gallery/video preview, and half-star display.
- Modify: `apps/prism/app/products/[sku]/ReviewForm.tsx`
  Accept `ReviewTarget`, enforce configurable-product selection rules, support half-star rating and media upload UX.
- Modify: `apps/prism/app/api/reviews/[sku]/route.ts`
  Extend GET and POST contract handling for sort, helpful viewer state, dual SKU fields, and media IDs.
- Create: `apps/prism/app/api/reviews/upload/route.ts`
  Proxy multipart uploads to Strapi `POST /api/review-media/upload` and normalize the response.
- Create: `apps/prism/app/api/reviews/helpful/route.ts`
  Proxy helpful voting by review `documentId` to Strapi and return normalized `{ helpfulCount, viewerHasMarkedHelpful }`.
- Modify: `apps/prism/lib/api/strapi/reviews.ts`
  Normalize Strapi snake_case review payloads, media payloads, half-star summaries, sort parameters, and helpful state.
- Verify or Create: `apps/prism/tests/ProductReviews.spec.tsx`
  UI tests for rendering, half-star display, helpful state, and mobile-priority content order.
- Verify or Create: `apps/prism/tests/ReviewForm.spec.tsx`
  UI tests for variant gating, half-star selection, media validation, and submission payload shaping.
- Verify or Create: `apps/prism/tests/reviews-api.spec.ts`
  Contract tests for normalization helpers and route-level payload shaping if those helpers are factored cleanly.
- Verify or Create: `apps/prism/tests/reviews-proxy.spec.ts`
  Route/proxy tests for upload and helpful endpoints if current Vitest setup supports route handler testing.

### Strapi files

- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/content-types/product-review/schema.json`
  Add `product_sku`, `purchased_sku`, `purchased_variant_label`, media relation, and decimal rating support.
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/controllers/product-review.js`
  Extend create and list behavior for dual SKU fields, 0.5-step validation, media IDs, sort handling, and viewer helpful state.
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/routes/custom.js`
  Register helpful endpoint and any list-route parameter support.
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/content-types/product-review/lifecycles.js`
  Recompute half-star summary buckets and preserve aggregate correctness on create/update.
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review-summary/content-types/product-review-summary/schema.json`
  Add half-star distribution fields.
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review-summary/controllers/product-review-summary.js`
  Return normalized half-star-capable distribution data.
- Create: `D:/WORK/helpcenter/backend/src/api/review-helpful-vote/content-types/review-helpful-vote/schema.json`
  Store lightweight deduped helpful votes.
- Create: `D:/WORK/helpcenter/backend/src/api/review-helpful-vote/controllers/review-helpful-vote.js`
  Implement helpful-vote create behavior if not kept in product-review controller.
- Create: `D:/WORK/helpcenter/backend/src/api/review-helpful-vote/routes/custom.js`
  Register helpful-vote route if separated from product-review routes.
- Modify: `D:/WORK/helpcenter/backend/config/plugins.js`
  Raise upload limits if required for the 20 MB single-video rule.

### Docs to keep open while implementing

- `docs/superpowers/specs/2026-03-26-customer-reviews-optimization-design.md`
- `apps/prism/app/products/[sku]/ProductReviews.tsx`
- `apps/prism/app/products/[sku]/ReviewForm.tsx`
- `apps/prism/lib/api/strapi/reviews.ts`
- `D:/WORK/helpcenter/backend/src/api/product-review/controllers/product-review.js`
- `D:/WORK/helpcenter/backend/src/api/product-review/content-types/product-review/schema.json`

### Verification commands available in current repos

- Prism typecheck: `pnpm nx run prism:typecheck`
- Prism tests once: `pnpm nx test prism -- --run --reporter=verbose`
- Prism lint: `pnpm nx lint prism`
- Prism build if needed: `pnpm nx build prism`
- Strapi build validation: `npm run build` from `D:/WORK/helpcenter/backend`

### Verification constraints and assumptions

- Prism currently has a minimal Vitest setup with one existing component spec at `apps/prism/tests/DiscoveryProductCard.spec.tsx`.
- Before adding new tests, verify that the current `nx test prism` target picks up new specs in `apps/prism/tests/`.
- Use `pnpm nx test prism -- --run --reporter=verbose` as the default command unless the workspace confirms a file-specific Vitest filter syntax.
- The backend repository does not expose a dedicated automated test script right now, so backend verification in this plan uses `npm run build` plus manual/API-path verification. This is an explicit gap relative to the ideal spec and should be called out in handoff notes as technical debt if no backend test harness is added during implementation.
- Use `D:/...` style paths in commands for consistency with the current environment.
- Execute this plan in an isolated worktree or feature branch so rollback remains cheap if either repo needs to be reset to a known-good point.

### Task 1: Extend Strapi Product Review Schema

**Files:**

- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/content-types/product-review/schema.json`
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review-summary/content-types/product-review-summary/schema.json`
- Modify: `D:/WORK/helpcenter/backend/config/plugins.js`
- Reference: `D:/WORK/helpcenter/backend/src/api/recipe/content-types/recipe/schema.json`
- Reference: `D:/WORK/helpcenter/backend/src/api/article/content-types/article/schema.json`

- [ ] **Step 1: Write down the failing schema expectations**

Document the target schema delta before editing:

```json
{
  "product_sku": { "type": "string", "required": true },
  "purchased_sku": { "type": "string", "required": true },
  "purchased_variant_label": { "type": "string", "required": false },
  "rating": { "type": "decimal", "min": 1, "max": 5 },
  "media": {
    "type": "media",
    "multiple": true,
    "required": false,
    "allowedTypes": ["images", "videos"]
  }
}
```

Expected summary additions:

```json
{
  "dist_4_5": { "type": "integer", "default": 0 },
  "dist_3_5": { "type": "integer", "default": 0 },
  "dist_2_5": { "type": "integer", "default": 0 },
  "dist_1_5": { "type": "integer", "default": 0 }
}
```

- [ ] **Step 2: Check current backend build before edits**

Run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS, proving the baseline backend schema is valid before changes.

- [ ] **Step 3: Update review and summary schemas minimally**

Apply the schema changes and upload-size adjustment only for the documented media rules. Keep `verified` semantics unchanged.

For `config/plugins.js`, update the upload size ceiling so a single 20 MB video can pass backend validation. The exact syntax should match the current Strapi upload plugin shape in this repo; do not guess a new config structure. Reuse the existing upload plugin object and raise only the relevant size limit.

- [ ] **Step 4: Run backend build to validate schema changes**

Run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS, proving Strapi accepts the new content-type definitions and plugin config.

- [ ] **Step 5: Commit schema-only changes**

```bash
git -C "D:/WORK/helpcenter/backend" add \
  src/api/product-review/content-types/product-review/schema.json \
  src/api/product-review-summary/content-types/product-review-summary/schema.json \
  config/plugins.js
git -C "D:/WORK/helpcenter/backend" commit -m "feat(reviews): extend review schema for media and half-star ratings"
```

### Task 2: Implement Strapi Review Controller and Summary Logic

**Files:**

- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/controllers/product-review.js`
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/content-types/product-review/lifecycles.js`
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review-summary/controllers/product-review-summary.js`
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/routes/custom.js`

- [ ] **Step 1: Write the failing behavior checklist**

Define the expected backend behaviors before editing:

```txt
- create accepts rating 4.5 and rejects 4.3
- create accepts product_sku + purchased_sku + purchased_variant_label
- create accepts uploaded media IDs
- list returns media and purchased SKU metadata
- list supports sort=newest|highest_rating|most_helpful
- summary returns 9 half-step buckets
- legacy reviews still aggregate because backfilled fields equal legacy sku
```

- [ ] **Step 2: Run backend build again to verify the pre-controller baseline**

Run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 3: Implement minimal controller and lifecycle changes**

Required implementation targets:

```js
const allowedSorts = {
  newest: [{ createdAt: 'desc' }],
  highest_rating: [{ rating: 'desc' }, { createdAt: 'desc' }],
  most_helpful: [{ helpful_count: 'desc' }, { createdAt: 'desc' }],
};

function isHalfStep(value) {
  return (
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 5 &&
    value * 2 === Math.round(value * 2)
  );
}
```

Update sanitization to include:

```js
{
  productSku: review.product_sku,
  purchasedSku: review.purchased_sku,
  purchasedVariantLabel: review.purchased_variant_label ?? null,
  media: normalizeMedia(review.media),
}
```

Update summary mapping so raw fields normalize to keys:

```js
{
  '5': dist_5,
  '4.5': dist_4_5,
  '4': dist_4,
  '3.5': dist_3_5,
  '3': dist_3,
  '2.5': dist_2_5,
  '2': dist_2,
  '1.5': dist_1_5,
  '1': dist_1,
}
```

- [ ] **Step 4: Run backend build after controller logic changes**

Run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 5: Manually verify target API paths against development backend**

Manual verification is required before calling the backend work complete because the backend repo currently lacks a dedicated automated test harness. First start the local backend with `cd "D:/WORK/helpcenter/backend" && npm run develop` and use test review data in a non-production environment.

Run these against the local Strapi environment:

```bash
curl -X GET "http://localhost:1337/api/product-review-summaries/by-sku/TEST-SKU"
curl -X GET "http://localhost:1337/api/product-reviews/by-sku/TEST-SKU?page=1&pageSize=10&sort=highest_rating"
```

Expected: summary payload contains half-star keys; list payload accepts `sort` and includes media/purchased SKU fields when seeded data exists.

- [ ] **Step 6: Commit controller and summary logic changes**

```bash
git -C "D:/WORK/helpcenter/backend" add \
  src/api/product-review/controllers/product-review.js \
  src/api/product-review/routes/custom.js \
  src/api/product-review/content-types/product-review/lifecycles.js \
  src/api/product-review-summary/controllers/product-review-summary.js
git -C "D:/WORK/helpcenter/backend" commit -m "feat(reviews): add half-star summary and sortable review APIs"
```

### Task 3: Add Strapi Helpful Vote Support

**Files:**

- Create: `D:/WORK/helpcenter/backend/src/api/review-helpful-vote/content-types/review-helpful-vote/schema.json`
- Modify or Create: `D:/WORK/helpcenter/backend/src/api/product-review/controllers/product-review.js`
- Modify: `D:/WORK/helpcenter/backend/src/api/product-review/routes/custom.js`
- Reference: `D:/WORK/helpcenter/backend/src/api/article-feedback/controllers/article-feedback.js`
- Reference: `D:/WORK/helpcenter/backend/src/api/faq-feedback/content-types/faq-feedback/schema.json`

- [ ] **Step 1: Write the failing helpful-vote contract**

```json
{
  "request": {
    "documentId": "review-doc-id",
    "dedupeKey": "visitor-uuid"
  },
  "response": {
    "helpfulCount": 3,
    "viewerHasMarkedHelpful": true
  }
}
```

Behavior to enforce:

```txt
- first vote creates a vote record and increments helpful_count
- second vote with same dedupeKey returns existing count unchanged
```

- [ ] **Step 2: Run backend build before adding the new collection type**

Run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 3: Implement the minimal helpful-vote model and endpoint**

Use a separate `review-helpful-vote` collection type for persistence, but keep the public endpoint on the existing product-review API surface so the final route remains `POST /api/product-reviews/:documentId/helpful`.

Suggested schema shape:

```json
{
  "review_document_id": { "type": "string", "required": true },
  "dedupe_key": { "type": "string", "required": true }
}
```

Suggested endpoint logic inside `product-review` controller:

```js
if (existingVote) {
  return { helpfulCount: review.helpful_count, viewerHasMarkedHelpful: true };
}

await strapi.documents('api::review-helpful-vote.review-helpful-vote').create({
  data: { review_document_id: documentId, dedupe_key: dedupeKey },
});
```

- [ ] **Step 4: Run backend build after helpful-vote changes**

Run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 5: Manually verify idempotent helpful voting**

Manual verification is required before calling the backend work complete because the backend repo currently lacks a dedicated automated test harness. First start the local backend with `cd "D:/WORK/helpcenter/backend" && npm run develop` and use test review data in a non-production environment.

Run these against local Strapi:

```bash
curl -X POST "http://localhost:1337/api/product-reviews/REVIEW_DOC_ID/helpful" \
  -H "Content-Type: application/json" \
  -d '{"dedupeKey":"visitor-123"}'
```

Run the same request twice.
Expected: first request increments count; second request returns same count with `viewerHasMarkedHelpful: true` and no second increment.

- [ ] **Step 6: Commit helpful-vote changes**

```bash
git -C "D:/WORK/helpcenter/backend" add \
  src/api/review-helpful-vote/content-types/review-helpful-vote/schema.json \
  src/api/review-helpful-vote/controllers/review-helpful-vote.js \
  src/api/review-helpful-vote/routes/custom.js \
  src/api/product-review/controllers/product-review.js
git -C "D:/WORK/helpcenter/backend" commit -m "feat(reviews): add helpful vote dedupe endpoint"
```

### Task 4: Verify Prism Test Harness and Extend Review Types/BFF Contracts

**Files:**

- Modify: `apps/prism/lib/api/strapi/reviews.ts`
- Modify: `apps/prism/app/api/reviews/[sku]/route.ts`
- Verify or Create: `apps/prism/tests/reviews-api.spec.ts`

- [ ] **Step 1: Verify the current Prism test harness picks up new specs**

Create a minimal throwaway spec beside `apps/prism/tests/DiscoveryProductCard.spec.tsx`, run the default Prism test command, and confirm the new file executes. Remove the throwaway spec immediately after validation.

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS, and output shows the temporary spec was discovered.

If this step fails, pause feature implementation and first repair the Prism Vitest configuration so new specs under `apps/prism/tests/` are executed reliably. Do not continue assuming tests exist when the harness is not discovering them.

- [ ] **Step 2: Write the failing normalization test**

```ts
it('normalizes media, dual SKU fields, and half-star distribution', () => {
  expect(normalizeReview(rawReview)).toEqual({
    productSku: 'PARENT-SKU',
    purchasedSku: 'CHILD-SKU',
    purchasedVariantLabel: 'Black / 2 Pack',
    rating: 4.5,
    media: [
      expect.objectContaining({ kind: 'image' }),
      expect.objectContaining({ kind: 'video' }),
    ],
    viewerHasMarkedHelpful: true,
  });
});
```

- [ ] **Step 3: Run the Prism test command to confirm failure**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: FAIL because the new normalization helpers and types do not exist yet.

- [ ] **Step 4: Implement minimal type and route contract updates**

Add these exact type directions:

```ts
export interface ProductReviewMedia {
  id: number;
  kind: 'image' | 'video';
  url: string;
  width: number | null;
  height: number | null;
  mime: string | null;
  alt: string | null;
  posterUrl: string | null;
}

export type ProductReviewDistributionKey =
  | '1'
  | '1.5'
  | '2'
  | '2.5'
  | '3'
  | '3.5'
  | '4'
  | '4.5'
  | '5';
```

Extend GET route handling for `sort` and visitor-key context, and POST handling for `productSku`, `purchasedSku`, `purchasedVariantLabel`, and `mediaIds`.

Add an explicit media normalization helper for Strapi upload payloads so both the list adapter and upload proxy can map raw files into `ProductReviewMedia` consistently.

- [ ] **Step 5: Run Prism tests again after contract updates**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

- [ ] **Step 6: Run typecheck to catch route/type drift**

Run: `pnpm nx run prism:typecheck`
Expected: PASS.

- [ ] **Step 7: Commit BFF contract changes**

```bash
git -C "D:/WORK/prism" add \
  apps/prism/lib/api/strapi/reviews.ts \
  apps/prism/app/api/reviews/[sku]/route.ts \
  apps/prism/tests/reviews-api.spec.ts
git -C "D:/WORK/prism" commit -m "feat(reviews): extend review contract and normalization"
```

### Task 5: Add Prism Upload and Helpful Proxy Routes

**Files:**

- Create: `apps/prism/app/api/reviews/upload/route.ts`
- Create: `apps/prism/app/api/reviews/helpful/route.ts`
- Modify: `apps/prism/lib/api/strapi/reviews.ts`
- Verify or Create: `apps/prism/tests/reviews-proxy.spec.ts`

- [ ] **Step 1: Write the failing proxy tests**

```ts
it('proxies multipart uploads to Strapi and returns normalized media metadata', async () => {
  expect(response.status).toBe(200);
  expect(body.items[0]).toEqual(
    expect.objectContaining({ kind: 'image', id: expect.any(Number) })
  );
});

it('proxies helpful voting and returns normalized helpful state', async () => {
  expect(body).toEqual({ helpfulCount: 4, viewerHasMarkedHelpful: true });
});
```

- [ ] **Step 2: Run the Prism test command to confirm failure**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: FAIL because the proxy routes do not exist yet.

- [ ] **Step 3: Implement minimal proxy routes**

Required route responsibilities:

```ts
// upload route: POST /api/reviews/upload
- accept FormData
- forward to Strapi POST /api/review-media/upload
- normalize each returned file into ProductReviewMedia-compatible data

// helpful route: POST /api/reviews/helpful
- accept { documentId, dedupeKey }
- forward to Strapi POST /api/product-reviews/:documentId/helpful
- return { helpfulCount, viewerHasMarkedHelpful }
```

- [ ] **Step 4: Run Prism tests again after adding the proxy routes**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Run typecheck after adding new routes**

Run: `pnpm nx run prism:typecheck`
Expected: PASS.

- [ ] **Step 6: Commit proxy-route changes**

```bash
git -C "D:/WORK/prism" add \
  apps/prism/app/api/reviews/upload/route.ts \
  apps/prism/app/api/reviews/helpful/route.ts \
  apps/prism/lib/api/strapi/reviews.ts \
  apps/prism/tests/reviews-proxy.spec.ts
git -C "D:/WORK/prism" commit -m "feat(reviews): add upload and helpful proxy routes"
```

### Task 6: Add Visitor-Key Utility and Rebuild Review Form for Mobile-First Submission

**Files:**

- Create: `apps/prism/app/products/[sku]/review-visitor-key.ts`
- Modify: `apps/prism/app/products/[sku]/ReviewForm.tsx`
- Modify: `apps/prism/app/products/[sku]/ProductDetailContent.tsx`
- Modify: `apps/prism/app/products/[sku]/ProductReviews.tsx`
- Verify or Create: `apps/prism/tests/ReviewForm.spec.tsx`

- [ ] **Step 1: Write the failing ReviewForm test**

```tsx
it('blocks configurable-product submission until a variant is selected', async () => {
  render(
    <ReviewForm
      target={{
        productSku: 'PARENT',
        purchasedSku: null,
        purchasedVariantLabel: null,
        requiresVariantSelection: true,
      }}
      onSubmitted={vi.fn()}
    />
  );

  expect(
    screen.getByText(/select a variant before writing a review/i)
  ).toBeInTheDocument();
});

it('rejects invalid media combinations before upload', async () => {
  expect(
    await screen.findByText(/only 1 video is allowed/i)
  ).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the Prism test command to confirm failure**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: FAIL because the target prop and media UX do not exist yet.

- [ ] **Step 3: Implement minimal mobile-first ReviewForm changes**

Variant integration guidance:

```txt
- keep ProductDetailContent as the owner of current PDP review target derivation
- derive ReviewTarget from the same selection state already updated by ProductDetailClient through onSelectionChange
- simple product: purchasedSku mirrors productSku
- configurable product without full selection: purchasedSku stays null and requiresVariantSelection stays true
- configurable product with full selection: purchasedSku becomes selectedVariant.sku and purchasedVariantLabel is derived from the selected option labels already shown in PDP state if available
- ProductDetailContent passes ReviewTarget into ProductReviews, and ProductReviews passes it into ReviewForm
```

Before wiring the helpful UI, add a tiny client-side utility such as `review-visitor-key.ts` that:

```ts
- reads a persisted visitor key from localStorage
- creates one with crypto.randomUUID() when absent
- returns the same key for upload/helpful/read requests on this device
```

Required prop and local-state direction:

```ts
interface ReviewTarget {
  productSku: string;
  purchasedSku: string | null;
  purchasedVariantLabel: string | null;
  requiresVariantSelection: boolean;
}
```

Required UI behaviors:

```txt
- half-star selection with visible numeric value
- purchased SKU confirmation block
- upload button + preview chips/cards
- remove and retry actions per file
- submit disabled while variant selection is incomplete
- submit disabled while uploads are pending or failed
```

- [ ] **Step 4: Run Prism tests again after ReviewForm changes**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Run full Prism tests and typecheck**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

Run: `pnpm nx run prism:typecheck`
Expected: PASS.

- [ ] **Step 6: Commit ReviewForm and variant-flow changes**

```bash
git -C "D:/WORK/prism" add \
  apps/prism/app/products/[sku]/ReviewForm.tsx \
  apps/prism/app/products/[sku]/ProductDetailContent.tsx \
  apps/prism/app/products/[sku]/ProductReviews.tsx \
  apps/prism/tests/ReviewForm.spec.tsx
git -C "D:/WORK/prism" commit -m "feat(reviews): rebuild review form for variant-aware mobile submission"
```

### Task 7: Rebuild Review Browsing UI for Mobile, Media, Helpful, and Half-Star Summary

**Files:**

- Modify: `apps/prism/app/products/[sku]/ProductReviews.tsx`
- Create: `apps/prism/tests/ProductReviews.spec.tsx`

- [ ] **Step 1: Write the failing ProductReviews UI test**

```tsx
it('renders purchased variant labels, half-star ratings, and helpful actions', () => {
  render(
    <ProductReviews sku="PARENT" initialReviews={[review]} summary={summary} />
  );

  expect(screen.getByText('Black / 2 Pack')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /helpful/i })).toBeInTheDocument();
  expect(screen.getByText(/4.5 out of 5/i)).toBeInTheDocument();
});

it('renders mobile-first summary above the review list', () => {
  expect(screen.getByTestId('reviews-summary')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the Prism test command to confirm failure**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: FAIL because the UI does not yet expose these elements.

- [ ] **Step 3: Implement minimal ProductReviews redesign**

Required rendering directions:

```txt
- summary card first on mobile
- half-star average with partial-fill stars
- 9-row distribution display
- attachment strip for image/video media
- helpful button with selected and disabled state
- sort control for newest/highest rating/most helpful
- purchased variant label visible in each card
```

- [ ] **Step 4: Run Prism tests again after ProductReviews changes**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Run full Prism verification commands**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

Run: `pnpm nx lint prism`
Expected: PASS.

Run: `pnpm nx run prism:typecheck`
Expected: PASS.

- [ ] **Step 6: Commit browsing UI changes**

```bash
git -C "D:/WORK/prism" add \
  apps/prism/app/products/[sku]/ProductReviews.tsx \
  apps/prism/tests/ProductReviews.spec.tsx
git -C "D:/WORK/prism" commit -m "feat(reviews): redesign review browsing for mobile and media"
```

### Task 8: End-to-End Cross-Repo Verification and Cleanup

**Files:**

- Review: `docs/superpowers/specs/2026-03-26-customer-reviews-optimization-design.md`
- Review: `docs/superpowers/plans/2026-03-26-customer-reviews-optimization.md`
- Review: Prism and Strapi files changed in Tasks 1-7

- [ ] **Step 1: Run final Prism verification suite**

Run: `pnpm nx test prism -- --run --reporter=verbose && pnpm nx lint prism && pnpm nx run prism:typecheck`
Expected: PASS.

- [ ] **Step 2: Run final Strapi build verification**

Run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 3: Verify upload, create, and helpful flows manually**

Manual verification checklist:

```txt
- configurable product without selected variant blocks review submit
- selected variant review submits with productSku and purchasedSku
- image upload succeeds
- one video upload up to 20 MB succeeds
- second video is rejected before submit
- review card shows purchased variant label
- review summary shows fractional average and 9 distribution rows
- helpful vote increments once and remains selected on second attempt from same visitor key
```

- [ ] **Step 4: Review diffs for drift against spec**

Check both repositories for any accidental work outside the planned files. If extra changes exist, either justify them or remove them before claiming completion.

- [ ] **Step 5: Create final commits if cleanup was needed**

```bash
# Only if cleanup edits were required after verification
```

- [ ] **Step 6: Prepare handoff notes**

Summarize:

```txt
- exact Prism files changed
- exact Strapi files changed
- commands run and outcomes
- any residual risks, especially upload limits and summary delete behavior
```
