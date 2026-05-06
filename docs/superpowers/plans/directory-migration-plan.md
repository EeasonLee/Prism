# 目录迁移计划

> **目标**：将当前项目目录结构从现有形态迁移到 [`docs/architecture/file-layout-spec.md`](../../architecture/file-layout-spec.md) v1.0 规范。
>
> **原则**：不改业务逻辑，只搬文件 + 改 import 路径。每一步独立提交，`pnpm typecheck` 通过后再下一步。

---

## 一、迁移总览

```
当前                               →  目标
core/                              →  infrastructure/
shared/ui/ (壳组件)                →  app/_ui/
shared/utils/ (工具函数)           →  按归属评估：features/ 或 libs/shared/
features/<name>/ (平铺)            →  features/<name>/{api,services,components,hooks}/
libs/blog/                         →  features/blog/
@prism/recipe/* (僵尸 tsconfig)    →  删除
```

---

## 二、阶段 1：重命名 `core/` → `infrastructure/`

**风险**：低（纯重命名）

| #    | 动作                              | 说明                                                                                    |
| ---- | --------------------------------- | --------------------------------------------------------------------------------------- |
| 1.1  | 创建 `infrastructure/` 目录结构   | `api/clients/`、`api/pipeline/`、`config/`、`observability/`                            |
| 1.2  | 搬运 `core/api/clients/*`         | magento.ts、strapi.ts、sso.ts、meilisearch.ts、bff.ts 等                                |
| 1.3  | 搬运 `core/api/pipeline/*`        | create-client.ts、response-parser.ts、types.ts                                          |
| 1.4  | 搬运 `core/api/*` 顶层文件        | errors.ts、index.ts、route-helpers.ts、server.ts、tracer.ts、config.ts、refresh-lock.ts |
| 1.5  | 搬运 `core/config/*`              | env.ts、api-config.ts、cache-policy.ts                                                  |
| 1.6  | 搬运 `core/observability/*`       | logger.ts、metrics.ts                                                                   |
| 1.7  | 全局替换 import 路径              | `@/core/` → `@/infrastructure/`（所有文件）                                             |
| 1.8  | 更新 `tsconfig.app.json` 路径别名 | 如存在 `@/core/*` 映射需改为 `@/infrastructure/*`                                       |
| 1.9  | 更新 CLAUDE.md 中的路径引用       | `core/api/` → `infrastructure/api/` 等                                                  |
| 1.10 | 删除旧的 `core/` 目录             |                                                                                         |

**验证**：`pnpm typecheck && pnpm lint`

---

## 三、阶段 2：拆解 `shared/`（app 级）

### 2.1 壳组件 → `app/_ui/`

| 文件                                  | 新位置                              |
| ------------------------------------- | ----------------------------------- |
| `shared/ui/Header.tsx`                | `app/_ui/Header.tsx`                |
| `shared/ui/HeaderClient.tsx`          | `app/_ui/HeaderClient.tsx`          |
| `shared/ui/Footer.tsx`                | `app/_ui/Footer.tsx`                |
| `shared/ui/MobileNavBar.tsx`          | `app/_ui/MobileNavBar.tsx`          |
| `shared/ui/MobileTabbar.tsx`          | `app/_ui/MobileTabbar.tsx`          |
| `shared/ui/PromoBar.tsx`              | `app/_ui/PromoBar.tsx`              |
| `shared/ui/SignupPromoController.tsx` | `app/_ui/SignupPromoController.tsx` |
| `shared/ui/SignupPromoModal.tsx`      | `app/_ui/SignupPromoModal.tsx`      |
| `shared/ui/ErrorPage.tsx`             | `app/_ui/ErrorPage.tsx`             |
| `shared/ui/HeroCarousel.tsx`          | `app/_ui/HeroCarousel.tsx`          |
| `shared/ui/HomeFirstHeroSection.tsx`  | `app/_ui/HomeFirstHeroSection.tsx`  |
| `shared/ui/share/*`                   | `app/_ui/share/`                    |

### 2.2 工具函数 → 按归属评估

| 文件                                   | 判断             | 目标                                           |
| -------------------------------------- | ---------------- | ---------------------------------------------- |
| `shared/utils/format-price.ts`         | 仅 product 用 →  | `features/product/services/price-formatter.ts` |
| `shared/utils/alert.ts`                | 多 feature 用 →  | `libs/shared/src/utils/`                       |
| `shared/utils/animations.ts`           | 多 feature 用 →  | `libs/shared/src/utils/`                       |
| `shared/utils/email-validation.ts`     | 仅 auth 用 →     | `features/auth/services/`                      |
| `shared/utils/cloudflare-turnstile.ts` | 仅 auth 用 →     | `features/auth/services/`                      |
| `shared/utils/notify.ts`               | 多 feature 用 →  | `libs/shared/src/utils/`                       |
| `shared/utils/seo.ts`                  | 多 feature 用 →  | `libs/shared/src/utils/`                       |
| `shared/mapping/category-mapping.ts`   | 仅 category 用 → | `features/category/services/`                  |

### 2.3 全局替换 import

所有 `@/shared/ui/` → `@/app/_ui/`，所有 `@/shared/utils/` → 对应新路径。

**验证**：`pnpm typecheck && pnpm lint`

---

## 四、阶段 3：`features/` 内部分子目录

### 试点：`features/product/`（文件最多，最复杂）

按文件后缀/前缀判断归属，移动到对应子目录：

| 现有文件匹配                                      | 目标子目录    |
| ------------------------------------------------- | ------------- |
| `*.bff.ts`、`*-bridge.api.ts`                     | `api/`        |
| `*.service.ts`、`*-calculator.ts`、`*-checker.ts` | `services/`   |
| `*.tsx`（组件）                                   | `components/` |
| `use*.ts`                                         | `hooks/`      |
| `types.ts`、`bff-types.ts`                        | 保留在根目录  |

按 `file-layout-spec.md` 的规定，以 `< 8 个文件` 为阈值决定是否建子目录。

### 其余 feature

基于试点经验，按优先级依次做：cart → auth → category → search → recipe → cms-page → account → navigation

**验证**：每搬完一个 feature 跑 `pnpm typecheck`

---

## 五、阶段 4：`libs/blog/` → `features/blog/`

| #   | 动作                                                            |
| --- | --------------------------------------------------------------- |
| 4.1 | 创建 `features/blog/{api,components,types,index.ts}`            |
| 4.2 | 搬运 `libs/blog/src/api/*` → `features/blog/api/`               |
| 4.3 | 搬运 `libs/blog/src/components/*` → `features/blog/components/` |
| 4.4 | 更新所有 import `@prism/blog` → `@/features/blog`               |
| 4.5 | 从 `tsconfig.base.json` 移除 `@prism/blog` 路径                 |
| 4.6 | 删除 `libs/blog/`                                               |

**验证**：`pnpm typecheck && pnpm build`

---

## 六、阶段 5：清理僵尸

| #   | 动作                           | 文件                                                            |
| --- | ------------------------------ | --------------------------------------------------------------- |
| 5.1 | 删除 tsconfig 僵尸路径         | `tsconfig.base.json` 中 `@prism/recipe/*`                       |
| 5.2 | 删除 `@prism/prism/*` 僵尸路径 | `tsconfig.base.json`                                            |
| 5.3 | 删除空 hooks 文件              | `libs/ui/src/hooks/index.ts`                                    |
| 5.4 | 删除冗余 Playwright 配置       | `playwright.config.ts`、`playwright.config.cts`（仅保留 `.js`） |

**验证**：`pnpm typecheck && pnpm lint`

---

## 七、阶段 6：页面私有组件回落

逐一检查 `features/*/components/` 下的组件，确认是否**仅在单个路由**使用：

| 判定方法                                                                       | 动作               |
| ------------------------------------------------------------------------------ | ------------------ |
| 搜索该组件的 import 引用 `rg "import.*ComponentName" apps/jd-frontend --stats` |                    |
| 仅在 1 个 `app/<route>/` 文件中被引用                                          | 移回该路由目录     |
| 在 ≥2 个路由中被引用                                                           | 保留在 `features/` |

**验证**：`pnpm typecheck && pnpm build && pnpm test`

---

## 八、最终验证

```bash
pnpm typecheck && pnpm lint && pnpm nx test jd-frontend -- --run && pnpm build
```

确认没有残留的旧路径引用：

```bash
rg "@/core/" apps/jd-frontend --stats
rg "@prism/recipe" apps/jd-frontend --stats
rg "@prism/blog" apps/jd-frontend --stats
```
