# Post 8: Sistema de Escrow com Milestones - Protegendo Investidores

## Contexto para o Gemini

Este post deve explicar como o sistema de escrow com liberação por milestones protege investidores de golpes e abandono de projetos.

## O Problema: Rug Pulls em Tokenização

```
Cenário de golpe típico:

1. "Empresa" cria token de propriedade
2. Promete 10% de yield ao ano
3. Investidores compram R$ 1 milhão em tokens
4. Empresa recebe R$ 1 milhão imediatamente
5. Empresa desaparece
6. Investidores ficam com tokens sem valor

Problema:
Vendedor recebe 100% do dinheiro ANTES de entregar qualquer valor.
Não há mecanismo de proteção.
```

## Nossa Solução: Escrow com Milestones

```
Distribuição de cada investimento:

┌─────────────────────────────────────────────────────┐
│            Investimento: 100 SOL                     │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Platform Fee │ │  Reserve Fund │ │  Seller Escrow│
│    2.5%       │ │     7.5%      │ │     90%       │
│   (2.5 SOL)   │ │   (7.5 SOL)   │ │   (90 SOL)    │
│               │ │               │ │               │
│  IMEDIATO     │ │   BLOQUEADO   │ │  MILESTONES   │
│  → Treasury   │ │   → Reserve   │ │  → Escrow     │
└───────────────┘ └───────────────┘ └───────────────┘
```

## Sistema de Milestones

```
Liberação progressiva baseada em % de tokens vendidos:

┌─────────────────────────────────────────────────────┐
│                    ESCROW VAULT                      │
│                     90 SOL                           │
└─────────────────────────────────────────────────────┘

Milestone 1: 50% vendido
├─ Libera: 50% do escrow (45 SOL)
├─ Vendedor provou: demanda real existe
└─ Investidores: metade do supply foi absorvido

Milestone 2: 75% vendido
├─ Libera: +30% do escrow (27 SOL)
├─ Total liberado: 80% (72 SOL)
└─ Propriedade praticamente "funded"

Milestone 3: 100% vendido
├─ Libera: +20% final (18 SOL)
├─ Total liberado: 100% (90 SOL)
└─ Projeto completamente financiado
```

## Estrutura On-Chain

```rust
#[account]
pub struct InvestmentVault {
    pub property_mint: Pubkey,           // Qual propriedade
    pub seller: Pubkey,                   // Quem recebe
    pub total_invested: u64,              // Total já investido
    pub total_platform_fees: u64,        // Fees coletados
    pub reserve_balance: u64,            // Fundo de reserva
    pub escrow_balance: u64,             // Pendente de liberação
    pub total_released_to_seller: u64,   // Já liberado
    pub current_milestone: u8,           // 0, 1, 2, ou 3
    pub is_initialized: bool,
    pub bump: u8,
}

// PDA: ["investment_vault", property_mint]
```

## Implementação do Investimento

```rust
pub fn invest_in_property(
    ctx: Context<InvestInProperty>,
    sol_amount: u64,
) -> Result<()> {
    let property = &ctx.accounts.property_state;
    let vault = &mut ctx.accounts.investment_vault;

    // Calcula distribuição
    let platform_fee = sol_amount
        .checked_mul(PLATFORM_FEE_BPS as u64)
        .ok_or(RwaError::MathOverflow)?
        .checked_div(BPS_DIVISOR as u64)
        .ok_or(RwaError::MathOverflow)?;

    let reserve_amount = sol_amount
        .checked_mul(RESERVE_FEE_BPS as u64)
        .ok_or(RwaError::MathOverflow)?
        .checked_div(BPS_DIVISOR as u64)
        .ok_or(RwaError::MathOverflow)?;

    let escrow_amount = sol_amount
        .checked_mul(SELLER_ESCROW_BPS as u64)
        .ok_or(RwaError::MathOverflow)?
        .checked_div(BPS_DIVISOR as u64)
        .ok_or(RwaError::MathOverflow)?;

    // 1. Platform fee → Treasury (IMEDIATO)
    transfer_sol(
        &ctx.accounts.investor,
        &ctx.accounts.platform_treasury,
        platform_fee,
    )?;

    // 2. Reserve → Reserve Vault (BLOQUEADO)
    transfer_sol(
        &ctx.accounts.investor,
        &ctx.accounts.reserve_vault,
        reserve_amount,
    )?;

    // 3. Escrow → Escrow Vault (MILESTONES)
    transfer_sol(
        &ctx.accounts.investor,
        &ctx.accounts.escrow_vault,
        escrow_amount,
    )?;

    // Atualiza vault
    vault.total_invested += sol_amount;
    vault.total_platform_fees += platform_fee;
    vault.reserve_balance += reserve_amount;
    vault.escrow_balance += escrow_amount;

    // Verifica se atingiu novo milestone
    check_and_process_milestone(ctx, vault)?;

    Ok(())
}
```

## Lógica de Milestones

```rust
fn check_and_process_milestone(
    ctx: Context<InvestInProperty>,
    vault: &mut InvestmentVault,
) -> Result<()> {
    let property = &ctx.accounts.property_state;

    // Calcula % de circulação
    let circulation_pct = property.circulating_supply
        .checked_mul(10000)
        .ok_or(RwaError::MathOverflow)?
        .checked_div(property.total_supply)
        .ok_or(RwaError::MathOverflow)? as u16;

    let new_milestone = match circulation_pct {
        pct if pct >= 10000 => 3,  // 100%
        pct if pct >= 7500 => 2,   // 75%
        pct if pct >= 5000 => 1,   // 50%
        _ => 0,
    };

    if new_milestone > vault.current_milestone {
        // Calcula quanto liberar
        let release_pct = match new_milestone {
            1 => 5000,  // 50% do escrow
            2 => 3000,  // +30% do escrow (80% total)
            3 => 2000,  // +20% do escrow (100% total)
            _ => 0,
        };

        let release_amount = vault.escrow_balance
            .checked_mul(release_pct)
            .ok_or(RwaError::MathOverflow)?
            .checked_div(10000)
            .ok_or(RwaError::MathOverflow)?;

        // Transfere para vendedor
        **ctx.accounts.escrow_vault.try_borrow_mut_lamports()? -= release_amount;
        **ctx.accounts.seller.try_borrow_mut_lamports()? += release_amount;

        vault.escrow_balance -= release_amount;
        vault.total_released_to_seller += release_amount;
        vault.current_milestone = new_milestone;

        emit!(MilestoneReached {
            property_mint: property.mint,
            milestone: new_milestone,
            circulation_percent: circulation_pct,
            amount_released: release_amount,
            timestamp: Clock::get()?.unix_timestamp,
        });
    }

    Ok(())
}
```

## Exemplo Prático

```
Propriedade: "Torre Horizonte"
Total Supply: 1.000.000 tokens
Preço por token: 1 SOL

Meta: 1.000.000 SOL

Cenário de venda progressiva:

Mês 1: 300.000 tokens vendidos (30%)
├─ Investido: 300.000 SOL
├─ Platform Fee: 7.500 SOL (liberado)
├─ Reserve: 22.500 SOL (bloqueado)
├─ Escrow: 270.000 SOL (bloqueado)
├─ Milestone: 0 (não atingiu 50%)
└─ Vendedor recebeu: 0 SOL

Mês 2: +200.000 tokens (total: 500.000 = 50%)
├─ Investido acumulado: 500.000 SOL
├─ Escrow acumulado: 450.000 SOL
├─ MILESTONE 1 ATINGIDO!
├─ Liberação: 225.000 SOL (50% do escrow)
└─ Vendedor recebeu total: 225.000 SOL

Mês 3: +250.000 tokens (total: 750.000 = 75%)
├─ MILESTONE 2 ATINGIDO!
├─ Escrow restante: 225.000 + 225.000 novos = 450.000 SOL
├─ Liberação: 135.000 SOL (30% do escrow)
└─ Vendedor recebeu total: 360.000 SOL

Mês 4: +250.000 tokens (total: 1.000.000 = 100%)
├─ MILESTONE 3 ATINGIDO!
├─ Liberação: Escrow restante (90.000 SOL)
└─ Vendedor recebeu total: 450.000 SOL
                           ↓
                    Correto! 90% de 500.000 = 450.000 SOL
```

## Proteção ao Investidor

```
E se vendedor abandona em 40%?

Cenário:
- 400.000 tokens vendidos
- Vendedor desiste do projeto
- Nenhum milestone foi atingido

Resultado:
- Escrow: 360.000 SOL permanecem bloqueados
- Reserve: 30.000 SOL para emergências
- Investidores podem votar para:
  a) Continuar projeto com novo gestor
  b) Liquidar e distribuir proporcionalmente

Vendedor NÃO consegue fugir com o dinheiro.
```

## Ângulo do Post

Mostrar que tokenização bem feita inclui proteção ao investidor. Não é só tecnologia - é alinhamento de incentivos.

## Hashtags Sugeridas

#InvestorProtection #SmartContracts #Escrow #RealEstateTokenization #TrustlessFinance #Solana #RWA #FinancialSecurity
