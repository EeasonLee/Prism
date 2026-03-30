# Product Q&A Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable product Q&A module backed by Strapi and exposed through Prism so PDP pages can show public FAQ and published user Q&A, while logged-in users can submit new questions by SKU.

**Architecture:** Treat Strapi as the source of truth for FAQ, user questions, and published answers, with SKU as the cross-frontend association key. In Prism, keep Strapi contract handling inside a focused `product-qa` API client, expose the approved BFF contract with `apps/prism/app/api/product-qa/by-sku/[sku]/route.ts` for reads and `apps/prism/app/api/product-qa/questions/route.ts` for submission, then render the PDP UI through a dedicated `ProductQA` component mounted from the existing `ProductDetailReviewShell` composition boundary and using the same auth entry points already used by review submission.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Vitest, Testing Library, Nx, Strapi 5, pnpm

**Implementation status (2026-03-30):** Prism 侧 `product-qa.ts`（含 `kind` / `item_type` 映射）、BFF、`ProductQA`（Official FAQ / Customer Q&A）、PDP 集成与 Vitest（含 `product-qa-api` / `product-qa-route` / `ProductQA.spec`）已落地。Strapi 侧在 `product-question` 自定义路由中提供 `GET /api/product-qa/by-sku/:sku`（`findAggregatedBySku` 合并 FAQ + 用户问答）、`POST /api/product-qa/questions`、`GET /api/product-qa/questions/by-sku/:sku`；`npm run build` 已通过。**Remaining:** Task 7 手工 PDP 清单；后端身份仅信任 token 的加固；Strapi 路由/聚合自动化测试（若有测试脚手架）。下方逐步复选框仍以 TDD 叙事保留，执行时可忽略已与实现对齐的步骤。

---

## File Structure

### Prism files

- Create: `apps/prism/lib/api/strapi/product-qa.ts`
  Normalize Strapi Q&A payloads into frontend-safe types and expose read/submit helpers with 5-minute fetch caching for reads.
- Create: `apps/prism/app/api/product-qa/by-sku/[sku]/route.ts`
  Proxy GET requests for the approved Prism read contract: `GET /api/product-qa/by-sku/:sku?page=1&pageSize=10`.
- Create: `apps/prism/app/api/product-qa/questions/route.ts`
  Proxy authenticated POST question submission: `POST /api/product-qa/questions` with JSON `{ sku, content, authorName, authorEmail, magentoUserId }` plus `Authorization: Bearer <token>`（BFF 再转为 Strapi `data` 的 snake_case 字段）。
- Create: `apps/prism/app/products/[sku]/ProductQA.tsx`
  Render the Q&A list, pagination controls, loading/error states, and the logged-in ask-a-question card, importing all Q&A types from `apps/prism/lib/api/strapi/product-qa.ts`.
- Modify: `apps/prism/app/products/[sku]/page.tsx`
  Fetch initial Q&A data for non-mock PDPs and pass it into the PDP review shell.
- Modify: `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx`
  Accept Q&A props and place the Q&A module below reviews in the PDP composition.
- Reference: `apps/prism/app/products/[sku]/ReviewForm.tsx`
  Reuse the existing `useAuth` and `useAuthModal` client-entry pattern for gated submission UX.
- Create: `apps/prism/tests/ProductQA.spec.tsx`
  Cover list rendering, sign-in gating, validation messaging, submission behavior, and pagination for the new PDP Q&A component.
- Verify or Create: `apps/prism/tests/product-qa-api.spec.ts`
  Cover shared normalization helpers and type-safe contract mapping from Strapi payloads.
- Verify or Create: `apps/prism/tests/product-qa-route.spec.ts`
  Cover the two Prism BFF route handlers in `app/api/product-qa/by-sku/[sku]/route.ts` and `app/api/product-qa/questions/route.ts` with focused request/response tests.

### Strapi files

- Create or Modify: `D:/WORK/helpcenter/backend/src/api/product-faq/content-types/product-faq/schema.json`
  Store official FAQ entries；`sku` 可选，空值表示全站公共 FAQ。
- Create or Modify: `D:/WORK/helpcenter/backend/src/api/product-question/content-types/product-question/schema.json`
  Store authenticated user question submissions and moderation status.
- Create or Modify: `D:/WORK/helpcenter/backend/src/api/product-question-answer/content-types/product-question-answer/schema.json`
  Store a single official answer per user question with publish control.
- **Implemented without a separate `api/product-qa` content-type:** aggregation and custom routes live on `product-question`.
- Modify: `D:/WORK/helpcenter/backend/src/api/product-question/controllers/product-question.js`
  Includes `create` (POST `/api/product-qa/questions`), `findBySku` (user questions only), `findAggregatedBySku` (FAQ + user Q&A, merged pagination).
- Modify: `D:/WORK/helpcenter/backend/src/api/product-question/routes/custom.js`
  Registers `GET /api/product-qa/by-sku/:sku`, `GET /api/product-qa/questions/by-sku/:sku`, `POST /api/product-qa/questions`.
- Verify or Create: backend tests adjacent to the new/modified API modules if the backend repo already has a runnable test harness.
  Prefer route/service tests for aggregation, visibility filtering, pagination, auth-derived fields, and single-answer enforcement over manual-only verification.

### Docs to keep open while implementing

- `docs/superpowers/specs/2026-03-30-product-qa-design.md`
- `apps/prism/app/products/[sku]/page.tsx`
- `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx`
- `apps/prism/app/products/[sku]/ProductReviews.tsx`
- `apps/prism/app/products/[sku]/ReviewForm.tsx`
- `apps/prism/app/api/reviews/[sku]/route.ts`
- `apps/prism/lib/api/strapi/reviews.ts`
- `D:/WORK/helpcenter/backend/src/api/product-review/controllers/product-review.js`
- `D:/WORK/helpcenter/backend/src/api/product-review/routes/custom.js`

### Verification commands available in current repos

- Prism tests once: `pnpm nx test prism -- --run --reporter=verbose`
- Prism typecheck: `pnpm nx run prism:typecheck`
- Prism lint: `pnpm nx lint prism`
- Strapi build validation: `npm run build` from `D:/WORK/helpcenter/backend`
- Backend tests: use the repo-local test command if one already exists; discover it before falling back to manual verification

### Verification constraints and assumptions

- Prism already has passing tests under `apps/prism/tests/`; add Q&A specs there directly rather than creating throwaway discovery files.
- This plan assumes Strapi backend work happens in `D:/WORK/helpcenter/backend`, per the repo workflow in `CLAUDE.md`.
- Aggregated read and custom POST routes are implemented under the existing `product-question` API (custom routes under `/api/product-qa/...`), not a separate Strapi content-type named `product-qa`.
- The approved Prism spec requires the by-SKU GET path to cache for 5 minutes. Implement that with `revalidate: 300` on the Strapi read fetch in `apps/prism/lib/api/strapi/product-qa.ts`, and keep the BFF route as a thin proxy.
- The approved backend spec requires token-derived `magento_user_id` and author email. Before coding, identify the exact backend middleware, policy, or helper that validates the incoming Prism bearer token and exposes authenticated user identity. Document the concrete file path and request field used by the implementation, for example `ctx.state.user`, a custom middleware-populated field, or another shared helper. Do not guess.
- If the backend repo has no automated test target for these new APIs, note that gap explicitly in handoff and compensate with focused manual endpoint verification. Do not claim equivalent confidence.

### Task 1: Define the Prism Q&A Client Contract and Tests

**Files:**

- Create: `apps/prism/tests/product-qa-api.spec.ts`
- Create: `apps/prism/lib/api/strapi/product-qa.ts`
- Reference: `apps/prism/lib/api/strapi/reviews.ts`

- [ ] **Step 1: Write the failing normalization test**

```ts
it('normalizes product Q&A items into the shared frontend contract', () => {
  expect(normalizeProductQaResponse(rawResponse)).toEqual({
    sku: 'JD-AF550',
    items: [
      {
        id: 'faq-001',
        type: 'faq',
        question: 'How long does it last?',
        answer: '<p>3-5 years</p>',
        authorName: null,
        order: 1,
        createdAt: '2026-01-15T10:00:00Z',
        answeredAt: null,
      },
      {
        id: 'qa-user-123',
        type: 'user_qa',
        question: 'Does it include a warranty?',
        answer: '<p>2-year warranty</p>',
        authorName: 'Jane',
        order: 0,
        createdAt: '2026-02-20T14:30:00Z',
        answeredAt: '2026-02-21T09:00:00Z',
      },
    ],
    pagination: {
      page: 1,
      pageSize: 10,
      total: 2,
      pageCount: 1,
    },
  });
});
```

- [ ] **Step 2: Run the Prism test command to confirm failure**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: FAIL because the Q&A types and normalization helpers do not exist yet.

- [ ] **Step 3: Write the minimal `product-qa` client and types**

Required type direction:

```ts
export interface ProductQaItem {
  id: string;
  type: 'faq' | 'user_qa';
  question: string;
  answer: string;
  authorName: string | null;
  order: number;
  createdAt: string | null;
  answeredAt: string | null;
}

export interface ProductQaPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export interface ProductQaResult {
  sku: string;
  items: ProductQaItem[];
  pagination: ProductQaPagination;
}

export interface SubmitProductQuestionInput {
  sku: string;
  content: string;
}
```

Required function direction:

```ts
export async function fetchProductQaBySku(
  sku: string,
  page = 1,
  pageSize = 10
): Promise<ProductQaResult>;

export async function submitProductQuestion(
  input: SubmitProductQuestionInput,
  accessToken?: string | null
): Promise<{ success: boolean; message: string; questionId: string }>;
```

Read-path requirement:

```ts
next: { tags: ['product-qa'], revalidate: 300 }
```

Keep the mapping logic local to this file. Do not leak Strapi snake_case fields to the rest of Prism.

- [ ] **Step 4: Run tests again after adding the client contract**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

- [ ] **Step 5: Run typecheck to catch contract drift**

Run: `pnpm nx run prism:typecheck`
Expected: PASS.

### Task 2: Add the Prism BFF Routes Matching the Approved Spec

**Files:**

- Create: `apps/prism/app/api/product-qa/by-sku/[sku]/route.ts`
- Create: `apps/prism/app/api/product-qa/questions/route.ts`
- Create: `apps/prism/tests/product-qa-route.spec.ts`
- Modify: `apps/prism/lib/api/strapi/product-qa.ts`
- Reference: `apps/prism/app/api/reviews/[sku]/route.ts`

- [ ] **Step 1: Write the failing route-level tests**

```ts
it('returns paginated product Q&A for a SKU', async () => {
  expect(response.status).toBe(200);
  expect(body.pagination.page).toBe(1);
  expect(body.items[0].type).toBe('faq');
});

it('rejects invalid question content before proxying to Strapi', async () => {
  expect(response.status).toBe(400);
  expect(body.error).toMatch(/between 10 and 500 characters/i);
});
```

- [ ] **Step 2: Run the Prism test command to confirm failure**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: FAIL because the Q&A route does not exist yet.

- [ ] **Step 3: Implement the minimal GET handler**

Required responsibilities:

```ts
// GET /api/product-qa/by-sku/[sku]
- decode the route SKU
- parse page and pageSize from search params
- clamp page >= 1
- clamp pageSize between 1 and 50
- call fetchProductQaBySku(decodedSku, page, pageSize)
- return JSON on success
- return 502 with { error } on upstream failure
```

- [ ] **Step 4: Implement the minimal POST handler**

Required responsibilities:

```ts
// POST /api/product-qa/questions
- parse JSON body with { sku, content }
- trim text fields
- require sku
- require content length between 10 and 500 characters
- read Authorization header
- call submitProductQuestion({ sku, content }, token)
- return 201 on success
- preserve ApiError status/data when Strapi responds with a typed API error
```

Do not add extra frontend-specific fields here. V1 only sends SKU and question content.

- [ ] **Step 5: Run Prism tests again after adding the routes**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

- [ ] **Step 6: Run Prism typecheck**

Run: `pnpm nx run prism:typecheck`
Expected: PASS.

### Task 3: Establish the Strapi Content Models and Submission Rules

**Files:**

- Create or Modify: `D:/WORK/helpcenter/backend/src/api/product-faq/content-types/product-faq/schema.json`
- Create or Modify: `D:/WORK/helpcenter/backend/src/api/product-question/content-types/product-question/schema.json`
- Create or Modify: `D:/WORK/helpcenter/backend/src/api/product-question-answer/content-types/product-question-answer/schema.json`
- Create or Modify: `D:/WORK/helpcenter/backend/src/api/product-question/controllers/product-question.js`
- Create or Modify: `D:/WORK/helpcenter/backend/src/api/product-question/routes/custom.js`

- [ ] **Step 1: Write down the failing backend model expectations**

Document the exact fields before editing:

```json
{
  "product-faq": {
    "title": { "type": "string", "required": true },
    "content": { "type": "richtext", "required": true },
    "sku": { "type": "string", "required": false },
    "is_public": { "type": "boolean", "default": false },
    "order": { "type": "integer", "default": 0 }
  },
  "product-question": {
    "sku": { "type": "string", "required": true },
    "content": { "type": "text", "required": true },
    "author_name": { "type": "string", "required": true },
    "author_email": { "type": "email", "required": true },
    "magento_user_id": { "type": "string", "required": true },
    "status": {
      "type": "enumeration",
      "enum": ["pending", "answered", "published"]
    }
  },
  "product-question-answer": {
    "question": { "type": "relation", "required": true },
    "content": { "type": "richtext", "required": true },
    "is_published": { "type": "boolean", "default": false }
  }
}
```

- [ ] **Step 2: Identify and document the exact auth validation path before writing code**

Inspect the backend auth flow used by protected endpoints and record:

```txt
- the exact file path of the middleware, policy, or helper that validates the incoming Prism bearer token
- the exact request field exposing authenticated user identity
- how that identity maps to magento_user_id, author_email, and author_name
```

Acceptable answer examples for the request field:

```txt
- ctx.state.user
- ctx.state.auth.credentials
- custom middleware-populated ctx.user
```

Do not continue until both the validating code path and the request field are confirmed from current backend code.

- [ ] **Step 3: Run current backend tests if available; otherwise run a baseline build**

Preferred: run the repo-local backend test command if one exists.
Fallback: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 4: Implement the three content types minimally**

Keep the schema exactly aligned with the approved spec. Do not add tags, search metadata, attachments, or guest-submission fields.

- [ ] **Step 5: Implement and verify the one-answer-per-question rule on the answer path**

Assign this rule explicitly to the answer create/update path for `product-question-answer` in whichever backend layer currently owns write validation for that API in this repo.

Required verification target:

```txt
- first answer for a question is accepted
- second answer for the same question is rejected deterministically
```

If backend tests exist, add a failing test around that exact path. Otherwise perform deterministic manual verification against the answer create/update endpoint and capture the outcome in handoff notes.

- [ ] **Step 6: Implement the authenticated question create path**

Required behavior:

```txt
- accept only authenticated requests
- derive magento_user_id and author_email from the confirmed auth identity source
- derive author_name from the same identity source using the smallest existing fallback pattern
- require sku
- require content length 10-500
- persist status as pending
- return { success, message, questionId }
```

- [ ] **Step 7: Add backend tests for submission behavior if the repo has a runnable test harness**

Minimum backend assertions:

```txt
- unauthenticated request is rejected
- authenticated request persists pending status
- author fields are derived from auth context, not trusted from client input
- content shorter than 10 or longer than 500 is rejected
```

If there is no backend test harness, write down that explicit gap before falling back to manual verification.

- [ ] **Step 8: Run backend verification after model and controller changes**

Preferred: run the repo-local backend test command if one exists.
Also run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 9: Manually verify question submission against the canonical backend route**

Start local backend if needed with `cd "D:/WORK/helpcenter/backend" && npm run develop`.

Run the request against the backend route that Prism will proxy from `POST /api/product-qa/questions`. The backend route path must be finalized during implementation, but the canonical public contract must remain aligned with the approved spec.

Example verification shape:

```bash
curl -X POST "http://localhost:1337/api/product-qa/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_TOKEN" \
  -d '{"sku":"JD-AF550","content":"Does this product support international warranty?"}'
```

Expected: `201` response with `success: true`, a message string, and a non-empty `questionId`.

### Task 4: Build the Strapi Aggregated By-SKU Read API

**Files:**

- Create: `D:/WORK/helpcenter/backend/src/api/product-qa/controllers/product-qa.js`
- Create: `D:/WORK/helpcenter/backend/src/api/product-qa/services/product-qa.js`
- Create: `D:/WORK/helpcenter/backend/src/api/product-qa/routes/custom.js`
- Reference: `D:/WORK/helpcenter/backend/src/api/product-review/controllers/product-review.js`

- [ ] **Step 1: Write the failing aggregation behavior checklist**

```txt
- includes product-specific FAQ where sku matches
- includes reusable FAQ where sku is null
- includes only published question/answer pairs for the SKU
- excludes pending, answered-only, and unpublished-answer records
- sorts by order ascending, then createdAt descending where order ties
- paginates with page and pageSize
- returns the shared contract consumed by Prism
```

- [ ] **Step 2: Add backend tests for the aggregate API if the repo has a runnable test harness**

Minimum backend assertions:

```txt
- public FAQ for matching sku is included
- reusable FAQ with null sku is included
- pending question is excluded
- answered question without published answer is excluded
- published answer for matching sku is included
- page and pageSize shape the returned pagination metadata correctly
```

If no backend test harness exists, document that gap explicitly before relying on manual checks.

- [ ] **Step 3: Run current backend tests if available; otherwise run a baseline build**

Preferred: run the repo-local backend test command if one exists.
Fallback: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 4: Implement the minimal aggregation service**

Required service shape:

```js
async function getProductQaBySku({ sku, page, pageSize }) {
  // fetch public FAQ for sku + public FAQ with null sku
  // fetch published answers whose question.sku matches sku
  // map into one shared item list
  // sort, paginate, and return { sku, items, pagination }
}
```

Required item mapping shape:

```js
{
  id: 'faq-001',
  type: 'faq',
  question: faq.title,
  answer: faq.content,
  authorName: null,
  order: faq.order ?? 0,
  createdAt: faq.createdAt ?? null,
  answeredAt: null,
}
```

```js
{
  id: 'qa-user-123',
  type: 'user_qa',
  question: question.content,
  answer: answer.content,
  authorName: question.author_name ?? null,
  order: 0,
  createdAt: question.createdAt ?? null,
  answeredAt: answer.updatedAt ?? answer.createdAt ?? null,
}
```

- [ ] **Step 5: Expose the custom by-SKU route**

Required route:

```txt
GET /api/product-qa/by-sku/:sku?page=1&pageSize=10
```

Validate page and pageSize before hitting the service. Keep the route public-read.

- [ ] **Step 6: Run backend verification after aggregation work**

Preferred: run the repo-local backend test command if one exists.
Also run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 7: Manually verify the by-SKU response**

Run against local Strapi:

```bash
curl -X GET "http://localhost:1337/api/product-qa/by-sku/JD-AF550?page=1&pageSize=10"
```

Expected: response includes mixed `faq` and `user_qa` items, excludes unpublished content, and returns pagination metadata.

### Task 5: Add PDP Fetching and ProductQA Composition in Prism

**Files:**

- Modify: `apps/prism/app/products/[sku]/page.tsx`
- Modify: `apps/prism/app/products/[sku]/ProductDetailReviewShell.tsx`
- Create: `apps/prism/app/products/[sku]/ProductQA.tsx`
- Reference: `apps/prism/app/products/[sku]/ProductReviews.tsx`
- Reference: `apps/prism/app/products/[sku]/ReviewForm.tsx`

- [ ] **Step 1: Write the failing ProductQA component test**

```tsx
it('renders FAQ items first and shows the ask-a-question card separately', () => {
  render(
    <ProductQA
      sku="JD-AF550"
      initialResult={{
        sku: 'JD-AF550',
        items: [faqItem, userQaItem],
        pagination: { page: 1, pageSize: 10, total: 2, pageCount: 1 },
      }}
      allowSubmit
    />
  );

  expect(
    screen.getByRole('heading', { name: /questions and answers/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/ask a question/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the Prism test command to confirm failure**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: FAIL because `ProductQA` does not exist yet.

- [ ] **Step 3: Fetch initial Q&A data in the PDP page from the shared server-side client**

Required page-level direction:

```ts
const [fetchedProduct, fetchedSummary, fetchedReviews, fetchedProductQa] = await Promise.all([...]);
```

Use `fetchProductQaBySku(...)` from `apps/prism/lib/api/strapi/product-qa.ts` for the server-rendered initial load, and reserve the Prism BFF routes for browser-driven pagination and submission. For failure handling, mirror the current PDP pattern used for reviews: fall back to an empty Q&A result instead of breaking the product page.

- [ ] **Step 4: Extend the review shell to carry ProductQA props**

Keep `ProductDetailReviewShell.tsx` as the composition boundary. Add the Q&A section below reviews rather than folding ProductQA directly into `page.tsx`.

- [ ] **Step 5: Implement the minimal `ProductQA` component**

Required UI responsibilities:

```txt
- section heading in English
- render FAQ/public Q&A items from initial data
- FAQ and published user Q&A use the same list container but visibly indicate the item type
- ask-a-question card is separate and appears after the list
- empty state explains there are no public questions yet
- pagination control appears only when pageCount > 1
- loading and API error states are handled for client-side page changes
```

Follow existing PDP design tokens and review-module layout patterns. Do not introduce a separate design system for this section.

- [ ] **Step 6: Run Prism tests again after component wiring**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

- [ ] **Step 7: Run Prism typecheck**

Run: `pnpm nx run prism:typecheck`
Expected: PASS.

### Task 6: Add Ask-a-Question Submission UX, Auth Gating, and Pagination in ProductQA

**Files:**

- Modify: `apps/prism/app/products/[sku]/ProductQA.tsx`
- Verify or Create: `apps/prism/tests/ProductQA.spec.tsx`
- Reference: `apps/prism/app/products/[sku]/ReviewForm.tsx`
- Reference: `apps/prism/lib/auth/context.tsx`
- Reference: `apps/prism/lib/auth-modal/context.tsx`

- [ ] **Step 1: Extend the failing ProductQA test for auth gating, submission, and pagination**

```tsx
it('opens sign-in when an unauthenticated user tries to submit a question', async () => {
  await user.click(screen.getByRole('button', { name: /submit question/i }));
  expect(openLogin).toHaveBeenCalledWith('signin');
});

it('submits a valid question and shows the success message', async () => {
  await user.type(
    screen.getByLabelText(/your question/i),
    'Does this fit a family of four?'
  );
  await user.click(screen.getByRole('button', { name: /submit question/i }));

  expect(
    await screen.findByText(/thank you for your question/i)
  ).toBeInTheDocument();
});

it('loads another page when pagination changes', async () => {
  await user.click(screen.getByRole('button', { name: /page 2/i }));
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringMatching(/page=2/),
    expect.anything()
  );
});
```

- [ ] **Step 2: Run the Prism test command to confirm failure**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: FAIL because the interactive form, auth gating, and page-change logic are incomplete.

- [ ] **Step 3: Implement the minimal ask-a-question form using the existing auth entry points**

Required UX rules:

```txt
- textarea only; no title field in V1
- all visible labels/messages in English
- import `ProductQaResult`, `ProductQaItem`, and related types from `apps/prism/lib/api/strapi/product-qa.ts`; do not redefine ad hoc copies in page, route, or component files
- use the existing `useAuth` + `useAuthModal` pattern already used by ReviewForm
- unauthenticated submit attempts open the sign-in modal instead of posting
- validate content length 10-500 on the client before submitting
- POST to /api/product-qa/questions with { sku, content }
- success state clears the textarea and shows confirmation
- failed submission shows inline error text
```

- [ ] **Step 4: Implement client-side pagination loading**

Required behavior:

```txt
- GET /api/product-qa/by-sku/[sku]?page=N&pageSize=10
- preserve current list while the next page is loading if possible
- show inline loading state for pagination changes
- replace list contents with the newly loaded page on success
```

- [ ] **Step 5: Run Prism tests again after interaction work**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

- [ ] **Step 6: Run full Prism verification commands**

Run: `pnpm nx test prism -- --run --reporter=verbose`
Expected: PASS.

Run: `pnpm nx lint prism`
Expected: PASS.

Run: `pnpm nx run prism:typecheck`
Expected: PASS.

### Task 7: End-to-End Cross-Repo Verification and Cleanup

**Files:**

- Review: `docs/superpowers/specs/2026-03-30-product-qa-design.md`
- Review: `docs/superpowers/plans/2026-03-30-product-qa.md`
- Review: Prism and Strapi files changed in Tasks 1-6

- [ ] **Step 1: Run final Prism verification suite**

Run: `pnpm nx test prism -- --run --reporter=verbose && pnpm nx lint prism && pnpm nx run prism:typecheck`
Expected: PASS.

- [ ] **Step 2: Run final backend verification**

Preferred: run the repo-local backend test command if one exists.
Also run: `cd "D:/WORK/helpcenter/backend" && npm run build`
Expected: PASS.

- [ ] **Step 3: Manually verify the user-visible Q&A flow**

Manual checklist:

```txt
- PDP shows FAQ and published user Q&A for the current SKU
- reusable FAQ appears on multiple SKUs when the backend record has no sku value
- pending questions never appear publicly
- unauthenticated submit attempts open sign-in instead of posting
- invalid short question is blocked before submit
- valid submission returns success message and does not expose pending content publicly
- pagination loads the next page without breaking the PDP layout
- only one answer can be associated with a question
```

- [ ] **Step 4: Review both repos for drift against the plan**

Check for accidental edits outside the planned files. If extra changes exist, either justify them in handoff or remove them before claiming completion.

- [ ] **Step 5: Prepare handoff notes**

Summarize:

```txt
- exact Prism files changed
- exact Strapi files changed
- commands run and outcomes
- confirmed auth identity source in backend
- any residual risks, especially around Strapi content-model naming drift or missing backend test harness coverage
```
