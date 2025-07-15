# Stage 1: Build the Next.js app
FROM --platform=linux/amd64 node:18-alpine AS builder
WORKDIR /app

# Set platform args
ARG TARGETARCH
ARG TARGETOS

# Install build dependencies
RUN apk add --no-cache libc6-compat

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Copy public assets including fonts
COPY public ./public

# Copy source code (exclude node_modules and .next for better caching)
COPY . .

# Set environment to production for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with network access disabled to prevent external font fetching
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Install production dependencies
RUN apk add --no-cache libc6-compat

# Copy the standalone directory
COPY --from=builder /app/.next/standalone ./

# Copy static files
COPY --from=builder /app/public ./public

# Copy .next files necessary for standalone mode
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/server ./.next/server

# Copy necessary configuration files
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/src/middleware.ts ./

# Ensure the server.js is executable
RUN chmod +x /app/server.js

# Expose the port the app runs on
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
