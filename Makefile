# .PHONY: up down build logs clean ps topics verify help

# ## Khởi động toàn bộ infrastructure
# up:
# 	docker-compose up -d
# 	@echo.
# 	@echo   Infrastructure started
# 	@echo   Kafka    : localhost:9092
# 	@echo   Redis    : localhost:6379
# 	@echo   MySQL    : localhost:3306
# 	@echo   Mongo    : localhost:27017
# 	@echo   Postgres : localhost:5432 (shipping_db, report_db)
# 	@echo   NiFi     : https://localhost:8443
# 	@echo   Grafana  : http://localhost:3100  (admin/admin)
# 	@echo   Prometheus: http://localhost:9090
# 	@echo.
# 	@echo   Run 'make topics' to create Kafka topics

# ## Tắt toàn bộ containers
# down:
# 	docker-compose down

# ## Tắt và xóa toàn bộ volumes
# clean:
# 	docker-compose down -v --remove-orphans
# 	@echo   All volumes deleted

# ## Build lại images
# build:
# 	docker-compose build --no-cache

# ## Xem logs realtime
# logs:
# 	docker-compose logs -f

# ## Logs của 1 service cụ thể: make logs-kafka
# logs-%:
# 	docker-compose logs -f $*

# ## Xem trạng thái containers
# ps:
# 	docker-compose ps

# ## Tạo 9 Kafka topics
# topics:
# 	@echo Creating BICAP Kafka topics...
# 	docker exec bicap-kafka bash /opt/kafka/create-topics.sh
# 	@echo Topics created

# ## Verify toàn bộ infrastructure
# verify:
# 	@echo ━━ Checking Kafka...
# 	docker exec bicap-kafka kafka-topics --bootstrap-server localhost:9092 --list
# 	@echo ━━ Checking Redis...
# 	docker exec bicap-redis redis-cli ping
# 	@echo ━━ Checking MySQL...
# 	docker exec bicap-mysql mysql -u root -p12123 -e "SHOW DATABASES LIKE '%_db';"
# 	@echo ━━ Checking Mongo...
# 	docker exec bicap-mongo mongosh --quiet --eval "db.adminCommand('ping')"
# 	@echo ━━ Checking Postgres (shipping + report)...
# 	docker exec bicap-postgres pg_isready -U postgres -d shipping_db
# 	@echo ━━ Checking Postgres (report)...
# 	docker exec bicap-postgres pg_isready -U postgres -d report_db
# 	@echo ━━ All checks done

# ## Hiển thị danh sách lệnh
# help:
# 	@echo.
# 	@echo   BICAP System - Available Commands:
# 	@echo   make up       - Start all infrastructure
# 	@echo   make down     - Stop containers (keep volumes)
# 	@echo   make clean    - Stop + delete all volumes (RESET)
# 	@echo   make build    - Rebuild images
# 	@echo   make logs     - View all logs realtime
# 	@echo   make logs-X   - View logs of service X (e.g. make logs-kafka)
# 	@echo   make ps       - Show container status
# 	@echo   make topics   - Create 9 Kafka topics
# 	@echo   make verify   - Verify all services running
# 	@echo.


## ══ DEMO targets (dành cho demo thầy) ══════════════════════

## Build tất cả Docker images
demo-build:
	docker-compose -f docker-compose.demo.yml build

## Khởi động toàn bộ hệ thống (demo mode)
demo-up:
	docker-compose -f docker-compose.demo.yml up -d
	@echo.
	@echo ✅ BICAP Demo đang khởi động...
	@echo Chờ 60-90 giây để các services healthy
	@echo.
	@echo 🌐 Web Public   : http://localhost
	@echo 🔧 Web Admin    : http://admin.localhost
	@echo 🌿 Web Farm     : http://farm.localhost
	@echo 🛒 Web Retailer : http://retail.localhost
	@echo 🚚 Web Shipping : http://shipping.localhost
	@echo 📊 Grafana      : http://localhost:3100
	@echo 🔍 Prometheus   : http://localhost:9090

## Dừng demo
demo-down:
	docker-compose -f docker-compose.demo.yml down

## Xem status
demo-ps:
	docker-compose -f docker-compose.demo.yml ps

## Xem logs 1 service: make demo-logs-identity
demo-logs-%:
	docker-compose -f docker-compose.demo.yml logs -f $*

## Tạo Kafka topics cho demo compose (kafka:29092 internal)
demo-topics:
	docker cp infrastructure/kafka/create-topics.sh bicap-kafka:/tmp/create-topics.sh
	docker exec -e BOOTSTRAP_SERVER=localhost:29092 bicap-kafka bash -c "tr -d '\r' < /tmp/create-topics.sh > /tmp/create-topics.unix.sh && bash /tmp/create-topics.unix.sh"

## Verify tất cả services healthy
demo-verify:
	docker exec bicap-mysql mysqladmin ping -u root -p12123 --silent
	docker exec bicap-redis redis-cli ping
	curl -s http://localhost/nginx-health