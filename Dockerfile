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

ENV NEXT_PUBLIC_APP_URL=http://192.168.50.4:3000
ENV NEXT_PUBLIC_API_URL=http://192.168.50.4:1337
ENV NEXT_PUBLIC_STRAPI_URL=http://192.168.50.4:1337
ENV NEXT_PUBLIC_IMAGE_BASE_URL=http://192.168.50.4:1337
ENV NEXT_PUBLIC_MAGENTO_API_URL=http://192.168.50.4:13000
ENV NEXT_PUBLIC_LOG_LEVEL=debug
ENV NEXT_PUBLIC_USE_API_PROXY=true

RUN pnpm nx build prism

# --- 生产运行 ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=http://192.168.50.4:3000
ENV NEXT_PUBLIC_API_URL=http://192.168.50.4:1337
ENV NEXT_PUBLIC_STRAPI_URL=http://192.168.50.4:1337
ENV NEXT_PUBLIC_IMAGE_BASE_URL=http://192.168.50.4:1337
ENV NEXT_PUBLIC_MAGENTO_API_URL=http://192.168.50.4:13000
ENV NEXT_PUBLIC_LOG_LEVEL=debug
ENV NEXT_PUBLIC_USE_API_PROXY=true

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/prism/public ./apps/prism/public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/prism/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/prism/.next/static ./dist/apps/prism/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/prism/server.js"]
