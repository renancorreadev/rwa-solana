# Hub Credential KYC API
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock* ./
RUN yarn install --ignore-optional 2>/dev/null || yarn install

# Copy source
COPY . .

# Build TypeScript
RUN yarn build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api
USER api

EXPOSE 3001

CMD ["node", "dist/app.js"]
