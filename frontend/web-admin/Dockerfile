# ════════════════════════════════════════════════════════════════
# BICAP — web-admin Dockerfile (NextJS 14 standalone)
# ════════════════════════════════════════════════════════════════

FROM node:20-alpine AS builder

WORKDIR /workspace

RUN corepack enable

# Workspace-aware install để web-admin thấy @bicap/* packages
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages ./packages
COPY web-admin ./web-admin

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter bicap-web-admin build

FROM node:20-alpine

WORKDIR /workspace

RUN adduser -D app
RUN corepack enable

COPY --from=builder /workspace /workspace

RUN chown -R app:app /workspace
USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000 || exit 1

EXPOSE 3000

ENTRYPOINT ["pnpm", "--filter", "bicap-web-admin", "start"]