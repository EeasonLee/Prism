# Prism

Prism is a clean Nx and Next.js frontend starter. Business routes, domain
features, API integrations, and brand assets have been cleared while the
workspace structure, design tokens, shared UI library, and app shell remain.

## Stack

- Nx 21
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- pnpm
- Storybook
- Vitest
- Playwright

## Workspace

```text
apps/
  jd-frontend/          Next.js application shell
libs/
  shared/               Shared utility functions
  tokens/               Design tokens and Tailwind preset
  ui/                   Reusable UI primitives
```

## Commands

```sh
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm storybook
```

The main app runs on `http://localhost:3090` in development.

## Adding Business Code

- Add routes under `apps/jd-frontend/app`.
- Add domain modules under `apps/jd-frontend/features`.
- Keep reusable primitives in `libs/ui`.
- Keep reusable, business-free helpers in `libs/shared`.
- Keep design values in `libs/tokens`.

## Environment

Copy `apps/jd-frontend/.env.example` to `apps/jd-frontend/.env.local` when local
environment values are needed.
