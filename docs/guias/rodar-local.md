# Rodar Localmente

## Pré-requisitos

### Software Necessário

| Software | Versão | Instalação |
|----------|--------|------------|
| Node.js | 20.x LTS | `nvm install 20` |
| Go | 1.21+ | [golang.org](https://golang.org/dl/) |
| Docker | 24.x+ | [docker.com](https://docs.docker.com/get-docker/) |
| Rust | 1.75+ | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Solana CLI | 1.18+ | `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"` |
| Anchor | 0.29+ | `cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked` |

### Verificar Instalações

```bash
# Verificar versões
node --version     # v20.x.x
npm --version      # v10.x.x
go version         # go1.21.x
docker --version   # Docker version 24.x.x
rustc --version    # rustc 1.75.x
solana --version   # solana-cli 1.18.x
anchor --version   # anchor-cli 0.29.x
```

---

## Opção 1: Docker Compose (Recomendado)

### 1. Clonar Repositório

```bash
git clone https://github.com/hub-token/platform.git
cd platform
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivos de exemplo
cp .env.example .env
cp services/api/.env.example services/api/.env
cp services/kyc-api/.env.example services/kyc-api/.env
cp services/indexer/.env.example services/indexer/.env
cp real_estate_program/app/.env.example real_estate_program/app/.env
```

### 3. Configurar Wallet (Opcional)

```bash
# Gerar nova wallet para desenvolvimento
solana-keygen new -o ~/.config/solana/dev-wallet.json

# Ver endereço
solana address -k ~/.config/solana/dev-wallet.json

# Airdrop SOL (devnet)
solana config set --url devnet
solana airdrop 5
```

### 4. Iniciar Serviços

```bash
# Iniciar todos os serviços
docker compose up -d

# Ver status
docker compose ps

# Ver logs
docker compose logs -f
```

### 5. Verificar Funcionamento

```bash
# Health check - API
curl http://localhost:3004/api/v1/health

# Health check - KYC API
curl http://localhost:3005/api/health

# Health check - Indexador
curl http://localhost:9090/health

# Listar propriedades
curl http://localhost:3004/api/v1/properties
```

### 6. Acessar Frontend

Abra o navegador em: http://localhost:5174

---

## Opção 2: Desenvolvimento Manual

Para desenvolvimento com hot-reload, execute cada serviço separadamente.

### 1. Banco de Dados

```bash
# Iniciar apenas PostgreSQL
docker compose up -d postgres

# Verificar conexão
docker exec -it hub-postgres-dev psql -U postgres -d hub_indexer -c "\dt"
```

### 2. Indexador (Go)

```bash
cd services/indexer

# Instalar dependências
go mod download

# Executar
go run cmd/main.go
```

### 3. API Principal (Node.js)

```bash
cd services/api

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

### 4. API KYC (Node.js)

```bash
cd services/kyc-api

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

### 5. Frontend (React)

```bash
cd real_estate_program/app

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev
```

---

## Desenvolvimento de Smart Contracts

### 1. Setup Anchor

```bash
cd real_estate_program

# Instalar dependências
npm install

# Verificar configuração
cat Anchor.toml
```

### 2. Build

```bash
# Build do programa
anchor build

# Verificar program ID
solana address -k target/deploy/hub_token-keypair.json
```

### 3. Deploy Local (Localnet)

```bash
# Iniciar validator local
solana-test-validator

# Em outro terminal, deploy
anchor deploy --provider.cluster localnet

# Ou para devnet
anchor deploy --provider.cluster devnet
```

### 4. Testes

```bash
# Rodar testes
anchor test

# Testes com logs
anchor test -- --nocapture
```

---

## Configuração de IDE

### VS Code

#### Extensões Recomendadas

```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "golang.go",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
```

#### settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[rust]": {
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  },
  "[go]": {
    "editor.defaultFormatter": "golang.go"
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## Estrutura de Pastas

```
/home/ubuntu/services/solana/
├── .env                          # Variáveis globais
├── docker-compose.yml            # Orquestração Docker
│
├── real_estate_program/          # Smart Contract Anchor
│   ├── programs/
│   │   └── hub_token/
│   │       └── src/
│   │           └── lib.rs        # Código Rust
│   ├── app/                      # Frontend React
│   │   ├── src/
│   │   └── package.json
│   ├── tests/
│   └── Anchor.toml
│
├── services/
│   ├── api/                      # API Principal
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   ├── kyc-api/                  # API KYC
│   │   ├── src/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── indexer/                  # Indexador Go
│       ├── cmd/
│       ├── internal/
│       ├── go.mod
│       └── Dockerfile
│
└── docs/                         # Documentação
```

---

## Variáveis de Ambiente para Desenvolvimento

### .env (raiz)

```bash
# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# Programs
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# Admin
ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
```

### services/api/.env

```bash
PORT=3002
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5436/hub_indexer
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
INDEXER_URL=http://localhost:9090
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### services/kyc-api/.env

```bash
PORT=3001
HOST=0.0.0.0
NODE_ENV=development
DATABASE_URL=postgres://postgres:postgres@localhost:5436/hub_indexer
SOLANA_RPC_URL=https://api.devnet.solana.com
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
JWT_SECRET=development-secret-min-32-characters
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

### real_estate_program/app/.env

```bash
VITE_API_URL=http://localhost:3004/api/v1
VITE_KYC_API_URL=http://localhost:3005/api
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet
VITE_PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
VITE_CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
VITE_ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
```

---

## Seed de Dados (Opcional)

### Criar Propriedade de Teste

```bash
# Via API (requer admin auth)
curl -X POST http://localhost:3004/api/v1/admin/properties \
  -H "Content-Type: application/json" \
  -H "X-Admin-Wallet: $ADMIN_WALLET" \
  -H "X-Admin-Signature: $SIGNATURE" \
  -H "X-Admin-Timestamp: $TIMESTAMP" \
  -d '{
    "name": "Edifício Teste",
    "symbol": "TEST",
    "decimals": 6,
    "totalSupply": "1000000000000",
    "sellerWallet": "34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH",
    "propertyDetails": {
      "propertyAddress": "Rua Teste, 123 - São Paulo",
      "propertyType": "Comercial",
      "totalValueUsd": 1000000000,
      "rentalYieldBps": 850,
      "metadataUri": "https://example.com/metadata.json"
    }
  }'
```

---

## Próximos Passos

1. Explore a [documentação de APIs](../api/README.md)
2. Entenda os [fluxos de negócio](../fluxos/README.md)
3. Consulte o [troubleshooting](./troubleshooting.md) se encontrar problemas

---

[← Voltar](./README.md) | [Próximo: Troubleshooting →](./troubleshooting.md)
