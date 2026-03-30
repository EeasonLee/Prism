# Product Attributes Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Phase 1 product attributes module so Strapi can manage PDP specifications as repeatable rows and Prism can render them as a new Specifications section on product detail pages.

**Architecture:** Phase 1 keeps backend scope intentionally light: extend Strapi `product-enrichment` with a `specifications` repeatable component, then normalize that raw component data in Prism’s existing `product-enrichment` adapter. Prism continues to aggregate through `fetchUnifiedProductBySku`, and the PDP renders a dedicated `Specifications` section only when normalized groups exist.

**Tech Stack:** Strapi v5 content-types/components, Next.js App Router, TypeScript, Vitest, Nx, pnpm

---

## File Structure

### Strapi changes

- Create: `D:\WORK\helpcenter\backend\src\components\product\specification-row.json`
  - Purpose: Define the Phase 1 repeatable specification row component used inside `product-enrichment`
- Modify: `D:\WORK\helpcenter\backend\src\api\product-enrichment\content-types\product-enrichment\schema.json`
  - Purpose: Add the `specifications` repeatable component field to the existing product enrichment content-type

### Prism adapter and type changes

- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\lib\api\strapi\product-enrichment.ts`
  - Purpose: Add raw Strapi specification row types, normalization helpers, and `specifications` output on `StrapiProductEnrichment`
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\lib\api\unified-product.ts`
  - Purpose: Extend `UnifiedProduct` and `mergeProduct()` to expose normalized specifications
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\app\products\[sku]\product-detail-data.ts`
  - Purpose: Add Specifications section-nav support

### Prism UI changes

- Create: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\app\products\[sku]\ProductSpecifications.tsx`
  - Purpose: Render grouped specification tables for the PDP
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\app\products\[sku]\page.tsx`
  - Purpose: Insert the Specifications section into the PDP flow after Details and before Recipes

### Tests

- Create: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\tests\product-specifications-api.spec.ts`
  - Purpose: TDD coverage for Strapi raw-data normalization into `ProductSpecificationGroup[]`
- Create: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\tests\product-detail-data.spec.ts`
  - Purpose: TDD coverage for section-nav behavior when specifications are present or absent
- Create: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\tests\ProductSpecifications.spec.tsx`
  - Purpose: TDD coverage for rendering grouped specification rows and hiding empty states

---

### Task 1: Add Strapi Specification Row Schema

**Files:**
- Create: `D:\WORK\helpcenter\backend\src\components\product\specification-row.json`
- Modify: `D:\WORK\helpcenter\backend\src\api\product-enrichment\content-types\product-enrichment\schema.json`

- [ ] **Step 1: Write the schema file for the new repeatable component**

```json
{
  "collectionName": "components_product_specification_rows",
  "info": {
    "displayName": "Product Specification Row",
    "description": "商品规格表行，用于 PDP Specifications 区块"
  },
  "options": {
    "timestamps": false
  },
  "attributes": {
    "group_key": {
      "type": "string",
      "required": true,
      "maxLength": 100
    },
    "group_title": {
      "type": "string",
      "required": true,
      "maxLength": 100
    },
    "key": {
      "type": "string",
      "required": true,
      "maxLength": 100
    },
    "label": {
      "type": "string",
      "required": true,
      "maxLength": 150
    },
    "value": {
      "type": "text",
      "required": true,
      "maxLength": 500
    },
    "sort_order": {
      "type": "integer",
      "default": 0,
      "min": 0
    },
    "is_highlighted": {
      "type": "boolean",
      "default": false
    },
    "enabled": {
      "type": "boolean",
      "default": true
    }
  }
}
```

- [ ] **Step 2: Extend `product-enrichment` to include the repeatable component**

```json
"specifications": {
  "type": "component",
  "repeatable": true,
  "component": "product.specification-row",
  "description": "商品规格表数据，用于 PDP Specifications 区块"
}
```

- [ ] **Step 3: Verify the schema diff is minimal and scoped only to Phase 1**

Run: `git -C "D:/WORK/helpcenter/backend" diff -- src/components/product/specification-row.json src/api/product-enrichment/content-types/product-enrichment/schema.json`
Expected: Only the new component file and the added `specifications` field appear.

- [ ] **Step 4: Build Strapi to catch schema errors**

Run: `cd "/mnt/d/WORK/helpcenter/backend" && npm run build`
Expected: Strapi build completes successfully with no schema validation errors.

- [ ] **Step 5: Restart Strapi to load the new component schema**

Run: `cd "/mnt/d/WORK/helpcenter/backend" && npm run develop`
Expected: Strapi starts successfully and the `specification-row` component is available in the admin UI.

- [ ] **Step 6: Commit the backend schema change**

```bash
git -C "D:/WORK/helpcenter/backend" add src/components/product/specification-row.json src/api/product-enrichment/content-types/product-enrichment/schema.json
git -C "D:/WORK/helpcenter/backend" commit -m "feat(product-enrichment): add specification row component"
```

### Task 2: Normalize Specifications in the Prism Strapi Adapter

**Files:**
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\lib\api\strapi\product-enrichment.ts`
- Test: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\tests\product-specifications-api.spec.ts`

- [ ] **Step 1: Write the failing adapter tests first**

Add tests covering these cases in `apps/prism/tests/product-specifications-api.spec.ts`:

```ts
it('groups raw specification rows by group_key and group_title', async () => {
  // expect specifications to become grouped output
});

it('filters disabled rows and empty values', async () => {
  // enabled === false and blank value should be removed
});

it('sorts rows within a group by sort_order ascending', async () => {
  // lower sort_order appears first
});

it('does not return empty groups', async () => {
  // groups with zero valid rows are omitted
});
```

- [ ] **Step 2: Run the new test file and confirm it fails**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/product-specifications-api.spec.ts`
Expected: FAIL because specification normalization types/helpers do not exist yet.

- [ ] **Step 3: Add the raw Strapi type and normalized output types**

In `apps/prism/lib/api/strapi/product-enrichment.ts`, add:

```ts
interface StrapiSpecificationRowRaw {
  group_key?: string | null;
  group_title?: string | null;
  key?: string | null;
  label?: string | null;
  value?: string | null;
  sort_order?: number | null;
  is_highlighted?: boolean | null;
  enabled?: boolean | null;
}

export interface ProductSpecificationRow {
  key: string;
  label: string;
  value: string;
  source?: 'template' | 'custom';
  highlighted?: boolean;
}

export interface ProductSpecificationGroup {
  id: string;
  title: string;
  rows: ProductSpecificationRow[];
}
```

- [ ] **Step 4: Implement minimal normalization helper**

Implement a helper similar to:

```ts
function normalizeSpecifications(
  rows: StrapiSpecificationRowRaw[] | null | undefined
): ProductSpecificationGroup[] | undefined {
  // filter disabled rows
  // trim strings
  // drop incomplete/blank rows
  // group by group_key + group_title
  // sort rows by sort_order
  // return undefined when no valid groups remain
}
```

- [ ] **Step 5: Populate `specifications` in `normalizeEnrichment()`**

Add:

```ts
specifications: normalizeSpecifications(raw.specifications),
```

And extend the two interfaces explicitly:

```ts
interface StrapiProductEnrichmentRaw {
  // ...existing fields
  specifications?: StrapiSpecificationRowRaw[] | null;
}

export interface StrapiProductEnrichment {
  // ...existing fields
  specifications?: ProductSpecificationGroup[];
}
```

- [ ] **Step 5b: Update the Strapi query to populate specifications**

Ensure the existing enrichment fetch query includes the specifications populate, matching the design contract. The resulting request must include:

```ts
populate[specifications]=true
```

If the file builds the query as a string, append this exact populate parameter alongside the existing populate list.

- [ ] **Step 6: Re-run the test file and confirm it passes**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/product-specifications-api.spec.ts`
Expected: PASS for all normalization tests.

- [ ] **Step 7: Commit the adapter change**

```bash
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" add apps/prism/lib/api/strapi/product-enrichment.ts apps/prism/tests/product-specifications-api.spec.ts
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" commit -m "feat(prism): normalize product specifications"
```

### Task 3: Expose Specifications Through Unified Product Aggregation

**Files:**
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\lib\api\unified-product.ts`

- [ ] **Step 1: Create a dedicated failing aggregation test**

Create `apps/prism/tests/unified-product-specifications.spec.ts` and add an assertion that `mergeProduct()` carries through `specifications` from enrichment to the resulting unified product.

```ts
expect(product.specifications).toEqual([
  {
    id: 'general',
    title: 'General',
    rows: [{ key: 'capacity', label: 'Capacity', value: '5.5 L' }],
  },
]);
```

- [ ] **Step 2: Run the dedicated test file and confirm it fails**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/unified-product-specifications.spec.ts`
Expected: FAIL because `UnifiedProduct` does not expose specifications yet.

- [ ] **Step 3: Extend `UnifiedProduct` and `mergeProduct()` minimally**

In `apps/prism/lib/api/unified-product.ts`, add the missing type import and extend the interface:

```ts
import type { ProductSpecificationGroup } from './strapi/product-enrichment';

export interface UnifiedProduct extends MagentoProduct {
  // ...existing fields
  specifications?: ProductSpecificationGroup[];
}
```

And in `mergeProduct()`:

```ts
specifications: enrichment?.specifications,
```

- [ ] **Step 4: Re-run the same test file and confirm it passes**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/unified-product-specifications.spec.ts`
Expected: PASS and the merged product now exposes the normalized groups.

- [ ] **Step 5: Commit the aggregation change**

```bash
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" add apps/prism/lib/api/unified-product.ts apps/prism/tests/unified-product-specifications.spec.ts
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" commit -m "feat(prism): expose specifications on unified products"
```

### Task 4: Add PDP Section Navigation Support for Specifications

**Files:**
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\app\products\[sku]\product-detail-data.ts`
- Test: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\tests\product-detail-data.spec.ts`

- [ ] **Step 1: Write the failing section-nav tests**

In `apps/prism/tests/product-detail-data.spec.ts`, add tests such as:

```ts
it('adds Specifications when unified product has specification groups', () => {
  // expect section-specifications to be present
});

it('does not add Specifications when groups are missing', () => {
  // expect section-specifications to be absent
});
```

- [ ] **Step 2: Run the test file and confirm it fails**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/product-detail-data.spec.ts`
Expected: FAIL because `buildPdpSectionNav()` does not add a specifications item yet.

- [ ] **Step 3: Implement the minimal nav logic**

In `apps/prism/app/products/[sku]/product-detail-data.ts`, add:

```ts
if ((product.specifications?.length ?? 0) > 0) {
  sections.push({ id: 'section-specifications', label: 'Specifications' });
}
```

Place it after the existing Details logic and before Recipes.

- [ ] **Step 4: Re-run the nav test file and confirm it passes**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/product-detail-data.spec.ts`
Expected: PASS and section ordering matches the plan.

- [ ] **Step 5: Commit the section-nav change**

```bash
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" add apps/prism/app/products/[sku]/product-detail-data.ts apps/prism/tests/product-detail-data.spec.ts
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" commit -m "feat(prism): add specifications section nav"
```

### Task 5: Build the PDP Specifications Component

**Files:**
- Create: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\app\products\[sku]\ProductSpecifications.tsx`
- Test: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\tests\ProductSpecifications.spec.tsx`

- [ ] **Step 1: Write the failing rendering tests**

In `apps/prism/tests/ProductSpecifications.spec.tsx`, add tests such as:

```tsx
it('renders grouped specification tables', () => {
  // expect group title and row label/value pairs
});

it('renders multiple groups in order', () => {
  // expect General before Power
});

it('renders nothing useful for empty input', () => {
  // expect no group headings and no rows
});
```

- [ ] **Step 2: Run the component test file and confirm it fails**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/ProductSpecifications.spec.tsx`
Expected: FAIL because the component file does not exist yet.

- [ ] **Step 3: Implement the smallest useful component**

Create `apps/prism/app/products/[sku]/ProductSpecifications.tsx` with a structure like:

```tsx
import type { ProductSpecificationGroup } from '../../../lib/api/strapi/product-enrichment';

interface ProductSpecificationsProps {
  groups: ProductSpecificationGroup[];
}

export function ProductSpecifications({ groups }: ProductSpecificationsProps) {
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="product-specifications-heading" className="py-10 lg:py-16">
      <h2 id="product-specifications-heading" className="heading-3 mb-8 text-center text-ink">
        Specifications
      </h2>
      <div className="space-y-8">
        {groups.map(group => (
          <div key={group.id}>
            <h3 className="heading-4 mb-4 text-ink">{group.title}</h3>
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <table className="w-full border-collapse">
                <tbody>
                  {group.rows.map(row => (
                    <tr key={row.key} className="border-t border-border first:border-t-0">
                      <th className="w-1/3 px-4 py-3 text-left font-medium text-ink-muted">{row.label}</th>
                      <td className="px-4 py-3 text-ink">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Re-run the component test file and confirm it passes**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/ProductSpecifications.spec.tsx`
Expected: PASS and the component renders grouped rows in order.

- [ ] **Step 5: Commit the UI component**

```bash
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" add apps/prism/app/products/[sku]/ProductSpecifications.tsx apps/prism/tests/ProductSpecifications.spec.tsx
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" commit -m "feat(prism): add product specifications component"
```

### Task 6: Insert Specifications into the PDP Page

**Files:**
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\app\products\[sku]\page.tsx`
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\apps\prism\app\products\[sku]\mock-data.ts` (only if needed to provide mock specification data for local/manual validation)

- [ ] **Step 1: Add a failing integration-style assertion to an existing or new test**

Add a focused test or temporary assertion expecting the PDP page path to render `section-specifications` when `product.specifications` is present.

- [ ] **Step 2: Run the relevant test scope and confirm it fails**

Run: `pnpm nx test prism -- --run --reporter=verbose apps/prism/tests/product-detail-data.spec.ts`
Expected: FAIL because the page does not render the specifications block yet.

- [ ] **Step 3: Implement the minimal page integration**

In `apps/prism/app/products/[sku]/page.tsx`:

1. Import `ProductSpecifications`
2. Render it after the Details block and before Recipes
3. Gate it with `(product.specifications?.length ?? 0) > 0`

Use this shape:

```tsx
{(product.specifications?.length ?? 0) > 0 && (
  <div id="section-specifications">
    <div className="border-t border-border" />
    <ProductSpecifications groups={product.specifications ?? []} />
  </div>
)}
```

- [ ] **Step 4: (Optional) Add minimal mock specification data if `mock-data.ts` is being used for local validation**

If `apps/prism/app/products/[sku]/mock-data.ts` is still used in local validation for the mock SKU, append a small `specifications` fixture that exercises at least two groups and three rows. If the current validation path does not depend on the mock SKU, skip this step.

- [ ] **Step 5: Run the focused test suite and confirm it passes**

Run: `pnpm nx test prism -- --run --reporter=verbose --testFile=apps/prism/tests/product-detail-data.spec.ts --testFile=apps/prism/tests/ProductSpecifications.spec.tsx --testFile=apps/prism/tests/product-specifications-api.spec.ts`
Expected: PASS for nav, normalization, and rendering tests.

- [ ] **Step 6: Commit the page integration**

```bash
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" add apps/prism/app/products/[sku]/page.tsx apps/prism/app/products/[sku]/mock-data.ts apps/prism/tests/product-detail-data.spec.ts apps/prism/tests/ProductSpecifications.spec.tsx apps/prism/tests/product-specifications-api.spec.ts
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" commit -m "feat(prism): render specifications on product pages"
```

### Task 7: Run Full Verification for the Prism Worktree

**Files:**
- Modify: `D:\WORK\prism\.claude\worktrees\product-attributes\docs\superpowers\specs\2026-03-30-product-attributes-design.md` (only if verification uncovers a contract mismatch that must be documented)

- [ ] **Step 1: Run the full Prism test target**

Run: `pnpm nx test prism -- --run`
Expected: PASS with the new specification tests included.

- [ ] **Step 2: Run repository checks**

Run: `pnpm check`
Expected: PASS for typecheck and lint.

- [ ] **Step 3: Inspect working tree for only intended changes**

Run: `git -C "D:/WORK/prism/.claude/worktrees/product-attributes" status --short`
Expected: Only the planned product-attributes files are modified or added.

- [ ] **Step 4: Perform cross-repo manual verification**

Manual checklist:

- Add `specifications` rows for a real SKU in Strapi
- Verify Prism fetches and groups them correctly
- Verify PDP renders `section-specifications`
- Verify no `Specifications` nav item appears when the SKU has no rows
- Verify `product_detail_html` still renders separately

- [ ] **Step 5: Commit final verification fixes if any are needed**

```bash
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" add apps/prism/lib/api/strapi/product-enrichment.ts apps/prism/lib/api/unified-product.ts apps/prism/app/products/[sku]/product-detail-data.ts apps/prism/app/products/[sku]/ProductSpecifications.tsx apps/prism/app/products/[sku]/page.tsx apps/prism/tests/product-specifications-api.spec.ts apps/prism/tests/product-detail-data.spec.ts apps/prism/tests/ProductSpecifications.spec.tsx docs/superpowers/specs/2026-03-30-product-attributes-design.md
git -C "D:/WORK/prism/.claude/worktrees/product-attributes" commit -m "test(prism): verify product specifications flow"
```

---

## Notes for the Implementer

- Stay inside Phase 1. Do not start building Phase 2 template content-types in this implementation pass.
- Keep the frontend contract stable as `ProductSpecificationGroup[]` even though the backend stores repeatable rows.
- Do not push formatting logic into React components when it can be normalized in the Strapi adapter.
- Keep the PDP insertion point exactly after Details and before Recipes unless a real rendering conflict appears.
- Use `@superpowers:test-driven-development` before implementation and `@superpowers:verification-before-completion` before claiming success.
