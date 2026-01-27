# ---- Base Stage ----
# Use the official Node.js 20 Alpine image as the base
FROM node:20-alpine AS base

# ---- Dependencies Stage ----
# Install dependencies only when needed
FROM base AS deps
# Add compatibility layer for native modules on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
# Install dependencies using npm ci for a clean, reproducible install
RUN npm ci

# ---- Builder Stage ----
# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from the deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application source code
COPY . .

# Build the Next.js application
# The GOOGLE_API_KEY can be provided at build time or runtime
# For Cloud Run, it's best to provide it at runtime via environment variables
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runner Stage ----
# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder from the builder stage (if it exists)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy the standalone output and static files from the builder stage
# The standalone output is enabled by `output: 'standalone'` in next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the port the app runs on
EXPOSE 3000

# Set the port environment variable
ENV PORT=3000

# Set the hostname to listen on all network interfaces
ENV HOSTNAME="0.0.0.0"

# Run the application
CMD ["node", "server.js"]
