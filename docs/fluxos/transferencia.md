# Transferência de Tokens

## Visão Geral

A transferência de tokens permite que investidores vendam suas participações para outros investidores no mercado secundário. O diferencial do Hub Token é que **toda transferência passa por verificação KYC automática** através do Transfer Hook.

## Conceito Chave: Transfer Hook

O **Transfer Hook** é uma extensão do padrão Token-2022 que intercepta todas as transferências e executa lógica customizada.

```mermaid
graph LR
    A[Investidor A] -->|transfer| T22[Token-2022]
    T22 -->|hook| HUB[Hub Token Program]
    HUB -->|verify| CRED[Credential Program]
    CRED -->|valid| HUB
    HUB -->|ok| T22
    T22 -->|complete| B[Investidor B]

    style HUB fill:#ff6b6b
    style CRED fill:#14f195
```

---

## Fluxo de Transferência

```mermaid
sequenceDiagram
    participant A as Alice (Vendedora)
    participant FE as Frontend
    participant W as Wallet
    participant T22 as Token-2022
    participant HOOK as Transfer Hook
    participant CRED as Credential
    participant B as Bob (Comprador)

    Note over A,FE: 1. Iniciar Transferência
    A->>FE: Acessar "Transferir"
    A->>FE: Informar destinatário + quantidade
    Note over FE: Destino: Bob (Pubkey)
    Note over FE: Quantidade: 1.000 TORRE

    Note over FE,W: 2. Preparar Transação
    FE->>FE: Criar instrução transfer
    FE->>W: Solicitar assinatura
    W->>A: Popup de confirmação
    A->>W: Aprova

    Note over W,T22: 3. Executar Transfer
    W->>T22: Enviar transação
    T22->>T22: Verificar saldo Alice

    Note over T22,HOOK: 4. Transfer Hook
    T22->>HOOK: transfer_hook_execute()
    HOOK->>HOOK: Extrair wallet destino (Bob)

    Note over HOOK,CRED: 5. Verificar KYC
    HOOK->>CRED: Carregar HubCredential do Bob

    alt Bob tem KYC válido
        CRED-->>HOOK: Credencial Active, não expirada
        HOOK-->>T22: OK, prosseguir
        T22->>T22: Debitar Alice
        T22->>T22: Creditar Bob
        T22-->>W: Sucesso
        W-->>FE: TX confirmada
        FE-->>A: ✅ Transferência concluída!
    else Bob sem KYC / expirado / revogado
        CRED-->>HOOK: Credencial inválida
        HOOK-->>T22: ERRO: KycVerificationRequired
        T22-->>W: Transação falhou
        W-->>FE: Erro
        FE-->>A: ❌ Destinatário sem KYC válido
    end
```

---

## Verificações do Transfer Hook

O hook verifica os seguintes pontos da credencial do **destinatário**:

```rust
fn verify_destination_kyc(credential: &HubCredential, destination: &Pubkey) -> Result<()> {
    // 1. Credencial pertence ao destinatário
    require!(
        credential.user == *destination,
        HubTokenError::InvalidCredential
    );

    // 2. Status é Active
    require!(
        credential.status == CredentialStatus::Active,
        HubTokenError::CredentialRevoked
    );

    // 3. Não está expirada
    let now = Clock::get()?.unix_timestamp;
    require!(
        credential.expires_at > now,
        HubTokenError::CredentialExpired
    );

    Ok(())
}
```

### Motivos de Bloqueio

| Status | Código de Erro | Descrição |
|--------|----------------|-----------|
| Sem credencial | `KycVerificationRequired` | Destinatário não fez KYC |
| Credencial expirada | `CredentialExpired` | KYC venceu |
| Credencial revogada | `CredentialRevoked` | Admin revogou |
| Credencial suspensa | `CredentialSuspended` | Suspensão temporária |

---

## Por que Transfer Hook?

### Sem Transfer Hook (vulnerável)

```mermaid
sequenceDiagram
    participant A as Alice (Verificada)
    participant B as Bob (Sem KYC)

    A->>B: Transfere 1000 tokens
    Note over B: Bob recebe tokens
    Note over B: Bob pode vender OTC
    Note over B: Sem rastreabilidade!
```

### Com Transfer Hook (seguro)

```mermaid
sequenceDiagram
    participant A as Alice (Verificada)
    participant HOOK as Transfer Hook
    participant B as Bob (Sem KYC)

    A->>HOOK: Tenta transferir
    HOOK->>HOOK: Verificar KYC do Bob
    HOOK-->>A: ❌ BLOQUEADO
    Note over A: Tokens permanecem com Alice
    Note over B: Bob precisa fazer KYC primeiro
```

---

## Tipos de Transferência

### 1. Venda P2P (Peer-to-Peer)

Venda direta entre dois investidores.

```
Alice (vendedora) ──► Bob (comprador)
        tokens    ◄──    SOL (off-chain)
```

**Importante:** O pagamento em SOL é feito fora da plataforma. O Hub Token apenas facilita a transferência de tokens.

### 2. Transferência entre Wallets Próprias

Mover tokens entre carteiras do mesmo dono.

```
Wallet Principal ──► Wallet Hardware
                         (Ledger)
```

**Requisito:** Ambas as wallets devem ter KYC aprovado.

### 3. Doação/Presente

Transferir tokens sem contrapartida financeira.

```
Pai ──► Filho
   tokens
```

---

## Interface do Usuário

### Modal de Transferência

```
┌─────────────────────────────────────────────────────────────┐
│                   TRANSFERIR TOKENS                         │
│                  Edifício Torre Norte                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Seu saldo: 10.000 TORRE                                   │
│                                                             │
│  Endereço do destinatário                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ⚠️  O destinatário precisa ter KYC aprovado               │
│                                                             │
│  Quantidade                                                 │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 1.000                                          TORRE  │ │
│  └───────────────────────────────────────────────────────┘ │
│  [25%] [50%] [75%] [MAX]                                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Resumo                                                     │
│  Quantidade:          1.000 TORRE                          │
│  Valor estimado:      ~6.000 USD                           │
│  Taxa de rede:        ~0.00001 SOL                         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ⚡ A transferência é instantânea e irreversível           │
│                                                             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │      CANCELAR       │  │        TRANSFERIR            │ │
│  └─────────────────────┘  └──────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Erro de KYC

```
┌─────────────────────────────────────────────────────────────┐
│                    ❌ ERRO NA TRANSFERÊNCIA                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  O destinatário não possui verificação KYC válida.         │
│                                                             │
│  Possíveis motivos:                                        │
│  • KYC não realizado                                       │
│  • KYC expirado                                            │
│  • KYC revogado/suspenso                                   │
│                                                             │
│  O destinatário precisa completar ou renovar o KYC         │
│  antes de receber tokens.                                  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                      ENTENDI                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Código Frontend

### Preparar Transferência

```typescript
const prepareTransfer = async (
  fromWallet: PublicKey,
  toWallet: PublicKey,
  mint: PublicKey,
  amount: number
) => {
  // Derivar ATAs
  const fromAta = getAssociatedTokenAddressSync(
    mint,
    fromWallet,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const toAta = getAssociatedTokenAddressSync(
    mint,
    toWallet,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  // Verificar se ATA destino existe
  const toAtaInfo = await connection.getAccountInfo(toAta);

  const instructions: TransactionInstruction[] = [];

  // Criar ATA se não existir
  if (!toAtaInfo) {
    instructions.push(
      createAssociatedTokenAccountInstruction(
        fromWallet,  // payer
        toAta,       // ata
        toWallet,    // owner
        mint,        // mint
        TOKEN_2022_PROGRAM_ID
      )
    );
  }

  // Instrução de transfer com hook
  instructions.push(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      fromWallet,
      amount,
      6,  // decimals
      [],
      TOKEN_2022_PROGRAM_ID
    )
  );

  return new Transaction().add(...instructions);
};
```

### Verificar KYC Antes

```typescript
const checkDestinationKyc = async (wallet: string): Promise<boolean> => {
  try {
    const response = await kycApi.verify(wallet);
    return response.isVerified && !response.isExpired;
  } catch {
    return false;
  }
};

// Uso
const handleTransfer = async () => {
  const hasKyc = await checkDestinationKyc(destinationWallet);

  if (!hasKyc) {
    showError('Destinatário não possui KYC válido');
    return;
  }

  // Prosseguir com transferência...
};
```

---

## Eventos Emitidos

```rust
#[event]
pub struct TransferKycVerified {
    pub mint: Pubkey,
    pub from: Pubkey,
    pub to: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}
```

---

## Considerações Importantes

### 1. Irreversibilidade

Transferências são **irreversíveis**. Uma vez confirmada na blockchain, não há como desfazer.

### 2. Propriedade da Credencial

A credencial KYC é vinculada à **wallet**, não à pessoa. Se o usuário perder acesso à wallet, precisará fazer KYC novamente com uma nova wallet.

### 3. Custo de Gas

Transferências custam aproximadamente 0.00001 SOL em taxas de rede.

### 4. Criação de ATA

Se o destinatário nunca recebeu tokens daquela propriedade, será necessário criar uma ATA (Associated Token Account), o que tem um custo adicional (~0.002 SOL).

### 5. Compliance

Todas as transferências ficam registradas na blockchain, permitindo auditoria completa da cadeia de custódia dos tokens.

---

## FAQ

**P: Posso transferir para qualquer pessoa?**
R: Não. O destinatário precisa ter KYC válido na plataforma.

**P: E se eu quiser vender para alguém sem KYC?**
R: A pessoa precisará completar o KYC primeiro. Não há como contornar.

**P: A transferência é instantânea?**
R: Sim, leva cerca de 400ms para confirmar na Solana.

**P: Quanto custa uma transferência?**
R: Aproximadamente 0.00001-0.002 SOL dependendo se precisa criar ATA.

---

[← Voltar](./dividendos.md) | [Próximo: Infraestrutura →](../infraestrutura/README.md)
