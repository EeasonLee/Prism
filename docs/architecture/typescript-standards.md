# TypeScript 类型体系设计规范

## 📋 概述

本文档定义了 Prism 项目的 TypeScript 类型体系架构，涵盖接口、业务、UI 组件、状态管理等各个层面的类型规范。

## 🏗️ 类型体系架构

```
libs/shared/src/
├── api/
│   ├── types/
│   │   ├── common.ts          # 通用 API 响应类型
│   │   ├── errors.ts          # 错误类型体系
│   │   └── utils.ts           # API 类型工具函数
│   └── ...
├── types/
│   ├── component.ts           # 组件类型规范
│   ├── state.ts               # 状态管理类型
│   ├── utility.ts             # 工具类型
│   └── guards.ts              # 类型守卫
└── ...
```

## 📦 类型分类

### 1. API 接口类型层 (`libs/shared/src/api/types/`)

#### 1.1 通用响应类型 (`common.ts`)

**设计原则：**

- 统一的响应结构，便于类型推断和错误处理
- 支持泛型，保证类型安全
- 可扩展的 meta 信息

**核心类型：**

```typescript
// 基础响应类型
export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// 分页响应类型
export interface PaginatedResponse<T, M = Record<string, unknown>> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  } & M;
}

// 错误响应类型
export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    status?: number;
    data?: unknown;
  };
}
```

#### 1.2 错误类型体系 (`errors.ts`)

**设计原则：**

- 继承 Error 类，保持错误堆栈
- 明确的错误分类（网络、认证、权限等）
- 支持错误代码和额外数据

**已实现：**

- `ApiError` - API 错误基类
- `NetworkError` - 网络错误
- `TimeoutError` - 超时错误
- `AuthenticationError` - 认证错误 (401)
- `AuthorizationError` - 权限错误 (403)
- `NotFoundError` - 资源不存在 (404)

#### 1.3 API 类型工具 (`utils.ts`)

**设计原则：**

- 提供类型提取和转换工具
- 支持请求参数类型推导
- 类型守卫函数

**工具类型：**

```typescript
// 提取响应数据类型
export type ExtractResponseData<T> = T extends ApiResponse<infer U> ? U : never;

// 提取分页数据类型
export type ExtractPaginatedData<T> = T extends PaginatedResponse<infer U, any>
  ? U
  : never;

// 请求参数类型
export type RequestParams<T extends Record<string, unknown>> = {
  [K in keyof T]?: T[K];
};

// 查询参数类型
export interface QueryParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  filters?: Record<string, unknown>;
  [key: string]: unknown;
}
```

### 2. 业务类型层 (`libs/{domain}/src/api/types.ts`)

**设计原则：**

- 每个业务域有独立的类型定义
- 类型命名清晰，体现业务含义
- 与 API 响应类型保持一致

**示例（Blog 域）：**

```typescript
// 业务实体类型
export interface ArticleDetail {
  id: number;
  title: string;
  content: string;
  // ...
}

// 业务查询参数
export interface ArticleSearchParams {
  keyword?: string;
  category?: string;
  tags?: string[];
  sort?: ArticleSort;
  page?: number;
  pageSize?: number;
}

// 业务响应类型（继承通用类型）
export interface ArticleSearchResponse
  extends PaginatedResponse<ArticleListItem> {
  meta: {
    pagination: PaginationMeta;
    search?: {
      keyword?: string;
      totalResults: number;
    };
  };
}
```

### 3. UI 组件类型层 (`libs/ui/src/types/` 和组件内联类型)

**设计原则：**

- Props 类型命名：`{ComponentName}Props`
- 支持 Variant Props（使用 `class-variance-authority`）
- 明确的默认值和可选属性
- 支持 ref 转发（使用 `React.forwardRef`）

**类型规范：**

```typescript
// 基础组件 Props 类型
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  children: React.ReactNode;
}

// 业务组件 Props 类型
export interface ArticleDetailProps {
  article: ArticleDetail;
  showExcerpt?: boolean;
  onCategoryClick?: (category: ArticleCategory) => void;
}

// 容器组件 Props 类型
export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}
```

**Variant Props 规范：**

```typescript
// 使用 class-variance-authority 定义变体
const buttonVariants = cva(/* ... */);

// Props 类型继承 VariantProps
export interface ButtonProps extends VariantProps<typeof buttonVariants> {
  // ...
}
```

### 4. 状态管理类型层 (`libs/shared/src/types/state.ts`)

**设计原则：**

- 区分服务端状态和客户端状态
- 支持异步状态（loading, error, data）
- 类型安全的操作函数

**状态类型：**

```typescript
// 异步状态类型
export interface AsyncState<T, E = Error> {
  data: T | null;
  loading: boolean;
  error: E | null;
}

// 分页状态类型
export interface PaginatedState<T> extends AsyncState<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
}

// 状态操作类型
export type StateAction<T> =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: Error }
  | { type: 'RESET' };
```

### 5. 工具类型层 (`libs/shared/src/types/utility.ts`)

**设计原则：**

- 提供常用的类型工具
- 支持类型转换和提取
- 增强类型推断能力

**工具类型：**

```typescript
// 深度只读类型
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// 深度部分类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// 提取 Promise 返回类型
export type Awaited<T> = T extends Promise<infer U> ? U : T;

// 提取函数返回类型
export type ReturnType<T extends (...args: any) => any> = T extends (
  ...args: any
) => infer R
  ? R
  : any;

// 提取函数参数类型
export type Parameters<T extends (...args: any) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

// 非空类型
export type NonNullable<T> = T extends null | undefined ? never : T;

// 键值对类型
export type KeyValuePair<K extends string | number | symbol, V> = {
  [key in K]: V;
};
```

### 6. 类型守卫层 (`libs/shared/src/types/guards.ts`)

**设计原则：**

- 提供运行时类型检查
- 支持类型收窄（Type Narrowing）
- 明确的返回值类型

**类型守卫：**

```typescript
// API 响应类型守卫
export function isApiResponse<T>(value: unknown): value is ApiResponse<T> {
  return typeof value === 'object' && value !== null && 'data' in value;
}

// 错误类型守卫
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

// 分页响应类型守卫
export function isPaginatedResponse<T>(
  value: unknown
): value is PaginatedResponse<T> {
  return (
    isApiResponse<T[]>(value) &&
    'meta' in value &&
    typeof value.meta === 'object' &&
    value.meta !== null &&
    'pagination' in value.meta
  );
}

// 非空类型守卫
export function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
```

## 📝 类型命名规范

### 接口命名

- **API 响应类型**：`{Entity}Response` 或 `{Action}Response`
  - 示例：`ArticleDetailResponse`、`ArticleSearchResponse`
- **业务实体类型**：`{Entity}` 或 `{Entity}Detail`
  - 示例：`Article`、`ArticleDetail`、`ArticleListItem`
- **组件 Props**：`{ComponentName}Props`
  - 示例：`ButtonProps`、`ArticleDetailProps`
- **状态类型**：`{Entity}State` 或 `{Action}State`
  - 示例：`ArticleState`、`SearchState`

### 类型别名命名

- **工具类型**：使用描述性名称
  - 示例：`ExtractResponseData`、`DeepReadonly`
- **联合类型**：使用 PascalCase
  - 示例：`ArticleSort`、`FilterType`

### 泛型参数命名

- **单字母泛型**：`T`（Type）、`K`（Key）、`V`（Value）、`E`（Error）
- **描述性泛型**：`TData`、`TError`、`TResponse`

## ✅ 最佳实践

### 1. 类型定义位置

- **共享类型**：`libs/shared/src/types/`
- **业务类型**：`libs/{domain}/src/api/types.ts`
- **组件类型**：组件文件内联定义（简单）或 `libs/ui/src/types/`（复杂）

### 2. 类型导出

- 使用 `export type` 导出类型（避免值导出）
- 通过 `index.ts` 统一导出
- 避免导出实现细节

### 3. 类型使用

- 优先使用接口（interface）而非类型别名（type）
- 使用 `type` 定义联合类型、工具类型
- 避免使用 `any`，使用 `unknown` 替代

### 4. 类型推断

- 充分利用 TypeScript 类型推断
- 使用 `as const` 获得字面量类型
- 使用 `satisfies` 进行类型检查（TS 4.9+）

### 5. 类型守卫

- 使用类型守卫进行运行时类型检查
- 在边界处（API 响应、用户输入）进行类型验证

## 🔄 类型演进

### 版本兼容

- 使用 `Partial` 和 `Omit` 进行类型扩展
- 避免破坏性变更，使用可选属性
- 废弃类型使用 `@deprecated` 标记

### 类型迁移

- 逐步迁移，保持向后兼容
- 使用类型工具函数简化迁移
- 文档记录迁移路径

## 📚 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

---

**最后更新：** 2024-12-19  
**维护者：** 架构团队
