# Next.js + Strapi Docker 部署实战笔记

## 项目概况

- **prism**: Next.js 15 前端，Nx monorepo + pnpm
- **helpcenter**: Strapi 5 CMS 后端，PostgreSQL + Redis + Meilisearch
- **服务器**: Linux, Docker + Docker Compose
- **访问方式**: IP + 端口直接访问

## 目录结构

```
/opt/projects/
├── helpcenter/                # Strapi 后端
│   ├── backend/               # Strapi 源码
│   │   ├── Dockerfile
│   │   ├── public/uploads/    # 媒体文件
│   │   └── database/migrations/
│   ├── docker-compose.test.yml  # 测试环境编排
│   └── .env                   # 环境变量
└── prism/                     # Next.js 前端
    ├── Dockerfile
    ├── docker-compose.yml
    ├── .dockerignore
    └── apps/prism/            # Next.js 应用目录
        └── next.config.js
```

## 关键配置文件

### Docker DNS 配置 (`/etc/docker/daemon.json`)

Docker 容器内默认用宿主机的 DNS，如果宿主机用 `systemd-resolved`（127.0.0.53），容器内无法解析域名。需要显式配置：

```json
{
  "registry-mirrors": ["https://你的镜像加速地址"],
  "dns": ["192.168.50.1", "223.5.5.5", "8.8.8.8"]
}
```

修改后需要 `systemctl restart docker`，所有容器会短暂中断。

### Strapi Dockerfile

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./

# lock 文件不同步时用 npm install 替代 npm ci
RUN npm install

COPY . .
RUN npm run build
RUN mkdir -p public/uploads

EXPOSE 1337

# Alpine 没有 curl，用 wget 做健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:1337/_health || exit 1

CMD ["npm", "run", "develop"]
```

**踩坑点：**

- Strapi 5 要求 Node >= 20，不能用 node:18
- `npm ci` 要求 package-lock.json 和 package.json 完全同步，不同步时用 `npm install`
- Alpine 镜像没有 curl，healthcheck 用 wget
- `start-period` 要给够（60s），Strapi 启动慢

### Next.js Dockerfile（Nx Monorepo）

```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# --- 安装依赖 ---
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/prism/package.json ./apps/prism/
RUN pnpm install --frozen-lockfile

# --- 构建 ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_API_URL=http://192.168.50.4:1337
ENV STRAPI_URL=http://192.168.50.4:1337

RUN pnpm nx build prism

# --- 生产运行 ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 注意：Nx 输出在 dist/ 目录下，不是 apps/ 下
COPY --from=builder /app/apps/prism/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/prism/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/prism/.next/static ./dist/apps/prism/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/prism/server.js"]
```

**踩坑点：**

- Nx monorepo 构建输出在 `/app/dist/apps/prism/` 而不是 `/app/apps/prism/`
- `next.config.js` 必须加 `output: 'standalone'` 才能生成 standalone 目录
- Nx integrated 模式下 libs 没有独立 package.json，不需要单独 COPY
- `NEXT_PUBLIC_*` 环境变量必须在构建阶段设置（它们会被编译进 JS bundle）
- `typedRoutes: true` 会导致外部链接的 `href` 类型报错，构建时可设 `ignoreBuildErrors: true`

### Strapi docker-compose.test.yml（核心服务）

```yaml
services:
  postgres:
    image: postgres:15-alpine
    container_name: helpcenter-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-helpcenter}
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '25432:5432' # 避免和已有 PostgreSQL 冲突
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-postgres}']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: helpcenter-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - '26379:6379' # 避免和已有 Redis 冲突

  meilisearch:
    image: getmeili/meilisearch:v1.11
    container_name: helpcenter-meilisearch
    restart: unless-stopped
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
    volumes:
      - meili_data:/meili_data
    ports:
      - '7700:7700'
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:7700/health']

  strapi:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: helpcenter-strapi
    restart: unless-stopped
    environment:
      DATABASE_HOST: postgres # 用服务名，不是 localhost
      DATABASE_PORT: 5432 # 容器内部端口，不是映射端口
      REDIS_HOST: redis
      MEILI_HOST_URL: http://meilisearch:7700
      # ... 其他环境变量
    volumes:
      - ./backend:/app # 开发模式挂载源码
      - /app/node_modules # 排除 node_modules
      - ./backend/public/uploads:/app/public/uploads
    ports:
      - '1337:1337'
    networks:
      - helpcenter-network
      - app-network # 和前端共享网络
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      meilisearch:
        condition: service_healthy

networks:
  helpcenter-network:
    driver: bridge
  app-network:
    external: true # 预先创建: docker network create app-network
```

## 数据同步流程

### 为啥会乱码（大白话）

- **数据库 dump 本质是文本文件**，服务器上的 PostgreSQL 按 **UTF-8** 读最省事。
- 老写法是：`docker exec ... pg_dump ... > helpcenter_dump.sql`。在 **Windows PowerShell** 里，`>` 把输出存盘时有时会变成 **UTF-16**（带 BOM），你在本机打开可能正常，传到 Linux 上一导入，中文就容易 **乱码**。
- **解决办法**：不要让 PowerShell 去“改写”这份 SQL——先在 **容器里** 生成文件，再用 **`docker cp` 拷到 Windows**，文件一直是 Linux 下的 UTF-8，一般就不用再 `iconv` 了。

### 1. 本地导出（推荐：避免乱码）

在 **PowerShell / CMD** 里都可以直接跑（把容器名、库名换成你本机的；测试编排默认库名多为 `helpcenter`）：

```bash
# 1) 在 Postgres 容器内生成 SQL（UTF-8，不经 PowerShell 重定向）
docker exec helpcenter-postgres sh -c "pg_dump -U postgres -d helpcenter --no-owner --no-acl -f /tmp/helpcenter_dump.sql"

# 2) 拷到当前目录（项目根或任意目录）
docker cp helpcenter-postgres:/tmp/helpcenter_dump.sql ./helpcenter_dump.sql
```

**打包 uploads**（在仓库 `helpcenter` 一侧；路径按你本机调整）：

```bash
# Linux / macOS / Git Bash
tar -czf uploads.tar.gz -C helpcenter/backend/public uploads

# Windows PowerShell（把 D:\WORK\helpcenter 换成你的路径）
tar -czf uploads.tar.gz -C D:\WORK\helpcenter\backend\public uploads
```

**若你坚持用管道落到本机一个 `.sql` 文件**（次选），在 PowerShell 里显式 UTF-8 无 BOM：

```powershell
docker exec helpcenter-postgres pg_dump -U postgres -d helpcenter --no-owner --no-acl |
  Set-Content -Path .\helpcenter_dump.sql -Encoding utf8NoBOM
```

### 2. 传输到服务器

```bash
scp helpcenter_dump.sql root@192.168.50.4:/opt/projects/helpcenter/
scp uploads.tar.gz root@192.168.50.4:/opt/projects/helpcenter/
```

### 3. 服务器导入

```bash
# 停止 Strapi
docker compose -f docker-compose.test.yml stop strapi

# 若 SQL 已是 UTF-8（推荐导出方式），直接导入，跳过下面 iconv。
# 只有当你确认文件是 PowerShell 用 `>` 导出的 UTF-16 时，才需要转换：
# iconv -f UTF-16LE -t UTF-8 helpcenter_dump.sql > helpcenter_dump_utf8.sql
# 然后下面把 helpcenter_dump.sql 改成 helpcenter_dump_utf8.sql

# 清空并导入数据库
docker exec -i helpcenter-postgres psql -U postgres -d helpcenter \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
docker exec -i helpcenter-postgres psql -U postgres -d helpcenter \
  < helpcenter_dump.sql

# 解压 uploads（覆盖服务端文件）
tar -xzf uploads.tar.gz -C backend/public/

# 重启 Strapi
docker compose -f docker-compose.test.yml start strapi
```

**踩坑点：**

- **推荐**用「容器内 `pg_dump -f` + `docker cp`」，避免 Windows 重定向导致 UTF-16 乱码；`iconv` 仅作补救。
- 导入前要 `DROP SCHEMA public CASCADE` 清空，否则会有表冲突。
- 导入后 Strapi 的 Public 角色 API 权限不会自动开放，需要在管理面板手动配置。

## 端口分配表

| 服务                    | 端口  | 说明                     |
| ----------------------- | ----- | ------------------------ |
| Next.js (prism)         | 3000  | 前端                     |
| Strapi                  | 1337  | 后端 API + 管理面板      |
| PostgreSQL (helpcenter) | 25432 | 避免和 SSO 的 15432 冲突 |
| Redis (helpcenter)      | 26379 | 避免和已有 6379 冲突     |
| Meilisearch             | 7700  | 搜索引擎                 |

## 常用运维命令

```bash
# 查看所有容器状态
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 查看日志
docker logs helpcenter-strapi --tail=50 -f
docker logs prism-frontend --tail=50 -f

# 重启单个服务
docker compose -f docker-compose.test.yml restart strapi

# 更新代码并重新部署
cd /opt/projects/helpcenter && git pull && docker compose -f docker-compose.test.yml up -d --build
cd /opt/projects/prism && git pull && docker compose up -d --build

# 进入容器调试
docker exec -it helpcenter-strapi sh
docker exec -it helpcenter-postgres psql -U postgres -d helpcenter

# 清理 Docker 缓存（磁盘不足时）
docker system prune -a
```

## 数据库迁移注意事项

Strapi 的自定义迁移脚本（`database/migrations/`）在全新数据库上运行时，表可能还不存在。需要先检查表是否存在再操作列：

```javascript
// 错误写法 — 表不存在时 hasColumn 会报错
const has = await knex.schema.hasColumn('articles', 'published_at');

// 正确写法 — 先检查表
const hasTable = await knex.schema.hasTable('articles');
if (hasTable) {
  const hasCol = await knex.schema.hasColumn('articles', 'published_at');
  // ...
}
```
