# ════════════════════════════════════════════════════════════════
# BICAP — farm-service Dockerfile (NodeJS/TypeScript)
# ════════════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Cache node_modules
COPY package*.json ./
RUN npm ci

# Copy source và build TypeScript → dist/
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Non-root user
RUN adduser -D app

# Chỉ copy dist và node_modules đã build
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

RUN chown -R app:app /app
USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:8083/health || exit 1

EXPOSE 8083

ENTRYPOINT ["node", "dist/server.js"]