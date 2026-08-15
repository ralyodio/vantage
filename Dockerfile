# Vantage API — Fly.io image.
# Built from the repo root so the workspace (and packages/shared) resolves:
#   docker build -t vantage-api .
# Fly does this automatically via fly.toml.
#
# Runtime notes:
# - Requires Node >= 22.18 (type-stripping is default-on) because
#   @vantage/shared ships TypeScript source resolved via workspaces.
# - Prisma client is generated at build time from ./prisma.

# ---------- deps ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN npm ci

# ---------- build ----------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NODE_ENV=production
# openssl CLI lets prisma detect the right engine target on slim images
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
# generate client, then compile the api workspace
RUN npx prisma generate \
 && npm run build --workspace=@vantage/api

# ---------- runtime ----------
FROM node:22-bookworm-slim AS runtime
WORKDIR /app
# openssl CLI: prisma detects its engine target at runtime as well
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
 && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production \
    API_HOST=0.0.0.0 \
    API_PORT=3001

# prisma engines + generated client live inside node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/prisma ./prisma
COPY package.json package-lock.json ./

# The api build also compiles @vantage/shared (its sources join the program
# via the workspace symlink). Point the workspace link at the compiled tree
# so `require('@vantage/shared')` resolves to CJS .js files — Node type
# stripping can't handle this package (extensionless relative imports).
RUN ln -sfn /app/apps/api/dist/packages/shared/src /app/node_modules/@vantage/shared

EXPOSE 3001
CMD ["node", "apps/api/dist/apps/api/src/index.js"]
