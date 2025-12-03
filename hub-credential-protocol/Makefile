.PHONY: help build up down logs clean test deploy

# Default target
help:
	@echo "Hub Credential Protocol - Available Commands"
	@echo "============================================="
	@echo ""
	@echo "Docker Commands:"
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make logs       - View service logs"
	@echo "  make clean      - Remove containers and images"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev-api    - Run KYC API in development mode"
	@echo "  make dev-app    - Run frontend app in development mode"
	@echo "  make test       - Run tests"
	@echo ""
	@echo "Solana Commands:"
	@echo "  make deploy     - Deploy credential program to localnet"
	@echo "  make validator  - Start local Solana validator"

# Docker commands
build:
	docker compose build

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

clean:
	docker compose down -v --rmi local

# Development commands
dev-api:
	cd services/kyc-api && yarn dev

dev-app:
	cd app && yarn dev

test:
	anchor test

# Solana commands
validator:
	export PATH="/opt/homebrew/opt/gnu-tar/libexec/gnubin:$$PATH" && \
	rm -rf test-ledger && \
	solana-test-validator --reset

deploy:
	export PATH="/opt/homebrew/opt/gnu-tar/libexec/gnubin:$$PATH" && \
	solana program deploy target/deploy/credential_program.so

# Build program
build-program:
	anchor build

# Full setup
setup: build-program build up
	@echo "Hub Credential Protocol is running!"
	@echo "KYC API: http://localhost:3001"
	@echo "Frontend: http://localhost:8080"
