# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Compile ormconfig.ts for production migrations
RUN npx tsc ormconfig.ts --outDir dist --esModuleInterop --module commonjs --resolveJsonModule

# Stage 2: Production
FROM node:22-alpine AS production

# Install postgresql-client for pg_isready in entrypoint
RUN apk add --no-cache postgresql-client

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

WORKDIR /app

# Set ownership of workdir
RUN chown nestjs:nodejs /app

# Switch to non-root user BEFORE npm ci
USER nestjs

# Copy package files (owned by nestjs)
COPY --chown=nestjs:nodejs package*.json ./

# Install production dependencies (typeorm CLI needed for migrations)
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder (owned by nestjs)
COPY --chown=nestjs:nodejs --from=builder /app/dist ./dist

# Copy entrypoint script (owned by nestjs)
COPY --chown=nestjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health/live || exit 1

# Use entrypoint script (runs migrations then starts app)
ENTRYPOINT ["./docker-entrypoint.sh"]
