FROM node:20-alpine AS deps

WORKDIR /workspace

RUN corepack enable

# Monorepo workspace metadata + local packages used by web-app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY web-app ./web-app

RUN pnpm install --no-frozen-lockfile

FROM node:20-alpine AS builder

WORKDIR /workspace

RUN corepack enable

COPY --from=deps /workspace /workspace

ARG DOCKER_BUILD=0
ENV DOCKER_BUILD=$DOCKER_BUILD

# Public URL phải là URL host-reachable (qua nginx) vì giá trị này được Next.js
# inline vào bundle browser khi build.
ARG NEXT_PUBLIC_API_URL=http://localhost/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN pnpm --filter web-app build

FROM node:20-alpine AS runner

WORKDIR /app

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /workspace/web-app/.next/standalone ./
COPY --from=builder /workspace/web-app/.next/static ./web-app/.next/static
COPY --from=builder /workspace/web-app/public ./web-app/public

USER nextjs

EXPOSE 3000

CMD ["node", "web-app/server.js"]