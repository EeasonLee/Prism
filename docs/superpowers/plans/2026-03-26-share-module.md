# Share Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable share module for Prism, integrate it into the product detail page, and leave a clean extension path for future article, recipe, and category page reuse.

**Architecture:** The implementation keeps share behavior split into three units: reusable client-side share primitives in `app/components/share/`, product-specific target normalization in `app/products/[sku]/`, and PDP integration at the existing shell layer that already coordinates configurable selection state. Mobile prefers native share, desktop uses an explicit popover menu, and all explicit fallback actions are driven from a normalized `ShareTarget`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Nx, Vitest, Testing Library, existing Prism design tokens and app component patterns.

---

## Preconditions

- Before implementation begins, update the `share-module` worktree so it includes the current PDP shell refactor from the main working tree. The approved spec and this plan assume `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx` exists and owns shell-level variant selection state.
- If that refactor has not been cherry-picked or otherwise synced into the worktree yet, do that first before starting Task 1.

## File map

### Create

- `apps/prism/app/components/share/types.ts` — normalized share types and supported channel unions
- `apps/prism/app/components/share/build-share-channel-url.ts` — builders for email and Facebook fallback URLs
- `apps/prism/app/components/share/useShareActions.ts` — client-side execution for native share, copy link, and fallback action handling
- `apps/prism/app/components/share/ShareMenu.tsx` — desktop share action list container
- `apps/prism/app/components/share/ShareSheet.tsx` — mobile fallback action container
- `apps/prism/app/components/share/ShareTrigger.tsx` — reusable trigger and orchestration entry point
- `apps/prism/app/components/share/index.ts` — local barrel if needed by app usage patterns
- `apps/prism/app/products/[sku]/build-product-share-target.ts` — product-specific share target normalization, including optional variant-aware URL logic
- `apps/prism/tests/share/build-share-channel-url.spec.ts` — unit coverage for channel URL generation
- `apps/prism/tests/share/build-product-share-target.spec.ts` — unit coverage for PDP share target normalization
- `apps/prism/tests/share/ShareTrigger.spec.tsx` — component tests for trigger behavior and fallback actions

### Modify

- `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx` — build the current PDP share target from shell-level selection state and pass it into detail content
- `apps/prism/app/products/[sku]/ProductDetailContent.tsx` — render the share trigger in the agreed secondary-action location
- `apps/prism/app/products/[sku]/page.tsx` — only if needed for metadata follow-up notes or prop flow alignment discovered during implementation

### Reuse / inspect during implementation

- `apps/prism/app/products/[sku]/ProductDetailClient.tsx` — source of configurable-selection behavior already feeding the shell
- `apps/prism/app/products/[sku]/ProductReviews.tsx` — verify sharing changes do not disturb review target behavior
- `apps/prism/tests/DiscoveryProductCard.spec.tsx` — reference for existing component test style in the app
- `apps/prism/project.json` via `pnpm exec nx show project prism` — confirm test target wiring if adding new test files changes execution expectations

---

### Task 1: Define share primitives

**Files:**

- Create: `apps/prism/app/components/share/types.ts`
- Create: `apps/prism/app/components/share/build-share-channel-url.ts`
- Test: `apps/prism/tests/share/build-share-channel-url.spec.ts`

- [ ] **Step 1: Write the failing tests for share channel builders**

```ts
import { describe, expect, it } from 'vitest';
import {
  buildEmailShareUrl,
  buildFacebookShareUrl,
} from '@/app/components/share/build-share-channel-url';

describe('build-share-channel-url', () => {
  it('builds an email share URL with encoded subject and body', () => {
    expect(
      buildEmailShareUrl({
        title: 'Joydeem Air Fryer',
        url: 'https://example.com/products/JD-AF550',
        text: 'Check this out',
      })
    ).toContain('mailto:?');
  });

  it('builds a Facebook share URL from the normalized target URL', () => {
    expect(
      buildFacebookShareUrl({
        title: 'Joydeem Air Fryer',
        url: 'https://example.com/products/JD-AF550',
      })
    ).toContain(encodeURIComponent('https://example.com/products/JD-AF550'));
  });
});
```

- [ ] **Step 2: Run the new spec to verify it fails**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/build-share-channel-url.spec.ts`
Expected: FAIL because the share types/builders do not exist yet.

- [ ] **Step 3: Implement minimal share types and channel URL builders**

Create `types.ts` with the normalized `ShareTarget` and narrow channel unions used by phase 1. Create `build-share-channel-url.ts` with minimal pure functions for:

- `buildEmailShareUrl(target)`
- `buildFacebookShareUrl(target)`

Keep these functions pure and fully URL-encoded. No browser globals should be required.

- [ ] **Step 4: Run the spec to verify it passes**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/build-share-channel-url.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit the primitive layer**

```bash
git add apps/prism/app/components/share/types.ts apps/prism/app/components/share/build-share-channel-url.ts apps/prism/tests/share/build-share-channel-url.spec.ts
git commit -m "feat(share): add share channel builders"
```

### Task 2: Build PDP share-target normalization

**Files:**

- Create: `apps/prism/app/products/[sku]/build-product-share-target.ts`
- Test: `apps/prism/tests/share/build-product-share-target.spec.ts`
- Inspect: `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx`

- [ ] **Step 1: Write the failing tests for product share target normalization**

```ts
import { describe, expect, it } from 'vitest';
import { buildProductShareTarget } from '@/app/products/[sku]/build-product-share-target';

describe('buildProductShareTarget', () => {
  it('returns the canonical PDP URL when no complete variant is selected', () => {
    const target = buildProductShareTarget({
      product: {
        sku: 'JD-AF550',
        display_name: 'Joydeem Air Fryer',
        type_id: 'configurable',
      } as never,
      origin: 'https://example.com',
      pathname: '/products/JD-AF550',
      selection: { selectedVariant: null, allSelected: false },
    });

    expect(target.url).toBe('https://example.com/products/JD-AF550');
  });

  it('adds a variant query parameter when configurable selection is complete', () => {
    const target = buildProductShareTarget({
      product: {
        sku: 'JD-AF550',
        display_name: 'Joydeem Air Fryer',
        type_id: 'configurable',
      } as never,
      origin: 'https://example.com',
      pathname: '/products/JD-AF550',
      selection: {
        selectedVariant: { sku: 'JD-AF550-BLACK' },
        allSelected: true,
      },
    });

    expect(target.url).toContain('?variant=JD-AF550-BLACK');
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/build-product-share-target.spec.ts`
Expected: FAIL because the builder does not exist yet.

- [ ] **Step 3: Implement the minimal product-target builder**

Create `build-product-share-target.ts` that accepts the current product, current pathname/origin inputs, and normalized selection state. It should:

- return a `ShareTarget`
- use canonical PDP URL by default
- append `variant` only when configurable selection is complete
- avoid duplicating configurable resolution logic already handled elsewhere

Do not add article/recipe builders yet.

- [ ] **Step 4: Run the spec to verify it passes**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/build-product-share-target.spec.ts`
Expected: PASS

- [ ] **Step 5: Commit the PDP adapter layer**

```bash
git add apps/prism/app/products/[sku]/build-product-share-target.ts apps/prism/tests/share/build-product-share-target.spec.ts
git commit -m "feat(share): add product share target builder"
```

### Task 3: Implement reusable client share actions

**Files:**

- Create: `apps/prism/app/components/share/useShareActions.ts`
- Modify: `apps/prism/app/components/share/types.ts`
- Test: `apps/prism/tests/share/ShareTrigger.spec.tsx`

- [ ] **Step 1: Write the failing tests for client share behavior**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShareTrigger } from '@/app/components/share/ShareTrigger';

describe('ShareTrigger', () => {
  it('copies the link when the copy action is selected', async () => {
    const user = userEvent.setup();
    render(
      <ShareTrigger
        target={{
          type: 'product',
          title: 'Joydeem Air Fryer',
          url: 'https://example.com/products/JD-AF550',
        }}
      />
    );

    await user.click(screen.getByRole('button', { name: /share/i }));
    await user.click(screen.getByRole('button', { name: /copy link/i }));

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/ShareTrigger.spec.tsx`
Expected: FAIL because `ShareTrigger` and share action orchestration do not exist yet.

- [ ] **Step 3: Implement minimal client action orchestration**

Create `useShareActions.ts` to encapsulate:

- native share capability detection
- native share invocation
- copy-link execution
- fallback channel execution metadata

Keep the hook small and UI-agnostic. It should return explicit action handlers and booleans needed by UI components.

- [ ] **Step 4: Update the test with any required browser mocks and rerun**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/ShareTrigger.spec.tsx`
Expected: still FAIL until presentation components exist, but the action layer should now be in place.

- [ ] **Step 5: Commit the client action layer**

```bash
git add apps/prism/app/components/share/useShareActions.ts apps/prism/app/components/share/types.ts apps/prism/tests/share/ShareTrigger.spec.tsx
git commit -m "feat(share): add client share actions"
```

### Task 4: Build share presentation components

**Files:**

- Create: `apps/prism/app/components/share/ShareMenu.tsx`
- Create: `apps/prism/app/components/share/ShareSheet.tsx`
- Create: `apps/prism/app/components/share/ShareTrigger.tsx`
- Create: `apps/prism/app/components/share/index.ts`
- Test: `apps/prism/tests/share/ShareTrigger.spec.tsx`

- [ ] **Step 1: Expand the existing component test to describe desktop and fallback UI**

Add expectations for:

- share trigger renders with accessible name `Share`
- desktop popover exposes `Copy link`, `Email`, and `Facebook`
- mobile/native unsupported paths can still reach explicit fallback actions

- [ ] **Step 2: Run the component test to verify it fails on missing UI**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/ShareTrigger.spec.tsx`
Expected: FAIL because the share presentation layer is still incomplete.

- [ ] **Step 3: Implement minimal presentation components**

Build the smallest UI that satisfies the agreed spec:

- text + icon share trigger
- desktop action container
- mobile fallback action container
- no extra channels
- no premature configurability

Use existing Prism tokens and shared UI patterns. Keep the trigger visually secondary.

- [ ] **Step 4: Run the component test to verify it passes**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/ShareTrigger.spec.tsx`
Expected: PASS

- [ ] **Step 5: Commit the presentation layer**

```bash
git add apps/prism/app/components/share/ShareMenu.tsx apps/prism/app/components/share/ShareSheet.tsx apps/prism/app/components/share/ShareTrigger.tsx apps/prism/app/components/share/index.ts apps/prism/tests/share/ShareTrigger.spec.tsx
git commit -m "feat(share): add share UI components"
```

### Task 5: Integrate share into PDP shell and summary content

**Files:**

- Modify: `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx`
- Modify: `apps/prism/app/products/[sku]/ProductDetailContent.tsx`
- Reuse: `apps/prism/app/products/[sku]/build-product-share-target.ts`
- Test: `apps/prism/tests/share/ShareTrigger.spec.tsx`

- [ ] **Step 1: Add the failing integration expectation**

Extend the existing component test, or add a focused PDP integration test, to assert that the PDP summary renders a `Share` action when given product detail props.

- [ ] **Step 2: Run the targeted test to verify it fails**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/ShareTrigger.spec.tsx`
Expected: FAIL because PDP does not yet pass a share target into the detail content.

- [ ] **Step 3: Implement minimal PDP integration**

Update `ProductDetailReviewShell.tsx` to build the current product share target from shell-level selection state and pass it to `ProductDetailContent.tsx`. Update `ProductDetailContent.tsx` to render the share trigger in the agreed location between product social proof and pricing context.

Do not move selection ownership again. Reuse the existing shell boundary.

- [ ] **Step 4: Run targeted tests and a focused repo check**

Run:

```bash
cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/ShareTrigger.spec.tsx
cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm check
```

Expected:

- share tests PASS
- `pnpm check` passes, or only shows pre-existing unrelated warnings that are understood and documented

- [ ] **Step 5: Commit PDP integration**

```bash
git add apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx apps/prism/app/products/[sku]/ProductDetailContent.tsx apps/prism/app/products/[sku]/build-product-share-target.ts apps/prism/tests/share/ShareTrigger.spec.tsx
git commit -m "feat(product): add share action to PDP"
```

### Task 6: Final verification and plan handoff

**Files:**

- Inspect: `docs/superpowers/specs/2026-03-26-share-module-design.md`
- Inspect: `docs/superpowers/plans/2026-03-26-share-module.md`

- [ ] **Step 1: Run final verification commands**

Run:

```bash
cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm check
cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm exec vitest run apps/prism/tests/share/build-share-channel-url.spec.ts apps/prism/tests/share/build-product-share-target.spec.ts apps/prism/tests/share/ShareTrigger.spec.tsx
```

Expected: PASS, or only known unrelated warnings that are explicitly recorded.

- [ ] **Step 2: Manually verify expected PDP behavior**

Run: `cd "/d/WORK/prism/.claude/worktrees/share-module" && pnpm dev`
Verify:

- `Share` appears in the PDP summary region
- desktop opens explicit actions
- copy link works
- configurable products without complete selection still share the canonical PDP URL
- complete configurable selection uses the variant-aware URL if implemented
- review and add-to-cart flows still behave as before

- [ ] **Step 3: Request code review before any merge decision**

Use `@superpowers:requesting-code-review` after implementation is complete and verification evidence is in hand.

- [ ] **Step 4: Commit any final fixes from verification**

```bash
git add <relevant files>
git commit -m "fix(share): address verification feedback"
```

- [ ] **Step 5: Decide branch completion workflow**

After review and verification, use `@superpowers:finishing-a-development-branch` to decide whether to open a PR, merge, or keep the worktree for follow-on work.
