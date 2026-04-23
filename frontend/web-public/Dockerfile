# ════════════════════════════════════════════════════════════════
# BICAP — web-admin Dockerfile (NextJS 14 standalone)
# ════════════════════════════════════════════════════════════════

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build NextJS với standalone output
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN adduser -D app

# Standalone output chứa tất cả dependencies cần thiết
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R app:app /app
USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://web-public:3004 || exit 1

EXPOSE 3004

ENTRYPOINT ["node", "server.js"]