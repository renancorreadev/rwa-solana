# Hub Token - Roadmap de Features para Tokenização Imobiliária

## Análise do Estado Atual

### O Que Já Está Implementado

| Área | Status | Detalhes |
|------|--------|----------|
| **Tokenização** | ✅ Completo | Token-2022 com TransferHook |
| **KYC/AML** | ✅ Completo | Hub Credential + 6 tipos de credencial |
| **Compliance** | ✅ Completo | Verificação obrigatória em todas transferências |
| **Dividendos** | ✅ Completo | Sistema de épocas com snapshot |
| **Portfolio** | ✅ Completo | Holdings, analytics, histórico |
| **Admin** | ✅ Completo | Criar propriedades, mintar, depositar revenue |
| **IPFS** | ✅ Completo | Metadados e imagens |
| **Preferências** | ✅ Completo | Tema, moeda, notificações |

---

## Novas Features Sugeridas

### PRIORIDADE ALTA (Essenciais para Produção)

#### 1. Marketplace Secundário (P2P Trading / DEX)

Permitir que investidores comprem/vendam tokens entre si usando um modelo AMM (Automated Market Maker).

**Smart Contract (hub_token_program):**
```rust
// Novas instruções
- create_sell_order(property_mint, amount, price_per_token, expiry)
- cancel_sell_order(order_id)
- execute_buy_order(order_id, amount)
- create_buy_order(property_mint, amount, max_price)

// Ou modelo AMM
- initialize_liquidity_pool(property_mint, initial_tokens, initial_sol)
- add_liquidity(property_mint, token_amount, sol_amount)
- remove_liquidity(property_mint, lp_tokens)
- swap_sol_for_tokens(property_mint, sol_amount, min_tokens_out)
- swap_tokens_for_sol(property_mint, token_amount, min_sol_out)
```

**Backend API:**
```
GET  /api/v1/marketplace/orders?property=X&type=sell|buy
POST /api/v1/marketplace/orders
DELETE /api/v1/marketplace/orders/:id
GET  /api/v1/marketplace/history/:property
GET  /api/v1/marketplace/price/:property (preço médio últimas 24h)
GET  /api/v1/marketplace/pools (liquidity pools)
GET  /api/v1/marketplace/pools/:mint/stats
```

**Frontend:**
- Nova página `/marketplace`
- Order book visual ou interface de swap
- Histórico de trades
- Gráfico de preço
- Liquidity pools dashboard

---

#### 2. Sistema de Notificações Real-Time

WebSocket + Push notifications para eventos importantes.

**Implementação:**
```typescript
// Novos eventos para notificar
- Nova propriedade listada
- Revenue disponível para claim
- Ordem executada (marketplace)
- KYC expirando (7 dias antes)
- Preço do token mudou X%
```

**Backend:**
- WebSocket server (Socket.io ou ws)
- Serviço de push notifications (Firebase FCM)
- Fila de mensagens (Redis pub/sub)

**Frontend:**
- Componente de notificações em tempo real
- Centro de notificações
- Preferências granulares

---

#### 3. Documentos Legais On-Chain

Hash de documentos legais armazenados no PropertyState.

**Smart Contract:**
```rust
// Novo campo em PropertyDetails
pub legal_documents: Vec<LegalDocument>,

pub struct LegalDocument {
    pub doc_type: DocumentType, // Escritura, Contrato, Laudo
    pub ipfs_hash: String,
    pub uploaded_at: i64,
    pub verified_by: Pubkey,
}
```

**Frontend:**
- Upload de documentos legais (admin)
- Visualização de documentos por investidores
- Verificação de hash para autenticidade

---

#### 4. Atualização de Valuation

Permitir atualização periódica do valor do imóvel.

**Smart Contract:**
```rust
// Nova instrução
pub fn update_property_valuation(
    ctx: Context<UpdateValuation>,
    new_value_usd: u64,
    appraisal_uri: String,
) -> Result<()>

// Histórico de valuations
pub struct ValuationHistory {
    pub value_usd: u64,
    pub appraised_at: i64,
    pub appraisal_uri: String,
}
```

**Frontend:**
- Gráfico de evolução do valor
- Comparativo valor/token
- Alertas de valorização

---

### PRIORIDADE MÉDIA (Diferenciação de Mercado)

#### 5. Governança e Votação

Permitir que token holders votem em decisões da propriedade.

**Smart Contract:**
```rust
pub struct Proposal {
    pub property: Pubkey,
    pub proposer: Pubkey,
    pub title: String,
    pub description_uri: String,
    pub proposal_type: ProposalType,
    pub votes_for: u64,
    pub votes_against: u64,
    pub voting_ends_at: i64,
    pub status: ProposalStatus,
    pub quorum_percentage: u8,
}

// Instruções
- create_proposal(property, title, type, duration)
- cast_vote(proposal, vote: bool)
- execute_proposal(proposal)
- cancel_proposal(proposal)
```

**Frontend:**
- Página `/governance`
- Lista de propostas ativas
- Interface de votação
- Histórico de decisões

---

#### 6. Staking com Boost de Yield

Investidores que "travam" tokens por mais tempo ganham mais dividendos.

**Smart Contract:**
```rust
pub struct StakePosition {
    pub investor: Pubkey,
    pub property: Pubkey,
    pub amount: u64,
    pub lock_until: i64,
    pub boost_multiplier: u16,
}

// Lock periods e multipliers
// 30 dias = 1.0x
// 90 dias = 1.1x
// 180 dias = 1.25x
// 365 dias = 1.5x
```

---

#### 7. Multi-Property Bundles

Criar "fundos" que agrupam múltiplas propriedades.

**Smart Contract:**
```rust
pub struct PropertyBundle {
    pub name: String,
    pub bundle_mint: Pubkey,
    pub properties: Vec<BundleAllocation>,
    pub total_value_usd: u64,
    pub management_fee_bps: u16,
}

pub struct BundleAllocation {
    pub property_mint: Pubkey,
    pub allocation_percentage: u8,
}
```

**Benefícios:**
- Diversificação automática
- Gestão simplificada
- Menor ticket de entrada

---

#### 8. Integração Bancária (PIX/TED)

Permitir compra de tokens com BRL via PIX.

**Implementação:**
- Integração com processador (Mercado Pago, PagSeguro, Stripe)
- Conta escrow para conversão BRL → SOL → Tokens
- Ordens de compra com pagamento fiat

---

### PRIORIDADE BAIXA (Nice to Have)

#### 9. Mobile App (React Native)

App nativo para iOS/Android.

**Features:**
- Carteira integrada
- Push notifications nativas
- Biometria para transações
- QR code para transferências

---

#### 10. Lending/Collateral

Usar tokens como colateral para empréstimos.

**Smart Contract:**
```rust
pub struct LoanPosition {
    pub borrower: Pubkey,
    pub collateral_mint: Pubkey,
    pub collateral_amount: u64,
    pub loan_amount_usdc: u64,
    pub interest_rate_bps: u16,
    pub ltv_ratio: u8,
    pub liquidation_threshold: u8,
}
```

---

#### 11. Relatórios Regulatórios Automatizados

Geração automática de relatórios para CVM/Receita Federal.

**Features:**
- Exportação para IR (ganhos de capital)
- Relatório de dividendos recebidos
- Histórico de transações formatado
- Integração com contabilidade

---

#### 12. Oracle de Preços Imobiliários

Feed de preços de imóveis similar ao Chainlink.

**Implementação:**
- Parceria com FIPE/ZAP/Imovelweb
- Atualização periódica de valuations
- Índice de preços por região

---

#### 13. Fracionamento de Aluguel (Rental Tokenization)

Além do imóvel, tokenizar o fluxo de aluguel separadamente.

**Conceito:**
- Token de propriedade (equity)
- Token de renda (yield-bearing)
- Investidor pode escolher exposição

---

#### 14. Insurance Pool

Fundo de seguro coletivo para propriedades.

**Smart Contract:**
```rust
pub struct InsurancePool {
    pub total_coverage: u64,
    pub premium_rate_bps: u16,
    pub claims: Vec<InsuranceClaim>,
}
```

---

#### 15. Cross-Chain Bridge

Permitir tokens em outras chains (Ethereum, Polygon).

**Implementação:**
- Wormhole ou LayerZero integration
- Wrapped tokens em EVM chains
- Liquidez cross-chain

---

## Roadmap Sugerido

```
FASE 1 (1-2 meses) - Produção Ready
├── Marketplace P2P / DEX
├── Sistema de notificações
└── Documentos legais on-chain

FASE 2 (2-3 meses) - Diferenciação
├── Governança e votação
├── Atualização de valuation
└── Integração PIX

FASE 3 (3-4 meses) - Expansão
├── Staking com boost
├── Property bundles
└── Mobile app

FASE 4 (4-6 meses) - Advanced
├── Lending/Collateral
├── Insurance pool
└── Cross-chain bridge
```

---

## Recomendação Top 3

As 3 features mais impactantes para implementar primeiro:

### 1. Marketplace Secundário (DEX-style)
> Sem liquidez, investidores hesitam. Um mercado P2P permite saída e atrai mais investimento.

### 2. Integração PIX/Fiat
> Remove a barreira de entrada (comprar SOL primeiro). Crucial para adoção no Brasil.

### 3. Sistema de Notificações
> Engagement e retenção. Investidores precisam saber quando há revenue para clamar.

---

## Arquitetura Atual

### Programas Solana
- **Hub Token Program**: `FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om`
- **Hub Credential Program**: `FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt`

### Serviços
- **API**: `/home/ubuntu/services/solana/services/api` (porta 3003)
- **KYC API**: `/home/ubuntu/services/solana/services/kyc-api` (porta 3001)
- **Indexer**: `/home/ubuntu/services/solana/services/indexer` (porta 9090)
- **Frontend**: `/home/ubuntu/services/solana/real_estate_program/app` (porta 5173)
- **Credential Portal**: `/home/ubuntu/services/solana/credential-id/app`

### Banco de Dados
- **PostgreSQL**: Preferências de usuário, atividades, snapshots de portfolio

---

*Documento gerado em: 2024-12-14*
*Projeto: Hub Token - Real Estate Tokenization Platform*
