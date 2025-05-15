# ---- Build Stage ----
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies (npm ci if lockfile is present)
COPY package.json package-lock.json ./
RUN npm ci

# Copy all files (including convex/ and app/)
COPY . .

# Build Next.js app
RUN npm run build

# ---- Production Stage ----
FROM node:18-alpine AS runner

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy built app and other necessary files from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.js ./next.config.js
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/app ./app
COPY --from=builder /app/convex ./convex
COPY --from=builder /app/src ./src
COPY --from=builder /app/middleware.ts ./middleware.ts
COPY --from=builder /app/.env.example ./.env.example

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Set environment variable for Next.js to use port 8080
ENV PORT 8080

# Start the Next.js app
CMD ["npm", "start", "--", "-p", "8080"]
