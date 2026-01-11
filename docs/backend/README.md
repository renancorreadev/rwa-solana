# Serviços Backend

## Visão Geral

O Hub Token possui três serviços backend:

```
┌─────────────────────────────────────────────────────────────────┐
│                        BACKEND SERVICES                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   API Principal │    API KYC      │       Indexador             │
│   (Node.js)     │   (Node.js)     │       (Go)                  │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ Porta: 3002     │ Porta: 3001     │ Porta: 9090                 │
│ Exposto: 3004   │ Exposto: 3005   │ Interno                     │
├─────────────────┼─────────────────┼─────────────────────────────┤
│ • Propriedades  │ • Autenticação  │ • Indexação blockchain      │
│ • Investimentos │ • JWT           │ • Sincronização             │
│ • Portfólios    │ • KYC Sessions  │ • Estatísticas              │
│ • Admin ops     │ • Credenciais   │ • Dados históricos          │
└─────────────────┴─────────────────┴─────────────────────────────┘
```

---

## Arquitetura

```mermaid
graph TB
    subgraph "API Principal"
        A1[Routes] --> A2[Controllers]
        A2 --> A3[Services]
        A3 --> A4[Repositories]
        A4 --> A5[(PostgreSQL)]
        A3 --> A6[Solana Client]
    end

    subgraph "API KYC"
        K1[Routes] --> K2[Controllers]
        K2 --> K3[Services]
        K3 --> K4[Repositories]
        K4 --> K5[(PostgreSQL)]
        K3 --> K6[Solana Client]
    end

    subgraph "Indexador"
        I1[Scheduler] --> I2[Syncer]
        I2 --> I3[Decoder]
        I3 --> I4[Processor]
        I4 --> I5[(PostgreSQL)]
        I2 --> I6[Solana RPC]
    end
```

---

## Stack Tecnológico

### API Principal & KYC

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Node.js | 20 LTS | Runtime |
| TypeScript | 5.x | Type safety |
| Express.js | 4.x | HTTP Server |
| Prisma | 5.x | ORM |
| @solana/web3.js | 1.x | Solana SDK |
| Anchor | 0.29 | Program interaction |
| Zod | 3.x | Validation |
| JWT | - | Autenticação |

### Indexador

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Go | 1.21 | Runtime |
| sqlx | - | Database |
| gagliardetto/solana-go | - | Solana SDK |
| gorilla/mux | - | HTTP Router |

---

## Documentos Nesta Seção

1. [API Principal](./api-principal.md)
   - Estrutura do projeto
   - Clean Architecture
   - Controllers e Services
   - Integração Solana

2. [API KYC](./api-kyc.md)
   - Autenticação wallet
   - Fluxo JWT
   - Sessões KYC
   - Emissão de credenciais

3. [Indexador](./indexador.md)
   - Arquitetura Go
   - Sincronização
   - Decodificação de instruções
   - Processamento de eventos

---

## Comunicação Entre Serviços

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as API Principal
    participant KYC as API KYC
    participant IDX as Indexador
    participant SOL as Solana
    participant DB as PostgreSQL

    Note over FE,DB: Fluxo de Investimento

    FE->>KYC: POST /auth/nonce
    KYC-->>FE: nonce
    FE->>FE: Assinar com wallet
    FE->>KYC: POST /auth/verify
    KYC-->>FE: JWT token

    FE->>API: GET /properties
    API->>IDX: GET /properties
    IDX->>DB: SELECT * FROM properties
    DB-->>IDX: properties data
    IDX-->>API: properties
    API-->>FE: properties

    FE->>SOL: Invest transaction
    SOL-->>FE: signature

    Note over IDX,SOL: Background sync
    IDX->>SOL: getSignaturesForAddress
    SOL-->>IDX: new transactions
    IDX->>DB: INSERT/UPDATE
```

---

## Estrutura de Pastas

### API Principal

```
services/api/
├── src/
│   ├── index.ts              # Entry point
│   ├── app.ts                # Express setup
│   ├── config/
│   │   └── index.ts          # Configurações
│   ├── routes/
│   │   ├── index.ts
│   │   ├── properties.ts
│   │   ├── invest.ts
│   │   ├── investors.ts
│   │   └── admin.ts
│   ├── controllers/
│   │   ├── PropertiesController.ts
│   │   ├── InvestController.ts
│   │   └── AdminController.ts
│   ├── services/
│   │   ├── PropertyService.ts
│   │   ├── InvestService.ts
│   │   └── SolanaService.ts
│   ├── repositories/
│   │   ├── PropertyRepository.ts
│   │   └── InvestorRepository.ts
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   ├── validation.ts
│   │   └── adminAuth.ts
│   ├── utils/
│   │   ├── solana.ts
│   │   └── format.ts
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── package.json
├── tsconfig.json
└── Dockerfile
```

### API KYC

```
services/kyc-api/
├── src/
│   ├── app.ts                # Entry point + Express
│   ├── config.ts             # Configurações
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── credentials.ts
│   │   ├── kyc.ts
│   │   └── admin.ts
│   ├── services/
│   │   ├── AuthService.ts
│   │   ├── CredentialService.ts
│   │   └── KycService.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── rateLimit.ts
│   │   └── validation.ts
│   └── utils/
│       ├── jwt.ts
│       └── solana.ts
├── package.json
├── tsconfig.json
└── Dockerfile
```

### Indexador

```
services/indexer/
├── cmd/
│   └── main.go               # Entry point
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── database/
│   │   ├── database.go
│   │   └── migrations/
│   ├── indexer/
│   │   ├── indexer.go
│   │   ├── decoder.go
│   │   └── processor.go
│   ├── api/
│   │   ├── server.go
│   │   ├── handlers.go
│   │   └── routes.go
│   └── models/
│       ├── property.go
│       ├── investor.go
│       └── transaction.go
├── go.mod
├── go.sum
└── Dockerfile
```

---

## Ambiente de Desenvolvimento

### Requisitos

```bash
# Node.js
node --version  # v20.x
npm --version   # v10.x

# Go
go version      # go1.21.x

# PostgreSQL
psql --version  # 15.x
```

### Iniciar Serviços

```bash
# Com Docker (recomendado)
docker compose up -d

# Sem Docker (desenvolvimento)
# Terminal 1 - PostgreSQL
docker run -d -p 5436:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine

# Terminal 2 - API Principal
cd services/api
npm install
npm run dev

# Terminal 3 - API KYC
cd services/kyc-api
npm install
npm run dev

# Terminal 4 - Indexador
cd services/indexer
go run cmd/main.go
```

---

## Variáveis de Ambiente Comuns

```bash
# Todos os serviços
DATABASE_URL=postgres://postgres:postgres@postgres:5432/hub_indexer
SOLANA_RPC_URL=https://api.devnet.solana.com

# APIs Node.js
NODE_ENV=development
LOG_LEVEL=debug

# Indexador Go
INDEXER_INTERVAL=60s
```

---

## Health Checks

### API Principal

```bash
curl http://localhost:3004/api/v1/health
```

### API KYC

```bash
curl http://localhost:3005/api/health
```

### Indexador

```bash
curl http://localhost:9090/health
```

---

[← Voltar](../api/endpoints-indexador.md) | [Próximo: API Principal →](./api-principal.md)
