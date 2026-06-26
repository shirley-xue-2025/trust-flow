# TrustFlow backend — multi-stage build.
# Build context MUST be the `src/` workspace root (see docker-compose.yml), so
# npm workspaces resolve @trustflow/shared. Produces a slim image that runs the
# COMPILED server (node dist/server.js), not tsx.

# ---- Build stage: install workspace deps, build shared + backend ------------
FROM node:22-alpine AS build
WORKDIR /app

# Manifests first for layer caching. Copy each workspace's package.json so the
# workspace install resolves without the full source.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY web/package.json ./web/

# Install the whole workspace (dev deps included — tsc lives in devDeps).
RUN npm ci

# Now the sources for the workspaces we build.
COPY shared ./shared
COPY backend ./backend

# Build shared (tsc -> dist) then backend (tsc -> dist). tsc copies the imported
# *.seed.json fixtures into backend/dist/fixtures, so dist is self-contained for
# fixtures. Golden transcripts (backend/test/golden) are copied separately below.
RUN npm run build --workspace shared \
 && npm run build --workspace backend

# ---- Runtime stage: production deps only, run compiled JS -------------------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Install ONLY production dependencies for the workspace.
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY web/package.json ./web/
RUN npm ci --omit=dev --workspace @trustflow/backend --include-workspace-root

# Bring in built shared (dist + its schemas/ + package.json for the export map)
# and the compiled backend.
COPY --from=build /app/shared/dist ./shared/dist
COPY shared/schemas ./shared/schemas
COPY shared/package.json ./shared/package.json
COPY --from=build /app/backend/dist ./backend/dist

# Golden transcripts power the key-less ?replay= demo. The compiled loader looks
# under backend/test/golden by default; we copy them and pin TRUSTFLOW_GOLDEN_DIR.
COPY backend/test/golden ./backend/test/golden

# Runtime data dir (policy store + audit JSONL). Owned by the non-root `node`
# user that the official image ships, so the mounted volume is writable.
ENV TRUSTFLOW_DATA_DIR=/data \
    TRUSTFLOW_GOLDEN_DIR=/app/backend/test/golden \
    PORT=8080
RUN mkdir -p /data && chown -R node:node /data /app

USER node
EXPOSE 8080
WORKDIR /app/backend
CMD ["node", "dist/server.js"]
