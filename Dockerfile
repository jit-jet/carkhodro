# ─────────────────────────────────────────────────────────────────────────────
# Stage: base — shared Alpine + OpenSSL (required by Prisma)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# ─────────────────────────────────────────────────────────────────────────────
# Stage: deps — install all node_modules once, reused by later stages
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm i

# ─────────────────────────────────────────────────────────────────────────────
# Stage: migrate — one-shot Prisma migration runner (no volume dependency)
# Bakes node_modules + prisma schema into the image so it never touches the
# anonymous volume that caused the missing @prisma/studio-core error.
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS migrate
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY prisma.config.ts ./
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage: dev — development server (source code mounted as a volume at runtime)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS dev
ENV NODE_ENV=development    
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 3000
# Source files come in via volume mount in docker-compose.yml
CMD ["npm", "run", "dev"]

# ─────────────────────────────────────────────────────────────────────────────
# Stage: builder — compile Next.js for production (standalone output)
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client targeting the Alpine (linux-musl) runtime
RUN npx prisma generate

RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage: runner — minimal production image (~150 MB)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# ── Next.js standalone bundle ─────────────────────────────────────────────────
# standalone/ contains server.js + its own minimal node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets and public dir must be added alongside standalone/
COPY --from=builder --chown=nextjs:nodejs /app/.next/static  ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public        ./public

# ── Prisma: schema + migrations + CLI for `migrate deploy` ───────────────────
# Built inside an Alpine image so binaries match the runner OS
COPY --from=builder --chown=nextjs:nodejs /app/prisma          ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma      ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma     ./node_modules/@prisma

USER nextjs
EXPOSE 3000

# Run pending migrations, then start the standalone server
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
