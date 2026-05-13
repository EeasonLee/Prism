# 项目文件分层架构规范

> **定位**：本文档是项目文件组织的唯一权威标准，适用于人工 Code Review、AI Coding、新人入职。所有新增文件和目录必须遵守本规范。

---

## 一、架构总览

```
apps/jd-frontend/
├── app/                              # [L3] 框架层 — Next.js 路由、API Handler、页面入口
│   ├── (marketing)/                  # 路由组：共用 MarketingLayout
│   ├── (shop)/                       # 路由组：共用 ShopLayout
│   ├── (account)/                    # 路由组：共用 AccountLayout
│   ├── _ui/                          # [L2] 全局布局壳组件（Header / Footer / MobileNav）
│   ├── api/                          # Route Handlers — 薄控制器，不写业务逻辑
│   ├── layout.tsx / providers.tsx / globals.css
│   └── <route>/page.tsx              # 页面入口 + 页面私有组件（可同目录放）
│
├── features/                         # [L1] 领域层 — 垂直切片，自包含
│   └── <feature>/
│       ├── api/                      # 数据聚合 & BFF（感知数据源、调用 infrastructure）
│       ├── services/                 # 纯业务规则（不依赖 IO，不依赖 React）
│       ├── components/               # 领域 UI 组件（≥2 个路由使用才放这里）
│       ├── hooks/                    # 客户端 hooks
│       ├── types.ts                  # 领域类型定义
│       └── index.ts                  # 公共 API 出口（控制外部可 import 什么）
│
├── infrastructure/                   # 基础设施层 — 跨领域的底层能力
│   ├── api/
│   │   ├── clients/                  # 各后端系统的原始 HTTP 客户端
│   │   └── pipeline/                 # 请求/响应拦截、错误处理、token 刷新
│   ├── auth/                         # Token 管理、Cookie、Session
│   ├── config/                       # 环境变量解析、运行时配置
│   └── observability/                # 日志、指标
│
libs/
├── shared/         @prism/shared     # [L0 base] 零依赖基础工具：cn()、debounce、类型守卫
├── ui/             @prism/ui         # [L0 atom] 原子 UI 组件：Button、Input、Skeleton、Dialog
└── tokens/         @prism/tokens     # 设计 token：CSS 变量、Tailwind preset
```

### 层级总览图

```
┌──────────────────────────────────────────────────┐
│  L3  页面 & 路由    app/                          │
│      (page.tsx, route handler, 页面私有组件)      │
├──────────────────────────────────────────────────┤
│  L2  布局壳          app/_ui/                     │
│      (Header, Footer, MobileNav, Sidebar)         │
├──────────────────────────────────────────────────┤
│  L1  领域功能        features/*/                  │
│      (components, hooks, api, services, types)    │
├──────────────────────────────────────────────────┤
│  Infra 基础设施      infrastructure/              │
│      (API clients, auth, config, observability)   │
├──────────────────────────────────────────────────┤
│  L0  原子 & 工具     libs/ui, libs/shared         │
│      (Button, cn, debounce, tokens)               │
└──────────────────────────────────────────────────┘
```

---

## 二、各层职责与边界规则

### `app/` — 框架层（L3）

**只放 Next.js 路由体系文件：**

- `page.tsx` / `layout.tsx` / `loading.tsx` / `error.tsx` / `not-found.tsx`
- `app/api/*/route.ts` — API Route Handler
- `providers.tsx` / `globals.css` / `robots.ts` / `sitemap.ts`
- 页面私有组件（仅此路由使用）放在同目录

**规则：**

- page.tsx 应该是服务端组件，负责 fetch 数据并传给客户端子组件
- 页面私有子组件数量 > 5 时，可建 `_components/` 子目录（下划线前缀阻止 Next.js 将其作为路由）
- route handler 控制在 30 行以内：解析参数 → 调用 `features/*/api/` → 返回响应
- **不放**：数据获取函数、业务规则、跨路由复用的组件

```ts
// ✅ app/products/[sku]/page.tsx — 标准形态
import { getProductDetail } from '@/features/product';
import { ProductDetailContent } from '@/features/product';

export default async function Page({ params }: Props) {
  const { sku } = await params;
  const product = await getProductDetail(sku);
  if (!product) notFound();
  return <ProductDetailContent product={product} />;
}
```

```ts
// ✅ app/api/products/[sku]/route.ts — 薄控制器
import { getProductDetail } from '@/features/product/api/product-detail.api';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sku: string }> }
) {
  const { sku } = await params;
  const result = await getProductDetail(sku);
  if (!result) return notFound();
  return NextResponse.json(result);
}
```

### `app/_ui/` — 布局壳层（L2）

**只放全局布局组件：** Header、Footer、MobileNav、MobileTabbar、PromoBar、ErrorPage

| 放 `app/_ui/`                                           | 不放 `app/_ui/`                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------ |
| 跨路由使用的布局壳                                      | 包含业务逻辑的组件（→ `features/`）                                |
| 不含任何 `features/` import                             | 只有单个路由使用的特殊布局（→ 该路由的 layout.tsx 附近）           |
| Header、Footer、Sidebar、MobileNav、PromoBar、ErrorPage | LoginModal（→ `features/auth/`）、CartDrawer（→ `features/cart/`） |

### `features/<feature>/` — 领域层（L1）

**一个 feature 目录包含与一个业务领域相关的所有代码，自包含。**

#### 内部子目录

| 子目录        | 角色                                                 | 依赖                                                   |
| ------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `api/`        | 数据聚合 & BFF，感知数据源，调用多个 client 拼装数据 | `infrastructure/api/clients/`、`services/`、`types.ts` |
| `services/`   | 纯业务规则，不依赖 IO，不依赖 React，单元可测        | `types.ts` 或 `libs/shared`                            |
| `components/` | 领域 UI 组件，**≥2 个路由**使用时才放这里            | `hooks/`、`services/`（仅通过返回值）、`libs/ui`       |
| `hooks/`      | 客户端 React hooks                                   | `services/`（纯逻辑）、`libs/shared`                   |
| `types.ts`    | 该领域的类型定义（接口、联合类型、常量）             | `libs/shared`                                          |
| `index.ts`    | **该 feature 的唯一公共出口**                        | 重新导出外部需要的一切                                 |

#### 豁免：小 feature 不建子目录

如果一个 feature 总文件数 **< 8 个**，可以不建子目录，文件直接平铺在 feature 根目录。达到 8 个时必须建标准子目录。

```
features/recipe/           # < 8 个文件，允许平铺
├── recipes.api.ts
├── RecipesClient.tsx
├── RecipeCard.tsx
├── RecipeGrid.tsx
├── types.ts
└── index.ts
```

#### feature 间引用规则

- **只能通过 `index.ts` 引用其他 feature**，禁止深层路径 import
- `services/` 不能 import `components/` 或 `hooks/`
- `components/` 可以 import `hooks/` 和 `services/`

```ts
// ✅ 正确：通过 barrel export 引用
import { ProductCard, getProductDetail } from '@/features/product';

// ❌ 错误：深层路径绕过 index.ts
import { ProductCard } from '@/features/product/components/ProductCard';
import { getProductDetail } from '@/features/product/api/product-detail.api';
```

### `infrastructure/` — 基础设施层

| 子目录           | 职责                                            | 规则                              |
| ---------------- | ----------------------------------------------- | --------------------------------- |
| `api/clients/`   | 各后端系统的原始 HTTP 客户端                    | 每个后端系统一个文件              |
| `api/pipeline/`  | 请求/响应拦截、错误包装、token 刷新链           | 可被 clients 和 features/api 使用 |
| `auth/`          | Token 存储/获取/刷新、Cookie 管理、Session 工具 | 不 import features                |
| `config/`        | 环境变量 Zod schema + 解析、API 地址、缓存策略  | 不 import features                |
| `observability/` | 日志器、性能指标                                | 不 import features                |

### `libs/` — 跨项目库（L0）

| 包              | 职责                                                       | 不能做什么                    |
| --------------- | ---------------------------------------------------------- | ----------------------------- |
| `@prism/shared` | `cn()`、`debounce`、通用类型守卫、基础工具                 | 不引用 React、不引用 features |
| `@prism/ui`     | 原子 UI：Button、Input、Select、Skeleton、Dialog、Carousel | 不含业务逻辑、不含 API 调用   |
| `@prism/tokens` | CSS 变量、Tailwind preset、设计 token 常量                 | 不导出运行时逻辑              |

---

## 三、组件四级分层

| 等级   | 位置                     | 职责                    | 裁判规则                                           |
| ------ | ------------------------ | ----------------------- | -------------------------------------------------- |
| **L0** | `libs/ui/`               | 无业务语义的原子组件    | Button、Skeleton、Dialog 不含商品/订单等概念       |
| **L1** | `features/*/components/` | 跨路由复用的领域组件    | ProductCard、CartItem 含业务概念，且 ≥2 个路由在用 |
| **L2** | `app/_ui/`               | 全局布局壳              | Header、Footer、Sidebar                            |
| **L3** | `app/<route>/`           | 页面入口 + 页面私有组件 | 仅一个路由在用                                     |

依赖方向：L3 → L2 → L1 → L0（不可反向）

```
L3 (页面私有) ──import──→ L2 (壳组件) ──import──→ L1 (领域组件) ──import──→ L0 (原子组件)
  │                        │                        │
  └────────import──────────┴────────import──────────┴──→ infrastructure (横向)
```

### 提升规则：页面私有 → 领域共享

> 当且仅当**第二个路由**真正需要引用该组件时，才从 `app/<route>/` 提升到 `features/<domain>/components/`。

以证据驱动，不以预感驱动。YAGNI。

---

## 四、依赖方向（严格单向）

```
app/  (page, route handler)
  ↓ 可以 import
features/*/
  ↓ 可以 import
infrastructure/  +  shared/ (app-level, 待评估)
  ↓ 可以 import
libs/  (@prism/shared, @prism/ui, @prism/tokens)
```

| 层                       | 可以 import                                                               | 禁止 import                                       |
| ------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `app/`                   | `features/`、`infrastructure/`、`libs/`、`app/_ui/`、`app/providers`      | 无                                                |
| `features/*/api/`        | `infrastructure/`、`features/*/services/`、`features/*/types.ts`、`libs/` | 其他 feature 的内部文件、`features/*/components/` |
| `features/*/services/`   | `libs/`、`features/*/types.ts`                                            | `infrastructure/`、React、其他 feature            |
| `features/*/components/` | `features/*/hooks/`、`features/*/services/`（仅通过返回值）、`libs/`      | 其他 feature 的内部文件（通过 index.ts 除外）     |
| `features/*/hooks/`      | `features/*/services/`、`libs/`                                           | `features/*/components/`                          |
| `infrastructure/`        | `libs/`                                                                   | `features/`、`app/`                               |
| `app/_ui/`               | `features/*/components/`（通过 index.ts）、`libs/`                        | `features/*/api/`、`features/*/services/`         |
| `libs/shared`            | 无（自包含）                                                              | 一切                                              |
| `libs/ui`                | `libs/shared`、`libs/tokens`                                              | `features/`、`app/`、`infrastructure/`            |

---

## 五、新增文件决策流程

```
"我要新增一个文件"
      │
      ├─ 是页面路由？              → app/<route>/page.tsx
      ├─ 是 API 端点？             → app/api/<domain>/route.ts  （薄控制器，≤30 行）
      ├─ 是页面布局？              → app/<route>/layout.tsx 或 app/layout.tsx
      │
      ├─ 是组件吗？
      │   ├─ 只有本路由用？        → app/<route>/<Name>.tsx （同目录）
      │   ├─ 多个路由共用？        → features/<domain>/components/<Name>.tsx
      │   ├─ 全局布局壳？          → app/_ui/<Name>.tsx
      │   └─ 纯原子控件？          → libs/ui/src/components/<Name>.tsx
      │
      ├─ 是后端逻辑吗？
      │   ├─ 调多个 client 拼数据？ → features/<domain>/api/<name>.api.ts
      │   └─ 纯数据转换/校验？     → features/<domain>/services/<name>.ts
      │
      ├─ 是 hook？                 → features/<domain>/hooks/use<Name>.ts
      ├─ 是类型？                  → features/<domain>/types.ts （领域类型）
      │                                libs/shared/src/types/  （通用基础类型）
      ├─ 是后端 HTTP 客户端？      → infrastructure/api/clients/<backend>.ts
      └─ 不确定？                  → 默认放 feature，等第二个消费者出现再提升
```

---

## 六、AI Coding 规则（直接写入 CLAUDE.md）

以下规则需要在 CLAUDE.md 中以 AI 可执行的指令格式存在：

```markdown
## 新增文件位置规则

当需要新增文件时，按以下顺序判断：

1. 页面路由 → `app/<route>/page.tsx`（服务端组件，fetch + 组合）
2. API 端点 → `app/api/<domain>/route.ts`（薄控制器，调 features/\*/api/）
3. 页面私有组件 → `app/<route>/<Component>.tsx`（仅此路由使用）
4. 跨路由领域组件 → `features/<domain>/components/<Component>.tsx`（≥2 个路由使用）
5. 数据聚合逻辑 → `features/<domain>/api/<name>.api.ts`（感知数据源）
6. 纯业务规则 → `features/<domain>/services/<name>.ts`（不依赖 IO、不依赖 React）
7. 客户端 hook → `features/<domain>/hooks/use<Name>.ts`
8. 领域类型 → `features/<domain>/types.ts`
9. 通用 UI 控件 → `libs/ui/src/components/<Component>.tsx`（无业务语义）
10. 布局壳 → `app/_ui/<Component>.tsx`
11. 后端客户端 → `infrastructure/api/clients/<backend>.ts`

### Import 规则（强制）

- 引用其他 feature 必须走其 index.ts 出口，禁止深层路径 import
- features/_/services/ 不能 import features/_/components/ 或 hooks/
- libs/ui/ 不能 import features/ 或 app/ 的任何内容
- features/_/api/ 不能 import features/_/components/

### 组件提升规则

- 只有第二个路由真正引用时，才从 app/<route>/ 提升到 features/
- 不确定放哪时，默认放最近的页面目录（YAGNI）
```

---

## 七、Code Review 检查清单

审查者检查以下 5 个问题即可覆盖 80% 的架构违规：

| #   | 检查项                            | 违规示例                                               | 正确做法                            |
| --- | --------------------------------- | ------------------------------------------------------ | ----------------------------------- |
| 1   | **文件位置对了吗？**              | 页面私有组件出现在 `features/` 下                      | 仅一个路由使用时留在 `app/<route>/` |
| 2   | **import 方向对了吗？**           | `services/` import 了 `components/`                    | services 只能依赖 types 和 libs     |
| 3   | **跨 feature 走 index.ts 了吗？** | `from '@/features/cart/components/CartDrawer'`         | `from '@/features/cart'`            |
| 4   | **api/ 和 services/ 分对了吗？**  | `getProductDetail()`（调了 Magento API）放在 services/ | 放 api/（感知 IO）                  |
| 5   | **libs/ui/ 没被污染吗？**         | Button 组件接受 `product: Product` prop                | 原子组件不能引入业务类型            |

---

## 八、路由组 Layout 分配

| 路由组        | 布局特征                         | 典型路由                            |
| ------------- | -------------------------------- | ----------------------------------- |
| `(marketing)` | Header + Footer + PromoBar       | `/`、`/blog`、`/search`、`/recipes` |
| `(shop)`      | Header（含 MiniCart）+ Footer    | `/products`、`/categories`、`/cart` |
| `(account)`   | Header + Footer + AccountSidebar | `/account/**`                       |
| `(checkout)`  | 无壳，最小化干扰                 | `/checkout/**`                      |

---

## 九、对比例子

### 正确

```
features/product/
├── api/
│   ├── product-detail.api.ts     # 调 Magento + Strapi + Reviews 聚合数据
│   ├── product-list.api.ts       # 调 Magento 搜索 + Meilisearch
│   └── product-reviews.api.ts   # 调 Reviews API，带鉴权
├── services/
│   ├── price-calculator.ts       # 纯函数：输入 price、discountPercent → 折后价
│   └── inventory-checker.ts     # 纯函数：输入 qty、minQty → 库存状态
├── components/
│   ├── ProductCard.tsx           # 跨路由复用（搜索结果页 + 分类页 + PDP 推荐）
│   ├── ProductCardSkeleton.tsx
│   └── AddToCartButton.tsx
├── hooks/
│   ├── useProductDetail.ts
│   └── useAddToCart.ts
├── types.ts
└── index.ts
```

### 错误

```
# ❌ 页面私有组件误放在 features/
features/product/components/HeroBanner.tsx  # 只有首页用 → 应该在 app/(marketing)/page.tsx 同目录

# ❌ 业务逻辑放错地方
libs/shared/src/utils/calculate-price.ts    # 含商品价格业务知识 → 应该在 features/product/services/

# ❌ API 聚合逻辑放在 services/
features/product/services/get-product.ts    # 调了后端 API → 应该在 api/

# ❌ 深层 import 绕开 index.ts
import { CartDrawer } from '@/features/cart/components/CartDrawer';  # → 应该 from '@/features/cart'
```

---

## 十、版本历史

| 日期       | 版本 | 变更                                                                     |
| ---------- | ---- | ------------------------------------------------------------------------ |
| 2026-05-06 | v1.0 | 初始版本。确立子目录分角色架构、组件四级分层、依赖单向规则、决策流程图。 |
