# Post 7: Sistema de Dividendos On-Chain - Distribuição Automática

## Contexto para o Gemini

Este post deve explicar como funciona a distribuição de dividendos (receita de aluguel) para holders de tokens de propriedade.

## O Problema da Distribuição Manual

```
Cenário tradicional (fundo imobiliário):

1. Propriedade gera R$ 10.000/mês de aluguel
2. Gestor calcula proporção de cada cotista
3. Gestor processa transferência manual para cada um
4. Cotista precisa confiar no cálculo
5. Processo pode levar dias
6. Erros acontecem, disputas surgem

Problemas:
- Opaco: cotista não vê cálculo
- Lento: dias para receber
- Custoso: taxas bancárias para cada transferência
- Centralizado: depende do gestor
```

## Nossa Solução: Sistema de Epochs

```
Conceito de Epoch:

Uma "epoch" é um período de distribuição de dividendos.
Cada depósito de receita cria uma nova epoch.

Epoch 1: Janeiro (10 SOL depositados)
Epoch 2: Fevereiro (12 SOL depositados)
Epoch 3: Março (8 SOL depositados)
...

Cada holder pode fazer claim de cada epoch individualmente.
```

## Estrutura On-Chain

```rust
#[account]
pub struct RevenueEpoch {
    pub property_mint: Pubkey,       // Qual propriedade
    pub epoch_number: u64,           // Número sequencial
    pub total_revenue: u64,          // Total depositado (lamports)
    pub eligible_supply: u64,        // Supply no momento do depósito
    pub deposited_at: i64,           // Timestamp do depósito
    pub is_finalized: bool,          // Pode fazer claim
    pub total_claimed: u64,          // Já resgatado
    pub bump: u8,
}

// PDA: ["revenue_epoch", property_state, epoch_number]
```

## Fluxo de Distribuição

```
            Admin                           Blockchain
              │                                  │
              │  1. deposit_revenue(epoch, 10 SOL)
              │ ─────────────────────────────────>
              │                                  │
              │                         ┌────────┴────────┐
              │                         │ Cria RevenueEpoch│
              │                         │ epoch_number: 5  │
              │                         │ total: 10 SOL    │
              │                         │ supply: 100,000  │
              │                         └────────┬────────┘
              │                                  │
              │                                  │
           Holder A                              │
              │                                  │
              │  2. claim(epoch_number: 5)       │
              │ ─────────────────────────────────>
              │                                  │
              │                         ┌────────┴────────┐
              │                         │ Calcula:        │
              │                         │ holder: 1,000   │
              │                         │ supply: 100,000 │
              │                         │ = 1% × 10 SOL   │
              │                         │ = 0.1 SOL       │
              │                         └────────┬────────┘
              │                                  │
              │ <────────────────────────────────┤
              │  0.1 SOL transferido              │
```

## Implementação do Depósito

```rust
pub fn deposit_revenue(
    ctx: Context<DepositRevenue>,
    epoch_number: u64,
    amount: u64,
) -> Result<()> {
    let property = &ctx.accounts.property_state;
    let epoch = &mut ctx.accounts.revenue_epoch;

    // Inicializa epoch
    epoch.property_mint = property.mint;
    epoch.epoch_number = epoch_number;
    epoch.total_revenue = amount;

    // CRÍTICO: Snapshot do supply no momento do depósito
    // Isso garante que quem comprar tokens DEPOIS
    // não tem direito a dividendos ANTES
    epoch.eligible_supply = property.circulating_supply;

    epoch.deposited_at = Clock::get()?.unix_timestamp;
    epoch.is_finalized = true;
    epoch.total_claimed = 0;

    // Transfere SOL do admin para o vault
    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.admin.key(),
        &ctx.accounts.revenue_vault.key(),
        amount,
    );

    anchor_lang::solana_program::program::invoke(
        &transfer_ix,
        &[
            ctx.accounts.admin.to_account_info(),
            ctx.accounts.revenue_vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    emit!(RevenueDeposited {
        property_mint: property.mint,
        epoch_number,
        amount,
        eligible_supply: epoch.eligible_supply,
        timestamp: epoch.deposited_at,
    });

    Ok(())
}
```

## Implementação do Claim

```rust
pub fn claim_revenue(
    ctx: Context<ClaimRevenue>,
    epoch_number: u64,
) -> Result<()> {
    let epoch = &mut ctx.accounts.revenue_epoch;
    let holder_balance = ctx.accounts.holder_token_account.amount;

    require!(epoch.is_finalized, RwaError::EpochNotFinalized);
    require!(holder_balance > 0, RwaError::NoTokenHolders);

    // Cálculo do dividendo
    // dividend = (holder_balance / eligible_supply) * total_revenue
    let dividend = (holder_balance as u128)
        .checked_mul(epoch.total_revenue as u128)
        .ok_or(RwaError::MathOverflow)?
        .checked_div(epoch.eligible_supply as u128)
        .ok_or(RwaError::MathOverflow)? as u64;

    require!(dividend > 0, RwaError::ClaimTooSmall);

    // Transfere do vault para o holder
    **ctx.accounts.revenue_vault.try_borrow_mut_lamports()? -= dividend;
    **ctx.accounts.holder.try_borrow_mut_lamports()? += dividend;

    epoch.total_claimed += dividend;

    emit!(RevenueClaimed {
        property_mint: epoch.property_mint,
        epoch_number,
        holder: ctx.accounts.holder.key(),
        amount: dividend,
        timestamp: Clock::get()?.unix_timestamp,
    });

    Ok(())
}
```

## Exemplo Prático

```
Propriedade: "Edifício Aurora"
Token: AURORA
Supply: 1.000.000 tokens

Investidor A: 50.000 tokens (5%)
Investidor B: 200.000 tokens (20%)
Investidor C: 750.000 tokens (75%)

Janeiro: Aluguel = 10 SOL
├─ A pode claim: 0.5 SOL (5%)
├─ B pode claim: 2.0 SOL (20%)
└─ C pode claim: 7.5 SOL (75%)

Fevereiro: Aluguel = 12 SOL
├─ A pode claim: 0.6 SOL
├─ B pode claim: 2.4 SOL
└─ C pode claim: 9.0 SOL

Total A (2 meses): 1.1 SOL
Total B (2 meses): 4.4 SOL
Total C (2 meses): 16.5 SOL
```

## Por que Epochs?

### 1. Justiça Temporal
```
Se João compra tokens em 15/Janeiro:
- Não tem direito ao dividendo de Janeiro (epoch já fechada)
- Tem direito a partir de Fevereiro

Snapshot do supply no momento do depósito garante isso.
```

### 2. Claim Assíncrono
```
Holders fazem claim quando quiserem.
Não precisa estar online no momento da distribuição.
Pode acumular vários epochs e fazer claim de uma vez.
```

### 3. Gas Efficiency
```
Admin deposita uma vez (1 tx).
Cada holder faz claim individual.
Não precisa loop de 1000 transferências.
```

## Ângulo do Post

Mostrar que dividendos on-chain são mais justos e transparentes. O código é a garantia, não a confiança no gestor.

## Hashtags Sugeridas

#DividendDistribution #SmartContracts #Solana #RealEstateTokenization #PassiveIncome #DeFi #Transparency #OnChainFinance
