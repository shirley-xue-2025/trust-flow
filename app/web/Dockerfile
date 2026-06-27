# TrustFlow web — multi-stage build.
# Build context MUST be the `src/` workspace root (see docker-compose.yml).
# Build stage: build shared + web (Vite) -> static dist. Runtime: nginx serves
# the static files and reverse-proxies /v1 (incl. SSE) to the backend.

# ---- Build stage ------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY web/package.json ./web/
RUN npm ci

COPY shared ./shared
COPY web ./web

# shared must be built first (web imports @trustflow/shared types). Then Vite.
# The web bundle calls the backend with same-origin RELATIVE /v1 paths (see
# web/src/api.ts), so no backend URL is baked in — nginx proxies /v1.
RUN npm run build --workspace shared \
 && npm run build --workspace web

# ---- Runtime stage: nginx serving the SPA ----------------------------------
FROM nginx:alpine AS runtime
# apache2-utils provides htpasswd, used by the startup script to build the
# basic-auth file when a passcode is configured.
RUN apk add --no-cache apache2-utils
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Default auth include (off); the entrypoint script overwrites it when a
# passcode is set. Shipped so nginx always has a valid include.
COPY deploy/auth.inc /etc/nginx/conf.d/auth.inc
COPY deploy/40-basic-auth.sh /docker-entrypoint.d/40-basic-auth.sh
RUN chmod +x /docker-entrypoint.d/40-basic-auth.sh
COPY --from=build /app/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
