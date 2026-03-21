# ════════════════════════════════════════════════════════════════
# BICAP SYSTEM — Makefile
# Yêu cầu: Docker Desktop đang chạy
# ════════════════════════════════════════════════════════════════

.PHONY: up down build logs clean ps topics verify help

## Khởi động toàn bộ infrastructure
up:
	docker-compose up -d
	@echo.
	@echo   ✅ Infrastructure started!
	@echo   Kafka    : localhost:9092
	@echo   Redis    : localhost:6379
	@echo   SQL Svr  : localhost:1433
	@echo   NiFi     : https://localhost:8443
	@echo   Grafana  : http://localhost:3100  (admin/admin)
	@echo   Prometheus: http://localhost:9090
	@echo.
	@echo   Run 'make topics' to create Kafka topics

## Tắt toàn bộ containers
down:
	docker-compose down

## Tắt và xóa toàn bộ volumes (reset hoàn toàn)
clean:
	docker-compose down -v --remove-orphans
	@echo   ⚠️  All volumes deleted!

## Build lại images
build:
	docker-compose build --no-cache

## Xem logs realtime (Ctrl+C để thoát)
logs:
	docker-compose logs -f

## Logs của 1 service cụ thể: make logs-kafka
logs-%:
	docker-compose logs -f $*

## Xem trạng thái containers
ps:
	docker-compose ps

## Tạo 9 Kafka topics (idempotent — chạy lại được)
topics:
	@echo Creating BICAP Kafka topics...
	docker exec bicap-kafka bash /opt/kafka/create-topics.sh
	@echo ✅ Topics created!

## Verify toàn bộ infrastructure
verify:
	@echo ━━ Checking Kafka...
	docker exec bicap-kafka kafka-topics --bootstrap-server localhost:9092 --list
	@echo ━━ Checking Redis...
	docker exec bicap-redis redis-cli ping
	@echo ━━ Checking MySQL...
	docker exec bicap-mysql mysql -u root -p12123 -e "SHOW DATABASES LIKE '%_db';"
	@echo ━━ All checks done!

## Hiển thị danh sách lệnh
help:
	@echo.
	@echo   BICAP System - Available Commands:
	@echo   make up       - Start all infrastructure
	@echo   make down     - Stop containers (keep volumes)
	@echo   make clean    - Stop + delete all volumes (RESET!)
	@echo   make build    - Rebuild images
	@echo   make logs     - View all logs realtime
	@echo   make logs-X   - View logs of service X (e.g. make logs-kafka)
	@echo   make ps       - Show container status
	@echo   make topics   - Create 9 Kafka topics
	@echo   make verify   - Verify all services running
	@echo.