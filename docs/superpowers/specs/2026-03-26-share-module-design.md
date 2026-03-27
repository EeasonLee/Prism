# Share Module Design

## Summary

Build a reusable, North America-friendly share capability for Prism that starts on product detail pages but is designed as a cross-content system capability. The first rollout targets PDP, with follow-on reuse for articles, recipes, category pages, and future campaign surfaces.

The module should prioritize modern sharing behavior over legacy social-button walls:

- Mobile: prefer native share when available
- Desktop: use a lightweight popover menu
- All surfaces: provide copy link as the primary explicit fallback action

The share module must remain business-agnostic. Product, article, recipe, and category pages build a normalized share target; the share system handles interaction, fallback behavior, feedback, and analytics.

## Goals

- Add a reusable share capability that matches contemporary North American ecommerce patterns
- Launch the first integration on PDP without making the design product-only
- Keep the UI visually secondary to primary commerce actions
- Support a clean extension path to article, recipe, category, and page-level sharing
- Establish clear boundaries for URL generation, metadata expectations, channel handling, and analytics

## Non-goals

- CMS-driven channel configuration in phase 1
- Poster generation, referral flows, or campaign share builders
- Sharing arbitrary filtered search or discovery state in phase 1
- Backend persistence of share counts in phase 1
- Creating a product-only component with hardcoded PDP logic in the share core

## Current context

### Prism changes

Current PDP structure has moved variant selection state up into `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx`, which coordinates both the detail content and review target state. `apps/prism/app/products/[sku]/ProductDetailContent.tsx` now receives the current `selection` and `onSelectionChange` from the shell rather than owning that state internally.

This matters for sharing because PDP share behavior may need to reflect complete variant selection in the final share URL, but that behavior should be decided in the product-specific adapter layer, not in the reusable share core.

### Strapi changes

No Strapi change is required for phase 1. Share behavior is frontend-only and consumes existing rendered page data.

### API/schema contract changes

No backend contract change is required for phase 1. The first version should rely on existing page data plus stable page URLs.

### Verification steps

Phase 1 verification should focus on:

- mobile native share behavior where supported
- desktop popover fallback behavior
- copy link feedback
- product page integration without disrupting variant selection or reviews
- ability to construct future share targets for non-product pages without changing the core module

## Proposed architecture

### 1. Share target normalization

All shareable surfaces should normalize their content into a small, shared target shape before invoking the share module.

```ts
interface ShareTarget {
  type: 'product' | 'article' | 'recipe' | 'category' | 'page';
  title: string;
  url: string;
  text?: string;
  imageUrl?: string;
  meta?: {
    id?: string;
    sku?: string;
    slug?: string;
  };
}
```

The share system must consume this shape only. It should not accept raw product, article, or recipe entities directly.

### 2. Layered module boundaries

The module should be split into three layers.

#### Core layer

Responsible for behavior and execution:

- native share capability detection
- copy-to-clipboard
- channel URL generation for supported fallback actions
- success/error normalization
- analytics event dispatch hooks

The core layer must not know about PDP, recipes, articles, or category-specific logic.

#### Presentation layer

Responsible for UI and interaction wrappers:

- share trigger button
- desktop popover menu
- mobile fallback bottom sheet
- action row rendering
- accessible labels and focus handling

The presentation layer consumes `ShareTarget` and core actions.

#### Content adapter layer

Responsible for converting page-specific data into `ShareTarget`.

Examples:

- `buildProductShareTarget(...)`
- `buildArticleShareTarget(...)`
- `buildRecipeShareTarget(...)`
- `buildCategoryShareTarget(...)`

Adapters decide the final URL and optional copy text for their own content type.

## Interaction design

### Trigger

Use a secondary action trigger labeled `Share` with icon + text. It must not compete visually with `Add to cart` or other primary commerce actions.

### Desktop

Desktop uses a lightweight popover menu. Recommended action order:

1. Copy link
2. Email
3. Facebook

Copy link should always appear first because it is the most broadly useful explicit desktop action.

### Mobile

Mobile uses a native-first flow:

1. attempt `navigator.share`
2. if unavailable, unsupported, or non-cancel failure occurs, fall back to a bottom sheet

The bottom sheet exposes the same explicit fallback actions as desktop.

### Feedback

Copy success should show a concise global toast such as `Link copied`.

Native share cancellation should be silent. Fallback paths should not display noisy errors.

## PDP integration

### Placement

On PDP, place the share trigger in the right-side summary column near product identity and social proof, as a secondary action near the purchase context rather than in the gallery or below long-form content.

Suggested information flow:

1. product identity (SKU, title, subtitle)
2. stock and rating
3. share secondary action
4. price and promotion context
5. options, quantity, add to cart

### PDP state boundary

Variant state already lives in `ProductDetailReviewShell`. The share integration for PDP should read the normalized selection state from this shell-level coordination rather than rebuilding product-option logic inside the share module.

The share system itself must remain unaware of configurable-product internals.

## URL and metadata rules

### URL ownership

The share system must never derive page routes on its own. It consumes the final URL built by the page adapter.

This keeps route semantics with the page that owns them and prevents the share core from becoming a routing abstraction.

### Canonical default

Phase 1 should default to stable canonical page URLs, not transient UI state.

That means phase 1 should not share:

- temporary filter state
- sort state
- open tabs
- review pagination
- arbitrary in-page UI conditions

### Variant-aware product sharing

PDP may optionally append a variant query parameter when a configurable product has a complete selection.

Rule:

- incomplete variant selection: share canonical PDP URL
- complete variant selection: product adapter may include a variant query parameter

This is an adapter concern, not a share-core concern.

### Metadata expectations

The module depends on good page metadata but does not generate it.

Each shareable page should maintain:

- clear title
- clear description
- stable canonical URL
- shareable OG image where available

For PDP, this means the product page metadata path will eventually need to be improved so that shared links render strong previews, but that work remains outside phase 1 share-core implementation.

## Channels

Phase 1 should support:

- native share when available
- copy link
- email
- Facebook fallback

This is intentionally narrow. The module should avoid looking like a legacy social-button wall.

The system should be structured so the supported channel list can be centrally changed later without rewriting each page integration.

## Analytics

Phase 1 should define analytics hooks even if full reporting is not wired immediately.

Recommended event semantics:

- `share_opened`
- `share_action_clicked`
- `share_completed`
- `share_copy_succeeded`

Recommended common fields:

- `content_type`
- `channel`
- `page_type`
- `surface`
- `used_native_share`
- `entity_id` or content-specific identifier such as `sku` or `slug`

This keeps future reporting consistent across products, recipes, and articles.

## Reuse path

Recommended rollout order:

1. product detail page
2. article page
3. recipe page
4. category page

This sequence validates the system on the highest-value commercial surface first, then proves that the abstraction is reusable on simpler content pages before category-specific URL questions are introduced.

## Suggested file boundaries

Phase 1 should keep the implementation inside `apps/prism` and split responsibilities into small, focused units.

Recommended structure:

- `apps/prism/app/components/share/ShareTrigger.tsx` for the visible trigger button
- `apps/prism/app/components/share/ShareMenu.tsx` for desktop popover content
- `apps/prism/app/components/share/ShareSheet.tsx` for mobile fallback sheet
- `apps/prism/app/components/share/useShareActions.ts` for client-side share execution and fallback orchestration
- `apps/prism/app/components/share/build-share-channel-url.ts` for email/Facebook URL builders
- `apps/prism/app/components/share/types.ts` for `ShareTarget` and related UI-facing types
- `apps/prism/app/products/[sku]/build-product-share-target.ts` for PDP-specific target normalization

This keeps the reusable share system close to app-level UI while leaving content-specific adaptation beside the owning route.

PDP integration should happen through `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx`, because that shell already owns normalized variant selection state shared between the purchase flow and reviews. The shell can build the current product share target and pass it into the share trigger rendered inside `ProductDetailContent.tsx`.

Follow-on page types should follow the same pattern:

- reusable UI and action logic stays in `app/components/share/`
- page-specific normalization stays beside the owning page or domain component

## Testing strategy

Phase 1 should cover:

- unit tests for share target builders
- unit tests for channel URL generation and copy-link helpers
- component tests for desktop popover rendering and fallback actions
- component tests for PDP integration with complete and incomplete configurable selection
- manual verification of native share on supported mobile browsers/devices
- regression verification that variant selection and review submission behavior remain intact on PDP

## Risks and mitigations

### Risk: product logic leaks into share core

Mitigation: keep variant-aware URL behavior only in the product adapter layer.

### Risk: overexposed social UI feels dated

Mitigation: keep the trigger text-based and keep channels behind a menu or sheet.

### Risk: weak link previews reduce share quality

Mitigation: treat metadata quality as a separate page-level requirement and document it explicitly.

### Risk: future page integrations duplicate channel logic

Mitigation: centralize channel action generation and require all surfaces to normalize to `ShareTarget` first.

## Recommended implementation direction

Implement the module as a reusable frontend system capability with a product-first rollout. Use native share first on mobile, popover fallback on desktop, and keep copy link as the primary explicit fallback action. PDP should integrate through shell-level selection state, while future content types reuse the same normalized target and UI primitives without changing the core.
