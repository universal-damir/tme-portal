# TME Portal Production Dockerfile
# Multi-stage build for optimized production image
# Supports cross-platform builds (AMD64)

# Stage 1: Dependencies
FROM --platform=linux/amd64 node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install ALL dependencies (including dev dependencies needed for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM --platform=linux/amd64 node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application (disable ESLint for production build)
ENV ESLINT_NO_DEV_ERRORS=true
ENV DISABLE_ESLINT_PLUGIN=true
# Use dummy URLs for build phase (will be overridden at runtime)
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV REDIS_URL=redis://localhost:6379
ENV NEXTAUTH_SECRET=dummy-build-secret
ENV OPENAI_API_KEY=placeholder_key_for_build
# Skip Redis connections during build
ENV SKIP_REDIS_CONNECTION=true
RUN npm run build

# Stage 3: Runner
FROM --platform=linux/amd64 node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Security hardening: Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Security: Remove unnecessary packages and clear cache
RUN rm -rf /var/cache/apk/* /tmp/* /var/tmp/*

# Copy the public folder including staff photos
COPY --from=builder /app/public ./public

# Ensure staff photos are included for profile photos feature
# Note: staff-photos directory should exist in project root/public/
RUN mkdir -p /app/public/staff-photos

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy database scripts and uploads folder
COPY --from=builder --chown=nextjs:nodejs /app/database ./database
RUN mkdir -p /app/public/uploads && chown nextjs:nodejs /app/public/uploads

# Install production dependencies only
COPY --from=deps /app/node_modules ./node_modules

# Security: Set proper permissions
RUN chmod 755 /app && \
    chmod -R 755 /app/public && \
    chmod -R 700 /app/database && \
    find /app -type f -name "*.json" -exec chmod 644 {} \; && \
    find /app -type f -name "*.js" -exec chmod 644 {} \;

# Switch to non-root user
USER nextjs

# Expose port 3000
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]