# BICAP — web-farm Dockerfile (Vite static build)

FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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
    CMD wget -qO- http://localhost:3001 || exit 1

EXPOSE 3001

ENTRYPOINT ["serve", "-s", "dist", "-l", "3001"]
