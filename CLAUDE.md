# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev              # Start development server (http://localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint check
pnpm lint:fix         # Auto-fix ESLint issues
pnpm typecheck        # TypeScript type check
pnpm check            # typecheck + lint together
pnpm check:fix        # Auto-fix all issues
pnpm test             # Run Vitest unit tests
pnpm nx test prism -- --run  # Run tests once (no watch mode)
pnpm nx test prism -- --run --reporter=verbose  # Run tests with verbose output
pnpm e2e              # Run Playwright E2E tests (install browsers first with: pnpm exec playwright install)
pnpm storybook        # Start Storybook
pnpm commit           # Interactive Conventional Commit (via Commitizen)
pnpm nx graph         # Visualize project dependency graph
```

All commands run via Nx under the hood, enabling build caching and affected-project analysis.

## Architecture

### 多系统集成

本项目是**跨境电商重构**的一部分，跨多个系统协同工作：Magento 负责核心商务事实，Strapi 负责内容与运营配置，SSO 负责认证聚合与 Magento 能力代理，Next.js 负责前端渲染与页面级聚合。

默认将商品富文本、discovery、SEO、blogs、recipes、category mapping 等需求视为跨系统任务，而不是单仓前端任务。

详细背景与集成参考见 `docs/architecture/integrations.md` 和 `docs/project-plan.md`。

### Monorepo Structure

This is an **Nx monorepo** with a layered dependency hierarchy that flows strictly one direction:

```
apps/prism  →  libs/blog, libs/ui  →  libs/shared
```

### Key Packages

- `**apps/prism/**` — Next.js 15 app with App Router. Pages live under `app/`, app-specific components under `app/components/`, API wrappers under `lib/api/`. Recipe domain is handled entirely within this app (no separate lib).
- `**libs/shared/**` (`@prism/shared`) — Shared base: API types, utility functions, type guards. Cannot depend on anything else.
- `**libs/ui/**` (`@prism/ui`) — Reusable UI components (Button, PageContainer, etc.) using shadcn/ui pattern. No business logic.
- `**libs/blog/**` (`@prism/blog`) — Blog domain: components, API adapters, hooks.
- `**libs/tokens/**` (`@prism/tokens`) — Design tokens (colors, spacing, typography) as Tailwind preset.

### Module Boundary Rules (enforced by ESLint `@nx/enforce-module-boundaries`)

- `libs/shared` can only depend on itself
- `libs/ui` and domain libs (`libs/blog`, etc.) can only depend on `libs/shared`
- `apps/prism` can depend on all libs
- **No circular dependencies** — if two libs need to share code, extract to `libs/shared`

### Path Aliases

Defined in `tsconfig.base.json` (cross-project):

- `@prism/shared` → `libs/shared/src/index.ts`
- `@prism/ui` → `libs/ui/src/index.ts`
- `@prism/blog` → `libs/blog/src/index.ts`
- `@prism/tokens` → `libs/tokens/src/index.ts`

Defined in `apps/prism/tsconfig.app.json` (app-only):

- `@/app/`_, `@/components/_`, `@/lib/\*`→ corresponding paths under`apps/prism/`

Within the same library, use relative imports. Never use deep path imports like `../../libs/ui/src/components/button`—always go through the alias.

### API Client

Use `apps/prism/lib/api/client.ts` as the default app-side API entry point unless the task explicitly requires bypassing it. Error types (`ApiError`, `AuthenticationError`, etc.) come from `@prism/shared`.

### Observability

When editing request-path, API integration, or performance-sensitive code, check existing instrumentation in `lib/observability/logger.ts`, `lib/observability/metrics.ts`, and `app/reportWebVitals.ts` before adding new logging or metrics.

### Cross-Repo Workflow

This repository frequently coordinates with Strapi backend at `D:\WORK\helpcenter\backend`.

When a task involves product enrichment, discovery, SEO, rich content, category mapping, recipes, blogs, or any Strapi-driven page section:

- Treat it as a cross-repo task, not a frontend-only change
- First inspect the Prism call site, consuming types, route, and rendering logic
- Then inspect the corresponding Strapi content-type, controller, service, lifecycle hook, and response shape in `D:\WORK\helpcenter\backend`
- Make contract changes explicit before editing: field names, nullable fields, slug rules, SKU mapping, category mapping, filter config, pagination, and localization assumptions
- In analysis and implementation updates, separate findings into `Prism changes`, `Strapi changes`, `API/schema contract changes`, and `Verification steps`
- Prefer the minimum viable cross-repo change; do not patch around backend contract mismatches purely in frontend unless the task explicitly asks for a frontend-only workaround
- If current worktree is `D:\WORK\prism`, treat the Strapi repo as an external dependency to inspect when needed, while keeping Prisma/Next changes scoped to this repository unless asked to edit the backend too
- For reusable task prompts and checklists, see `docs/claude-workflows.md`

## Coding Constraints

### Images

Always use `<Image>` from `next/image` with explicit `width`/`height`. Native `<img>` is banned.

### Navigation

Internal links: `<Link>` from `next/link`. External links: `<a target="_blank" rel="noopener noreferrer">`.

### TypeScript

- No `any` (`@typescript-eslint/no-explicit-any`)
- No non-null assertion `!` — use optional chaining `?.` and nullish coalescing `??`
- No floating promises — `await` or explicit `void` for fire-and-forget
- Unused variables/params must be prefixed with `_`
- Prefer `interface` for object shapes; use union types instead of enums

### Language

All user-visible text (buttons, labels, aria-labels, error messages, placeholders) must be in **English**. Code comments may be in Chinese.

## Design System

### Colors — use tokens, never hardcode

```tsx
// ✅
className = 'text-ink bg-surface';
className = 'text-brand bg-brand/10';
// ❌
className = 'text-[#1a1a1a] bg-orange-50';
```

Token reference: `text-ink`, `text-ink-muted`, `text-ink-faint`, `bg-surface`, `bg-surface-muted`, `bg-background`, `bg-card`, `bg-brand text-brand-foreground`

### Typography — use semantic classes

```tsx
// ✅  <h1 className="heading-1 text-ink">
// ❌  <h1 className="text-5xl font-bold">
```

Classes: `heading-1`, `heading-2`, `heading-3`, `heading-4`, `body-text`, `micro-text`

### Layout — use PageContainer

```tsx
import { PageContainer } from '@prism/ui';
<PageContainer>...</PageContainer>;
// ❌ <div className="mx-auto max-w-[1720px] px-4 ...">
```

### Responsive — mobile-first only

```tsx
// ✅  className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
// ❌  className="grid-cols-3 max-md:grid-cols-1"
```

### New UI components

Use CVA for variants and `cn()` from `@prism/shared` for className merging.

## State Management

State complexity progression: `useState` → `useReducer` → Context API → Zustand

For Zustand stores:

- Name hooks `use[Feature]Store`
- Define explicit TypeScript interfaces for state and actions
- Use functional updates (`set((state) => ...)`) for state-dependent updates
- Select only needed fields to prevent unnecessary re-renders; use `useShallow` for multiple fields
- Place store files in a `store/` directory

## Commit Convention

Conventional Commits format is enforced by commitlint + husky:

```
feat(blog): add article search
fix(api): resolve type error in endpoint
```

Use `pnpm commit` for interactive guided commit creation.

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax
