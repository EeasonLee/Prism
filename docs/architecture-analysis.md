# 项目请求与 SSR 架构分析

## 📋 整体架构设计

### 请求流程设计

项目采用了**双路径请求策略**：

#### 1. 客户端请求流程

```
浏览器 → /api/proxy/[...path] → Next.js API Route → 后端 API
```

- **目的**：避免 CORS 问题
- **特点**：通过 Next.js API 路由代理所有客户端请求
- **实现**：`apps/prism/app/api/proxy/[...path]/route.ts`

#### 2. 服务端请求流程

```
Next.js Server Component → 直接请求后端 API
```

- **目的**：服务端无跨域限制，直接请求更高效
- **特点**：使用环境变量 `NEXT_PUBLIC_API_URL` 直接请求
- **实现**：`apps/prism/lib/api/recipes.ts` 中的 `getApiBaseUrl()`

### SSR 渲染策略

#### 列表页（`/recipes/page.tsx`）

- ✅ **Server Component**：在服务端渲染
- ✅ **并行数据获取**：使用 `Promise.all` 同时获取筛选类型和食谱列表
- ✅ **ISR 缓存**：`revalidate = 60` 秒

#### 详情页（`/recipes/[category]/[slug]/page.tsx`）

- ⚠️ **Client Component**：在客户端渲染
- ⚠️ **useEffect 获取数据**：首屏为空，需要等待客户端加载
- ❌ **失去 SSR 优势**：不利于 SEO，首屏性能差

---

## 🔴 发现的问题

### 1. 【严重】API_BASE_URL 模块级计算

**位置**：`apps/prism/lib/api/recipes.ts:43`

```typescript
const API_BASE_URL = getApiBaseUrl(); // ❌ 问题：在模块顶层计算
```

**问题**：

- `getApiBaseUrl()` 依赖 `typeof window === 'undefined'` 判断环境
- 在模块加载时计算，无法适应动态环境变化
- 如果代码在构建时执行，可能导致错误的环境判断

**影响**：

- 可能导致客户端/服务端使用错误的 API 地址
- 在 Next.js 的某些构建场景下可能出现问题

**建议**：改为每次请求时动态获取

---

### 2. 【严重】详情页使用客户端渲染

**位置**：`apps/prism/app/recipes/[category]/[slug]/page.tsx`

**问题**：

- 使用 `'use client'` + `useEffect` 获取数据
- 首屏为空 HTML，需要等待客户端 JavaScript 执行
- 不利于 SEO（搜索引擎看不到内容）
- 首屏加载性能差

**建议**：改为 Server Component，使用 SSR + ISR

---

### 3. 【中等】代理路由缺少认证 Token

**位置**：`apps/prism/app/api/proxy/[...path]/route.ts:75-79`

```typescript
// 如果需要，可以在这里添加认证头
// const authToken = request.headers.get('authorization');
// if (authToken) {
//   headers['Authorization'] = authToken;
// }
```

**问题**：

- 代理路由没有添加 `STRAPI_API_TOKEN`
- 客户端请求经过代理时，后端可能因缺少认证而失败
- 注释说明了需要，但未实现

**影响**：

- 客户端请求可能失败（如果后端需要认证）

**建议**：从环境变量读取 token 并添加到请求头

---

### 4. 【轻微】重复的 console.log

**位置**：`apps/prism/lib/api/recipes.ts:328-330`

```typescript
console.log('🚀 ~ getFilterTypes ~ url:', url);
console.log('🚀 ~ getFilterTypes ~ url:', url); // ❌ 重复
console.log('🚀 ~ getFilterTypes ~ url:', url); // ❌ 重复
```

**问题**：调试代码未清理

---

### 5. 【轻微】错误处理可以改进

**位置**：多个位置

**问题**：

- 错误信息不够结构化
- 缺少错误类型区分（网络错误、认证错误、业务错误等）
- 代理路由的错误响应格式不一致

---

### 6. 【轻微】缓存策略不统一

**问题**：

- 列表页：`revalidate = 60` 秒
- 详情页：`revalidate = 3600` 秒（但实际未使用，因为是客户端组件）
- 缺少统一的缓存策略配置

---

## ✅ 优化建议

### 优先级 P0：修复严重问题

#### 1. 修复 API_BASE_URL 计算方式

```typescript
// 改为函数调用，每次请求时动态获取
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    const baseUrl = env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_API_URL is not set');
    }
    // ... 处理逻辑
    return `${baseUrl}/api`;
  }
  return '/api/proxy';
}

// 在使用时调用
export async function getFilterTypes(): Promise<FilterTypesResponse> {
  const url = `${getApiBaseUrl()}/recipe-filters/types`; // ✅ 动态获取
  // ...
}
```

#### 2. 将详情页改为 Server Component

```typescript
// apps/prism/app/recipes/[category]/[slug]/page.tsx
import { getRecipeBySlug } from '../../../../lib/api/recipes';
import { RecipeDetail } from '../../components/RecipeDetail';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // ISR: 1 小时

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;

  try {
    const { data: recipe } = await getRecipeBySlug(slug);

    // 验证 category 匹配
    const actualCategorySlug = recipe.categories?.[0]?.slug;
    if (actualCategorySlug && category !== actualCategorySlug) {
      notFound(); // 或使用 redirect
    }

    return <RecipeDetail recipe={recipe} />;
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      notFound();
    }
    throw error; // 触发 error.tsx
  }
}
```

### 优先级 P1：完善功能

#### 3. 为代理路由添加认证

```typescript
// apps/prism/app/api/proxy/[...path]/route.ts
import { env } from '../../../../lib/env';

async function handleProxyRequest(...) {
  // ...
  const headers: Record<string, string> = {
    // ... 现有 headers
  };

  // 添加认证 token（服务端环境变量，不会暴露到客户端）
  if (env.STRAPI_API_TOKEN) {
    headers['token'] = env.STRAPI_API_TOKEN;
  }

  // ...
}
```

#### 4. 统一缓存策略配置

```typescript
// apps/prism/lib/config/cache.ts
export const CACHE_CONFIG = {
  recipeList: 60, // 列表页：1 分钟
  recipeDetail: 3600, // 详情页：1 小时
  filterTypes: 3600, // 筛选类型：1 小时
} as const;
```

### 优先级 P2：代码质量改进

#### 5. 改进错误处理

```typescript
// apps/prism/lib/api/errors.ts
export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

// 使用
if (!response.ok) {
  if (response.status === 404) {
    throw new ApiError('Recipe not found', 404, 'NOT_FOUND');
  }
  if (response.status === 403) {
    throw new ApiError('Forbidden', 403, 'FORBIDDEN');
  }
  throw new ApiError(`API Error: ${response.statusText}`, response.status);
}
```

#### 6. 清理调试代码

- 移除重复的 `console.log`
- 生产环境禁用详细日志
- 使用统一的日志工具（已有 `lib/observability/logger.ts`）

---

## 📊 架构优化对比

### 当前架构

| 页面类型 | 渲染方式  | 缓存策略 | SEO | 首屏性能 |
| -------- | --------- | -------- | --- | -------- |
| 列表页   | SSR + ISR | 60s      | ✅  | ✅       |
| 详情页   | CSR       | 无       | ❌  | ❌       |

### 优化后架构

| 页面类型 | 渲染方式  | 缓存策略 | SEO | 首屏性能 |
| -------- | --------- | -------- | --- | -------- |
| 列表页   | SSR + ISR | 60s      | ✅  | ✅       |
| 详情页   | SSR + ISR | 3600s    | ✅  | ✅       |

---

## 🎯 实施建议

### 第一步：修复 API_BASE_URL（影响面小，风险低）

- 修改 `lib/api/recipes.ts`，移除模块级常量
- 所有 API 函数改为动态获取 URL

### 第二步：改造详情页（影响面大，需要测试）

- 将 Client Component 改为 Server Component
- 添加错误边界处理
- 测试 category 验证逻辑

### 第三步：完善代理路由（功能增强）

- 添加认证 token
- 统一错误响应格式

### 第四步：代码质量提升（可选）

- 统一错误处理
- 清理调试代码
- 统一缓存配置

---

## 📝 总结

### 当前设计优点

1. ✅ 双路径请求策略清晰（客户端代理，服务端直连）
2. ✅ 列表页 SSR + ISR 实现正确
3. ✅ 环境变量使用 Zod 验证，类型安全
4. ✅ 请求头模拟浏览器，避免被后端拦截

### 主要问题

1. ❌ API_BASE_URL 模块级计算存在风险
2. ❌ 详情页使用客户端渲染，失去 SSR 优势
3. ❌ 代理路由缺少认证 token
4. ⚠️ 缓存策略、错误处理可以进一步优化

### 关键优化点

- **P0**：修复 API_BASE_URL 计算方式
- **P0**：将详情页改为 Server Component
- **P1**：为代理路由添加认证
- **P2**：改进错误处理和代码质量
