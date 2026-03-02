<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.

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
