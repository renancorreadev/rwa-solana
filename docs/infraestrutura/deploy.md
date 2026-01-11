# Deploy

## Visão Geral

Este guia descreve o processo de deploy do Hub Token em diferentes ambientes.

---

## Ambientes

| Ambiente | Propósito | Solana Network |
|----------|-----------|----------------|
| Development | Desenvolvimento local | Devnet |
| Staging | Testes de integração | Devnet/Testnet |
| Production | Produção | Mainnet-Beta |

---

## Infraestrutura de Produção

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE                                │
│                     (DNS + CDN + SSL)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                         KONG                                     │
│                    (API Gateway)                                 │
│          rwa.hubweb3.com/api → API                              │
│          rwa.hubweb3.com/kyc-api → KYC                          │
│          rwa.hubweb3.com → Frontend                             │
└────────────┬────────────┬────────────┬──────────────────────────┘
             │            │            │
             ▼            ▼            ▼
        ┌────────┐   ┌────────┐   ┌────────┐
        │Frontend│   │  API   │   │KYC API │
        │(Nginx) │   │(Node)  │   │(Node)  │
        └────────┘   └───┬────┘   └───┬────┘
                         │            │
                         ▼            ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    │      (RDS)          │
                    └─────────────────────┘
                              ▲
                              │
                    ┌─────────────────────┐
                    │      Indexador      │
                    │        (Go)         │
                    └─────────────────────┘
```

---

## Deploy com Docker Compose

### Produção

```bash
# 1. Clonar repositório
git clone https://github.com/hub-token/platform.git
cd platform

# 2. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # Editar com valores de produção

# 3. Build das imagens
docker compose -f docker-compose.prod.yml build

# 4. Iniciar serviços
docker compose -f docker-compose.prod.yml up -d

# 5. Verificar status
docker compose -f docker-compose.prod.yml ps

# 6. Ver logs
docker compose -f docker-compose.prod.yml logs -f
```

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: hub-postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hub_indexer
    restart: always
    networks:
      - hub-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  indexer:
    image: hub-indexer:latest
    container_name: hub-indexer
    env_file:
      - ./services/indexer/.env.prod
    depends_on:
      postgres:
        condition: service_healthy
    restart: always
    networks:
      - hub-network
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:9090/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  api:
    image: hub-api:latest
    container_name: hub-api
    env_file:
      - ./services/api/.env.prod
    depends_on:
      postgres:
        condition: service_healthy
      indexer:
        condition: service_healthy
    restart: always
    networks:
      - hub-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  kyc-api:
    image: hub-kyc-api:latest
    container_name: hub-kyc-api
    env_file:
      - ./services/kyc-api/.env.prod
    depends_on:
      postgres:
        condition: service_healthy
    restart: always
    networks:
      - hub-network

  frontend:
    image: hub-frontend:latest
    container_name: hub-frontend
    depends_on:
      - api
      - kyc-api
    restart: always
    networks:
      - hub-network

  kong:
    image: kong:3.4-alpine
    container_name: hub-kong
    environment:
      KONG_DATABASE: "off"
      KONG_DECLARATIVE_CONFIG: /kong/kong.yml
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
    volumes:
      - ./kong/kong.yml:/kong/kong.yml:ro
    ports:
      - "80:8000"
      - "443:8443"
    restart: always
    networks:
      - hub-network

volumes:
  postgres-data:

networks:
  hub-network:
    driver: bridge
```

---

## Configuração Kong

### kong/kong.yml

```yaml
_format_version: "3.0"

services:
  - name: rwa-api
    url: http://hub-api:3002
    routes:
      - name: api-route
        paths:
          - /api/v1
        strip_path: false

  - name: rwa-kyc-api
    url: http://hub-kyc-api:3001
    routes:
      - name: kyc-route
        paths:
          - /kyc-api/api
        strip_path: true

  - name: rwa-frontend
    url: http://hub-frontend:5173
    routes:
      - name: frontend-route
        paths:
          - /
        strip_path: false

plugins:
  - name: cors
    config:
      origins:
        - "https://rwa.hubweb3.com"
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      headers:
        - Authorization
        - Content-Type
      credentials: true
      max_age: 3600

  - name: rate-limiting
    config:
      minute: 100
      policy: local
```

---

## Deploy de Smart Contracts

### 1. Preparar Ambiente

```bash
# Instalar Anchor
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked

# Configurar Solana CLI
solana config set --url devnet  # ou mainnet-beta
solana-keygen new -o ~/.config/solana/deployer.json
```

### 2. Build do Programa

```bash
cd real_estate_program

# Build
anchor build

# Verificar program ID
solana address -k target/deploy/hub_token-keypair.json
```

### 3. Deploy

```bash
# Deploy para devnet
anchor deploy --provider.cluster devnet

# Deploy para mainnet (CUIDADO!)
anchor deploy --provider.cluster mainnet-beta
```

### 4. Verificar Deploy

```bash
# Verificar programa
solana program show <PROGRAM_ID>

# Verificar logs
solana logs <PROGRAM_ID>
```

---

## Deploy Frontend (Vercel/Netlify)

### Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
cd real_estate_program/app
vercel

# Deploy produção
vercel --prod
```

### vercel.json

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## CI/CD com GitHub Actions

### .github/workflows/deploy.yml

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API
        uses: docker/build-push-action@v5
        with:
          context: ./services/api
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/api:latest

      - name: Build and push KYC API
        uses: docker/build-push-action@v5
        with:
          context: ./services/kyc-api
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/kyc-api:latest

      - name: Build and push Indexer
        uses: docker/build-push-action@v5
        with:
          context: ./services/indexer
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/indexer:latest

      - name: Build and push Frontend
        uses: docker/build-push-action@v5
        with:
          context: ./real_estate_program/app
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest

    steps:
      - name: Deploy to Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /opt/hub-token
            docker compose pull
            docker compose up -d
            docker system prune -f
```

---

## Monitoramento

### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    ports:
      - "9091:9090"
    networks:
      - hub-network

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
    networks:
      - hub-network

volumes:
  prometheus-data:
  grafana-data:
```

### prometheus/prometheus.yml

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'api'
    static_configs:
      - targets: ['hub-api:3002']

  - job_name: 'kyc-api'
    static_configs:
      - targets: ['hub-kyc-api:3001']

  - job_name: 'indexer'
    static_configs:
      - targets: ['hub-indexer:9090']
```

---

## Backup

### Script de Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup PostgreSQL
docker exec hub-postgres pg_dump -U postgres hub_indexer | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Limpar backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/db_$DATE.sql.gz"
```

### Cron

```bash
# Backup diário às 2AM
0 2 * * * /opt/hub-token/backup.sh >> /var/log/backup.log 2>&1
```

---

## Checklist de Deploy

### Pré-Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Secrets seguros e não expostos
- [ ] SSL/TLS configurado
- [ ] Banco de dados com backup
- [ ] Testes passando
- [ ] Build sem erros

### Deploy

- [ ] Build das imagens Docker
- [ ] Push para registry
- [ ] Pull no servidor de produção
- [ ] Restart dos containers
- [ ] Health checks passando

### Pós-Deploy

- [ ] Verificar logs de erro
- [ ] Testar endpoints críticos
- [ ] Verificar métricas
- [ ] Confirmar sync do indexador
- [ ] Testar fluxos principais (invest, KYC)

---

## Rollback

```bash
# Ver histórico de imagens
docker images | grep hub-api

# Rollback para versão anterior
docker tag hub-api:previous hub-api:latest
docker compose up -d api

# Ou usando versão específica
docker compose up -d -e API_VERSION=v1.2.3 api
```

---

[← Voltar](./variaveis-ambiente.md) | [Próximo: Guias →](../guias/README.md)
