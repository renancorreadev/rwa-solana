# Hub Token - Contexto Completo do Projeto

## 1. Visao Geral

**Hub Token** e uma plataforma completa de tokenizacao imobiliaria na blockchain Solana que permite propriedade fracionada de imoveis usando tokens RWA (Real World Assets).

### Componentes Principais:
- **Smart Contract**: Programa Anchor/Solana para tokenizacao
- **Backend Services**: API Node.js, Indexer Go, KYC API
- **Frontend**: Aplicacao React/TypeScript
- **Database**: PostgreSQL para indexacao

### URLs de Producao:
- Frontend: https://rwa.hubweb3.com/
- API Principal: https://rwa.hubweb3.com/api/v1
- KYC API: https://rwa.hubweb3.com/kyc-api
- Indexer: https://rwa.hubweb3.com/indexer

---

## 2. Estrutura de Diretorios

```
hub-token/
├── .env                           # Variaveis de ambiente dev
├── .env.docker                    # Variaveis Docker
├── docker-compose.yml             # Compose desenvolvimento
├── docker-compose.prod.yml        # Compose producao
├── Makefile                       # Comandos uteis
│
├── real_estate_program/           # Programa Solana principal
│   ├── Anchor.toml
│   ├── programs/
│   │   └── hub_token_program/    # Smart contract
│   │       └── src/
│   │           ├── lib.rs        # Entry point
│   │           ├── constants.rs
│   │           ├── error.rs      # 13 tipos de erro
│   │           ├── events.rs
│   │           ├── state/        # Accounts
│   │           └── instructions/ # 7 instrucoes
│   ├── tests/                    # Testes TypeScript
│   ├── target/
│   │   ├── deploy/               # Binarios compilados
│   │   └── idl/                  # IDL definitions
│   └── app/                      # Frontend React
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── components/
│       │   ├── pages/            # HomePage, PropertiesPage, etc.
│       │   ├── hooks/
│       │   ├── stores/           # Zustand
│       │   ├── providers/
│       │   └── services/         # API client
│       └── Dockerfile
│
├── services/                      # Backend services
│   ├── api/                       # API Principal (Node/TypeScript)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── application/      # Use cases
│   │   │   ├── domain/           # Entities
│   │   │   │   └── entities/
│   │   │   │       ├── Property.ts
│   │   │   │       ├── Investor.ts
│   │   │   │       ├── Revenue.ts
│   │   │   │       ├── UserPreferences.ts   # NOVO
│   │   │   │       └── UserActivity.ts      # NOVO
│   │   │   ├── infrastructure/   # DB, Solana, IPFS
│   │   │   ├── interfaces/       # Controllers/Routes
│   │   │   └── shared/           # DI container
│   │   └── Dockerfile
│   │
│   ├── kyc-api/                   # KYC Service (Node/TypeScript)
│   │   ├── src/
│   │   │   ├── app.ts
│   │   │   ├── config.ts
│   │   │   ├── routes/
│   │   │   └── services/
│   │   └── Dockerfile
│   │
│   └── indexer/                   # Indexer (Go)
│       ├── cmd/main.go
│       ├── internal/
│       │   ├── config/
│       │   ├── database/         # PostgreSQL
│       │   ├── models/
│       │   ├── indexer/
│       │   └── api/              # HTTP API (Gin)
│       └── Dockerfile
│
└── docker/                        # Deploy docs
```

---

## 3. Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|-----------|--------|
| Blockchain | Solana | 1.18+ |
| Smart Contract | Anchor | 0.30.1 |
| Backend API | Node.js/Express | 20 LTS |
| Backend Language | TypeScript | 5.3 |
| DI Framework | TSyringe | 4.8.0 |
| Validacao | Zod | 3.22 |
| Database | PostgreSQL | 15 |
| Indexer | Go/Gin | 1.21 |
| Frontend | React | 18.2 |
| Build | Vite | 5.0 |
| State | Zustand | 4.4 |
| Styling | Tailwind CSS | 3.4 |
| Web3 | @solana/web3.js | 1.95.3 |
| Wallet | Wallet Adapter | 0.9.23 |
| KYC | Civic Pass | 1.2.4 |

---

## 4. Database (PostgreSQL)

### Conexao:
```
postgres://postgres:postgres@postgres:5432/hub_indexer?sslmode=disable
```

### Schema (criado automaticamente pelo indexer):

```sql
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    mint VARCHAR(44) UNIQUE NOT NULL,
    property_state_pda VARCHAR(44) NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    authority VARCHAR(44) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    total_supply BIGINT DEFAULT 0,
    circulating_supply BIGINT DEFAULT 0,
    decimals INTEGER DEFAULT 0,
    property_type VARCHAR(50),
    location VARCHAR(255),
    total_value_usd BIGINT DEFAULT 0,
    annual_yield BIGINT DEFAULT 0,
    metadata_uri TEXT,
    image TEXT,
    current_epoch BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_indexed_slot BIGINT DEFAULT 0
);

CREATE INDEX idx_properties_mint ON properties(mint);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_updated ON properties(updated_at);
```

### Tabelas a Criar (para Settings e Reports):

```sql
-- Preferencias do usuario
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'system',
    currency VARCHAR(10) DEFAULT 'USD',
    hide_balances BOOLEAN DEFAULT false,
    notifications JSONB DEFAULT '{"revenueAlerts":true,"priceAlerts":true,"newProperties":true,"kycReminders":true,"marketingEmails":false}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Atividades do usuario
CREATE TABLE user_activities (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    property_mint VARCHAR(44),
    property_name VARCHAR(255),
    amount DECIMAL(20, 2),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_activities_wallet ON user_activities(wallet_address);
CREATE INDEX idx_user_activities_created ON user_activities(created_at);

-- Historico de portfolio (para graficos)
CREATE TABLE portfolio_snapshots (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL,
    total_value_usd DECIMAL(20, 2),
    total_properties INTEGER,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(wallet_address, snapshot_date)
);

CREATE INDEX idx_portfolio_snapshots_wallet ON portfolio_snapshots(wallet_address);
CREATE INDEX idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date);
```

---

## 5. API Endpoints

### API Principal (services/api)

**Properties:**
- `GET /api/v1/properties` - Lista propriedades
- `GET /api/v1/properties/:mint` - Propriedade por mint

**KYC:**
- `POST /api/v1/kyc/attestation` - Criar attestation
- `GET /api/v1/kyc/verify/:wallet` - Verificar KYC

**Investors:**
- `GET /api/v1/investors/:wallet/portfolio` - Portfolio do investidor
- `GET /api/v1/investors/:wallet/claimable` - Revenue claimable

**Revenue:**
- `GET /api/v1/revenue/property/:mint` - Historico de revenue

**Admin:**
- `POST /api/v1/admin/properties` - Criar propriedade
- `PUT /api/v1/admin/properties/:mint` - Atualizar
- `POST /api/v1/admin/properties/:mint/status` - Toggle status

**IPFS:**
- `GET /api/v1/ipfs/status`
- `POST /api/v1/ipfs/upload/image`
- `POST /api/v1/ipfs/metadata`

**User (IMPLEMENTADO):**
- `GET /api/v1/users/:wallet/preferences` - Buscar preferencias do usuario
- `PUT /api/v1/users/:wallet/preferences` - Atualizar preferencias
- `DELETE /api/v1/users/:wallet/preferences` - Deletar preferencias
- `GET /api/v1/users/:wallet/analytics` - Dashboard analytics com graficos
- `GET /api/v1/users/:wallet/activities` - Atividades recentes (paginado)
- `POST /api/v1/users/:wallet/activities` - Registrar nova atividade
- `GET /api/v1/users/:wallet/export` - Exportar dados (JSON ou CSV)

---

## 6. Arquitetura do Backend (Clean Architecture)

```
src/
├── domain/              # Regras de negocio puras
│   └── entities/        # Property, Investor, Revenue, UserPreferences
│
├── application/         # Use cases e logica de aplicacao
│   ├── ports/           # Interfaces (IPropertyRepository, etc)
│   ├── use-cases/       # GetPropertiesUseCase, etc
│   └── dtos/            # Data Transfer Objects
│
├── infrastructure/      # Implementacoes externas
│   ├── config/          # Config.ts
│   ├── database/        # Conexoes DB (se necessario)
│   ├── repositories/    # PropertyRepositoryImpl, etc
│   ├── solana/          # SolanaConnectionAdapter, SolanaProgramAdapter
│   ├── kyc/             # KycServiceAdapter
│   └── ipfs/            # IpfsService (Pinata)
│
├── interfaces/          # Controllers HTTP
│   └── http/
│       ├── controllers/ # PropertyController, InvestorController, etc
│       ├── routes/      # propertyRoutes.ts, etc
│       └── middlewares/ # errorHandler, requestLogger
│
└── shared/              # Utilitarios compartilhados
    ├── container/       # DI (TSyringe) - container.ts, tokens.ts
    ├── errors/
    └── utils/           # Logger, helpers
```

### Injecao de Dependencia (TSyringe)

```typescript
// tokens.ts
export const TOKENS = {
  SolanaConnection: Symbol.for('SolanaConnection'),
  PropertyRepository: Symbol.for('PropertyRepository'),
  UserPreferencesRepository: Symbol.for('UserPreferencesRepository'), // NOVO
  // ...
};

// container.ts
container.registerSingleton(TOKENS.PropertyRepository, PropertyRepositoryImpl);
container.registerSingleton(TOKENS.UserPreferencesRepository, UserPreferencesRepositoryImpl);
```

---

## 7. Variaveis de Ambiente

### Root (.env)
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_NETWORK=devnet
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
```

### API (services/api/.env)
```env
PORT=3002
HOST=0.0.0.0
CORS_ORIGINS=http://localhost:5173,https://rwa.hubweb3.com
DATABASE_URL=postgres://postgres:postgres@postgres:5432/hub_indexer
INDEXER_URL=http://indexer:9090
```

### Indexer (services/indexer/.env)
```env
PORT=9090
DATABASE_URL=postgres://postgres:postgres@postgres:5432/hub_indexer?sslmode=disable
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
INDEXER_INTERVAL=60s
```

### Frontend (real_estate_program/app/.env)
```env
VITE_SOLANA_NETWORK=devnet
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_API_URL=https://rwa.hubweb3.com/api/v1
VITE_KYC_API_URL=https://rwa.hubweb3.com/kyc-api
VITE_PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
```

---

## 8. Docker

### Comandos Makefile
```bash
make up              # Iniciar todos servicos
make down            # Parar todos servicos
make restart         # Reiniciar
make build           # Rebuild imagens
make ps              # Status
make logs            # Ver todos logs
make logs-api        # Logs API
make logs-indexer    # Logs Indexer
make logs-postgres   # Logs PostgreSQL
```

### Portas
| Servico | Porta Dev | Porta Prod |
|---------|-----------|------------|
| Frontend | 5174 | 5173 |
| API | 3004 | 3002 |
| KYC API | 3005 | 3001 |
| Indexer | 9090 | 9090 |
| PostgreSQL | 5436 | 5432 |

---

## 9. Program IDs (Solana)

```
HUB Token Program: FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
Credential Program: FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
```

---

## 10. Arquivos Implementados (Settings e Reports)

### Backend - Criados:

1. **Domain Entities:**
   - `domain/entities/UserPreferences.ts` - Preferencias do usuario
   - `domain/entities/UserActivity.ts` - Atividades do usuario

2. **Application Ports:**
   - `application/ports/IUserPreferencesRepository.ts`
   - `application/ports/IUserAnalyticsRepository.ts`

3. **Infrastructure:**
   - `infrastructure/database/PostgresDatabase.ts` - Conexao PostgreSQL
   - `infrastructure/repositories/UserPreferencesRepositoryImpl.ts`
   - `infrastructure/repositories/UserAnalyticsRepositoryImpl.ts`

4. **Use Cases:**
   - `application/use-cases/GetUserPreferencesUseCase.ts`
   - `application/use-cases/UpdateUserPreferencesUseCase.ts`
   - `application/use-cases/GetUserAnalyticsUseCase.ts`
   - `application/use-cases/GetUserActivitiesUseCase.ts`
   - `application/use-cases/RecordUserActivityUseCase.ts`

5. **Controllers e Routes:**
   - `interfaces/http/controllers/UserController.ts`
   - `interfaces/http/routes/userRoutes.ts`

### Frontend - Atualizados:

1. **Services:**
   - `services/api/user.ts` - Cliente API para endpoints de usuario

2. **Pages:**
   - `pages/SettingsPage.tsx` - Integrado com API real
   - `pages/ReportsPage.tsx` - Integrado com API real

---

## 11. Como Executar o Projeto

### Desenvolvimento Local:

```bash
# 1. Instalar dependencias
cd services/api && npm install
cd ../kyc-api && npm install
cd ../../real_estate_program/app && npm install

# 2. Subir PostgreSQL via Docker
docker run -d --name hub-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=hub_indexer \
  -p 5432:5432 postgres:15-alpine

# 3. Iniciar API (terminal 1)
cd services/api && npm run dev

# 4. Iniciar Frontend (terminal 2)
cd real_estate_program/app && npm run dev
```

### Producao (Docker Compose):

```bash
# Subir todos os servicos
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f
```

---

## 12. Exemplo de Codigo para Adicionar Endpoint

### 1. Entity (domain/entities/UserPreferences.ts)
```typescript
export interface UserPreferences {
  walletAddress: string;
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'BRL' | 'EUR';
  hideBalances: boolean;
  notifications: NotificationPreferences;
}
```

### 2. Port (application/ports/IUserPreferencesRepository.ts)
```typescript
export interface IUserPreferencesRepository {
  findByWallet(wallet: string): Promise<UserPreferences | null>;
  save(prefs: UserPreferences): Promise<UserPreferences>;
  update(wallet: string, data: Partial<UserPreferences>): Promise<UserPreferences>;
}
```

### 3. Repository (infrastructure/repositories/UserPreferencesRepositoryImpl.ts)
```typescript
@injectable()
export class UserPreferencesRepositoryImpl implements IUserPreferencesRepository {
  constructor(@inject(TOKENS.Database) private db: Database) {}

  async findByWallet(wallet: string): Promise<UserPreferences | null> {
    const result = await this.db.query(
      'SELECT * FROM user_preferences WHERE wallet_address = $1',
      [wallet]
    );
    return result.rows[0] || null;
  }
}
```

### 4. Use Case (application/use-cases/GetUserPreferencesUseCase.ts)
```typescript
@injectable()
export class GetUserPreferencesUseCase {
  constructor(
    @inject(TOKENS.UserPreferencesRepository)
    private repo: IUserPreferencesRepository
  ) {}

  async execute(wallet: string): Promise<UserPreferencesDTO> {
    const prefs = await this.repo.findByWallet(wallet);
    return prefs || UserPreferencesEntity.createDefault(wallet);
  }
}
```

### 5. Controller (interfaces/http/controllers/UserController.ts)
```typescript
@injectable()
export class UserController {
  constructor(
    private getPrefsUseCase: GetUserPreferencesUseCase,
    private updatePrefsUseCase: UpdateUserPreferencesUseCase
  ) {}

  async getPreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const { wallet } = req.params;
      const prefs = await this.getPrefsUseCase.execute(wallet);
      res.json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }
}
```

### 6. Routes (interfaces/http/routes/userRoutes.ts)
```typescript
export function createUserRoutes(): Router {
  const router = Router();
  const controller = container.resolve(UserController);

  router.get('/:wallet/preferences', controller.getPreferences.bind(controller));
  router.put('/:wallet/preferences', controller.updatePreferences.bind(controller));

  return router;
}
```

### 7. Register in index.ts
```typescript
import { createUserRoutes } from './userRoutes';
router.use('/users', createUserRoutes());
```

---

## 12. Conexao PostgreSQL no Backend

O backend precisa de uma conexao PostgreSQL. Criar arquivo:

### infrastructure/database/PostgresDatabase.ts
```typescript
import { Pool } from 'pg';
import { injectable } from 'tsyringe';

@injectable()
export class PostgresDatabase {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL ||
        'postgres://postgres:postgres@localhost:5432/hub_indexer'
    });
  }

  async query(text: string, params?: any[]) {
    return this.pool.query(text, params);
  }

  async close() {
    await this.pool.end();
  }
}
```

Adicionar `pg` ao package.json:
```bash
cd services/api
npm install pg @types/pg
```

---

## 14. Contato e Suporte

- Repositorio: hub-token/
- Deploy: Docker Compose
- Producao: rwa.hubweb3.com

---

**Ultima atualizacao:** Dezembro 2024

## RESUMO FINAL - O QUE FOI IMPLEMENTADO

### Backend (services/api/):
- Conexao PostgreSQL com auto-criacao de tabelas
- User Preferences API (GET, PUT, DELETE)
- User Analytics API (analytics, activities, export)
- Clean Architecture completa

### Frontend (real_estate_program/app/):
- SettingsPage com integracao real a API
- ReportsPage com graficos e dados da API
- Service client para endpoints de usuario

### Novos Endpoints:
```
GET  /api/v1/users/:wallet/preferences
PUT  /api/v1/users/:wallet/preferences
DELETE /api/v1/users/:wallet/preferences
GET  /api/v1/users/:wallet/analytics?timeRange=30d
GET  /api/v1/users/:wallet/activities?page=1&pageSize=20
POST /api/v1/users/:wallet/activities
GET  /api/v1/users/:wallet/export?format=json
```

### Dependencia adicionada:
```bash
npm install pg @types/pg
```
