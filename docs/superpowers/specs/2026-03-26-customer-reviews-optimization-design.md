# Customer Reviews Optimization Design

## Goal

Upgrade the product detail page Customer Reviews module into a mobile-first, production-ready review system that supports image and video attachments, lightweight helpful voting, half-star ratings across submission and display, and explicit association between each review and the purchased SKU variant.

## Confirmed Product Decisions

- Delivery target: real production-ready design, including Strapi contract changes.
- Helpful model: lightweight mode. Any visitor can mark a review helpful. Prism suppresses repeat interactions on the same device, while Strapi stores lightweight dedupe records server-side.
- Media model: standard UGC. Up to 6 attachments total, allowing images plus at most 1 video.
- Upload constraints: images up to 5 MB each, video up to 20 MB.
- Rating model: half-star supported in submission, list display, summary display, and distribution display.
- Mobile priority: optimize both submission and browsing flows, treating mobile as the primary design target with desktop enhancement.

## Current State

### Prism changes

Current review UX is implemented primarily in `apps/prism/app/products/[sku]/ProductReviews.tsx`, `apps/prism/app/products/[sku]/ReviewForm.tsx`, `apps/prism/app/api/reviews/[sku]/route.ts`, and `apps/prism/lib/api/strapi/reviews.ts`.

Today the module has four structural limitations:

- Submission only accepts integer ratings, title, and text content.
- Helpful count is read-only UI with no interaction path.
- Reviews have no media fields or upload flow.
- Layout is optimized for desktop first, with a two-column desktop-oriented presentation that does not translate well to mobile interaction.

### Strapi changes

Current backend review support lives in `D:\WORK\helpcenter\backend` under:

- `src/api/product-review/...`
- `src/api/product-review-summary/...`

Current constraints:

- `rating` is integer-only and validated as `1..5`.
- Review summaries only support whole-star distribution buckets.
- `helpful_count` exists as a field but has no write endpoint.
- There is no media relation on reviews.
- Reviews are deduplicated by `(sku, magento_user_id)` for pending and approved records.

The upload plugin already exists and supports Strapi media upload patterns. Existing content types in the backend already use multi-image media fields, so media attachment is additive rather than a novel storage capability.

## Recommended Architecture

Use one review record as the primary entity, with additive extensions for media, SKU identity, and helpful vote tracking.

### Prism changes

Prism remains the composition layer and user experience owner.

- `ReviewForm` becomes a mobile-first review composer with five logical sections: rating, purchased SKU identity, text review, media attachments, and submit status.
- `ProductReviews` becomes a mobile-first review browser with summary, half-star distribution, sorting/filter controls appropriate to narrow viewports, helpful action, and attachment gallery/video preview.
- `app/api/reviews/[sku]/route.ts` continues acting as a BFF boundary so page components do not depend directly on raw Strapi response shapes.
- `lib/api/strapi/reviews.ts` becomes the normalized contract adapter for list, summary, create, and helpful endpoints.

### Strapi changes

Strapi owns persistent review data and aggregation.

- Extend `product-review` with media relations and dual-SKU identity.
- Add a lightweight `review-helpful-vote` collection type to support dedupe and future extensibility.
- Change rating storage from integer to decimal with 0.5-step validation.
- Extend review summary storage and recomputation logic to support half-star distribution buckets.

### API/schema contract changes

Prism should continue to consume a normalized review contract. Strapi storage remains snake_case, while the BFF and app-facing adapters normalize to camelCase.

Strapi storage fields:

- `product_sku`
- `purchased_sku`
- `purchased_variant_label`
- `author_name`
- `helpful_count`
- `review_status`

Prism-facing normalized contract:

```ts
interface ProductReviewMedia {
  id: number;
  kind: 'image' | 'video';
  url: string;
  width: number | null;
  height: number | null;
  mime: string | null;
  alt: string | null;
  posterUrl: string | null;
}

interface ProductReview {
  id: number;
  documentId?: string;
  productSku: string;
  purchasedSku: string;
  purchasedVariantLabel: string | null;
  authorName: string;
  rating: number; // 1.0 to 5.0 in 0.5 steps
  title: string;
  content: string;
  media: ProductReviewMedia[];
  verified: boolean; // always false in this release unless backend verification is explicitly added
  helpfulCount: number;
  viewerHasMarkedHelpful: boolean;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string | null;
  updatedAt: string | null;
}

interface ProductReviewSummary {
  sku: string;
  average: number;
  total: number;
  distribution: Record<
    '1' | '1.5' | '2' | '2.5' | '3' | '3.5' | '4' | '4.5' | '5',
    number
  >;
}
```

## Purchased SKU Association

This is required for correctness and should be first-class in the data model.

### Problem

A product detail page may aggregate reviews at the parent or PDP SKU level, but an actual buyer often reviews a specific purchased variant SKU. If only a single SKU is stored, the system cannot accurately express which variant the review refers to.

### Design

Each review stores two SKU identities:

- `product_sku`: the PDP aggregation SKU used to query and summarize reviews for the current product page.
- `purchased_sku`: the specific variant SKU the user is reviewing.

Optional but recommended:

- `purchased_variant_label`: a presentation-friendly label such as `Vanilla / 12 Pack`.

### Behavioral rule

- Simple products: `product_sku` and `purchased_sku` are the same.
- Configurable products: the user must select a complete variant before submitting a review.
- Review listing on PDP aggregates by `product_sku` but displays the specific `purchased_sku` or `purchased_variant_label` in each card.

### Deduplication rule

Change dedupe semantics from `(sku, magento_user_id)` to `(purchased_sku, magento_user_id)` for pending and approved reviews.

That keeps the model aligned to the actual reviewed purchase target and avoids multiple reviews for the same variant from the same account, while still allowing future business decisions about whether different purchased SKUs under one parent should be separately reviewable.

### Migration strategy

Existing rows only have the legacy `sku` field semantics. During rollout:

- backfill `product_sku = sku`
- backfill `purchased_sku = sku`
- backfill `purchased_variant_label = null`
- keep old reviews queryable in the same PDP aggregation path

This keeps legacy reviews visible and avoids blocking deployment on historical Magento variant reconstruction. New reviews follow the dual-SKU model immediately after rollout.

## Detailed Design

### 1. Review submission flow

### Prism changes

The submission experience should be optimized for touch input and constrained screens.

Mobile-first structure:

1. Rating selector with half-star granularity and explicit numeric feedback.
2. Purchased SKU confirmation area.
3. Title and review text fields.
4. Media picker with upload constraints and previews.
5. Submission footer with concise system feedback.

Expected behavior:

- Rating control supports 0.5 increments via tap targets large enough for mobile.
- For configurable products, review submission is disabled until a full variant is selected.
- The selected variant label is shown before submission so users understand what SKU they are reviewing.
- Users can attach up to 6 files total, with at most 1 video.
- Client-side validation blocks invalid combinations before network calls.
- Client-side validation enforces per-file size and media type constraints.
- Uploaded items show preview, remove action, and upload-state feedback.

### Variant selection data flow

`ReviewForm` should no longer receive only `sku`. It should receive a review target payload from the product-detail parent, derived from the same variant selection state already managed by `ProductDetailContent` and `ProductDetailClient`.

Recommended app-facing shape:

```ts
interface ReviewTarget {
  productSku: string;
  purchasedSku: string | null;
  purchasedVariantLabel: string | null;
  requiresVariantSelection: boolean;
}
```

Behavior:

- `ProductDetailContent` derives `ReviewTarget` from current selected variant state.
- simple product: `purchasedSku = productSku`
- configurable product without full selection: `purchasedSku = null`, `requiresVariantSelection = true`
- configurable product with full selection: `purchasedSku = selectedVariant.sku`
- `ProductReviews` passes the target to `ReviewForm`
- `ReviewForm` blocks submit while `requiresVariantSelection` is true

### Strapi changes

The backend should use the existing upload plugin in a two-step flow:

1. Prism uploads files to Strapi standard upload endpoint `POST /api/review-media/upload` and receives file IDs.
2. Prism submits the review create request including those media IDs.

Upload orchestration for this release stays inside Prism's BFF boundary rather than calling Strapi directly from page components.

Recommended request flow:

- page component sends multipart upload request to a new Prism route such as `POST /api/reviews/upload`
- Prism route forwards the multipart payload to project-controlled Strapi endpoint `POST /api/review-media/upload`
- Strapi endpoint validates `REVIEW_UPLOAD_TOKEN` and review media rules before calling the upload plugin service
- Prism route returns normalized upload results to the client
- final review submit goes through existing review BFF route with media IDs included

Partial upload failure behavior:

- any failed file remains in error state in the client preview list
- successful uploads may remain attached in UI memory
- review submission is blocked while any selected file is still failed or pending
- user can remove failed files or retry them before final submit
- final submit only sends successfully uploaded Strapi media IDs

`product-review` additions:

- `product_sku: string` required
- `purchased_sku: string` required
- `purchased_variant_label: string | null`
- `media: media[]` allowing images and videos, multiple

`rating` changes:

- change field type to decimal
- validate `>= 1`, `<= 5`, and `% 0.5 === 0`

Review create validation should also enforce:

- maximum 6 attachments total
- maximum 1 video
- image max size 5 MB
- video max size 20 MB

If upload plugin global size limit remains 10 MB, backend configuration must be raised to at least accommodate the chosen video limit.

## 2. Helpful voting

### Design choice

Although the product requirement is lightweight voting, backend state should not be a blind increment. Use a lightweight vote record to avoid the most obvious duplicate abuse and leave room for future auth-based voting.

### Strapi changes

Add `review-helpful-vote` collection type with fields like:

- `review_document_id` or relation to `product-review`
- `dedupe_key`
- `createdAt`

`dedupe_key` can be derived from a lightweight visitor identity passed by Prism, for example a stable client-generated UUID persisted in local storage and optionally combined with review identifier. Exact anti-abuse hardening is not the goal here; the purpose is reasonable duplicate suppression.

Expose endpoint:

- `POST /api/product-reviews/:documentId/helpful`

Behavior:

- if the dedupe key has already voted for this review, return current count without incrementing
- otherwise create vote record and increment or recompute `helpful_count`
- response returns at least `{ helpfulCount, viewerHasMarkedHelpful }`

### Read-time viewer state

`viewerHasMarkedHelpful` is computed in the BFF-backed read path using the same visitor key used for write operations.

Recommended read flow:

- Prism generates or reuses a persistent visitor key in local storage
- review list requests send the key to a Prism read endpoint or as a header/query to the existing BFF route
- Prism BFF forwards the key to Strapi when fetching review list data
- Strapi resolves whether each returned review already has a matching helpful vote for that key
- Prism normalizes that result into `viewerHasMarkedHelpful`

This keeps viewer-specific state out of static page code and prevents page components from needing Strapi-specific knowledge.

### Prism changes

- Generate or reuse a persistent client visitor key in local storage.
- Pass it through the BFF route rather than calling Strapi directly from components.
- Update helpful UI optimistically only after basic request success.
- After a vote is recorded, disable repeat interaction for that device and show selected state.

This matches the chosen product direction: open-to-all lightweight helpful voting, but not a naive unaudited counter.

## 3. Half-star rating support

### Strapi changes

- Change review `rating` from integer to decimal.
- Update controller validation to accept `0.5` steps.
- Update summary schema to include half-star buckets.
- Update recomputation lifecycle to map decimal values into explicit bucket fields.

Recommended summary storage fields:

- `dist_5`
- `dist_4_5`
- `dist_4`
- `dist_3_5`
- `dist_3`
- `dist_2_5`
- `dist_2`
- `dist_1_5`
- `dist_1`

Expose normalized response keys as numeric strings or numbers through the BFF. Prism should not depend on Strapi field naming.

### Prism changes

- Summary star visuals use partial fill rather than rounded integer star display.
- Review cards show each review’s half-star rating visually and numerically.
- Distribution panel displays all supported half-step rows.
- PDP header summary should also render the correct fractional average.

## 4. Mobile-first review browsing

### Prism changes

The browsing experience should stop assuming desktop width.

Recommended interaction model:

- Default to single-column review cards on mobile.
- Keep summary card above the list on mobile, not sticky sidebar.
- Introduce compact sort/filter controls suitable for touch.
- On desktop, restore two-column or split layout as an enhancement.

Recommended mobile card content order:

1. author + verified badge + date
2. purchased SKU / variant label
3. half-star rating
4. title
5. body text
6. attachment strip
7. helpful action

Recommended sort/filter scope for this release:

- sort by newest
- sort by highest rating
- sort by most helpful
- optional filter by rating bucket

Backend sorting is in scope for this release. Strapi `by-sku` should accept normalized sort parameters so pagination remains correct across mobile and desktop views. Rating-bucket filtering may be deferred to a later backend enhancement if needed, but sort behavior should not stay client-only in production.

## 5. Verification and purchase semantics

### Current reality

Current backend sets `verified` to false on create with no purchase verification path.

### This release

Do not fake stronger verified behavior. In this release, `verified` remains persisted and returned as `false` by default. Storing `purchased_sku` is informational and future-safe, but it does not trigger order validation in this iteration unless Magento order checks are explicitly added later using `magento_user_id + purchased_sku`.

### Future-safe design

By storing `purchased_sku`, the system becomes ready for a future verified-purchase check against actual order history for the exact variant.

## Endpoint inventory

### Prism BFF endpoints

- `GET /api/reviews/:sku?page=:page&pageSize=:pageSize&sort=:sort`
  Returns normalized review list with `viewerHasMarkedHelpful` resolved for the current visitor key.
- `POST /api/reviews/:sku`
  Accepts normalized review create payload including `productSku`, `purchasedSku`, `purchasedVariantLabel`, `rating`, `title`, `content`, and uploaded `mediaIds`.
- `POST /api/reviews/upload`
  Accepts multipart file upload, proxies to Strapi upload API, and returns normalized media payloads.
- `POST /api/reviews/helpful`
  Accepts review `documentId` plus visitor key context, proxies to Strapi helpful endpoint, and returns `{ helpfulCount, viewerHasMarkedHelpful }`.

### Strapi endpoints

- `POST /api/review-media/upload`
  Standard upload endpoint used behind Prism BFF.
- `POST /api/product-reviews`
  Extended create endpoint accepting dual-SKU fields and media IDs.
- `GET /api/product-reviews/by-sku/:sku?page=:page&pageSize=:pageSize&sort=:sort`
  Returns approved reviews populated with media and purchased SKU metadata.
- `POST /api/product-reviews/:documentId/helpful`
  Creates a deduplicated helpful vote and returns current helpful state.
- `GET /api/product-review-summaries/by-sku/:sku`
  Returns half-star-capable summary distribution.

Recommended sort values for this release:

- `newest`
- `highest_rating`
- `most_helpful`

## Error handling

### Prism changes

Client should provide concise user-facing feedback for:

- invalid media count or type combinations
- oversize image or video
- upload failure per file
- review submit failure
- helpful vote failure
- missing variant selection for configurable products

All messages remain English-only per repository rules.

### Strapi changes

Return structured error payloads that the BFF can normalize into stable messages for the UI. Media validation failures should identify the violated rule when possible.

## Testing Strategy

### Prism changes

Add or update tests for:

- half-star selector behavior
- configurable product review submission blocking until variant selection
- client-side media validation rules
- successful normalization of media-rich review payloads
- helpful button state transition and duplicate suppression behavior
- mobile layout rendering expectations where practical

### Strapi changes

Add backend tests for:

- review create with decimal rating
- review create rejection for invalid step values
- review create with valid image/video combinations
- review create rejection for too many files or too many videos
- helpful endpoint duplicate suppression
- summary recomputation with half-star bucket counts
- by-SKU response includes media and purchased SKU metadata
- by-SKU sort behavior for `newest`, `highest_rating`, and `most_helpful`

### Cross-repo integration verification

Add integration coverage for:

- Prism upload proxy to Strapi upload endpoint
- upload success followed by review create with returned media IDs
- partial upload failure followed by retry/remove flow
- helpful vote request from Prism BFF through Strapi dedupe path
- BFF normalization of Strapi media, summary, and viewer helpful state into Prism contracts

## Files Likely To Change

### Prism changes

- `apps/prism/app/products/[sku]/ReviewForm.tsx`
- `apps/prism/app/products/[sku]/ProductReviews.tsx`
- `apps/prism/app/products/[sku]/ProductDetailContent.tsx`
- `apps/prism/app/api/reviews/[sku]/route.ts`
- new `apps/prism/app/api/reviews/upload/route.ts`
- new or extended helpful BFF route under `apps/prism/app/api/reviews/`
- `apps/prism/lib/api/strapi/reviews.ts`
- potentially product detail tests and review-specific specs under `apps/prism/tests/`

The product-detail side also needs a small data-flow update so review components receive `ReviewTarget` derived from the selected variant rather than only the page SKU.

### Strapi changes

- `src/api/product-review/content-types/product-review/schema.json`
- `src/api/product-review/controllers/product-review.js`
- `src/api/product-review/routes/custom.js`
- `src/api/product-review/content-types/product-review/lifecycles.js`
- `src/api/product-review-summary/content-types/product-review-summary/schema.json`
- `src/api/product-review-summary/controllers/product-review-summary.js`
- new `src/api/review-helpful-vote/...`
- possibly upload plugin configuration if video limit must exceed current global ceiling

## Non-Goals

This release does not attempt to add:

- full moderation workflow redesign
- cancelable helpful votes
- abuse detection or rate-limiting beyond lightweight dedupe
- multi-locale review content
- verified-purchase order reconciliation, unless explicitly scoped later
- advanced review media editing after submission

## Recommended Delivery Order

1. Extend Strapi review schema for dual SKU identity and half-star ratings.
2. Extend summary schema and recomputation logic.
3. Add media relation handling and upload constraints.
4. Add helpful vote model and endpoint.
5. Update Prism BFF and normalized review types.
6. Rebuild review form for mobile-first submission.
7. Rebuild review list for mobile-first browsing and helpful interactions.
8. Verify end-to-end contract behavior across both repositories.

## Open Technical Risks

- Strapi upload size configuration currently appears too low for a 20 MB video target and likely needs adjustment.
- Existing summary recomputation does not handle delete events, which may leave aggregates stale if moderation tooling deletes records.
- If PDP aggregation SKU differs from Magento purchase SKU conventions in edge cases, product detail code must define a single authoritative `product_sku` mapping rule before implementation.

## Success Criteria

The feature is complete when:

- users can submit reviews with half-star ratings and valid attachments
- each review clearly states the purchased variant SKU it refers to
- PDP review summary and list correctly reflect half-star data
- visitors can mark reviews helpful once per device-like identity
- the entire review experience is comfortable and legible on mobile without sacrificing desktop usability
- Prism and Strapi contracts are explicit, tested, and stable
