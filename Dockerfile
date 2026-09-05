# Multi-stage build for Cognitive Training Platform

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/schemas/package.json ./packages/schemas/
COPY packages/db/package.json ./packages/db/
COPY packages/game-core/package.json ./packages/game-core/
COPY packages/game-memory-matrix/package.json ./packages/game-memory-matrix/
COPY packages/game-target-watch/package.json ./packages/game-target-watch/
COPY packages/game-quick-match/package.json ./packages/game-quick-match/
COPY packages/game-stop-signal/package.json ./packages/game-stop-signal/
COPY packages/game-rule-switch/package.json ./packages/game-rule-switch/
COPY packages/scoring/package.json ./packages/scoring/
COPY packages/adaptive/package.json ./packages/adaptive/
COPY packages/planner/package.json ./packages/planner/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/*/node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN cd packages/db && pnpm exec prisma generate

# Build packages
RUN pnpm --filter @cog/schemas build
RUN pnpm --filter @cog/scoring build
RUN pnpm --filter @cog/adaptive build
RUN pnpm --filter @cog/planner build
RUN pnpm --filter @cog/game-core build
RUN pnpm --filter @cog/game-memory-matrix build
RUN pnpm --filter @cog/game-target-watch build
RUN pnpm --filter @cog/game-quick-match build
RUN pnpm --filter @cog/game-stop-signal build
RUN pnpm --filter @cog/game-rule-switch build

# Build web app
RUN pnpm --filter @cog/web build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built artifacts
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/*/node_modules ./packages/*/node_modules
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/packages/*/dist ./packages/*/dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/auth/me || exit 1

# Start application
CMD ["pnpm", "--filter", "@cog/web", "start"]
