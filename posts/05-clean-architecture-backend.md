# Post 5: Clean Architecture no Backend - Separação que Escala

## Contexto para o Gemini

Este post deve mostrar como aplicamos Clean Architecture no backend da plataforma Kota e por que isso importa.

## O Problema de Backends "Monolíticos"

```
Backend típico de startup:

controllers/
  propertyController.js  ← lógica de negócio AQUI
  userController.js      ← validação AQUI
  paymentController.js   ← chamada de banco AQUI

Resultado:
- Controller faz TUDO
- Impossível testar sem banco real
- Trocar Postgres por MongoDB? Reescreve tudo
- Trocar Express por Fastify? Reescreve tudo
- Código duplicado entre controllers
```

## Nossa Estrutura - Clean Architecture

```
src/
├── domain/                    # NÚCLEO - Zero dependências externas
│   └── entities/
│       ├── Property.ts        # Regras de negócio puras
│       ├── Investor.ts
│       └── Revenue.ts
│
├── application/               # CASOS DE USO - Orquestra o domínio
│   ├── ports/                 # Interfaces (contratos)
│   │   ├── IPropertyRepository.ts
│   │   ├── IKycService.ts
│   │   └── ISolanaAdapter.ts
│   └── use-cases/
│       ├── GetPropertiesUseCase.ts
│       ├── GetInvestorPortfolioUseCase.ts
│       └── CreateKycAttestationUseCase.ts
│
├── infrastructure/            # IMPLEMENTAÇÕES - Detalhes técnicos
│   ├── solana/
│   │   ├── SolanaConnectionAdapter.ts
│   │   └── SolanaProgramAdapter.ts
│   ├── database/
│   │   └── PostgresDatabase.ts
│   ├── kyc/
│   │   └── HubCredentialServiceAdapter.ts
│   └── repositories/
│       └── PropertyRepositoryImpl.ts
│
└── interfaces/                # ENTRADA - HTTP, CLI, etc
    └── http/
        ├── controllers/
        └── routes/
```

## A Regra de Dependência

```
                    ┌─────────────────┐
                    │     Domain      │  ← Não conhece NADA externo
                    │   (Entities)    │
                    └────────▲────────┘
                             │
                    ┌────────┴────────┐
                    │   Application   │  ← Conhece Domain
                    │   (Use Cases)   │  ← Define interfaces (Ports)
                    └────────▲────────┘
                             │
         ┌───────────────────┴───────────────────┐
         │                                       │
┌────────┴────────┐                    ┌─────────┴────────┐
│ Infrastructure  │                    │   Interfaces     │
│  (Adapters)     │                    │    (HTTP)        │
└─────────────────┘                    └──────────────────┘

Dependências SEMPRE apontam para DENTRO
Camadas internas NUNCA conhecem camadas externas
```

## Código Real - Use Case

```typescript
// GetInvestorPortfolioUseCase.ts

@injectable()
export class GetInvestorPortfolioUseCase {
  constructor(
    // Injeta INTERFACES, não implementações
    @inject(TOKENS.InvestorRepository)
    private investorRepository: IInvestorRepository,

    @inject(TOKENS.PropertyRepository)
    private propertyRepository: IPropertyRepository,

    @inject(TOKENS.KycService)
    private kycService: IKycService
  ) {}

  async execute(walletAddress: string): Promise<PortfolioDTO> {
    // 1. Verifica KYC (não sabe se é Civic, Hub Credential, etc)
    const kycResult = await this.kycService.verifyKyc(walletAddress);

    // 2. Busca propriedades (não sabe se é Postgres, Indexer, etc)
    const properties = await this.propertyRepository.findAll();

    // 3. Busca holdings (não sabe se é RPC direto, cache, etc)
    const holdings = await this.investorRepository.getHoldings(
      walletAddress,
      properties.map(p => p.mint)
    );

    // 4. Lógica de negócio PURA - cálculos
    return this.buildPortfolioDTO(kycResult, properties, holdings);
  }
}
```

## Código Real - Repository Interface vs Implementation

```typescript
// IPropertyRepository.ts (Port - Application Layer)
export interface IPropertyRepository {
  findByMint(mint: string): Promise<Property | null>;
  findAll(filter?: PropertyFilter): Promise<Property[]>;
}

// PropertyRepositoryImpl.ts (Adapter - Infrastructure Layer)
@injectable()
export class PropertyRepositoryImpl implements IPropertyRepository {
  constructor(
    @inject(TOKENS.SolanaProgram) private programAdapter: SolanaProgramAdapter,
    @inject(TOKENS.Config) private config: Config
  ) {}

  async findAll(filter?: PropertyFilter): Promise<Property[]> {
    // Tenta indexer primeiro (rápido)
    try {
      const response = await axios.get(
        `${this.config.indexer.url}/api/v1/properties`
      );
      return response.data.data.map(this.mapToEntity);
    } catch {
      // Fallback para on-chain (lento mas confiável)
      return this.fetchFromChain();
    }
  }
}
```

## Injeção de Dependência com TSyringe

```typescript
// container.ts

export function configureContainer(): DependencyContainer {
  // Infraestrutura
  container.registerSingleton(TOKENS.Config, Config);
  container.registerSingleton(TOKENS.Database, PostgresDatabase);
  container.registerSingleton(TOKENS.SolanaConnection, SolanaConnectionAdapter);

  // Repositories (Adapters implementam Ports)
  container.registerSingleton(
    TOKENS.PropertyRepository,
    PropertyRepositoryImpl
  );
  container.registerSingleton(
    TOKENS.InvestorRepository,
    InvestorRepositoryImpl
  );

  // Services
  container.registerSingleton(TOKENS.KycService, HubCredentialServiceAdapter);

  // Use Cases são auto-registrados via @injectable()
  return container;
}

// Uso no controller
@injectable()
export class PropertyController {
  constructor(
    @inject(TOKENS.PropertyRepository)
    private propertyRepository: IPropertyRepository
  ) {}
}
```

## Benefícios Reais

### 1. Testabilidade
```typescript
// Test com mock - não precisa de banco real
const mockRepo: IPropertyRepository = {
  findAll: jest.fn().mockResolvedValue([mockProperty]),
  findByMint: jest.fn()
};

const useCase = new GetPropertiesUseCase(mockRepo);
const result = await useCase.execute();
expect(result).toHaveLength(1);
```

### 2. Substituibilidade
```
Trocar Civic por Hub Credential?
1. Criar HubCredentialServiceAdapter
2. Implementar IKycService
3. Trocar registro no container
4. ZERO mudança nos use cases
```

### 3. Escalabilidade
```
Extrair para microserviço?
1. Use Case já está isolado
2. Expor via gRPC/HTTP
3. Criar adapter que chama o novo serviço
4. Demais serviços continuam funcionando
```

## Ângulo do Post

Mostrar que arquitetura importa desde o início. Não é "over-engineering" - é investimento em manutenibilidade.

## Hashtags Sugeridas

#CleanArchitecture #SoftwareArchitecture #TypeScript #NodeJS #SOLID #DependencyInjection #BackendDevelopment #SoftwareEngineering
