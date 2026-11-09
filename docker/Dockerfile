# check=skip=SecretsUsedInArgOrEnv
# (KOMBO_SSL_KEY_STORE below is the path of the keystore, not a secret: the password is never in the image)

# Kombo image, built in three stages from the root of the repository:
#   docker build -f docker/Dockerfile -t deliaml10/kombo:dev .
# 1. Build of the React client (static files)
# 2. Build of the Spring Boot jar, with the static files of the client inside
# 3. Final image with only the Java runtime (JRE) and the jar

# ---------- Stage 1: React client ----------
FROM node:22-alpine AS frontend
WORKDIR /frontend
# Dependencies first, so Docker reuses this layer while package*.json do not change
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: Spring Boot jar ----------
FROM eclipse-temurin:21-jdk AS backend
WORKDIR /backend
COPY backend/mvnw backend/pom.xml ./
COPY backend/.mvn .mvn
# Downloads the dependencies in their own layer (reused while pom.xml does not change)
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY backend/src src
# The client is served by Spring Boot as static content, from the same origin as the REST API
COPY --from=frontend /frontend/dist src/main/resources/static
RUN ./mvnw -B -q package -DskipTests && cp target/kombo-*.jar /backend/kombo.jar

# ---------- Stage 3: runtime ----------
FROM eclipse-temurin:21-jre
WORKDIR /app
# Unprivileged user: the application does not need root
RUN groupadd --system kombo && useradd --system --gid kombo --home /app kombo \
    && mkdir -p /app/certs && chown kombo:kombo /app/certs
COPY --from=backend /backend/kombo.jar /app/kombo.jar
COPY --chmod=755 docker/entrypoint.sh /app/entrypoint.sh

# A non-root user cannot listen on ports below 1024, so the container uses 8443
# and docker compose publishes it as port 443 of the host
ENV SERVER_PORT=8443 \
    KOMBO_SSL_KEY_STORE=file:/app/certs/kombo-keystore.p12
EXPOSE 8443
# Keeps the generated keystore when the container is recreated
VOLUME /app/certs

USER kombo
ENTRYPOINT ["/app/entrypoint.sh"]
