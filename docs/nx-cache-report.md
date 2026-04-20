# Nx Cache Optimization Report

## Scope

This report captures the Nx cache optimization work completed in this workspace, including:

- Baseline performance and cache hit behavior
- Configuration and project-graph optimizations
- Post-change benchmark and affected-range validation

## What Was Changed

### 1) `nx.json` named inputs and global hash inputs

Updated `namedInputs.default` to exclude generated artifacts that should not affect task hashes:

- `!{projectRoot}/dist/**/*`
- `!{projectRoot}/.next/**/*`
- `!{projectRoot}/test-output/**/*`
- `!{projectRoot}/coverage/**/*`
- `!{projectRoot}/storybook-static/**/*`
- `!{projectRoot}/next-env.d.ts`
- `!{projectRoot}/**/*.tsbuildinfo`

Updated `sharedGlobals` to include critical workspace-level files:

- `{workspaceRoot}/nx.json`
- `{workspaceRoot}/package.json`
- `{workspaceRoot}/pnpm-lock.yaml`
- `{workspaceRoot}/tsconfig.base.json`
- `{workspaceRoot}/tsconfig.json`
- `{workspaceRoot}/eslint.config.mjs`
- `{workspaceRoot}/.prettierrc*`
- `{workspaceRoot}/.npmrc`

### 2) Remove unnecessary upstream build dependency for tests

In `targetDefaults.test`, changed:

- from: `dependsOn: ["^test", "^build"]`
- to: `dependsOn: ["^test"]`

This reduces unnecessary task graph expansion when running tests.

### 3) Bring `libs/tokens` into full Nx/TS task closure

Added:

- `libs/tokens/tsconfig.json`
- `libs/tokens/tsconfig.lib.json`

And added TS project references:

- root `tsconfig.json` -> `./libs/tokens`
- `apps/jd-frontend/tsconfig.json` -> `../../libs/tokens`
- `apps/jd-frontend/tsconfig.app.json` -> `../../libs/tokens/tsconfig.lib.json`

This enables stable `tokens:build` and `tokens:typecheck` participation in Nx task graph and cache.

## Baseline (Before Optimization)

Measured with `NX_DAEMON=false` and cold/warm runs.

| Target    | Projects                              |    Cold |    Warm | Cache Hit |
| --------- | ------------------------------------- | ------: | ------: | --------: |
| build     | shared, ui, blog                      | 12.760s |  9.204s |       1/3 |
| lint      | shared, ui, blog, tokens, jd-frontend | 27.825s | 22.664s |       2/5 |
| typecheck | shared, ui, blog, jd-frontend         | 15.589s | 11.230s |       1/4 |

## Post-Optimization Results

Measured with same method and equivalent command shape.

| Target    | Projects                              |    Cold |    Warm | Cache Hit |
| --------- | ------------------------------------- | ------: | ------: | --------: |
| build     | shared, ui, blog, tokens              |  8.794s |  6.463s |       2/4 |
| lint      | shared, ui, blog, tokens, jd-frontend | 21.048s | 16.871s |       4/5 |
| typecheck | shared, ui, blog, tokens, jd-frontend |  6.764s |  6.610s |       4/5 |

## Affected-Range Validation

Validated that generated artifacts do not unnecessarily expand affected scope:

- `nx affected -t build --files=dist/apps/jd-frontend/.next/types/routes.d.ts` -> **No tasks were run**
- `nx affected -t typecheck --files=dist/out-tsc/libs/tokens/tsconfig.lib.tsbuildinfo` -> **No tasks were run**
- `nx affected -t lint --files=dist/out-tsc/libs/tokens/tsconfig.lib.tsbuildinfo` -> **No tasks were run**

Result: affected-range noise from generated files is reduced.

## Commands Used for Repeatable Benchmarking

```bash
# Disable daemon for stable local measurements
$env:NX_DAEMON='false'

# Reset cache
pnpm nx reset

# Build benchmarks
pnpm nx run-many -t build --projects=shared,ui,blog,tokens --outputStyle=static
pnpm nx run-many -t build --projects=shared,ui,blog,tokens --outputStyle=static

# Lint benchmarks
pnpm nx run-many -t lint --projects=shared,ui,blog,tokens,jd-frontend --outputStyle=static
pnpm nx run-many -t lint --projects=shared,ui,blog,tokens,jd-frontend --outputStyle=static

# Typecheck benchmarks
pnpm nx run-many -t typecheck --projects=shared,ui,blog,tokens,jd-frontend --outputStyle=static
pnpm nx run-many -t typecheck --projects=shared,ui,blog,tokens,jd-frontend --outputStyle=static

# Affected validation
pnpm nx affected -t build --files=dist/apps/jd-frontend/.next/types/routes.d.ts --outputStyle=static
pnpm nx affected -t typecheck --files=dist/out-tsc/libs/tokens/tsconfig.lib.tsbuildinfo --outputStyle=static
pnpm nx affected -t lint --files=dist/out-tsc/libs/tokens/tsconfig.lib.tsbuildinfo --outputStyle=static
```

## Notes and Caveats

- `jd-frontend:test` currently has existing failing tests in the repository; failed tasks are not cache-reusable in the same way as successful tasks.
- `jd-frontend:build` may be influenced by local environment/network behavior and Windows symlink permissions, so this report focuses on stable comparative targets (`build` for libs, `lint`, `typecheck`).

## Next Suggested Step

For further gains, run `nx affected -t lint,typecheck,build` in CI (instead of full run-many on every push) and monitor cache hit ratio over a week.
