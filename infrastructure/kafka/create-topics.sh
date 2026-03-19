#!/bin/bash
# ════════════════════════════════════════════════════════════════
# BICAP — Tạo 9 Kafka topics (idempotent — chạy nhiều lần được)
# Gọi bởi: make topics
# ════════════════════════════════════════════════════════════════

set -e

KAFKA_CONTAINER="bicap-kafka"
BOOTSTRAP_SERVER="localhost:9092"
PARTITIONS=3
REPLICATION=1

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  BICAP — Creating Kafka Topics"
echo "  Bootstrap: $BOOTSTRAP_SERVER"
echo "  Partitions: $PARTITIONS | Replication: $REPLICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TOPICS=(
  "bicap.season.created"
  "bicap.season.updated"
  "bicap.season.exported"
  "bicap.order.placed"
  "bicap.order.confirmed"
  "bicap.order.delivered"
  "bicap.shipment.updated"
  "bicap.payment.success"
  "bicap.iot.alert"
)

for TOPIC in "${TOPICS[@]}"; do
  kafka-topics \
    --bootstrap-server "$BOOTSTRAP_SERVER" \
    --create \
    --if-not-exists \
    --topic "$TOPIC" \
    --partitions "$PARTITIONS" \
    --replication-factor "$REPLICATION" \
    --config retention.ms=604800000 \
    --config segment.bytes=1073741824

  echo "  ✓  $TOPIC"
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Verifying topics..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

kafka-topics \
  --bootstrap-server "$BOOTSTRAP_SERVER" \
  --list | grep "bicap\."

echo ""
echo "  ✅  All BICAP topics ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"