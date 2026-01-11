# Hub Token - Real Estate Tokenization Ecosystem

## Complete Technical Documentation

**Version:** 1.0
**Network:** Solana (Devnet/Mainnet)
**Last Updated:** December 2025

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Smart Contracts (Solana Programs)](#3-smart-contracts-solana-programs)
4. [Backend Services](#4-backend-services)
5. [Frontend Application](#5-frontend-application)
6. [Database Schema](#6-database-schema)
7. [Investment Flow](#7-investment-flow)
8. [KYC & Credential System](#8-kyc--credential-system)
9. [Revenue Distribution (Dividends)](#9-revenue-distribution-dividends)
10. [Transfer Hook & Compliance](#10-transfer-hook--compliance)
11. [Docker Infrastructure](#11-docker-infrastructure)
12. [Security Considerations](#12-security-considerations)
13. [API Reference](#13-api-reference)

---

## 1. Overview

### What is Hub Token?

Hub Token is a complete **Real World Asset (RWA) Tokenization Platform** built on Solana that enables:

- **Fractional Ownership** of real estate properties
- **Automated Dividend Distribution** to token holders
- **KYC/Compliance Verification** via Hub Credential Protocol
- **Investment Flows** with automated fee distribution
- **Secondary Market** with built-in compliance (Transfer Hooks)

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Blockchain** | Solana | 1.18+ |
| **Smart Contracts** | Anchor/Rust | 0.30.1 |
| **Token Standard** | Token-2022 (SPL) | Latest |
| **Backend API** | Node.js/TypeScript | 20 LTS |
| **KYC API** | Node.js/TypeScript | 20 LTS |
| **Indexer** | Go/Gin | 1.21 |
| **Database** | PostgreSQL | 15 |
| **Frontend** | React/TypeScript | 18.2 |
| **Styling** | Tailwind CSS | 3.4 |
| **State Management** | Zustand | 4.4 |

### Program IDs

```
Hub Token Program:    FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
Credential Program:   FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
```

### Key Wallets

```
Admin Wallet:         AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
Reserve Treasury:     34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH
```

---

## 2. System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        FE[React Frontend<br/>Port: 5173]
    end

    subgraph "API Gateway"
        KONG[Kong Gateway<br/>Port: 8000]
    end

    subgraph "Backend Services"
        API[Main API<br/>Node.js - Port: 3002]
        KYC[KYC API<br/>Node.js - Port: 3001]
        IDX[Indexer<br/>Go - Port: 9090]
    end

    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Port: 5432)]
        IPFS[IPFS/Pinata<br/>Metadata Storage]
    end

    subgraph "Solana Blockchain"
        HUB[Hub Token Program<br/>FDfk...6om]
        CRED[Credential Program<br/>FaJ4...Wt]
        T22[Token-2022<br/>SPL Program]
    end

    FE --> KONG
    KONG --> API
    KONG --> KYC

    API --> PG
    API --> IDX
    API --> HUB
    API --> IPFS

    KYC --> CRED
    KYC --> PG

    IDX --> PG
    IDX --> HUB

    HUB --> T22
    HUB -.-> CRED

    style FE fill:#61dafb
    style API fill:#68a063
    style KYC fill:#68a063
    style IDX fill:#00add8
    style PG fill:#336791
    style HUB fill:#9945ff
    style CRED fill:#14f195
```

### Component Interaction Flow

```mermaid
flowchart LR
    subgraph Client
        USER[User Browser]
    end

    subgraph Frontend
        REACT[React App]
        WALLET[Wallet Adapter]
    end

    subgraph Backend
        API[Main API]
        KYC_API[KYC API]
        INDEXER[Go Indexer]
    end

    subgraph Database
        DB[(PostgreSQL)]
    end

    subgraph Solana
        PROGRAM[Hub Token Program]
        CREDENTIAL[Credential Program]
    end

    USER --> REACT
    REACT --> WALLET
    WALLET --> PROGRAM

    REACT --> API
    REACT --> KYC_API

    API --> DB
    API --> INDEXER
    API --> PROGRAM

    KYC_API --> CREDENTIAL
    KYC_API --> DB

    INDEXER --> DB
    INDEXER --> PROGRAM

    PROGRAM -.->|Verify KYC| CREDENTIAL
```

### Service Port Mapping

| Service | Development | Production | Purpose |
|---------|-------------|------------|---------|
| Frontend | 5174 | 5173 | React SPA (Nginx) |
| Main API | 3004 | 3002 | Business Logic API |
| KYC API | 3005 | 3001 | Credential Service |
| Indexer | 9090 | 9090 | Blockchain Indexer |
| PostgreSQL | 5436 | 5432 | Database |
| Kong | 8000 | 8000 | API Gateway |

---

## 3. Smart Contracts (Solana Programs)

### Directory Structure

```
real_estate_program/
├── programs/hub_token_program/src/
│   ├── lib.rs                        # Entry point (11 instructions)
│   ├── constants.rs                  # PDA seeds, fees, limits
│   ├── error.rs                      # 13 custom error types
│   ├── events.rs                     # Audit event definitions
│   ├── state/
│   │   ├── property_state.rs         # Main property account
│   │   ├── property_details.rs       # Metadata structure
│   │   └── investment_vault.rs       # Investment escrow & reserve
│   ├── instructions/
│   │   ├── create_property_mint.rs   # Create Token-2022 mint
│   │   ├── mint_property_tokens.rs   # Mint to investors (KYC required)
│   │   ├── burn_property_tokens.rs   # Token redemption
│   │   ├── update_property_details.rs
│   │   ├── toggle_property_status.rs
│   │   ├── transfer_hook.rs          # Token-2022 transfer verification
│   │   ├── revenue_vault.rs          # Dividend distribution
│   │   └── invest_in_property.rs     # Investment with SOL payment
│   └── utils/
│       └── hub_credential_verification.rs # KYC verification logic
```

### Program Instructions Overview

```mermaid
graph TD
    subgraph "Property Management"
        A[create_property_mint]
        B[update_property_details]
        C[toggle_property_status]
    end

    subgraph "Token Operations"
        D[mint_property_tokens]
        E[burn_property_tokens]
        F[initialize_extra_account_metas]
        G[transfer_hook_execute]
    end

    subgraph "Investment"
        H[initialize_investment_vault]
        I[invest_in_property]
    end

    subgraph "Revenue"
        J[deposit_revenue]
        K[claim_revenue]
    end

    A --> D
    A --> H
    H --> I
    I --> D
    D --> G
    J --> K
```

### Key State Structures

#### PropertyState
```rust
pub struct PropertyState {
    pub authority: Pubkey,              // Property owner
    pub seller_wallet: Pubkey,          // Receives 90% of investments
    pub mint: Pubkey,                   // Token-2022 mint
    pub property_name: String,          // Max 50 chars
    pub property_symbol: String,        // Max 10 chars
    pub total_supply: u64,              // Max mintable tokens
    pub circulating_supply: u64,        // Currently minted
    pub details: PropertyDetails,       // Metadata
    pub is_active: bool,                // Minting enabled?
    pub created_at: i64,                // Timestamp
    pub updated_at: i64,                // Timestamp
    pub bump: u8,                       // PDA bump
}
```

#### PropertyDetails
```rust
pub struct PropertyDetails {
    pub property_address: String,       // Physical location (max 200)
    pub property_type: String,          // Type (max 100)
    pub total_value_usd: u64,           // USD cents
    pub rental_yield_bps: u16,          // Basis points (0-10000)
    pub metadata_uri: String,           // IPFS/Arweave (max 500)
}
```

#### InvestmentVault
```rust
pub struct InvestmentVault {
    pub property_mint: Pubkey,
    pub seller: Pubkey,
    pub total_invested: u64,            // Total SOL received
    pub total_platform_fees: u64,       // Accumulated fees
    pub reserve_balance: u64,           // Maintenance fund
    pub escrow_balance: u64,            // Seller's escrow
    pub total_released_to_seller: u64,  // Already released
    pub current_milestone: u8,          // 0-3
    pub is_initialized: bool,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}
```

### PDA Derivation

```mermaid
graph LR
    MINT[Mint Pubkey] --> |"seeds: ['property', mint]"| PS[PropertyState PDA]
    MINT --> |"seeds: ['extra-account-metas', mint]"| EAM[ExtraAccountMetaList PDA]
    MINT --> |"seeds: ['investment_vault', mint]"| IV[InvestmentVault PDA]
    MINT --> |"seeds: ['revenue_vault', mint, epoch]"| RV[RevenueVault PDA]
```

### Error Types

| Error | Code | Description |
|-------|------|-------------|
| `Unauthorized` | 6000 | Only authority can perform |
| `PropertyNameTooLong` | 6001 | Name exceeds 50 chars |
| `PropertySymbolTooLong` | 6002 | Symbol exceeds 10 chars |
| `InvalidTotalSupply` | 6003 | Supply must be > 0 |
| `ExceedsMaxSupply` | 6004 | Minting exceeds limit |
| `PropertyNotActive` | 6005 | Property is paused |
| `InvalidMint` | 6006 | Mint validation failed |
| `KycVerificationRequired` | 6007 | Hub Credential missing |
| `InvalidRentalYield` | 6008 | Yield > 100% |
| `CredentialExpired` | 6009 | KYC credential expired |
| `CredentialRevoked` | 6010 | KYC credential revoked |
| `CredentialSuspended` | 6011 | KYC credential suspended |
| `InsufficientBalance` | 6012 | Not enough tokens |
| `VaultNotInitialized` | 6013 | Vault not set up |

---

## 4. Backend Services

### Main API (Node.js - Port 3002)

**Architecture:** Clean Architecture with Dependency Injection (TSyringe)

```
services/api/src/
├── domain/                  # Business entities
│   └── entities/
│       ├── Property.ts
│       ├── Investor.ts
│       ├── Revenue.ts
│       └── Dividend.ts
├── application/             # Use cases & logic
│   ├── ports/               # Repository interfaces
│   ├── use-cases/           # Business logic
│   └── services/            # Application services
├── infrastructure/          # External integrations
│   ├── database/            # PostgreSQL
│   ├── solana/              # Program adapter
│   └── ipfs/                # Pinata integration
├── interfaces/              # HTTP layer
│   └── http/
│       ├── controllers/
│       ├── routes/
│       └── middlewares/
└── shared/                  # DI container
```

### KYC API (Node.js - Port 3001)

```
services/kyc-api/src/
├── app.ts              # Express setup
├── config.ts           # Configuration
├── routes/
│   ├── auth.ts         # Wallet authentication
│   ├── credential.ts   # Credential operations
│   ├── kyc.ts          # KYC sessions
│   └── admin.ts        # Admin endpoints
├── services/
│   ├── kycSessionService.ts
│   ├── credentialService.ts
│   └── solanaService.ts
└── middleware/
```

### Indexer (Go - Port 9090)

```
services/indexer/
├── cmd/main.go         # Entry point
├── internal/
│   ├── config/         # Environment config
│   ├── database/       # PostgreSQL
│   ├── models/         # Data models
│   ├── indexer/        # Blockchain indexing
│   └── api/            # REST API
```

### Service Communication Diagram

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as Main API
    participant KYC as KYC API
    participant IDX as Indexer
    participant DB as PostgreSQL
    participant SOL as Solana

    FE->>API: GET /properties
    API->>DB: Query properties
    DB-->>API: Properties data
    API-->>FE: JSON response

    FE->>KYC: POST /auth/verify
    KYC->>SOL: Verify signature
    SOL-->>KYC: Valid
    KYC-->>FE: JWT token

    IDX->>SOL: Fetch program accounts
    SOL-->>IDX: Account data
    IDX->>DB: Upsert properties
```

---

## 5. Frontend Application

### Directory Structure

```
real_estate_program/app/src/
├── pages/
│   ├── HomePage.tsx        # Dashboard
│   ├── PropertiesPage.tsx  # Browse
│   ├── PropertyDetailPage.tsx
│   ├── PortfolioPage.tsx   # Holdings
│   ├── DividendsPage.tsx   # Claims
│   ├── AdminPage.tsx       # Admin
│   └── KycPage.tsx         # Verification
├── components/
│   ├── investment/         # Investment modal
│   ├── property/           # Property cards
│   ├── wallet/             # Wallet connect
│   ├── layout/             # Header, Sidebar
│   └── ui/                 # Reusable components
├── providers/
│   ├── WalletProvider.tsx
│   └── HubCredentialProvider.tsx
├── stores/                 # Zustand
│   ├── useAppStore.ts
│   └── useKycStore.ts
├── services/api/           # API clients
└── i18n/                   # i18n (PT/EN)
```

### Page Flow Diagram

```mermaid
graph TB
    HOME[HomePage<br/>Dashboard & Stats]
    PROPS[PropertiesPage<br/>Browse & Filter]
    DETAIL[PropertyDetailPage<br/>Details & Invest]
    PORTFOLIO[PortfolioPage<br/>Holdings & Value]
    DIVIDENDS[DividendsPage<br/>Claim Revenue]
    KYC[KycPage<br/>Verification]
    ADMIN[AdminPage<br/>Management]

    HOME --> PROPS
    PROPS --> DETAIL
    DETAIL --> |Invest| KYC
    KYC --> |Verified| DETAIL
    DETAIL --> |After Investment| PORTFOLIO
    PORTFOLIO --> DIVIDENDS

    ADMIN --> |Create Property| PROPS
```

---

## 6. Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    PROPERTIES {
        serial id PK
        varchar mint UK
        varchar property_state_pda
        varchar name
        varchar symbol
        varchar authority
        varchar status
        bigint total_supply
        bigint circulating_supply
        integer decimals
        varchar property_type
        varchar location
        bigint total_value_usd
        bigint annual_yield
        text metadata_uri
        text image
        timestamp created_at
        timestamp updated_at
    }

    USER_PREFERENCES {
        serial id PK
        varchar wallet_address UK
        varchar theme
        varchar currency
        boolean hide_balances
        jsonb notifications
        timestamp created_at
        timestamp updated_at
    }

    USER_ACTIVITIES {
        serial id PK
        varchar wallet_address FK
        varchar activity_type
        varchar property_mint FK
        varchar property_name
        decimal amount
        text description
        jsonb metadata
        timestamp created_at
    }

    PORTFOLIO_SNAPSHOTS {
        serial id PK
        varchar wallet_address FK
        decimal total_value_usd
        integer total_properties
        date snapshot_date
        timestamp created_at
    }

    USER_PREFERENCES ||--o{ USER_ACTIVITIES : has
    USER_PREFERENCES ||--o{ PORTFOLIO_SNAPSHOTS : has
    PROPERTIES ||--o{ USER_ACTIVITIES : references
```

### Tables DDL

```sql
-- Properties table
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

-- User preferences
CREATE TABLE user_preferences (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) UNIQUE NOT NULL,
    theme VARCHAR(20) DEFAULT 'system',
    currency VARCHAR(10) DEFAULT 'USD',
    hide_balances BOOLEAN DEFAULT false,
    notifications JSONB DEFAULT '{"email": false, "push": false}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Activity log
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

-- Portfolio history
CREATE TABLE portfolio_snapshots (
    id SERIAL PRIMARY KEY,
    wallet_address VARCHAR(44) NOT NULL,
    total_value_usd DECIMAL(20, 2),
    total_properties INTEGER,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(wallet_address, snapshot_date)
);

-- Indexes
CREATE INDEX idx_properties_mint ON properties(mint);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_user_activities_wallet ON user_activities(wallet_address);
CREATE INDEX idx_user_activities_created ON user_activities(created_at);
CREATE INDEX idx_portfolio_snapshots_wallet ON portfolio_snapshots(wallet_address);
```

---

## 7. Investment Flow

### Investment Process Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Backend API
    participant SOL as Solana Program
    participant CRED as Credential Program

    U->>FE: Click "Invest"
    FE->>API: GET /invest/quote?mint=X&amount=Y
    API-->>FE: Quote (fees, tokens)

    FE->>FE: Display confirmation
    U->>FE: Confirm investment

    FE->>SOL: invest_in_property()
    SOL->>CRED: verify_hub_credential()
    CRED-->>SOL: Credential valid

    SOL->>SOL: Transfer fees (2.5% + 7.5%)
    SOL->>SOL: Transfer escrow (90%)
    SOL->>SOL: Mint tokens to investor
    SOL->>SOL: Check milestones

    SOL-->>FE: Transaction success
    FE->>API: POST /activities (log)
    FE-->>U: Show success + tokens
```

### Fee Distribution Flow

```mermaid
flowchart TB
    INVEST[Investment: 1000 SOL]

    INVEST --> PLATFORM[Platform Fee<br/>2.5% = 25 SOL]
    INVEST --> RESERVE[Reserve Fund<br/>7.5% = 75 SOL]
    INVEST --> SELLER[Seller Escrow<br/>90% = 900 SOL]

    PLATFORM --> TREASURY[Platform Treasury<br/>AMuiRHo...JUpYi4x]
    RESERVE --> RESERVE_WALLET[Reserve Treasury<br/>34JKXfY...PZChpxHH]

    SELLER --> M1{50% Sold?}
    M1 -->|Yes| R1[Release 50%<br/>450 SOL]
    M1 -->|No| HOLD1[Hold in Escrow]

    R1 --> M2{75% Sold?}
    M2 -->|Yes| R2[Release 30%<br/>270 SOL]
    M2 -->|No| HOLD2[Wait]

    R2 --> M3{100% Sold?}
    M3 -->|Yes| R3[Release 20%<br/>180 SOL]
```

### Fee Calculation

| Component | Percentage | Basis Points | Example (1000 SOL) |
|-----------|------------|--------------|-------------------|
| Platform Fee | 2.5% | 250 BPS | 25 SOL |
| Reserve Fund | 7.5% | 750 BPS | 75 SOL |
| Seller (Escrow) | 90% | 9000 BPS | 900 SOL |
| **Total** | **100%** | **10000 BPS** | **1000 SOL** |

### Milestone Release Schedule

| Milestone | % Sold | Escrow Released | Cumulative |
|-----------|--------|-----------------|------------|
| Initial | 0% | 0% | 0% |
| Milestone 1 | 50% | 50% | 50% |
| Milestone 2 | 75% | 30% | 80% |
| Milestone 3 | 100% | 20% | 100% |

---

## 8. KYC & Credential System

### Credential Types

| Type | Code | Description |
|------|------|-------------|
| `KycBasic` | 0 | Basic identity verification |
| `KycFull` | 1 | Full KYC including AML |
| `AccreditedInvestor` | 2 | US accredited investor |
| `QualifiedPurchaser` | 3 | Qualified purchaser |
| `BrazilianCpf` | 4 | CPF verification (Brazil) |
| `BrazilianCnpj` | 5 | CNPJ verification (Brazil) |

### Credential Status

| Status | Code | Description |
|--------|------|-------------|
| `Active` | 0 | Valid and usable |
| `Expired` | 1 | Validity period ended |
| `Revoked` | 2 | Manually revoked |
| `Suspended` | 3 | Temporarily suspended |

### KYC Verification Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant KYC as KYC API
    participant CRED as Credential Program
    participant ISSUER as Issuer Wallet

    U->>FE: Start KYC
    FE->>KYC: POST /kyc/session
    KYC-->>FE: Session ID

    U->>FE: Fill KYC form
    FE->>KYC: PUT /kyc/session/:id

    U->>FE: Submit documents
    FE->>KYC: POST /kyc/session/:id/submit

    Note over KYC: Off-chain verification

    KYC->>CRED: issue_credential()
    CRED->>CRED: Create HubCredential PDA
    CRED-->>KYC: Credential issued

    KYC-->>FE: KYC Approved
    FE-->>U: Ready to invest!
```

### Credential Data Structure

```mermaid
classDiagram
    class HubCredential {
        +Pubkey user
        +Pubkey issuer
        +u8 credential_type
        +u8 status
        +i64 issued_at
        +i64 expires_at
        +String metadata
    }

    class CredentialType {
        <<enumeration>>
        KycBasic
        KycFull
        AccreditedInvestor
        QualifiedPurchaser
        BrazilianCpf
        BrazilianCnpj
    }

    class CredentialStatus {
        <<enumeration>>
        Active
        Expired
        Revoked
        Suspended
    }

    HubCredential --> CredentialType
    HubCredential --> CredentialStatus
```

---

## 9. Revenue Distribution (Dividends)

### Dividend Flow Diagram

```mermaid
sequenceDiagram
    participant OWNER as Property Owner
    participant API as Backend API
    participant SOL as Solana Program
    participant INV as Investors

    OWNER->>API: POST /admin/revenue
    Note over API: amount: 500 SOL<br/>epoch: 1

    API->>SOL: deposit_revenue()
    SOL->>SOL: Create RevenueEpoch
    SOL->>SOL: Snapshot eligible supply
    SOL->>SOL: Store SOL in vault

    Note over SOL: RevenueEpoch:<br/>total: 500 SOL<br/>eligible: 1,000,000 tokens

    INV->>SOL: claim_revenue()
    SOL->>SOL: Calculate share
    Note over SOL: share = (balance / eligible) * total
    SOL->>INV: Transfer SOL
```

### Dividend Calculation

```
Claimable Amount = (Investor Balance / Eligible Supply) × Total Revenue

Example:
- Investor has: 100,000 tokens
- Eligible supply: 1,000,000 tokens
- Total revenue: 500 SOL

Claimable = (100,000 / 1,000,000) × 500 = 50 SOL
```

### Revenue Distribution Flow

```mermaid
flowchart TB
    DEPOSIT[Property Owner<br/>Deposits 500 SOL]

    DEPOSIT --> EPOCH[Create Revenue Epoch]
    EPOCH --> SNAPSHOT[Snapshot Eligible Supply<br/>1,000,000 tokens]

    SNAPSHOT --> VAULT[Revenue Vault<br/>500 SOL]

    VAULT --> INV_A[Investor A<br/>100k tokens = 10%]
    VAULT --> INV_B[Investor B<br/>400k tokens = 40%]
    VAULT --> INV_C[Investor C<br/>500k tokens = 50%]

    INV_A --> CLAIM_A[Claim: 50 SOL]
    INV_B --> CLAIM_B[Claim: 200 SOL]
    INV_C --> CLAIM_C[Claim: 250 SOL]
```

---

## 10. Transfer Hook & Compliance

### Transfer Hook Architecture

Token-2022's Transfer Hook extension allows custom logic to execute on every token transfer. Hub Token uses this for KYC compliance.

```mermaid
sequenceDiagram
    participant ALICE as Alice (Sender)
    participant T22 as Token-2022 Program
    participant HOOK as Hub Token Program
    participant CRED as Credential Program
    participant BOB as Bob (Receiver)

    ALICE->>T22: transfer(100 tokens to Bob)
    T22->>HOOK: transfer_hook_execute()

    HOOK->>HOOK: Extract destination wallet
    HOOK->>CRED: Load HubCredential PDA

    alt Credential Valid
        CRED-->>HOOK: Active, not expired
        HOOK-->>T22: Success
        T22->>BOB: Transfer 100 tokens
        HOOK->>HOOK: Emit TransferKycVerified
    else Credential Invalid
        CRED-->>HOOK: Missing/Expired/Revoked
        HOOK-->>T22: Error: KycVerificationRequired
        Note over T22: Transfer blocked
    end
```

### Transfer Hook Flow

```mermaid
flowchart TB
    START[Token Transfer Initiated]

    START --> INTERCEPT[Token-2022 Intercepts]
    INTERCEPT --> CALL_HOOK[Call transfer_hook_execute]

    CALL_HOOK --> EXTRACT[Extract Destination Wallet]
    EXTRACT --> LOAD[Load Hub Credential PDA]

    LOAD --> CHECK_EXISTS{Credential<br/>Exists?}

    CHECK_EXISTS -->|No| BLOCK1[Block Transfer<br/>KycVerificationRequired]
    CHECK_EXISTS -->|Yes| CHECK_STATUS{Status<br/>Active?}

    CHECK_STATUS -->|No| BLOCK2[Block Transfer<br/>CredentialRevoked/Suspended]
    CHECK_STATUS -->|Yes| CHECK_EXPIRY{Not<br/>Expired?}

    CHECK_EXPIRY -->|No| BLOCK3[Block Transfer<br/>CredentialExpired]
    CHECK_EXPIRY -->|Yes| ALLOW[Allow Transfer]

    ALLOW --> EMIT[Emit TransferKycVerified]
    EMIT --> COMPLETE[Transfer Complete]

    style BLOCK1 fill:#ff6b6b
    style BLOCK2 fill:#ff6b6b
    style BLOCK3 fill:#ff6b6b
    style COMPLETE fill:#51cf66
```

### Extra Account Metas Setup

For Transfer Hooks to work, the program must initialize an `ExtraAccountMetaList` that tells Token-2022 which additional accounts are needed:

```rust
// Accounts needed for transfer hook
[
    investor_credential,      // HubCredential PDA
    credential_program_id,    // Credential Program
]
```

---

## 11. Docker Infrastructure

### Docker Compose Architecture

```mermaid
graph TB
    subgraph "Docker Network: hub-network"
        PG[(PostgreSQL<br/>hub-postgres-dev)]

        IDX[Indexer<br/>hub-indexer-dev<br/>:9090]

        API[API<br/>hub-api-dev<br/>:3002]

        KYC[KYC API<br/>hub-kyc-api-dev<br/>:3001]

        FE[Frontend<br/>hub-frontend-dev<br/>:5173]
    end

    subgraph "External"
        SOL[Solana RPC]
        IPFS[IPFS/Pinata]
    end

    IDX --> PG
    API --> PG
    API --> IDX
    KYC --> PG

    IDX --> SOL
    API --> SOL
    KYC --> SOL
    API --> IPFS

    FE --> API
    FE --> KYC
```

### Service Dependencies

```mermaid
graph LR
    PG[PostgreSQL]
    IDX[Indexer]
    API[API]
    KYC[KYC API]
    FE[Frontend]

    PG --> IDX
    PG --> API
    PG --> KYC
    IDX --> API
    API --> FE
    KYC --> FE
```

### Environment Variables

**Root `.env`:**
```env
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_WS_URL=wss://api.devnet.solana.com
SOLANA_NETWORK=devnet
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
```

**API `.env`:**
```env
PORT=3002
DATABASE_URL=postgres://postgres:postgres@postgres:5432/hub_indexer
INDEXER_URL=http://indexer:9090
CORS_ORIGINS=http://localhost:5173,https://rwa.hubweb3.com
PINATA_API_KEY=xxx
PINATA_SECRET=xxx
```

### Docker Commands

```bash
# Development
docker compose up -d

# Rebuild specific service
docker compose build --no-cache frontend
docker compose up -d frontend

# View logs
docker compose logs -f api

# Production
docker compose -f docker-compose.prod.yml up -d
```

---

## 12. Security Considerations

### On-Chain Security

```mermaid
mindmap
  root((On-Chain<br/>Security))
    KYC Gate
      All investments require Hub Credential
      Transfer Hook verifies all transfers
    Authority Checks
      Only property owner can update
      Only issuer can manage credentials
    PDA Derivation
      Deterministic account addresses
      No spoofing possible
    Arithmetic Safety
      Checked math operations
      Overflow protection
    Event Auditing
      All transactions logged
      Immutable audit trail
```

### Off-Chain Security

```mermaid
mindmap
  root((Off-Chain<br/>Security))
    Transport
      HTTPS/TLS encryption
      Kong API Gateway
    Access Control
      CORS restrictions
      Rate limiting 100 req/15min
    Input Validation
      Zod schema validation
      Parameterized SQL queries
    Secret Management
      Environment variables
      No hardcoded secrets
```

### Compliance Features

| Feature | Implementation |
|---------|---------------|
| KYC/AML | Hub Credential required for all investments |
| Credential Levels | Multiple types (Basic, Full, Accredited) |
| Expiration | Credentials expire after set period |
| Revocation | Admin can revoke credentials |
| Audit Trail | All events recorded on-chain |
| Secondary Market | Transfer Hook enforces compliance |

---

## 13. API Reference

### Main API Endpoints

#### Properties

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/properties` | List all properties |
| GET | `/api/v1/properties/:mint` | Get property details |

#### Investment

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/invest/quote` | Get investment quote |
| POST | `/api/v1/invest` | Execute investment |

#### Portfolio

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/investors/:wallet/portfolio` | User portfolio |
| GET | `/api/v1/investors/:wallet/claimable` | Unclaimed dividends |

#### User

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users/:wallet/preferences` | Get preferences |
| PUT | `/api/v1/users/:wallet/preferences` | Update preferences |
| GET | `/api/v1/users/:wallet/activities` | Activity log |
| GET | `/api/v1/users/:wallet/analytics` | Analytics data |

#### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/admin/properties` | Create property |
| POST | `/api/v1/admin/mint` | Mint tokens |
| POST | `/api/v1/admin/revenue` | Deposit revenue |

### KYC API Endpoints

#### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/nonce` | Request signing nonce |
| POST | `/api/auth/verify` | Verify wallet signature |
| GET | `/api/auth/me` | Get current user |

#### Credentials

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/credentials/:wallet` | Get credential |
| POST | `/api/credentials/issue` | Issue credential |
| POST | `/api/credentials/refresh` | Refresh credential |
| POST | `/api/credentials/revoke` | Revoke credential |

#### KYC Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/kyc/session` | Create session |
| GET | `/api/kyc/session/:id` | Get session status |
| PUT | `/api/kyc/session/:id` | Update session data |
| POST | `/api/kyc/session/:id/submit` | Submit for verification |

---

## Summary

Hub Token provides a complete, production-ready solution for real estate tokenization on Solana:

1. **Fractional Ownership** - Any property can be tokenized and sold in fractions
2. **Compliance Built-In** - KYC verification required for all transactions
3. **Automated Dividends** - Property income distributed proportionally
4. **Secondary Market Ready** - Transfer Hooks ensure all transfers are compliant
5. **Milestone-Based Escrow** - Seller funds released as property sells
6. **Full Audit Trail** - All events recorded on-chain

The system is architected for scalability, security, and regulatory compliance, making it suitable for institutional-grade real estate tokenization.

---

**Production URLs:**
- Frontend: https://rwa.hubweb3.com
- API: https://rwa.hubweb3.com/api/v1
- KYC: https://rwa.hubweb3.com/kyc-api

**GitHub:** [Repository Link]

**Contact:** [Contact Information]
