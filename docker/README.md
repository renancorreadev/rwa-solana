# Hub Token - Docker Deployment

Deploy the Hub Token platform using pre-built Docker images from Docker Hub.

## Prerequisites

- Docker and Docker Compose installed
- Solana RPC URL (use your own for production)
- Pinata account for IPFS storage (optional)

## Quick Start

1. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your configuration:**
   - Set your `SOLANA_RPC_URL` (recommend using Alchemy, QuickNode, or Helius)
   - Configure Pinata credentials if you need IPFS storage
   - Adjust ports if needed

3. **Start all services:**
   ```bash
   docker compose up -d
   ```

4. **Check services status:**
   ```bash
   docker compose ps
   ```

5. **View logs:**
   ```bash
   docker compose logs -f
   ```

## Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 5173 | React web application |
| api | 3003 | Hub Token REST API |
| kyc-api | 3001 | KYC verification API (Civic) |
| indexer | 9090 | Blockchain indexer (Go) |
| postgres | 5432 | PostgreSQL database |

## Access

- **Frontend:** http://localhost:5173
- **API:** http://localhost:3003
- **KYC API:** http://localhost:3001
- **Indexer:** http://localhost:9090

## Docker Images

All images are hosted on Docker Hub under `skynance/`:

- `skynance/hub-frontend:latest`
- `skynance/hub-api:latest`
- `skynance/hub-kyc-api:latest`
- `skynance/hub-indexer:latest`

## Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f [service_name]

# Restart a service
docker compose restart [service_name]

# Pull latest images
docker compose pull

# Remove all data (including database)
docker compose down -v
```

## Production Considerations

1. **RPC URL:** Use a dedicated RPC provider (Alchemy, QuickNode, Helius)
2. **Database:** Use strong passwords and consider external PostgreSQL
3. **SSL:** Put services behind a reverse proxy (nginx/traefik) with HTTPS
4. **Monitoring:** Add health checks and monitoring (Prometheus/Grafana)
5. **Backups:** Configure database backups

## Troubleshooting

**Services not starting:**
```bash
docker compose logs [service_name]
```

**Database connection issues:**
```bash
docker compose exec postgres pg_isready -U hubtoken
```

**Reset everything:**
```bash
docker compose down -v
docker compose up -d
```
