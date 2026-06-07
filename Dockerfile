FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/jd-frontend/package.json ./apps/jd-frontend/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_LOG_LEVEL=info

RUN pnpm nx build jd-frontend

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_LOG_LEVEL=info

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/jd-frontend/public ./apps/jd-frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/jd-frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/dist/apps/jd-frontend/.next/static ./dist/apps/jd-frontend/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "apps/jd-frontend/server.js"]
