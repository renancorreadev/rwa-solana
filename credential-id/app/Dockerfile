# Hub Credential Frontend App
FROM node:20-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev

WORKDIR /app

# Copy package files
COPY package.json yarn.lock* ./

# Install dependencies - full install for build
RUN yarn install || npm install

# Copy source
COPY . .

# Build for production
RUN yarn build || npm run build

# Production image - serve with nginx
FROM nginx:alpine AS runner

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
