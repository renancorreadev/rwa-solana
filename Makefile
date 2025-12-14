.PHONY: up down restart ps logs logs-api logs-kyc logs-indexer logs-postgres logs-frontend build

# Docker Compose commands
up:
	docker compose up -d

down:
	docker compose down

restart:
	docker compose restart

build:
	docker compose build

ps:
	docker compose ps

# Logs - all services
logs:
	docker compose logs -f

logs-tail:
	docker compose logs -f --tail=100

# Logs - individual services
logs-api:
	docker compose logs -f api

logs-kyc:
	docker compose logs -f kyc-api

logs-indexer:
	docker compose logs -f indexer

logs-postgres:
	docker compose logs -f postgres

logs-frontend:
	docker compose logs -f frontend

# Logs with tail
logs-api-tail:
	docker compose logs -f --tail=100 api

logs-kyc-tail:
	docker compose logs -f --tail=100 kyc-api

logs-indexer-tail:
	docker compose logs -f --tail=100 indexer

# Help
help:
	@echo "Comandos disponíveis:"
	@echo "  make up              - Inicia todos os containers"
	@echo "  make down            - Para todos os containers"
	@echo "  make restart         - Reinicia todos os containers"
	@echo "  make build           - Rebuild das imagens"
	@echo "  make ps              - Lista status dos containers"
	@echo ""
	@echo "  make logs            - Logs de todos os serviços"
	@echo "  make logs-tail       - Logs de todos (últimas 100 linhas)"
	@echo ""
	@echo "  make logs-api        - Logs da API"
	@echo "  make logs-kyc        - Logs do KYC API"
	@echo "  make logs-indexer    - Logs do Indexer"
	@echo "  make logs-postgres   - Logs do PostgreSQL"
	@echo "  make logs-frontend   - Logs do Frontend"
