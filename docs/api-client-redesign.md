# API 客户端架构重构方案

## 📋 设计目标

1. **独立可复用**：统一的 API Client，符合 Next.js 最佳实践
2. **多环境支持**：生产、测试、本地环境无缝切换
3. **易于调试**：清晰的请求日志和错误追踪
4. **健壮性强**：完善的错误处理和类型安全
5. **可维护性**：清晰的架构分层和职责划分

## 🎯 技术选型

### 核心原则

遵循 **Next.js 推荐实践**：

- ✅ Server Component：服务端直接 `fetch`（无跨域问题）
- ✅ Client Component：通过 API Route 代理（解决跨域）
- ✅ 使用 Next.js 原生 `fetch`（支持缓存配置）
- ✅ 不引入额外 HTTP 客户端库（如 axios），保持轻量

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                    业务层 (Business Layer)                    │
│  recipes.ts, filters.ts, ... (业务 API 函数)                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                  API Client 核心层                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ApiClient (统一请求入口)                             │  │
│  │  - createApiClient() 创建客户端实例                   │  │
│  │  - 请求拦截器（日志、认证、错误处理）                 │  │
│  │  - 响应拦截器（数据转换、错误处理）                   │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
┌───────▼────────┐            ┌────────▼────────┐
│  Request       │            │   Request       │
│  Adapter       │            │   Adapter       │
│  (Server)      │            │   (Client)      │
│                │            │                 │
│  直接 fetch    │            │  通过 API Route │
│  (无跨域)      │            │  (解决跨域)     │
└───────┬────────┘            └────────┬────────┘
        │                               │
        └───────────────┬───────────────┘
                        │
            ┌───────────▼──────────┐
            │   配置层 (Config)     │
            │  - 环境变量管理       │
            │  - 环境切换逻辑       │
            │  - API 基础配置       │
            └──────────────────────┘
```

## 🏗️ 架构分层

### 1. 配置层 (`lib/api/config.ts`)

**职责**：环境配置管理、API 基础配置

```typescript
// 支持的环境类型
type Environment = 'development' | 'test' | 'production';

// API 配置接口
interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  // ...
}
```

**功能**：

- 环境检测和切换
- 多环境配置管理（.env.development, .env.test, .env.production）
- 配置验证（使用 Zod）
- 类型安全的配置访问

### 2. 请求适配器层 (`lib/api/adapters/`)

**职责**：抽象服务端/客户端请求差异

#### 2.1 服务端适配器 (`server-adapter.ts`)

- 直接使用 `fetch` 请求后端 API
- 无跨域问题
- 支持 Next.js 缓存配置（`next: { revalidate }`）

#### 2.2 客户端适配器 (`client-adapter.ts`)

- 通过 `/api/proxy` 路由代理请求
- 解决跨域问题
- 统一的请求格式

### 3. API Client 核心层 (`lib/api/client.ts`)

**职责**：统一请求入口、拦截器、错误处理

**核心功能**：

- 请求/响应拦截器
- 日志记录（开发环境详细日志）
- 错误处理（网络错误、业务错误、认证错误）
- 重试机制
- 请求取消支持
- 类型安全

### 4. 业务层 (`lib/api/recipes.ts`, etc.)

**职责**：业务相关的 API 函数

**特点**：

- 使用统一的 ApiClient
- 类型定义完善
- 业务逻辑封装

## 📦 目录结构

```
apps/prism/lib/
├── api/
│   ├── client.ts              # API Client 核心
│   ├── config.ts              # 配置管理
│   ├── types.ts               # 共享类型
│   ├── errors.ts              # 错误类定义
│   ├── adapters/
│   │   ├── server-adapter.ts  # 服务端适配器
│   │   └── client-adapter.ts  # 客户端适配器
│   ├── interceptors/
│   │   ├── logger.ts          # 日志拦截器
│   │   ├── auth.ts            # 认证拦截器
│   │   └── error-handler.ts   # 错误处理拦截器
│   └── recipes.ts             # 业务 API（示例）
├── env.ts                     # 环境变量（增强）
└── observability/
    └── logger.ts              # 日志工具（已有）
```

## 🔧 核心实现

### 1. 环境配置 (`lib/api/config.ts`)

```typescript
import { z } from 'zod';
import { env } from '../env';

const apiConfigSchema = z.object({
  baseUrl: z.string().url(),
  timeout: z.number().min(1000).default(30000),
  retries: z.number().min(0).max(3).default(1),
});

type ApiConfig = z.infer<typeof apiConfigSchema>;

/**
 * 获取 API 基础 URL
 * - 服务端：直接使用后端地址
 * - 客户端：使用代理路由
 */
export function getApiBaseUrl(): string {
  const isServer = typeof window === 'undefined';

  if (isServer) {
    // 服务端：直接请求后端
    const baseUrl = env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_API_URL is required on server side');
    }
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  }

  // 客户端：使用代理路由
  return '/api/proxy';
}

/**
 * 获取 API 配置
 */
export function getApiConfig(): ApiConfig {
  return apiConfigSchema.parse({
    baseUrl: getApiBaseUrl(),
    timeout: 30000,
    retries: 1,
  });
}

/**
 * 判断当前环境
 */
export function getEnvironment(): 'development' | 'test' | 'production' {
  return env.NODE_ENV === 'production'
    ? 'production'
    : env.NODE_ENV === 'test'
    ? 'test'
    : 'development';
}

/**
 * 是否为开发环境
 */
export function isDevelopment(): boolean {
  return getEnvironment() === 'development';
}
```

### 2. 错误定义 (`lib/api/errors.ts`)

```typescript
/**
 * API 错误基类
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 网络错误
 */
export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends Error {
  constructor(message = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends ApiError {
  constructor(message = 'Authentication failed', data?: unknown) {
    super(message, 401, 'UNAUTHORIZED', data);
    this.name = 'AuthenticationError';
  }
}

/**
 * 权限错误
 */
export class AuthorizationError extends ApiError {
  constructor(message = 'Permission denied', data?: unknown) {
    super(message, 403, 'FORBIDDEN', data);
    this.name = 'AuthorizationError';
  }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', data?: unknown) {
    super(message, 404, 'NOT_FOUND', data);
    this.name = 'NotFoundError';
  }
}
```

### 3. 请求适配器

#### 服务端适配器 (`lib/api/adapters/server-adapter.ts`)

```typescript
import { env } from '../../env';

export interface ServerRequestOptions extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export async function serverRequest(
  url: string,
  options: ServerRequestOptions = {}
): Promise<Response> {
  const { next, ...fetchOptions } = options;

  // 构建完整的 URL（服务端需要绝对路径）
  const fullUrl = url.startsWith('http')
    ? url
    : `${env.NEXT_PUBLIC_API_URL}/api/${url}`;

  // 准备请求头
  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  // 添加认证 token（服务端专用，不会暴露到客户端）
  if (env.STRAPI_API_TOKEN) {
    headers.set('token', env.STRAPI_API_TOKEN);
  }

  // 模拟浏览器请求头（避免被后端拦截）
  headers.set(
    'User-Agent',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  );

  return fetch(fullUrl, {
    ...fetchOptions,
    headers,
    next, // Next.js 缓存配置
  });
}
```

#### 客户端适配器 (`lib/api/adapters/client-adapter.ts`)

```typescript
export interface ClientRequestOptions extends RequestInit {
  timeout?: number;
}

export async function clientRequest(
  url: string,
  options: ClientRequestOptions = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  // 客户端统一使用代理路由
  const proxyUrl = `/api/proxy/${url}`;

  // 使用 AbortController 实现超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(proxyUrl, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 4. API Client 核心 (`lib/api/client.ts`)

```typescript
import type { ServerRequestOptions } from './adapters/server-adapter';
import type { ClientRequestOptions } from './adapters/client-adapter';
import { serverRequest } from './adapters/server-adapter';
import { clientRequest } from './adapters/client-adapter';
import { getApiConfig, isDevelopment } from './config';
import { logger } from '../observability/logger';
import {
  ApiError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from './errors';

type RequestOptions = (ServerRequestOptions | ClientRequestOptions) & {
  skipLogging?: boolean; // 跳过日志记录（敏感请求）
};

/**
 * 统一的 API Client
 */
class ApiClient {
  private config = getApiConfig();
  private isServer = typeof window === 'undefined';

  /**
   * 执行请求
   */
  async request<T = unknown>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipLogging = false, ...requestOptions } = options;
    const startTime = Date.now();

    // 构建完整 URL
    const url = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    try {
      // 开发环境日志
      if (!skipLogging && isDevelopment()) {
        logger.debug('API Request', {
          url,
          method: requestOptions.method || 'GET',
          isServer: this.isServer,
        });
      }

      // 根据环境选择适配器
      const response = this.isServer
        ? await serverRequest(url, requestOptions as ServerRequestOptions)
        : await clientRequest(url, requestOptions as ClientRequestOptions);

      const duration = Date.now() - startTime;

      // 开发环境日志
      if (!skipLogging && isDevelopment()) {
        logger.debug('API Response', {
          url,
          status: response.status,
          duration: `${duration}ms`,
        });
      }

      // 处理响应
      if (!response.ok) {
        await this.handleErrorResponse(response, url);
      }

      // 解析响应体
      const data = await response.json();
      return data as T;
    } catch (error) {
      const duration = Date.now() - startTime;

      // 错误日志
      if (!skipLogging) {
        logger.error('API Request Failed', {
          url,
          error: error instanceof Error ? error.message : String(error),
          duration: `${duration}ms`,
        });
      }

      // 错误处理
      throw this.handleError(error);
    }
  }

  /**
   * 处理错误响应
   */
  private async handleErrorResponse(
    response: Response,
    url: string
  ): Promise<never> {
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }

    // 根据状态码抛出不同类型的错误
    switch (response.status) {
      case 401:
        throw new AuthenticationError('Authentication required', errorData);
      case 403:
        throw new AuthorizationError('Permission denied', errorData);
      case 404:
        throw new NotFoundError(`Resource not found: ${url}`, errorData);
      default:
        throw new ApiError(
          `API request failed: ${response.statusText}`,
          response.status,
          undefined,
          errorData
        );
    }
  }

  /**
   * 处理请求错误
   */
  private handleError(error: unknown): Error {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof Error) {
      // 超时错误
      if (error.name === 'AbortError') {
        return new TimeoutError('Request timeout');
      }

      // 网络错误
      if (error.message.includes('fetch')) {
        return new NetworkError('Network error', error);
      }
    }

    return new NetworkError(
      'Unknown error occurred',
      error instanceof Error ? error : new Error(String(error))
    );
  }

  /**
   * GET 请求
   */
  get<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST 请求
   */
  post<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT 请求
   */
  put<T = unknown>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE 请求
   */
  delete<T = unknown>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * 创建 API Client 实例
 */
export function createApiClient(): ApiClient {
  return new ApiClient();
}

/**
 * 默认导出的单例实例
 */
export const apiClient = createApiClient();
```

### 5. 业务层示例 (`lib/api/recipes.ts`)

```typescript
import { apiClient } from './client';
import type {
  Recipe,
  RecipeSearchParams,
  RecipeSearchResponse,
  FilterTypesResponse,
  FilterListResponse,
} from '../../app/recipes/types';

/**
 * 获取筛选类型
 */
export async function getFilterTypes(): Promise<FilterTypesResponse> {
  return apiClient.get<FilterTypesResponse>('recipe-filters/types');
}

/**
 * 获取筛选列表
 */
export async function getFilters(params?: {
  type?: string;
  rootOnly?: boolean;
  includeChildren?: boolean;
  sort?: string[];
}): Promise<FilterListResponse> {
  const queryParams = new URLSearchParams();

  if (params?.type) queryParams.set('type', params.type);
  if (params?.rootOnly !== undefined)
    queryParams.set('rootOnly', params.rootOnly.toString());
  if (params?.includeChildren !== undefined)
    queryParams.set('includeChildren', params.includeChildren.toString());
  if (params?.sort) queryParams.set('sort', params.sort.join(','));

  const queryString = queryParams.toString();
  const endpoint = `recipe-filters${queryString ? `?${queryString}` : ''}`;

  return apiClient.get<FilterListResponse>(endpoint);
}

/**
 * 搜索食谱
 */
export async function searchRecipes(
  params: RecipeSearchParams
): Promise<RecipeSearchResponse> {
  const queryParams = new URLSearchParams();

  queryParams.set('page', String(params.page ?? 1));
  queryParams.set('pageSize', String(params.pageSize ?? 12));
  queryParams.set('includeFacets', String(params.includeFacets ?? false));

  // 添加筛选条件
  if (params.recipeTypes?.length) {
    params.recipeTypes.forEach(id =>
      queryParams.append('recipeTypes', String(id))
    );
  }
  // ... 其他筛选条件

  return apiClient.get<RecipeSearchResponse>(`recipes/search?${queryParams}`);
}

/**
 * 根据 slug 获取食谱详情（服务端使用，支持 ISR 缓存）
 */
export async function getRecipeBySlug(
  slug: string,
  revalidate = 3600
): Promise<{ data: Recipe }> {
  // 只在服务端支持缓存配置
  const options =
    typeof window === 'undefined'
      ? ({ next: { revalidate } } as const)
      : undefined;

  return apiClient.get<{ data: Recipe }>(`recipes/slug/${slug}`, options);
}
```

### 6. 代理路由增强 (`app/api/proxy/[...path]/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { env } from '../../../../lib/env';

/**
 * 处理代理请求
 */
async function handleProxyRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const apiBaseUrl = env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return NextResponse.json(
        { error: 'API URL not configured' },
        { status: 500 }
      );
    }

    // 构建目标 URL
    const path = pathSegments.join('/');
    const targetUrl = `${apiBaseUrl}/api/${path}`;

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const fullUrl = queryString ? `${targetUrl}?${queryString}` : targetUrl;

    // 准备请求头
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent':
        request.headers.get('user-agent') ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Accept: 'application/json',
      Referer: request.headers.get('referer') || apiBaseUrl,
      Origin: request.headers.get('origin') || apiBaseUrl,
    };

    // 添加认证 token（服务端环境变量，不会暴露到客户端）
    if (env.STRAPI_API_TOKEN) {
      headers['token'] = env.STRAPI_API_TOKEN;
    }

    // 处理请求体
    let body: string | undefined;
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      try {
        const requestBody = await request.json();
        body = JSON.stringify(requestBody);
      } catch {
        // 无请求体或解析失败，忽略
      }
    }

    // 转发请求
    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    });

    // 获取响应数据
    const data = await response.text();

    // 尝试解析 JSON
    let jsonData: unknown;
    try {
      jsonData = JSON.parse(data);
    } catch {
      jsonData = data;
    }

    // 返回响应
    return NextResponse.json(jsonData, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Proxy request failed:', error);
    return NextResponse.json(
      {
        error: 'Proxy request failed',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleProxyRequest(request, resolvedParams.path, 'DELETE');
}
```

## 🔄 环境切换方案

### 环境变量配置

```bash
# .env.development (本地开发)
NEXT_PUBLIC_API_URL=http://localhost:1337
STRAPI_API_TOKEN=your_dev_token

# .env.test (测试环境)
NEXT_PUBLIC_API_URL=https://test-api.example.com
STRAPI_API_TOKEN=your_test_token

# .env.production (生产环境)
NEXT_PUBLIC_API_URL=https://api.example.com
STRAPI_API_TOKEN=your_prod_token
```

### 环境检测逻辑

- Next.js 会根据 `NODE_ENV` 自动加载对应的 `.env.*` 文件
- `env.ts` 使用 Zod 验证环境变量
- API Client 自动根据环境选择正确的配置

## 📊 优势对比

| 特性     | 当前实现    | 重构后             |
| -------- | ----------- | ------------------ |
| 代码复用 | ❌ 重复逻辑 | ✅ 统一 API Client |
| 类型安全 | ⚠️ 部分     | ✅ 完整类型        |
| 错误处理 | ⚠️ 分散     | ✅ 统一错误类      |
| 日志调试 | ⚠️ 不统一   | ✅ 统一日志        |
| 环境切换 | ⚠️ 手动     | ✅ 自动            |
| 跨域处理 | ✅ 有代理   | ✅ 自动适配        |
| 缓存支持 | ⚠️ 不一致   | ✅ 统一配置        |
| 可测试性 | ❌ 困难     | ✅ 易于 mock       |

## 🚀 实施步骤

### 阶段 1：基础设施（1-2 天）

1. ✅ 创建配置层 (`config.ts`)
2. ✅ 创建错误定义 (`errors.ts`)
3. ✅ 创建请求适配器 (`adapters/`)
4. ✅ 创建 API Client 核心 (`client.ts`)

### 阶段 2：迁移业务代码（2-3 天）

1. ✅ 重构 `recipes.ts` 使用新 API Client
2. ✅ 更新代理路由
3. ✅ 迁移其他业务 API

### 阶段 3：优化和测试（1-2 天）

1. ✅ 完善错误处理
2. ✅ 添加单元测试
3. ✅ 性能优化
4. ✅ 文档完善

## 🎯 使用示例

### Server Component 中使用

```typescript
// app/recipes/page.tsx
import { getFilterTypes, searchRecipes } from '@/lib/api/recipes';

export default async function RecipesPage() {
  // 服务端直接调用，自动使用服务端适配器
  const [filters, recipes] = await Promise.all([
    getFilterTypes(),
    searchRecipes({ page: 1, pageSize: 12 }),
  ]);

  return <RecipesClient filters={filters} recipes={recipes} />;
}
```

### Client Component 中使用

```typescript
'use client';

import { getRecipeBySlug } from '@/lib/api/recipes';
import { useEffect, useState } from 'react';

export function RecipeDetail({ slug }: { slug: string }) {
  const [recipe, setRecipe] = useState(null);

  useEffect(() => {
    // 客户端调用，自动使用客户端适配器（通过代理）
    getRecipeBySlug(slug).then(({ data }) => setRecipe(data));
  }, [slug]);

  // ...
}
```

### 直接使用 API Client

```typescript
import { apiClient } from '@/lib/api/client';

// GET 请求
const data = await apiClient.get<MyType>('endpoint');

// POST 请求
const result = await apiClient.post<MyType>('endpoint', { key: 'value' });

// 带缓存配置（仅服务端）
const cached = await apiClient.get<MyType>('endpoint', {
  next: { revalidate: 60 },
});
```

## ✅ 验收标准

1. ✅ 所有 API 请求通过统一客户端
2. ✅ 支持服务端/客户端自动适配
3. ✅ 开发环境能看到详细请求日志
4. ✅ 错误处理完善，类型安全
5. ✅ 多环境切换无需修改代码
6. ✅ 代码可测试，易于 mock
7. ✅ 符合 Next.js 最佳实践
