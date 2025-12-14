# Hub Token Frontend App
FROM node:20-alpine AS builder

# Install build dependencies for native modules (including usb/libudev)
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev libusb-dev

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Remove package-lock.json and install fresh to get correct platform binaries
RUN rm -f package-lock.json && npm install

# Copy source
COPY . .

# Build for production
RUN npm run build

# Production image - serve with Node
FROM node:20-alpine AS runner

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist ./dist

# Create non-root user and fix permissions
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app/dist
USER nodejs

EXPOSE 5173

# Serve the app
CMD ["serve", "-s", "dist", "-l", "5173"]
