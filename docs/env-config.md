# 环境变量配置说明

## 概述

本项目使用 Zod 进行环境变量校验，所有环境变量定义在 `apps/prism/lib/env.ts` 中。

## 环境变量列表

### 客户端环境变量（`NEXT_PUBLIC_*`）

这些变量会在构建时注入到客户端代码中，可以在浏览器中访问。

| 变量名                  | 类型                                   | 默认值                  | 必需 | 说明                                      |
| ----------------------- | -------------------------------------- | ----------------------- | ---- | ----------------------------------------- |
| `NEXT_PUBLIC_APP_URL`   | string (URL)                           | `http://localhost:3000` | 否   | 应用的基础 URL，用于生成元数据链接等      |
| `NEXT_PUBLIC_API_URL`   | string (URL)                           | -                       | 否   | 后端 API 的基础地址（不包含 `/api` 后缀） |
| `NEXT_PUBLIC_LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` | `info`                  | 否   | 日志输出级别，控制日志的详细程度          |

### 服务端环境变量

这些变量只在服务端可用，不会暴露到客户端。

| 变量名             | 类型                                    | 默认值 | 必需 | 说明                                  |
| ------------------ | --------------------------------------- | ------ | ---- | ------------------------------------- |
| `NODE_ENV`         | `development` \| `production` \| `test` | -      | 是   | Node.js 环境，通常由 Next.js 自动设置 |
| `STRAPI_API_TOKEN` | string                                  | -      | 否   | 服务端请求后端 API 时使用的认证 Token |

## 配置示例

### 开发环境 (`.env.development`)

```bash
# 应用 URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 后端 API 地址（不包含 /api 后缀）
NEXT_PUBLIC_API_URL=http://192.168.50.244:1337

# 日志级别（开发环境建议使用 debug）
NEXT_PUBLIC_LOG_LEVEL=debug

# 服务端认证 Token（可选）
STRAPI_API_TOKEN=your_token_here
```

### 生产环境 (`.env.production`)

```bash
# 应用 URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# 后端 API 地址
NEXT_PUBLIC_API_URL=https://api.your-domain.com

# 日志级别（生产环境建议使用 error）
NEXT_PUBLIC_LOG_LEVEL=error

# 服务端认证 Token
STRAPI_API_TOKEN=your_production_token
```

## 详细说明

### `NEXT_PUBLIC_APP_URL`

**用途**：

- 生成应用的元数据链接（Open Graph、Twitter Card 等）
- 用于生成绝对 URL

**示例**：

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**注意**：

- 必须以 `http://` 或 `https://` 开头
- 不要以 `/` 结尾

### `NEXT_PUBLIC_API_URL`

**用途**：

- 后端 API 的基础地址
- 用于构建完整的 API 请求 URL

**示例**：

```bash
# 开发环境
NEXT_PUBLIC_API_URL=http://192.168.50.244:1337

# 生产环境
NEXT_PUBLIC_API_URL=https://api.example.com
```

**注意**：

- 不要包含 `/api` 后缀（接口路径已经以 `api/` 开头）
- 不要以 `/` 结尾
- 接口路径会自动拼接，如：`${NEXT_PUBLIC_API_URL}/api/recipes`

**URL 构建规则**：

```
NEXT_PUBLIC_API_URL=http://192.168.50.244:1337
接口路径: api/recipes/search
最终 URL: http://192.168.50.244:1337/api/recipes/search
```

### `NEXT_PUBLIC_LOG_LEVEL`

**用途**：

- 控制日志输出级别
- 影响服务端和客户端的日志输出

**可选值**：

- `debug` - 最详细，包含所有日志（包括 API 请求日志）
- `info` - 默认级别，显示信息和警告
- `warn` - 只显示警告和错误
- `error` - 只显示错误

**推荐配置**：

- 开发环境：`debug`（查看详细的 API 请求日志）
- 生产环境：`error`（只记录错误）

**示例**：

```bash
# 开发环境 - 查看所有日志
NEXT_PUBLIC_LOG_LEVEL=debug

# 生产环境 - 只记录错误
NEXT_PUBLIC_LOG_LEVEL=error
```

### `STRAPI_API_TOKEN`

**用途**：

- 服务端请求后端 API 时使用的认证 Token
- 只在服务端使用，不会暴露到客户端

**安全提示**：

- ⚠️ 不要提交到版本控制系统
- ⚠️ 使用 `.env.local` 或环境变量管理工具存储
- ✅ 已添加到 `.gitignore`

**示例**：

```bash
STRAPI_API_TOKEN=your_secret_token_here
```

### `NODE_ENV`

**用途**：

- Node.js 环境标识
- 通常由 Next.js 自动设置，无需手动配置

**可选值**：

- `development` - 开发环境
- `production` - 生产环境
- `test` - 测试环境

**注意**：

- 通常不需要手动设置
- Next.js 会根据运行命令自动设置：
  - `pnpm dev` → `development`
  - `pnpm build` → `production`

## 环境变量文件

### 文件优先级

Next.js 按以下顺序加载环境变量（后面的会覆盖前面的）：

1. `.env` - 所有环境的默认配置
2. `.env.local` - 本地覆盖（不提交到 Git）
3. `.env.development` / `.env.production` - 环境特定配置
4. `.env.development.local` / `.env.production.local` - 环境特定的本地覆盖

### 文件位置

所有环境变量文件位于：`apps/prism/`

```
apps/prism/
├── .env.development    # 开发环境配置
├── .env.production     # 生产环境配置
└── .env.local          # 本地覆盖（不提交到 Git）
```

## 使用方式

### 在代码中使用

```typescript
import { env } from '@/lib/env';

// 访问环境变量
const apiUrl = env.NEXT_PUBLIC_API_URL;
const logLevel = env.NEXT_PUBLIC_LOG_LEVEL;
```

### 类型安全

所有环境变量都通过 Zod 进行类型校验，如果配置错误会在构建时报错。

## 常见问题

### Q: 修改环境变量后没有生效？

**A**: 需要重启开发服务器：

```bash
# 停止服务器（Ctrl+C）
# 重新启动
pnpm dev
```

### Q: 如何查看当前生效的环境变量？

**A**: 在代码中临时打印：

```typescript
import { env } from '@/lib/env';
console.log('Current env:', env);
```

### Q: 生产环境如何配置环境变量？

**A**: 根据部署平台配置：

- **Vercel**: 在项目设置中配置 Environment Variables
- **Docker**: 使用 `-e` 参数或 `.env` 文件
- **其他平台**: 参考平台文档

### Q: 为什么有些变量是 `NEXT_PUBLIC_*` 开头？

**A**: Next.js 约定，以 `NEXT_PUBLIC_` 开头的变量会暴露到客户端代码中。如果不需要在客户端使用，不要加这个前缀。

## 快速参考

### 最小配置（开发环境）

```bash
# .env.development
NEXT_PUBLIC_API_URL=http://192.168.50.244:1337
```

### 完整配置（开发环境）

```bash
# .env.development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://192.168.50.244:1337
NEXT_PUBLIC_LOG_LEVEL=debug
STRAPI_API_TOKEN=your_token_here
```

### 完整配置（生产环境）

```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_LOG_LEVEL=error
STRAPI_API_TOKEN=your_production_token
```

## 相关文件

- 环境变量定义：`apps/prism/lib/env.ts`
- 日志配置：`apps/prism/lib/observability/logger.ts`
- API 配置：`apps/prism/lib/api/config.ts`
