# BICAP — web-retailer Dockerfile (Vite static build)

FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN adduser -D app
RUN npm install -g serve

COPY --from=builder /app/dist ./dist

RUN chown -R app:app /app
USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3002 || exit 1

EXPOSE 3002

ENTRYPOINT ["serve", "-s", "dist", "-l", "3002"]