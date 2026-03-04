<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

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

<!-- nx configuration end-->

## Project Coding Constraints

When generating or modifying code in this project, always follow these rules:

### Images

- Never use `<img>` — always use `<Image>` from `next/image` with explicit `width` and `height` props

### TypeScript

- Never use the non-null assertion operator `!` — use optional chaining `?.` with a nullish fallback `?? value` instead
- Never use `any` — declare explicit types
- Prefix unused variables/parameters with `_` (e.g. `_event`, `_unusedProp`)

### Async

- Never leave floating promises — always `await` or explicitly mark fire-and-forget with `void`

### Navigation

- Use `<Link>` from `next/link` for internal navigation — never bare `<a href="...">`

### Language

- All user-visible text (buttons, labels, placeholders, error messages, aria-label) must be in **English**
- Code comments may be written in Chinese
