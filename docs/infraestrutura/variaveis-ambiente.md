# Variáveis de Ambiente

## Visão Geral

As variáveis de ambiente são utilizadas para configurar os serviços sem necessidade de alterar código. Cada serviço possui seu próprio arquivo `.env`.

## Estrutura de Arquivos

```
/home/ubuntu/services/solana/
├── .env                        # Variáveis globais/raiz
├── services/
│   ├── api/.env                # API Principal
│   ├── kyc-api/.env            # API KYC
│   └── indexer/.env            # Indexador
└── real_estate_program/
    └── app/.env                # Frontend (build time)
```

---

## Arquivo Raiz (.env)

```bash
# ============================================
# SOLANA NETWORK
# ============================================
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_NETWORK=devnet

# ============================================
# PROGRAM IDS
# ============================================
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# ============================================
# ADMIN
# ============================================
ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw

# ============================================
# TREASURIES
# ============================================
PLATFORM_TREASURY=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
RESERVE_TREASURY=34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH
```

---

## API Principal (services/api/.env)

```bash
# ============================================
# SERVER
# ============================================
PORT=3002
HOST=0.0.0.0
NODE_ENV=production

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgres://postgres:postgres@postgres:5432/hub_indexer

# ============================================
# SOLANA
# ============================================
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# ============================================
# ADMIN
# ============================================
ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
ADMIN_PRIVATE_KEY=your-base58-private-key-here

# ============================================
# TREASURIES
# ============================================
PLATFORM_TREASURY=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
RESERVE_TREASURY=34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH

# ============================================
# INDEXER
# ============================================
INDEXER_URL=http://indexer:9090

# ============================================
# IPFS (PINATA)
# ============================================
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET=your-pinata-secret
PINATA_GATEWAY=https://gateway.pinata.cloud

# ============================================
# CORS
# ============================================
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://rwa.hubweb3.com

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
```

---

## API KYC (services/kyc-api/.env)

```bash
# ============================================
# SERVER
# ============================================
PORT=3001
HOST=0.0.0.0
NODE_ENV=production

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgres://postgres:postgres@postgres:5432/hub_indexer

# ============================================
# SOLANA
# ============================================
SOLANA_RPC_URL=https://api.devnet.solana.com
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# ============================================
# ISSUER (para emitir credenciais)
# ============================================
ISSUER_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
ISSUER_PRIVATE_KEY=your-base58-private-key-here

# ============================================
# JWT
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d

# ============================================
# CORS
# ============================================
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://rwa.hubweb3.com

# ============================================
# RATE LIMITING
# ============================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ============================================
# IPFS (para documentos KYC)
# ============================================
PINATA_API_KEY=your-pinata-api-key
PINATA_SECRET=your-pinata-secret
```

---

## Indexador (services/indexer/.env)

```bash
# ============================================
# SERVER
# ============================================
PORT=9090
HOST=0.0.0.0

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgres://postgres:postgres@postgres:5432/hub_indexer?sslmode=disable

# ============================================
# SOLANA
# ============================================
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om

# ============================================
# INDEXER CONFIG
# ============================================
INDEXER_INTERVAL=60s
INDEXER_BATCH_SIZE=100

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
```

---

## Frontend (real_estate_program/app/.env)

```bash
# ============================================
# APIs
# ============================================
VITE_API_URL=http://localhost:3004/api/v1
VITE_KYC_API_URL=http://localhost:3005/api

# Para produção
# VITE_API_URL=https://rwa.hubweb3.com/api/v1
# VITE_KYC_API_URL=https://rwa.hubweb3.com/kyc-api/api

# ============================================
# SOLANA
# ============================================
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet

# ============================================
# PROGRAM IDS
# ============================================
VITE_PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
VITE_CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# ============================================
# ADMIN
# ============================================
VITE_ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw

# ============================================
# TREASURIES
# ============================================
VITE_PLATFORM_TREASURY=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
VITE_RESERVE_TREASURY=34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH
```

---

## Tabela de Referência

### Variáveis Obrigatórias

| Variável | Serviço | Descrição |
|----------|---------|-----------|
| `DATABASE_URL` | API, KYC, Indexer | Connection string PostgreSQL |
| `SOLANA_RPC_URL` | Todos | URL do RPC Solana |
| `PROGRAM_ID` | API, Frontend | ID do Hub Token Program |
| `CREDENTIAL_PROGRAM_ID` | Todos | ID do Credential Program |
| `ADMIN_WALLET` | API, Frontend | Carteira do admin |

### Variáveis Sensíveis (Secrets)

| Variável | Serviço | Descrição |
|----------|---------|-----------|
| `ADMIN_PRIVATE_KEY` | API | Chave privada para transações admin |
| `ISSUER_PRIVATE_KEY` | KYC | Chave privada para emitir credenciais |
| `JWT_SECRET` | KYC | Secret para tokens JWT |
| `PINATA_SECRET` | API, KYC | Secret do Pinata IPFS |

---

## Configuração por Ambiente

### Desenvolvimento

```bash
# .env.development
NODE_ENV=development
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet
LOG_LEVEL=debug
```

### Staging

```bash
# .env.staging
NODE_ENV=staging
SOLANA_RPC_URL=https://api.testnet.solana.com
SOLANA_NETWORK=testnet
LOG_LEVEL=info
```

### Produção

```bash
# .env.production
NODE_ENV=production
SOLANA_RPC_URL=https://solana-mainnet.rpc.examplenode.com
SOLANA_NETWORK=mainnet-beta
LOG_LEVEL=warn
```

---

## Boas Práticas

### 1. Nunca Commitar Secrets

```gitignore
# .gitignore
.env
.env.local
.env.*.local
*.pem
*.key
```

### 2. Usar Diferentes Chaves por Ambiente

```bash
# Dev
ADMIN_PRIVATE_KEY=dev-key-here

# Prod
ADMIN_PRIVATE_KEY=prod-key-here  # Diferente!
```

### 3. Validar Variáveis no Startup

```typescript
// config.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'SOLANA_RPC_URL',
  'PROGRAM_ID',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required env var: ${envVar}`);
  }
}
```

### 4. Usar Valores Default Seguros

```typescript
const config = {
  port: parseInt(process.env.PORT || '3002'),
  logLevel: process.env.LOG_LEVEL || 'info',
  rateLimit: parseInt(process.env.RATE_LIMIT || '100'),
};
```

---

## Gerenciamento de Secrets

### Opção 1: Docker Secrets

```yaml
# docker-compose.yml
secrets:
  admin_private_key:
    file: ./secrets/admin_private_key.txt

services:
  api:
    secrets:
      - admin_private_key
```

### Opção 2: HashiCorp Vault

```bash
# Recuperar secret
vault kv get -field=private_key secret/hub/admin
```

### Opção 3: AWS Secrets Manager

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-1" });
const response = await client.send(
  new GetSecretValueCommand({ SecretId: "hub/admin-private-key" })
);
```

---

[← Voltar](./docker.md) | [Próximo: Deploy →](./deploy.md)
