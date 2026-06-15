# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ============================================
# Stage 2: Prisma Generate
# ============================================
FROM node:20-alpine AS prisma

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma

# Generate Prisma Client
RUN npx prisma generate

# ============================================
# Stage 3: Migrations (has full deps + prisma CLI)
# ============================================
FROM node:20-alpine AS migrations

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma
COPY package.json ./
COPY prisma ./prisma
COPY scripts/docker-migrate.sh ./docker-migrate.sh

RUN chmod +x docker-migrate.sh

CMD ["sh", "./docker-migrate.sh"]

# ============================================
# Stage 4: Build
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma

COPY package.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./
COPY eslint.config.mjs ./
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ============================================
# Stage 5: Production
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=prisma /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /app/node_modules/@prisma ./node_modules/@prisma

# PaddleOCR runs as a separate sidecar container — no tesseract needed in app

# Copy bcryptjs for entrypoint seeding (not bundled by Next.js standalone)
COPY --from=deps /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Copy scripts (for seeding)
COPY scripts ./scripts

# Copy entrypoint
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create uploads directory
RUN mkdir -p public/uploads && \
    chown -R nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
