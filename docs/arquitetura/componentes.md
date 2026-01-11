# Componentes do Sistema

## Diagrama de Componentes Detalhado

```mermaid
graph TB
    subgraph "Frontend Container"
        FE_NGINX[Nginx]
        FE_REACT[React App]
        FE_WALLET[Wallet Adapter]
        FE_STORE[Zustand Store]
        FE_API[API Client]

        FE_NGINX --> FE_REACT
        FE_REACT --> FE_WALLET
        FE_REACT --> FE_STORE
        FE_REACT --> FE_API
    end

    subgraph "API Container"
        API_EXPRESS[Express Server]
        API_CTRL[Controllers]
        API_SVC[Services]
        API_REPO[Repositories]
        API_SOL[Solana Adapter]

        API_EXPRESS --> API_CTRL
        API_CTRL --> API_SVC
        API_SVC --> API_REPO
        API_SVC --> API_SOL
    end

    subgraph "KYC Container"
        KYC_EXPRESS[Express Server]
        KYC_AUTH[Auth Service]
        KYC_CRED[Credential Service]
        KYC_SESSION[Session Service]

        KYC_EXPRESS --> KYC_AUTH
        KYC_EXPRESS --> KYC_CRED
        KYC_EXPRESS --> KYC_SESSION
    end

    subgraph "Indexer Container"
        IDX_GIN[Gin Server]
        IDX_FETCHER[Blockchain Fetcher]
        IDX_PARSER[Data Parser]
        IDX_REPO[Repository]

        IDX_GIN --> IDX_FETCHER
        IDX_FETCHER --> IDX_PARSER
        IDX_PARSER --> IDX_REPO
    end

    FE_API --> API_EXPRESS
    FE_API --> KYC_EXPRESS
    FE_WALLET --> SOLANA[Solana RPC]

    API_SOL --> SOLANA
    KYC_CRED --> SOLANA
    IDX_FETCHER --> SOLANA

    API_REPO --> PG[(PostgreSQL)]
    KYC_SESSION --> PG
    IDX_REPO --> PG
```

---

## Frontend (React)

### Estrutura de Diretórios

```
app/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root component + Routes
├── pages/                      # Páginas da aplicação
│   ├── HomePage.tsx            # Dashboard principal
│   ├── PropertiesPage.tsx      # Lista de propriedades
│   ├── PropertyDetailPage.tsx  # Detalhes do imóvel
│   ├── PortfolioPage.tsx       # Portfólio do usuário
│   ├── DividendsPage.tsx       # Dividendos
│   ├── KycPage.tsx             # Verificação KYC
│   ├── AdminPage.tsx           # Painel admin
│   └── SettingsPage.tsx        # Configurações
├── components/                 # Componentes reutilizáveis
│   ├── layout/                 # Header, Sidebar, Footer
│   ├── ui/                     # Button, Card, Input, etc.
│   ├── wallet/                 # WalletConnectButton
│   ├── property/               # PropertyCard, Gallery
│   ├── investment/             # InvestmentModal
│   └── dividends/              # ClaimCard
├── hooks/                      # Custom hooks
├── stores/                     # Zustand stores
├── services/                   # API clients
│   └── api/
│       ├── client.ts           # Axios instance
│       ├── properties.ts       # Properties API
│       ├── kyc.ts              # KYC API
│       └── invest.ts           # Investment API
├── providers/                  # Context providers
│   ├── WalletProvider.tsx      # Solana wallet
│   └── HubCredentialProvider.tsx # KYC context
├── types/                      # TypeScript types
├── i18n/                       # Internacionalização
│   ├── pt-BR.json              # Português
│   └── en.json                 # Inglês
└── styles/                     # CSS global
    └── index.css               # Tailwind + custom
```

### Componentes Principais

```mermaid
graph TD
    APP[App.tsx]
    LAYOUT[Layout]
    HEADER[Header]
    SIDEBAR[Sidebar]
    MOBILE_NAV[MobileNav]

    APP --> LAYOUT
    LAYOUT --> HEADER
    LAYOUT --> SIDEBAR
    LAYOUT --> MOBILE_NAV
    LAYOUT --> PAGES

    subgraph PAGES[Páginas]
        HOME[HomePage]
        PROPS[PropertiesPage]
        DETAIL[PropertyDetailPage]
        PORTFOLIO[PortfolioPage]
    end
```

### Store (Zustand)

```typescript
// useAppStore.ts
interface AppState {
  selectedProperty: Property | null;
  setSelectedProperty: (p: Property | null) => void;

  userPreferences: UserPreferences;
  setUserPreferences: (p: UserPreferences) => void;
}

// useKycStore.ts
interface KycState {
  isVerified: boolean;
  credential: HubCredential | null;
  checkCredential: (wallet: string) => Promise<void>;
}
```

---

## API Principal (Node.js)

### Estrutura de Diretórios

```
services/api/src/
├── index.ts                    # Entry point
├── app.ts                      # Express setup
├── domain/                     # Camada de Domínio
│   └── entities/
│       ├── Property.ts         # Entidade Property
│       ├── Investor.ts         # Entidade Investor
│       ├── Revenue.ts          # Entidade Revenue
│       └── Dividend.ts         # Entidade Dividend
├── application/                # Camada de Aplicação
│   ├── ports/                  # Interfaces (contratos)
│   │   ├── PropertyRepository.ts
│   │   └── UserRepository.ts
│   ├── use-cases/              # Casos de uso
│   │   ├── GetProperties.ts
│   │   ├── InvestInProperty.ts
│   │   └── ClaimDividends.ts
│   └── services/               # Serviços de aplicação
│       ├── PropertyService.ts
│       └── InvestmentService.ts
├── infrastructure/             # Camada de Infraestrutura
│   ├── config/                 # Configurações
│   ├── database/               # Conexão PostgreSQL
│   ├── repositories/           # Implementações
│   │   ├── PropertyRepositoryImpl.ts
│   │   └── UserRepositoryImpl.ts
│   ├── solana/                 # Adapter Solana
│   │   └── SolanaConnectionAdapter.ts
│   └── ipfs/                   # Adapter IPFS
│       └── PinataService.ts
├── interfaces/                 # Camada de Interface
│   └── http/
│       ├── controllers/        # Controllers
│       │   ├── PropertyController.ts
│       │   ├── InvestController.ts
│       │   ├── AdminController.ts
│       │   └── UserController.ts
│       ├── routes/             # Rotas
│       │   └── v1/
│       │       ├── properties.ts
│       │       ├── invest.ts
│       │       └── users.ts
│       └── middlewares/        # Middlewares
│           ├── errorHandler.ts
│           └── validation.ts
└── shared/                     # Compartilhado
    ├── container.ts            # DI Container (TSyringe)
    └── tokens.ts               # Injection tokens
```

### Injeção de Dependência

```typescript
// container.ts
import { container } from 'tsyringe';

// Registrar repositórios
container.registerSingleton(
  TOKENS.PropertyRepository,
  PropertyRepositoryImpl
);

// Registrar serviços externos
container.registerSingleton(
  TOKENS.SolanaConnection,
  SolanaConnectionAdapter
);
```

### Controllers Pattern

```typescript
// PropertyController.ts
@injectable()
export class PropertyController {
  constructor(
    @inject(TOKENS.PropertyService)
    private propertyService: PropertyService
  ) {}

  async getAll(req: Request, res: Response) {
    const properties = await this.propertyService.findAll();
    res.json(properties);
  }

  async getByMint(req: Request, res: Response) {
    const { mint } = req.params;
    const property = await this.propertyService.findByMint(mint);
    res.json(property);
  }
}
```

---

## API KYC (Node.js)

### Estrutura de Diretórios

```
services/kyc-api/src/
├── app.ts                      # Express + middlewares
├── config.ts                   # Configurações
├── routes/
│   ├── auth.ts                 # Autenticação wallet
│   ├── credential.ts           # Operações de credencial
│   ├── kyc.ts                  # Sessões KYC
│   └── admin.ts                # Endpoints admin
├── services/
│   ├── kycSessionService.ts    # Gerencia sessões
│   ├── credentialService.ts    # Emissão/verificação
│   └── solanaService.ts        # Interação blockchain
├── middleware/
│   ├── auth.ts                 # JWT validation
│   ├── rateLimit.ts            # Rate limiting
│   └── validation.ts           # Input validation
├── types/
│   └── index.ts                # TypeScript types
└── utils/
    └── crypto.ts               # Funções de criptografia
```

### Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as KYC API
    participant DB as PostgreSQL

    C->>API: POST /auth/nonce
    API->>DB: Gerar e salvar nonce
    API-->>C: { nonce: "abc123" }

    C->>C: Assinar nonce com wallet

    C->>API: POST /auth/verify
    Note right of C: { signature, publicKey }

    API->>API: Verificar assinatura
    API->>DB: Criar/atualizar sessão
    API-->>C: { token: "jwt..." }
```

---

## Indexador (Go)

### Estrutura de Diretórios

```
services/indexer/
├── cmd/
│   └── main.go                 # Entry point
├── internal/
│   ├── config/
│   │   └── config.go           # Load .env
│   ├── database/
│   │   └── database.go         # PostgreSQL connection
│   ├── models/
│   │   └── property.go         # Data models
│   ├── indexer/
│   │   ├── indexer.go          # Loop principal
│   │   └── solana.go           # Cliente Solana
│   └── api/
│       ├── handler.go          # HTTP handlers
│       └── router.go           # Gin routes
├── go.mod
└── go.sum
```

### Loop de Indexação

```go
// indexer.go
func (i *Indexer) Start() {
    ticker := time.NewTicker(i.config.Interval)
    defer ticker.Stop()

    for {
        select {
        case <-ticker.C:
            i.indexProperties()
        case <-i.stop:
            return
        }
    }
}

func (i *Indexer) indexProperties() {
    // 1. Buscar todas as contas do programa
    accounts, _ := i.solana.GetProgramAccounts(programID)

    // 2. Para cada conta, fazer parse dos dados
    for _, acc := range accounts {
        property := parsePropertyState(acc.Data)

        // 3. Upsert no banco
        i.db.UpsertProperty(property)
    }
}
```

### API REST

```go
// router.go
func SetupRouter(h *Handler) *gin.Engine {
    r := gin.Default()

    r.GET("/health", h.Health)

    v1 := r.Group("/api/v1")
    {
        v1.GET("/properties", h.GetProperties)
        v1.GET("/properties/:mint", h.GetProperty)
        v1.POST("/index/trigger", h.TriggerIndex)
    }

    return r
}
```

---

## Interação entre Componentes

### Cenário: Usuário Lista Propriedades

```mermaid
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant API as API Principal
    participant DB as PostgreSQL

    U->>FE: Acessar /properties
    FE->>FE: useQuery(['properties'])
    FE->>API: GET /api/v1/properties

    API->>DB: SELECT * FROM properties
    DB-->>API: [Property rows]

    API->>API: Map to response format
    API-->>FE: JSON array

    FE->>FE: Update React Query cache
    FE-->>U: Renderizar PropertyCards
```

### Cenário: Usuário Investe

```mermaid
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant W as Wallet
    participant SC as Smart Contract
    participant IDX as Indexador
    participant DB as PostgreSQL

    U->>FE: Clicar "Investir"
    FE->>FE: Abrir modal
    U->>FE: Confirmar valor

    FE->>W: Preparar transação
    W->>U: Solicitar aprovação
    U->>W: Aprovar

    W->>SC: Enviar transação
    SC->>SC: invest_in_property()
    SC-->>W: Confirmação

    W-->>FE: TX Success
    FE-->>U: Mostrar sucesso

    Note over IDX,DB: Próximo ciclo de indexação
    IDX->>SC: Buscar dados
    IDX->>DB: Atualizar propriedade
```

---

## Mapeamento de Portas

```
┌─────────────────────────────────────────────────────────────┐
│                    PORTAS DOS SERVIÇOS                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Frontend   │    │    API      │    │   KYC API   │     │
│  │    5173     │    │    3002     │    │    3001     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Indexador  │    │  PostgreSQL │    │    Kong     │     │
│  │    9090     │    │    5432     │    │    8000     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

[← Voltar](./README.md) | [Próximo: Comunicação →](./comunicacao.md)
