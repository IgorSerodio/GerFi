FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install tsx globally and install script dependencies locally
# Next.js bundles pure JS dependencies (like bcryptjs) into its server files, removing them from standalone node_modules
RUN npm install -g tsx && npm install bcryptjs pg

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy original package.json to maintain script definitions (like migrate and seed)
# This MUST be after copying standalone so it overwrites the minimal package.json
COPY package.json ./

# Copy scripts and sql directories for database migration/seeding
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/sql ./sql

# Copy only the database connection file needed by the scripts
COPY --from=builder /app/src/infra/database.ts ./src/infra/database.ts

# Create an empty .env file so that `npm run migrate` (--env-file=.env) doesn't crash
# when passing environment variables directly via docker-compose
RUN touch .env

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
