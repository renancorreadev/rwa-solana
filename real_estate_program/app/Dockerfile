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

# Production image - nginx with reverse proxy
FROM nginx:alpine AS runner

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
