# 统一 API 层设计方案

## 一、当前问题

### 7 个 HTTP 客户端，各写各的

| #   | 客户端               | 文件                                     | 类型                    | 用途                 |
| --- | -------------------- | ---------------------------------------- | ----------------------- | -------------------- |
| 1   | `ApiClient`          | `lib/api/client.ts` + `adapters/`        | 纯 HTTP                 | Strapi 内容 API      |
| 2   | `magentoClient`      | `lib/api/magento/client.ts`              | 纯 HTTP                 | Magento/SSO BFF 代理 |
| 3   | `magentoRestFetch`   | `lib/api/bff/magento-rest-client.ts`     | 纯 HTTP（server-only）  | Magento REST 直连    |
| 4   | `magentoServerFetch` | `lib/api/bff/magento-server.ts`          | 纯 HTTP（server-only）  | Magento OSS BFF      |
| 5   | `magentoGraphQL`     | `lib/services/magento-graphql.client.ts` | 纯 HTTP                 | Magento GraphQL      |
| 6   | `authFetch`          | `lib/api/magento/auth-api.ts`            | 有状态（token/cookie）  | 客户端认证 BFF       |
| 7   | `cartFetch`          | `lib/api/magento/cart.ts`                | 有状态（cartId cookie） | 客户端购物车 BFF     |

关键区分：#1-#5 是**纯 HTTP 客户端**（问题在于重复实现），#6-#7 是**有状态服务**（HTTP + 业务逻辑混合）。

### 5 套错误类型，互不继承

```
ApiError (libs/shared)           ← 基类，仅 ApiClient 使用
MagentoApiError                  ← 不继承 shared
MagentoGraphQLError              ← 不继承 shared，携带 errors[] 数组
AccountServiceError              ← 不继承 shared
CartRequestError                 ← 不继承 shared
```

### 重复造轮子

- URL 构建逻辑重复 6 处，各有不同斜杠处理和 base URL 解析
- Content-Type 设置不一致：有的无条件设置，有的仅在 body 存在时设置
- 超时仅 client adapter 做了，其余客户端无内置超时
- `logRequest` 3 个客户端用、2 个没用
- 502 处理复制 3 份 + 14 个 route handler 各自手写

### 根因

**没有共享的 HTTP 请求处理逻辑。** 每个客户端独立实现了：

```
构造 URL → 设置 Header → 发 fetch → 解析响应 → 映射错误 → 记日志(或不记)
```

---

## 二、设计原则

1. **工厂函数，不是中间件链** — `createHttpClient(config)` 返回 `{ get, post, put, delete }`，内部是线性处理逻辑。不要为了"可插拔"引入不必要的抽象
2. **纯 HTTP 与有状态服务分开处理** — #1-#5 用 `createHttpClient` 重写；#6-#7 保留业务逻辑，只替换内部的 HTTP 调用
3. **自包含错误树** — 错误类型全部定义在 `core/api/errors.ts`，不依赖 `@prism/shared`。`libs/shared` 不放置任何请求相关类型
4. **服务端/客户端分离** — server-only 代码不进浏览器 bundle
5. **逐客户端试点，不全量铺开** — 每个客户端独立迁移、独立验证、独立开关
6. **先锚定性能目标，再动手** — 管道延迟 < 1ms，bundle 增量 < 5KB gzipped，生产环境零 tracer 代码

---

## 三、目标架构

### 3.1 核心：`createHttpClient()` 工厂函数

摒弃中间件链。一个函数，内部是显式的处理步骤：

```typescript
// pipeline/create-client.ts
function createHttpClient(config: ClientConfig): HttpClient {
  return {
    async request<T>(
      method: string,
      path: string,
      options?: ReqOptions
    ): Promise<T> {
      // 1. 构建上下文：traceId + URL + headers + auth
      const ctx = buildRequestContext(config, method, path, options);

      // 2. 超时控制
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), config.timeout);

      // 3. 记录请求开始
      if (isDev) tracer.recordStart(ctx);

      try {
        const res = await fetch(ctx.url, {
          method,
          headers: ctx.headers,
          signal: controller.signal,
          body: options?.body,
        });

        // 4. 记录响应
        if (isDev) tracer.recordEnd(ctx, res);

        // 5. 错误映射
        if (!res.ok) throw await mapHttpError(res, config.errorOverrides);

        // 6. 解析响应
        return parseResponseBody(res);
      } catch (error) {
        // 7. 错误标准化
        if (isDev) tracer.recordError(ctx, error);
        throw normalizeError(error);
      } finally {
        clearTimeout(timer);
      }
    },

    get<T>(path, opts) {
      return this.request<T>('GET', path, opts);
    },
    post<T>(path, opts) {
      return this.request<T>('POST', path, opts);
    },
    put<T>(path, opts) {
      return this.request<T>('PUT', path, opts);
    },
    delete<T>(path, opts) {
      return this.request<T>('DELETE', path, opts);
    },
  };
}
```

步骤是硬编码的、线性的——不是可插拔中间件。这会带来：

- 零抽象开销（无中间件链遍历）
- 调试直观（单文件内单步追踪）
- 行为确定性（不存在中间件顺序/跳过/覆盖的不确定性）

### 3.2 `buildRequestContext` — 集中处理 URL + Header + Auth

```typescript
function buildRequestContext(
  config: ClientConfig,
  method: string,
  path: string,
  options?: ReqOptions
): RequestContext {
  // URL: 统一斜杠处理，消除 6 处重复
  const url = `${config.baseURL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

  // Headers: 统一规则 — Content-Type 仅在 body 存在时设置
  const headers = new Headers(config.defaultHeaders);
  if (options?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options?.headers) {
    for (const [k, v] of Object.entries(options.headers)) headers.set(k, v);
  }

  // Auth: 按 config.auth 类型自动注入
  if (config.auth) {
    const token = config.auth.getToken(); // () => string | Promise<string>
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Trace
  const traceId = generateTraceId();

  return { url, headers, traceId, startTime: performance.now() };
}
```

### 3.3 客户端实例：配置差异，不是实现差异

```typescript
// clients/strapi.ts
export const strapiClient = createHttpClient({
  baseURL: env.STRAPI_API_URL,
  timeout: 30000,
  defaultHeaders: { 'Content-Type': 'application/json' },
  auth: { getToken: () => env.STRAPI_API_TOKEN },
});

// clients/magento.ts
export const magentoClient = createHttpClient({
  baseURL: env.NEXT_PUBLIC_MAGENTO_API_URL,
  timeout: 15000,
  defaultHeaders: {}, // Content-Type 由 buildRequestContext 按 body 存在时自动设置
  auth: { getToken: getMagentoAccessToken },
  retry: { maxRetries: 2, onStatus: [502, 503] },
});

// clients/magento-graphql.ts
export const magentoGraphQLClient = createHttpClient({
  baseURL: env.MAGENTO_URL + '/graphql',
  timeout: 20000,
  defaultHeaders: { 'Content-Type': 'application/json' },
  auth: { getToken: getMagentoAccessToken },
  retry: { maxRetries: 1, onEOF: true },
  errorOverrides: graphqlErrorMapper, // GraphQL 错误不在 HTTP status，在 body.errors
});

// clients/meilisearch.ts
export const meilisearchClient = createHttpClient({
  baseURL: env.MEILISEARCH_URL,
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.MEILISEARCH_API_KEY}`,
  },
});

// clients/magento-server.ts（仅服务端）
export const magentoServerClient = createHttpClient({
  baseURL: env.MAGENTO_INTERNAL_URL, // 服务端直连，不走 SSO 代理
  timeout: 15000,
});
```

### 3.4 统一出口

```typescript
// index.ts（双端安全）
import { strapiClient } from './clients/strapi';
import { magentoClient } from './clients/magento';
import { magentoGraphQLClient } from './clients/magento-graphql';
import { meilisearchClient } from './clients/meilisearch';

export const api = {
  strapi: strapiClient,
  magento: magentoClient,
  magentoGraphQL: magentoGraphQLClient,
  search: meilisearchClient,
};
```

```typescript
// server.ts（仅服务端）
import 'server-only';
import { magentoServerClient } from './clients/magento-server';
export const apiServer = { magento: magentoServerClient };
```

### 3.5 有状态服务（Cart / Auth）：保留业务逻辑，替换 HTTP 层

Cart 和 Auth 不是"换了个 baseURL 的 HTTP 客户端"。它们有 cookie 管理、token 刷新、金额格式化等业务逻辑。策略：拆成两层。

```typescript
// 之前 lib/api/magento/cart.ts
async function addCartItem(sku: string, qty: number) {
  const cartId = getCartIdFromCookie();
  const res = await fetch(`/api/v1/cart/${cartId}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cart-Token': getCartToken(),
    },
    body: JSON.stringify({ sku, qty }),
  });
  if (!res.ok) throw new CartRequestError(res.status, await res.json());
  return res.json();
}

// 之后：HTTP 部分走管道，业务逻辑保留
import { api } from '@/core/api';

async function addCartItem(sku: string, qty: number) {
  const cartId = getCartIdFromCookie();
  try {
    return await api.magento.post(`/api/v1/cart/${cartId}/items`, {
      body: { sku, qty },
      headers: { 'Cart-Token': getCartToken() },
    });
  } catch (error) {
    // Cart 特有的错误处理（如有必要，在调用方做）
    throw error;
  }
}
```

函数签名不变，调用方无感，但 HTTP 逻辑（URL 拼接、Content-Type、超时、日志）由管道统一处理。

### 3.6 文件结构

```
apps/jd-frontend/src/core/api/
├── index.ts                    ← export const api
├── server.ts                   ← export const apiServer（'server-only'）
│
├── pipeline/
│   ├── create-client.ts        ← createHttpClient() 工厂 + buildRequestContext
│   ├── error-mapper.ts         ← mapHttpError(status, body) → ApiError 子类
│   ├── response-parser.ts      ← Content-Type 感知解析
│   └── types.ts                ← ClientConfig, RequestContext, HttpClient
│
├── config.ts                   ← 环境变量解析工具函数（不存具体值）
├── errors.ts                   ← 自包含错误树，ApiError 为根，不从 libs/shared 引入
├── tracer.ts                   ← 仅 dev 环境存在（prod 构建时树摇移除）
│
├── clients/
│   ├── strapi.ts               ← createHttpClient({ baseURL: env.STRAPI_API_URL, ... })
│   ├── magento.ts              ← createHttpClient({ baseURL: env.MAGENTO_API_URL, ... })
│   ├── magento-graphql.ts      ← createHttpClient({ baseURL: env.MAGENTO_GRAPHQL_URL, ... })
│   ├── magento-server.ts       ← createHttpClient({ baseURL: env.MAGENTO_INTERNAL_URL, ... })
│   └── meilisearch.ts          ← createHttpClient({ baseURL: env.MEILISEARCH_URL, ... })
│
└── devtools/                   ← 独立迭代，不阻塞管道迁移
    ├── route.ts                ← GET /api/__dev/request-log
    └── panel.tsx               ← 瀑布图面板
```

---

## 四、统一错误类型

```
ApiError                                        ← 根（message, status, code?, data?），定义在 core/api/errors.ts
├── NetworkError                                ← 网络断连
├── TimeoutError                                ← 请求超时
├── AuthenticationError (401)                   ← 未登录
├── AuthorizationError (403)                    ← 无权限
├── NotFoundError (404)                         ← 资源不存在
├── ServerError (5xx)                           ← 服务端错误
│   └── MagentoServiceError (502)               ← Magento 特有 502
├── ValidationError (422)                       ← 参数校验失败
│
└── 子系统特化
    └── MagentoGraphQLError extends ServerError  ← 保留 errors: GraphQLError[]
```

所有错误类自包含在 `core/api/errors.ts`，不从 `libs/shared` 导入。`libs/shared` 不再放置任何与 HTTP 请求相关的类型。

### 统一错误映射（pipeline/error-mapper.ts）

```typescript
async function mapHttpError(
  res: Response,
  overrides?: ErrorMapper
): Promise<never> {
  // 先给子系统机会处理（如 GraphQL 的 body.errors）
  if (overrides) {
    const body = await res
      .clone()
      .json()
      .catch(() => null);
    const result = overrides(res.status, body);
    if (result) throw result;
  }

  const message = await res.text().catch(() => res.statusText);
  switch (res.status) {
    case 401:
      throw new AuthenticationError(message);
    case 403:
      throw new AuthorizationError(message);
    case 404:
      throw new NotFoundError(message);
    case 422:
      throw new ValidationError(message);
    case 502:
      throw new MagentoServiceError(message);
    default:
      if (res.status >= 500) throw new ServerError(res.status, message);
      throw new ApiError(res.status, message);
  }
}
```

### 错误行为兼容性

迁移前，对每个旧客户端做错误 diff，确保管道抛出的错误类型/status/code 与旧行为一致：

| 旧客户端            | 旧错误类                                | 新错误类                                    | 兼容性                                                    |
| ------------------- | --------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| magentoClient       | `MagentoApiError(status, code, detail)` | `ApiError(status, message)` + `detail→data` | `error.status` 不变，`error.detail` → `error.data.detail` |
| magentoGraphQL      | `MagentoGraphQLError(errors[])`         | `MagentoGraphQLError(errors[])`             | 完全兼容                                                  |
| AccountServiceError | `AccountServiceError(status, code)`     | `ApiError(status, message)`                 | 丢失 `error.code`，需评估调用方是否依赖                   |
| CartRequestError    | `CartRequestError(status)`              | `ApiError(status, message)`                 | `error.status` 不变                                       |

如果调用方依赖了 `error.code` 或 `error.detail`，迁移时同步修改 catch 逻辑。

---

## 五、内置请求追踪

### 5.1 设计约束

- **仅 dev 环境存在**：通过 `if (process.env.NODE_ENV === 'development')` 守卫，生产构建时代码路径不可达 → 树摇移除
- **不阻塞请求**：`tracer.record`\* 是同步写入 ring buffer，无 await
- **有界内存**：ring buffer 上限 500 条，超出后覆盖最旧记录

### 5.2 RequestTracer

```typescript
// tracer.ts — 仅开发环境生效
interface RequestLogEntry {
  traceId: string
  method: string
  url: string
  startTime: number
  duration: number
  status: number
  requestHeaders: Record<string, string>
  requestBody?: unknown
  responseHeaders: Record<string, string>
  responseBody?: unknown
  error?: { type: string; message: string }
  side: 'server' | 'client'
}

class RequestTracer {
  private buffer: RequestLogEntry[] = []  // ring buffer
  private readonly MAX = 500

  recordStart(ctx: RequestContext): void { ... }
  recordEnd(ctx: RequestContext, res: Response): void { ... }
  recordError(ctx: RequestContext, error: unknown): void { ... }
  getAll(): RequestLogEntry[] { return this.buffer }
  clear(): void { this.buffer = [] }
}

export const tracer = new RequestTracer()
```

### 5.3 pageRequestId

不在核心管道实现。理由：

- AsyncLocalStorage 不兼容 Edge Runtime
- `<meta>` 标签方案在客户端导航（`<Link>`）时不更新
- 是 devtools 面板的需求，不应影响管道核心设计

在第六步 devtools 实现时，采用更简单的方案：客户端生成 `window.__PAGE_REQUEST_ID__`，服务端通过 `headers()` 传递。不污染管道。

---

## 六、分步执行

### 第 1 步：错误类型搬迁（1-2h）

- 将 `libs/shared/src/api/types/errors.ts` 中的 `ApiError`、`NetworkError`、`TimeoutError`、`AuthenticationError`、`AuthorizationError`、`NotFoundError` 搬到 `core/api/errors.ts`
- 新增 `ServerError`、`MagentoServiceError`、`ValidationError`、`MagentoGraphQLError`
- 更新所有 import `@prism/shared` 中错误类的文件 → import `@/core/api/errors`
- 从 `libs/shared` 的 barrel export 中移除 `api/*`，删除 `libs/shared/src/api/` 目录
- 删除死代码 `ApiResponse`、`PaginatedResponse`（无人使用）
- 验证：`pnpm typecheck && pnpm lint`

### 第 2 步：建目录 + 核心实现（不影响旧客户端，3-4h）

- 创建 `core/api/` 目录
- 写 `pipeline/types.ts`：`ClientConfig`、`RequestContext`、`HttpClient`
- 写 `config.ts`：环境变量解析工具（`getEnvStr()`、`getEnvUrl()`），不存具体值
- 写 `errors.ts`：统一错误类 + `mapHttpError()`
- 写 `pipeline/create-client.ts`：`createHttpClient()` + `buildRequestContext()`
- 写 `pipeline/response-parser.ts`
- 写 `tracer.ts`（`process.env.NODE_ENV === 'development'` 守卫）
- 写 `createHttpClient` 单元测试：mock fetch，验证 URL 拼接、header 合并、超时 abort、status→ 错误映射
- 验证：`pnpm typecheck && pnpm lint && pnpm nx test jd-frontend -- --run`

### 第 3 步：试点迁移 — Meilisearch（风险最低，最先做）

- 写 `clients/meilisearch.ts`
- 替换 Meilisearch 调用方（`features/product/api.ts` 等）
- 加 feature flag：`NEXT_PUBLIC_USE_NEW_API_SEARCH=true`
- 验证：搜索功能正常（分类页、商品列表）
- **确认管道行为完全正确后，再进入第 4 步**

### 第 4 步：逐个迁移剩余客户端（每个 1-2h）

按调用方多少和复杂度排序：Strapi → Magento REST → Magento GraphQL → Magento Server

每个客户端迁移流程：

1. 写 `clients/<name>.ts`
2. 加 feature flag：`NEXT_PUBLIC_USE_NEW_API_<NAME>`
3. 替换该客户端的调用方 import
4. 做"错误行为 diff"：对比旧客户端的错误处理和新管道的行为，确认 catch 逻辑不失效
5. 验证：`typecheck + lint + test + build`
6. 手动回归受影响页面
7. flag 默认值改为 `true`

### 第 5 步：迁移 Cart / Auth（有状态服务，特殊处理）

- 不改 `cart.ts` / `auth-api.ts` 的函数签名
- 将内部的 `fetch()` 调用替换为 `api.magento.get/post/...`
- 删除内部的手动 URL 拼接、Content-Type 设置、错误映射（管道已处理）
- 保留 cookie 管理、token 刷新、金额格式化等业务逻辑
- 验证：登录流程 + 购物车流程完整回归

### 第 6 步：替换 route handler 的错误处理

- 所有 route handler 中手写的 `NextResponse.json({ error }, { status: 502 })` → `handleApiError(error)`
- Grep `status: 502` 确认全部替换

### 第 7 步：稳定期 + 清理

- 所有 flag 默认 `true`，保留至少一个 release 周期
- 确认无回归后，删除旧客户端文件
- 删除 feature flags
- CI 加 ESLint `no-restricted-imports` 封禁旧路径

### 第 8 步：devtools 面板（独立迭代，不阻塞管道迁移）

- 写 `devtools/route.ts`：`GET /api/__dev/request-log`
- 写 `devtools/panel.tsx`：瀑布图 + 请求详情
- 实现 pageRequestId（服务端 `headers()` + 客户端 `window.__PAGE_REQUEST_ID__`）
- `layout.tsx` 中 `NODE_ENV === 'development'` 条件加载

---

## 七、执行策略：串行 vs 并行

### 依赖链

```
Step 1 (错误搬迁)
  ↓
Step 2 (pipeline 核心: types + config + create-client + error-mapper + tracer)
  ↓
Step 3 (试点: Meilisearch) ──────────────────┐
  ↓                                           │
Step 4 (逐个迁移客户端)                         │
  ├─ Strapi                                   │
  ├─ Magento REST                              │
  ├─ Magento GraphQL                           │
  └─ Magento Server                            │
  ↓                                           │
Step 5 (Cart / Auth)                          │
  ↓                                           │
Step 6 (route handler 错误处理)                 │
  ↓                                           │
Step 7 (清理)                                  │
                                              │
Step 8 (devtools) ←───────────────────────────┘ 可与 Step 3-7 并行
```

### 结论：串行执行

**不建议多个 Agent 并行去写客户端。** 理由：

1. **Step 1-2 是硬瓶颈** — 所有客户端依赖 `createHttpClient()` 和 `errors.ts`。这些没写完，任何客户端工作都是空中楼阁。这部分只能一个人做。
2. **Step 3 是质量闸门** — Meilisearch 试点验证管道设计是否正确。如果管道 API 需要调整（大概率会），并行写的其他客户端全部要返工。先试点、验证、必要时调整 pipeline，然后再批量迁移。
3. **客户端迁移工作量小** — 每个客户端 1-2h，5 个客户端 1-2 天。Agent 间协调的开销反而比直接做更大。
4. **一致性要求高** — 5 个客户端的代码风格、错误处理、测试模式需要一致。一个人写比多人写更容易保持一致性。

### 可并行的部分

- **Step 8（devtools）与 Step 3-7 完全独立** — 可以分配给另一个 Agent 同时进行
- **单元测试** — `createHttpClient` 的测试可以和客户端迁移同时写（测试接口在 Step 2 已确定）

### 建议执行节奏

```
Day 1: Step 1 + Step 2（核心管道落定）
Day 2: Step 3（Meilisearch 试点 + 验证管道）→ 必要时调整 pipeline API
Day 3: Step 4（Strapi + Magento REST） + Step 5（Cart/Auth）
Day 4: Step 6 + Step 7（收尾清理）
可并行: Step 8（devtools，任意时间开始）
```

---

## 八、验证方式

### 自动化（每一步）

```bash
pnpm typecheck
pnpm lint
pnpm nx test jd-frontend -- --run
pnpm build          # + bundle analyzer，确认无 server-only 泄漏 + 增量 < 5KB gzipped
```

### createHttpClient 单元测试（第 2 步新增）

```typescript
describe('createHttpClient', () => {
  it('sends request to correct URL (slash normalization)');
  it('merges default and request headers');
  it('sets Content-Type only when body present');
  it('aborts after timeout');
  it('maps 401 → AuthenticationError');
  it('maps 502 → MagentoServiceError');
  it('maps 5xx → ServerError');
  it('retries on configured status codes');
  it('does not retry on success');
});
```

### 手动回归（第 3-5 步）

| 页面                     | 验证内容                    |
| ------------------------ | --------------------------- |
| 首页 `/`                 | Strapi 内容 + 商品列表      |
| 商品详情 `/products/xxx` | Magento + Strapi 聚合       |
| 分类页 `/categories/xxx` | Meilisearch 搜索            |
| 登录 `/login`            | 认证流程（包括 token 刷新） |
| 购物车 `/cart`           | 增删改查 + 优惠券           |

---

## 九、性能目标

| 指标                        | 目标                                           | 测量方式                                              |
| --------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| `createHttpClient` 额外延迟 | < 1ms/请求                                     | `performance.now()` 在 `buildRequestContext` 前后打点 |
| 客户端 bundle 增量          | < 5KB gzipped                                  | `pnpm build` + `@next/bundle-analyzer`                |
| tracer 内存（dev）          | < 50MB                                         | Chrome DevTools Memory profiler                       |
| tracer 代码（prod）         | 0 bytes                                        | 构建后检查 bundle 中是否包含 tracer 代码              |
| 请求去重                    | 依赖 Next.js 内置 fetch 去重，管道不做额外缓存 | React `cache()` 按需在外围包装                        |

---

## 十、与上一版的区别

|               | 上一版（中间件链）           | 这一版（工厂函数）                  |
| ------------- | ---------------------------- | ----------------------------------- |
| 抽象层级      | 9 步中间件链，可插拔         | `createHttpClient()` 工厂，线性逻辑 |
| Cart/Auth     | 与其他客户端等同处理         | 分离为"纯 HTTP"和"有状态服务"两层   |
| 迁移策略      | 第 3 步一次性写完 5 个客户端 | 试点 1 个 → 逐客户端迁移，每步闭环  |
| 回滚能力      | 无                           | 逐客户端 feature flag               |
| 错误兼容      | 无 diff 机制                 | 迁移前做"错误行为 diff"             |
| pageRequestId | 核心管道内实现               | 推迟到 devtools 步骤                |
| 性能目标      | 未定义                       | 4 个量化指标                        |
| 测试          | 依赖现有测试                 | 新增 createHttpClient 单元测试      |
| 旧客户端删除  | 第 5 步直接删                | 保留至少一个 release 周期再删       |

---

## 十一、风险与缓解

| 风险                                 | 可能性 | 缓解措施                                                                                 |
| ------------------------------------ | ------ | ---------------------------------------------------------------------------------------- |
| 管道行为与旧客户端不一致             | 中     | 逐客户端 diff + 单元测试 + 手动回归；feature flag 秒级回滚                               |
| 错误消息/类型变化导致 catch 静默失效 | 高     | 迁移前做错误行为 diff 表；TS 类型检查捕获类型不匹配                                      |
| 服务端代码打入客户端 bundle          | 低     | `apiServer` 使用 `'server-only'` 包；build 后检查 bundle                                 |
| tracer 泄漏到生产                    | 中     | `process.env.NODE_ENV` 守卫 + 树摇；build 后确认 0 bytes                                 |
| Cart/Auth cookie/token 状态断裂      | 中     | 不在管道内管理状态；Cart/Auth 保留业务逻辑层                                             |
| 管道工厂函数无法覆盖边缘场景         | 低     | `ClientConfig.errorOverrides` 允许子系统自定义错误映射；如需更复杂定制，该客户端不走管道 |
