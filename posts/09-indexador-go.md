# Post 9: Indexador em Go - Performance para Blockchain

## Contexto para o Gemini

Este post deve explicar por que escolhemos Go para o indexador e como ele melhora a performance do sistema.

## O Problema: Latência de Queries On-Chain

```
Cenário sem indexador:

1. Usuário abre página de propriedades
2. Frontend chama API: GET /properties
3. API precisa buscar dados:
   a) Buscar todas as contas do programa na Solana
   b) Deserializar cada conta (Anchor IDL)
   c) Buscar metadados do IPFS para cada uma
   d) Montar resposta JSON
4. Tempo total: 3-8 segundos

Problemas:
- UX ruim (loading longo)
- Sobrecarrega RPC público
- Rate limit pode bloquear
- Custo alto de RPC privado com muito uso
```

## Nossa Solução: Indexador Dedicado

```
Com indexador:

1. Usuário abre página de propriedades
2. Frontend chama API: GET /properties
3. API consulta PostgreSQL (indexado)
4. Tempo total: 50-200ms

Indexador roda em background:
- Polling a cada 60 segundos
- Atualiza PostgreSQL com dados frescos
- API sempre consulta banco local
```

## Por que Go?

### 1. Performance de Concorrência

```go
// Go: Goroutines são leves (2KB stack inicial)
// Pode ter milhares rodando simultaneamente

func (s *SolanaClient) FetchAllProperties(ctx context.Context) ([]Property, error) {
    accounts, _ := s.client.GetProgramAccounts(ctx, s.programID)

    properties := make(chan Property, len(accounts))
    errors := make(chan error, len(accounts))

    // Processa cada conta em paralelo
    for _, acc := range accounts {
        go func(account Account) {
            prop, err := s.parseProperty(account)
            if err != nil {
                errors <- err
                return
            }
            properties <- prop
        }(acc)
    }

    // Coleta resultados
    result := make([]Property, 0, len(accounts))
    for i := 0; i < len(accounts); i++ {
        select {
        case prop := <-properties:
            result = append(result, prop)
        case err := <-errors:
            log.Printf("Warning: %v", err)
        }
    }

    return result, nil
}
```

### 2. Binário Único

```
Node.js:
- node_modules: 500MB+
- Precisa Node runtime
- Dependências nativas podem falhar

Go:
- Binário único: 15MB
- Zero dependências em runtime
- Cross-compile para qualquer OS
- Container Docker minimal (Alpine + binário)
```

### 3. Tipagem Forte para Dados Binários

```go
// Deserialização manual de dados Anchor
// Mais trabalhoso, mas 100% controlado

func (s *SolanaClient) parsePropertyState(data []byte) (Property, error) {
    if len(data) < PROPERTY_STATE_SIZE {
        return Property{}, fmt.Errorf("invalid size")
    }

    offset := 0

    // Discriminator (8 bytes) - Anchor
    offset += 8

    // Authority (32 bytes)
    authority := solana.PublicKeyFromBytes(data[offset:offset+32])
    offset += 32

    // Mint (32 bytes)
    mint := solana.PublicKeyFromBytes(data[offset:offset+32])
    offset += 32

    // String: 4 bytes length + content
    nameLen := binary.LittleEndian.Uint32(data[offset:offset+4])
    offset += 4
    name := string(data[offset:offset+int(nameLen)])
    offset += int(nameLen)

    // ... continua para outros campos

    return Property{
        Authority: authority.String(),
        Mint:      mint.String(),
        Name:      name,
    }, nil
}
```

### 4. HTTP Server Eficiente

```go
// Gin framework - rápido e minimal

func SetupRouter(idx *indexer.Indexer) *gin.Engine {
    router := gin.Default()

    // CORS
    router.Use(cors.Default())

    // Health check
    router.GET("/health", func(c *gin.Context) {
        c.JSON(200, gin.H{"status": "healthy"})
    })

    api := router.Group("/api/v1")
    {
        api.GET("/properties", idx.GetProperties)
        api.GET("/properties/:mint", idx.GetPropertyByMint)
        api.POST("/index/trigger", idx.TriggerIndexing)
    }

    return router
}
```

## Arquitetura do Indexador

```
┌─────────────────────────────────────────────────────┐
│                    INDEXER (Go)                      │
│                                                      │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────┐ │
│  │  Scheduler  │───>│   Syncer    │───>│ Decoder │ │
│  │  (60s tick) │    │ (RPC calls) │    │ (Parse) │ │
│  └─────────────┘    └─────────────┘    └────┬────┘ │
│                                              │      │
│                                              ▼      │
│                                        ┌─────────┐ │
│                                        │Processor│ │
│                                        │ (Upsert)│ │
│                                        └────┬────┘ │
│                                              │      │
└──────────────────────────────────────────────┼──────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ PostgreSQL  │
                                        │             │
                                        │ properties  │
                                        │ credentials │
                                        │ investments │
                                        └─────────────┘
```

## Schema do Banco

```sql
CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    mint VARCHAR(44) UNIQUE NOT NULL,
    property_state_pda VARCHAR(44) NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    authority VARCHAR(44) NOT NULL,
    seller_wallet VARCHAR(44),
    status VARCHAR(20) DEFAULT 'active',
    total_supply BIGINT NOT NULL,
    circulating_supply BIGINT DEFAULT 0,
    decimals INTEGER DEFAULT 9,
    property_type VARCHAR(50),
    location TEXT,
    total_value_usd BIGINT,
    annual_yield INTEGER,
    metadata_uri TEXT,
    image TEXT,
    current_epoch BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_indexed_slot BIGINT
);

CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_value ON properties(total_value_usd);
```

## Fallback Pattern na API

```typescript
// API Principal (Node.js) com fallback

@injectable()
export class PropertyRepositoryImpl implements IPropertyRepository {
  async findAll(): Promise<Property[]> {
    // Tenta indexador primeiro (rápido)
    try {
      const response = await axios.get(
        `${this.config.indexer.url}/api/v1/properties`,
        { timeout: 2000 }
      );
      return response.data.data.map(this.mapToEntity);
    } catch (error) {
      console.warn('Indexer unavailable, falling back to on-chain');
    }

    // Fallback: busca direto na blockchain (lento)
    return this.fetchFromChain();
  }
}
```

## Métricas de Performance

```
Benchmark: Listar 50 propriedades

Sem Indexador (on-chain direto):
├─ GetProgramAccounts: 1.2s
├─ Deserialização: 0.3s
├─ IPFS metadata (50 calls): 4.5s
└─ Total: ~6 segundos

Com Indexador (PostgreSQL):
├─ Query SQL: 15ms
├─ JSON serialization: 5ms
└─ Total: ~20ms

Melhoria: 300x mais rápido
```

## Ângulo do Post

Mostrar que Go é uma escolha técnica fundamentada para workloads de blockchain. Não é hype - é pragmatismo.

## Hashtags Sugeridas

#Golang #SystemsDesign #Blockchain #Indexing #PostgreSQL #Performance #BackendDevelopment #SolanaDevs
