# API 集成指南

本文档说明如何在 Prism 项目中集成和使用 API。

## 🏗️ API 架构

### 层次结构

```
应用层 (apps/prism/lib/api/)
  ↓ 注入 apiClient
业务域库 (libs/{domain}/api/)
  ↓ 使用类型和查询函数
共享库 (libs/shared/api/)
  ↓ 提供基础类型和客户端
```

## 📦 类型定义

### 通用响应类型

```typescript
import type { ApiResponse, PaginatedResponse } from '@prism/shared';

// 单个数据响应
const response: ApiResponse<Article> = {
  data: article,
  meta: { ... }
};

// 分页响应
const paginatedResponse: PaginatedResponse<ArticleListItem> = {
  data: articles,
  meta: {
    pagination: { page: 1, pageSize: 10, ... }
  }
};
```

### 业务域类型

在 `libs/{domain}/src/api/types.ts` 中定义：

```typescript
// libs/blog/src/api/types.ts
export interface ArticleDetail {
  id: number;
  title: string;
  content: string;
  // ...
}

export interface ArticleSearchResponse
  extends PaginatedResponse<ArticleListItem> {
  meta: {
    pagination: PaginationMeta;
    search?: { keyword?: string; totalResults: number };
  };
}
```

## 🔧 API 查询函数

### 在业务域库中定义

```typescript
// libs/blog/src/api/queries.ts
import type { ApiClientAdapter } from './client-adapter';
import type { ArticleDetail, ArticleSearchResponse } from './types';

export async function fetchArticleBySlug(
  apiClient: ApiClientAdapter,
  slug: string
): Promise<ArticleDetail> {
  const response = await apiClient.get<{ data: ArticleDetail }>(
    `/api/articles/${slug}`
  );
  return response.data;
}

export async function searchArticles(
  apiClient: ApiClientAdapter,
  params: ArticleSearchParams
): Promise<ArticleSearchResponse> {
  const queryString = buildQueryString(params);
  const response = await apiClient.get<ArticleSearchResponse>(
    `/api/articles?${queryString}`
  );
  return response;
}
```

### 在应用层包装

```typescript
// apps/prism/lib/api/articles.ts
import { apiClient } from './client';
import { setApiClient } from '@prism/blog';

// 初始化 blog 库的 apiClient
setApiClient(apiClient);

// 重新导出 blog 库的所有 API 函数和类型
export * from '@prism/blog';
```

## 🎯 使用方式

### 在 Server Component 中使用

```typescript
// apps/prism/app/blog/[slug]/page.tsx
import { fetchArticleBySlug } from '@/lib/api/articles';

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await fetchArticleBySlug(params.slug);

  return (
    <div>
      <h1>{article.title}</h1>
      {/* ... */}
    </div>
  );
}
```

### 在 Client Component 中使用

```typescript
// apps/prism/app/blog/components/ArticleSearch.tsx
'use client';

import { useState } from 'react';
import { searchArticles } from '@/lib/api/articles';

export function ArticleSearch() {
  const [articles, setArticles] = useState([]);

  const handleSearch = async (keyword: string) => {
    const response = await searchArticles({ keyword });
    setArticles(response.data);
  };

  // ...
}
```

## 🛡️ 错误处理

### 使用错误类型

```typescript
import { ApiError, NotFoundError, NetworkError } from '@prism/shared';

try {
  const article = await fetchArticleBySlug(slug);
} catch (error) {
  if (error instanceof NotFoundError) {
    // 处理 404
  } else if (error instanceof NetworkError) {
    // 处理网络错误
  } else {
    // 处理其他错误
  }
}
```

### 使用类型守卫

```typescript
import { isApiError } from '@prism/shared';

try {
  const article = await fetchArticleBySlug(slug);
} catch (error) {
  if (isApiError(error)) {
    console.error('API Error:', error.status, error.message);
  }
}
```

## 📝 最佳实践

### 1. 类型安全

- 始终为 API 响应定义类型
- 使用泛型保持类型推断
- 使用类型守卫进行运行时检查

### 2. 错误处理

- 使用统一的错误类型
- 在边界处捕获错误
- 提供有意义的错误消息

### 3. 查询参数

- 使用 `buildQueryString` 构建查询字符串
- 使用 `QueryParams` 类型定义参数

### 4. 代码组织

- API 类型放在 `libs/{domain}/src/api/types.ts`
- 查询函数放在 `libs/{domain}/src/api/queries.ts`
- 应用层包装放在 `apps/prism/lib/api/{domain}.ts`

## 🔍 示例：完整的 API 集成

### 1. 定义类型

```typescript
// libs/blog/src/api/types.ts
export interface Article {
  id: number;
  title: string;
  content: string;
}

export interface ArticleSearchParams {
  keyword?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}
```

### 2. 定义查询函数

```typescript
// libs/blog/src/api/queries.ts
export async function fetchArticle(
  apiClient: ApiClientAdapter,
  id: number
): Promise<Article> {
  const response = await apiClient.get<{ data: Article }>(
    `/api/articles/${id}`
  );
  return response.data;
}
```

### 3. 应用层包装

```typescript
// apps/prism/lib/api/articles.ts
import { apiClient } from './client';
import { setApiClient, fetchArticle } from '@prism/blog';

setApiClient(apiClient);

export { fetchArticle };
```

### 4. 在组件中使用

```typescript
// apps/prism/app/blog/[id]/page.tsx
import { fetchArticle } from '@/lib/api/articles';

export default async function Page({ params }: { params: { id: string } }) {
  const article = await fetchArticle(Number(params.id));
  return <div>{article.title}</div>;
}
```

## 📚 相关文档

- [TypeScript 规范](../architecture/typescript-standards.md) - 类型定义规范
- [代码组织规范](./code-organization.md) - 代码放置规则

---

**最后更新：** 2024-12-19  
**维护者：** 开发团队
