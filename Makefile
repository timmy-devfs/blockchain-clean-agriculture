# ════════════════════════════════════════════════════════════
# BICAP SYSTEM — Makefile
# Yêu cầu: Docker Desktop đang chạy
# ════════════════════════════════════════════════════════════

.PHONY: up down build logs clean ps help

## Khởi động toàn bộ infrastructure (Kafka, Redis, SQL Server, NiFi)
up:
	docker-compose up -d

## Tắt toàn bộ containers
down:
	docker-compose down

## Build lại images
build:
	docker-compose build --no-cache

## Xem logs realtime (Ctrl+C để thoát)
logs:
	docker-compose logs -f

## Xóa toàn bộ containers, volumes, network
clean:
	docker-compose down -v --remove-orphans

## Xem trạng thái các containers
ps:
	docker-compose ps

## Hiển thị danh sách lệnh
help:
	@echo.
	@echo   BICAP System - Available Commands:
	@echo   make up      - Start all infrastructure
	@echo   make down    - Stop all containers
	@echo   make build   - Rebuild images
	@echo   make logs    - View realtime logs
	@echo   make clean   - Remove all containers + volumes
	@echo   make ps      - Show container status
	@echo.