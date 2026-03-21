# ════════════════════════════════════════════════════════════════
# BICAP — identity-service Dockerfile (Multi-stage)
# Stage 1: Build với Maven
# Stage 2: Run với JRE slim (image nhỏ hơn ~400MB)
# ════════════════════════════════════════════════════════════════

# ── Stage 1: Build ────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /build

# Copy POM trước để cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copy source và build
COPY src ./src
RUN mvn clean package -DskipTests -q

# ── Stage 2: Runtime ──────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Non-root user (security best practice)
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy JAR từ builder stage
COPY --from=builder /build/target/*.jar app.jar

# Đổi owner
RUN chown appuser:appgroup app.jar

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8081/actuator/health || exit 1

EXPOSE 8081

ENTRYPOINT ["java", \
    "-Xms256m", "-Xmx512m", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", "app.jar"]