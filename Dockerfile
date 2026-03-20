FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
ENV NODE_ENV=development
# Cache the npm package store between builds to avoid re-downloading packages
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit --legacy-peer-deps --include=dev 2>/dev/null || \
    npm install --no-audit --legacy-peer-deps --include=dev

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY next.config.js tsconfig.json tailwind.config.ts postcss.config.js ./
COPY public ./public
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts
COPY sql ./sql
COPY plugin-hub ./plugin-hub

ARG NEXT_PUBLIC_API_URL=http://localhost:8302
ARG NEXT_PUBLIC_WS_PROXY_URL=ws://localhost:3002/api/openai-realtime
ARG NEXT_PUBLIC_WS_PROXY_PORT=3002
ARG BUILD_MEMORY_LIMIT=8192

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_PROXY_URL=${NEXT_PUBLIC_WS_PROXY_URL}
ENV NEXT_PUBLIC_WS_PROXY_PORT=${NEXT_PUBLIC_WS_PROXY_PORT}
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1
ENV LANGFUSE_HOST="http://dummy-langfuse-host.com"
# Reduce build resource usage
ENV CI=true
# Limit npm concurrency to reduce memory spikes
ENV npm_config_maxsockets=2
# Limit webpack parallelism
ENV WEBPACK_PARALLELISM=2

# Cache .next/cache between builds for incremental Next.js compilation
# NEXTAUTH_SECRET passed inline (not as ENV layer) to avoid secret exposure in image history
RUN --mount=type=cache,target=/app/.next/cache \
    NEXTAUTH_SECRET="dummy_secret_at_least_32_characters_long_for_build" \
    NEXT_PUBLIC_APP_VERSION=$(node -p "require('./package.json').version") \
    NODE_OPTIONS="--max-old-space-size=${BUILD_MEMORY_LIMIT} --max-semi-space-size=64" \
    npm run build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8301 \
    HOSTNAME="0.0.0.0" \
    NODE_OPTIONS="--max-old-space-size=2048"

RUN apk add --no-cache postgresql-client dos2unix openssl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/sql ./sql
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

COPY docker-entrypoint.sh /docker-entrypoint.sh

# Pre-create upload directories with correct ownership so the app can write files
RUN dos2unix /docker-entrypoint.sh && mkdir -p .next && chown nextjs:nodejs .next && chmod +x /docker-entrypoint.sh \
    && mkdir -p public/uploads/widget-avatars public/uploads/logos public/uploads/emulator-backgrounds public/uploads/favicons \
    && chown -R nextjs:nodejs public/uploads

USER nextjs
EXPOSE 8301

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
