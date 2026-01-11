# Docker e Containers

## Docker Compose

O projeto utiliza Docker Compose para orquestrar todos os serviços.

### Arquivo Principal (docker-compose.yml)

```yaml
version: '3.8'

services:
  # ============================================
  # BANCO DE DADOS
  # ============================================
  postgres:
    image: postgres:15-alpine
    container_name: hub-postgres-dev
    ports:
      - "5436:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hub_indexer
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - hub-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # INDEXADOR (GO)
  # ============================================
  indexer:
    build:
      context: ./services/indexer
      dockerfile: Dockerfile
    container_name: hub-indexer-dev
    ports:
      - "9090:9090"
    env_file:
      - ./services/indexer/.env
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - hub-network

  # ============================================
  # API PRINCIPAL (NODE.JS)
  # ============================================
  api:
    build:
      context: ./services/api
      dockerfile: Dockerfile
    container_name: hub-api-dev
    ports:
      - "3004:3002"
    env_file:
      - ./services/api/.env
    depends_on:
      postgres:
        condition: service_healthy
      indexer:
        condition: service_started
    restart: unless-stopped
    networks:
      - hub-network

  # ============================================
  # API KYC (NODE.JS)
  # ============================================
  kyc-api:
    build:
      context: ./services/kyc-api
      dockerfile: Dockerfile
    container_name: hub-kyc-api-dev
    ports:
      - "3005:3001"
    env_file:
      - ./services/kyc-api/.env
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - hub-network

  # ============================================
  # FRONTEND (REACT)
  # ============================================
  frontend:
    build:
      context: ./real_estate_program/app
      dockerfile: Dockerfile
    container_name: hub-frontend-dev
    ports:
      - "5174:5173"
    depends_on:
      - api
      - kyc-api
    restart: unless-stopped
    networks:
      - hub-network

# ============================================
# VOLUMES
# ============================================
volumes:
  postgres-data:

# ============================================
# NETWORKS
# ============================================
networks:
  hub-network:
    driver: bridge
```

---

## Dockerfiles

### API (Node.js)

```dockerfile
# services/api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build TypeScript
RUN npm run build

# ============================================
# Imagem de produção
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# Copiar apenas o necessário
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "dist/index.js"]
```

### KYC API (Node.js)

```dockerfile
# services/kyc-api/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/app.js"]
```

### Indexador (Go)

```dockerfile
# services/indexer/Dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copiar go.mod e go.sum
COPY go.mod go.sum ./
RUN go mod download

# Copiar código fonte
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -o indexer ./cmd/main.go

# ============================================
# Imagem final
# ============================================
FROM alpine:3.19

WORKDIR /app

# Certificados SSL
RUN apk --no-cache add ca-certificates

# Copiar binário
COPY --from=builder /app/indexer .

# Usuário não-root
RUN adduser -D appuser
USER appuser

EXPOSE 9090

CMD ["./indexer"]
```

### Frontend (React + Nginx)

```dockerfile
# real_estate_program/app/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Build
RUN npm run build

# ============================================
# Imagem de produção com Nginx
# ============================================
FROM nginx:alpine AS runner

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Config (Frontend)

```nginx
# real_estate_program/app/nginx.conf
server {
    listen 5173;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    # Cache de assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (se necessário)
    location /api/ {
        proxy_pass http://api:3002/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Comandos Docker

### Desenvolvimento

```bash
# Iniciar todos os serviços
docker compose up -d

# Ver logs
docker compose logs -f

# Logs de serviço específico
docker compose logs -f api

# Parar todos
docker compose down

# Rebuild específico
docker compose build --no-cache api
docker compose up -d api

# Entrar no container
docker exec -it hub-api-dev sh
```

### Produção

```bash
# Build e deploy
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Ver status
docker compose -f docker-compose.prod.yml ps

# Atualizar serviço específico
docker compose -f docker-compose.prod.yml build frontend
docker compose -f docker-compose.prod.yml up -d frontend
```

### Manutenção

```bash
# Limpar volumes não utilizados
docker volume prune

# Limpar imagens não utilizadas
docker image prune -a

# Ver uso de recursos
docker stats

# Backup do banco
docker exec hub-postgres-dev pg_dump -U postgres hub_indexer > backup.sql

# Restore do banco
cat backup.sql | docker exec -i hub-postgres-dev psql -U postgres hub_indexer
```

---

## Health Checks

### PostgreSQL

```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U postgres"]
  interval: 10s
  timeout: 5s
  retries: 5
```

### API

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### Indexador

```yaml
healthcheck:
  test: ["CMD", "wget", "-q", "--spider", "http://localhost:9090/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

## Rede Docker

### Comunicação Interna

Os serviços se comunicam usando nomes de container:

```
api → postgres        (hub-postgres-dev:5432)
api → indexer         (hub-indexer-dev:9090)
kyc-api → postgres    (hub-postgres-dev:5432)
indexer → postgres    (hub-postgres-dev:5432)
frontend → api        (hub-api-dev:3002)
```

### DNS Interno

```
postgres    → hub-postgres-dev
indexer     → hub-indexer-dev
api         → hub-api-dev
kyc-api     → hub-kyc-api-dev
frontend    → hub-frontend-dev
```

---

## Volumes

### postgres-data

Persiste os dados do PostgreSQL entre reinicializações.

```yaml
volumes:
  postgres-data:
    driver: local
```

### Localização

```bash
# Ver volumes
docker volume ls

# Inspecionar volume
docker volume inspect solana_postgres-data

# Caminho físico (Linux)
/var/lib/docker/volumes/solana_postgres-data/_data
```

---

## Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs --tail=100 api

# Verificar se porta está em uso
lsof -i :3002

# Verificar status
docker compose ps
```

### Erro de conexão com banco

```bash
# Verificar se postgres está rodando
docker compose ps postgres

# Testar conexão
docker exec hub-api-dev nc -zv postgres 5432

# Verificar variáveis de ambiente
docker exec hub-api-dev env | grep DATABASE
```

### Build falha

```bash
# Limpar cache do Docker
docker builder prune

# Rebuild sem cache
docker compose build --no-cache

# Verificar espaço em disco
df -h
```

---

[← Voltar](./README.md) | [Próximo: Variáveis de Ambiente →](./variaveis-ambiente.md)
