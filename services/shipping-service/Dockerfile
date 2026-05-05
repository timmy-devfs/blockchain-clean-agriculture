# ════════════════════════════════════════════════════════════════
# BICAP — identity-service Dockerfile (Multi-stage)
# Stage 1: Build với Maven
# Stage 2: Runtime JRE slim — non-root user
# ════════════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /app

# Cache dependencies riêng — chỉ re-download khi pom.xml thay đổi
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# Build JAR
COPY src ./src
RUN mvn package -DskipTests -B -q

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Non-root user — security best practice
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/target/*.jar app.jar
RUN chown app:app app.jar

USER app

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget -qO- http://localhost:8084/actuator/health || exit 1

EXPOSE 8084

ENTRYPOINT ["java", "-Xms256m", "-Xmx512m", \
            "-Djava.security.egd=file:/dev/./urandom", \
            "-jar", "app.jar"]