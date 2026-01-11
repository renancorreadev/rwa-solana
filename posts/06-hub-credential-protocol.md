# Post 6: Hub Credential Protocol - KYC On-Chain Próprio

## Contexto para o Gemini

Este post deve explicar a decisão de criar um protocolo próprio de credenciais ao invés de usar soluções terceiras como Civic Pass.

## O Cenário Inicial

```
Opções no mercado para KYC on-chain:

1. Civic Pass
   - Prós: Já estabelecido, fácil integração
   - Contras: Dependência externa, taxas por verificação,
              tipos de credencial fixos, dados off-chain

2. Worldcoin
   - Prós: Proof of personhood único
   - Contras: Hardware específico (Orb), privacidade questionável

3. Construir próprio
   - Prós: Controle total, customizável, sem taxas externas
   - Contras: Tempo de desenvolvimento, manutenção
```

## Por que Construímos o Hub Credential Protocol

### 1. Tipos de Credencial Customizados

```rust
pub enum CredentialType {
    KycBasic = 0,              // Nome + ID verificado
    KycFull = 1,               // + Endereço + Fonte de recursos
    AccreditedInvestor = 2,    // Net worth > threshold (SEC)
    QualifiedPurchaser = 3,    // Higher threshold
    BrazilianCpf = 4,          // CPF verificado (Brasil)
    BrazilianCnpj = 5,         // CNPJ verificado (empresas)
}

// Civic Pass não oferece BrazilianCpf/Cnpj
// Crucial para compliance regulatório no Brasil
```

### 2. Modelo de Emissores Descentralizado

```
Hub Credential permite múltiplos emissores:

┌─────────────────────────────────────────────────────┐
│              Credential Network (PDA)                │
│                    Admin: Kota                       │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Issuer 1    │ │   Issuer 2    │ │   Issuer 3    │
│   (Kota)      │ │  (Parceiro)   │ │   (Banco)     │
│               │ │               │ │               │
│ ✓ KycBasic    │ │ ✓ KycFull     │ │ ✓ Accredited  │
│ ✓ BrazilCpf   │ │ ✓ BrazilCnpj  │ │ ✓ Qualified   │
└───────────────┘ └───────────────┘ └───────────────┘

Cada emissor pode emitir tipos específicos de credencial.
Banco pode emitir Accredited Investor.
Fintech pode emitir KYC básico.
```

### 3. Dados On-Chain vs Off-Chain

```
Civic Pass:
- Credencial: on-chain (gateway token)
- Dados do usuário: off-chain (servers Civic)
- Se Civic sair do ar → verificação falha

Hub Credential:
- Credencial: on-chain (PDA)
- Metadados: IPFS (descentralizado)
- Hash dos dados: on-chain
- Se nosso backend cair → verificação continua funcionando
```

## Estrutura da Credencial On-Chain

```rust
#[account]
pub struct UserCredential {
    pub holder: Pubkey,                    // Wallet do usuário
    pub issuer: Pubkey,                    // Quem emitiu
    pub credential_type: CredentialType,   // Tipo da credencial
    pub status: CredentialStatus,          // Active/Expired/Revoked
    pub issued_at: i64,                    // Quando foi emitida
    pub expires_at: i64,                   // Quando expira (0 = nunca)
    pub last_verified_at: i64,             // Última renovação
    pub metadata_uri: String,              // IPFS hash (dados criptografados)
    pub revocation_reason: String,         // Motivo se revogada
    pub version: u8,                       // Versão do protocolo
    pub bump: u8,                          // PDA bump
}

// PDA derivado: ["credential", holder_wallet]
// Único por wallet
```

## Instruções do Programa

```rust
// 6 instruções core

1. initialize_network(name, fee)
   // Admin cria a rede uma vez
   // Define taxa de emissão (pode ser 0)

2. register_issuer(name, uri)
   // Admin autoriza novos emissores
   // Cada emissor tem escopo definido

3. issue_credential(type, expiry, metadata_uri)
   // Emissor emite credencial após verificação off-chain
   // Metadata criptografada no IPFS

4. verify_credential()
   // Verificação on-chain para Transfer Hook
   // Retorna se credencial é válida

5. revoke_credential(reason)
   // Emissor ou Admin pode revogar
   // Motivo registrado on-chain (audit trail)

6. refresh_credential(new_expiry)
   // Renova sem re-verificação completa
   // Para credenciais expirando
```

## Integração com Transfer Hook

```rust
// No Kota Program - transfer_hook_execute

pub fn transfer_hook_execute(ctx: Context<TransferHook>) -> Result<()> {
    // Credencial já está na lista de extra accounts
    let credential_data = ctx.accounts.hub_credential.data.borrow();

    // Verifica programa owner
    require!(
        ctx.accounts.hub_credential.owner == &HUB_CREDENTIAL_PROGRAM_ID,
        RwaError::InvalidCredential
    );

    // Parse e valida
    let status = credential_data[72]; // Offset do status
    require!(status == 0, RwaError::CredentialNotActive);

    let expires_at = i64::from_le_bytes(credential_data[81..89].try_into()?);
    let now = Clock::get()?.unix_timestamp;
    require!(expires_at == 0 || now < expires_at, RwaError::CredentialExpired);

    Ok(())
}
```

## Fluxo de Emissão

```
┌──────────┐     1. Submete docs     ┌──────────┐
│  Usuário │ ──────────────────────> │  KYC API │
└──────────┘                         └────┬─────┘
                                          │
                                    2. Verifica
                                          │
                                          ▼
                                    ┌──────────┐
                                    │   IPFS   │
                                    │ (Pinata) │
                                    └────┬─────┘
                                          │
                                    3. Armazena metadata
                                          │
                                          ▼
┌──────────────────────────────────────────────────────┐
│                     Solana                            │
│  ┌────────────────┐        ┌───────────────────┐     │
│  │    Issuer      │ ────>  │  UserCredential   │     │
│  │   Keypair      │  4.    │      PDA          │     │
│  │                │ issue  │                   │     │
│  └────────────────┘        └───────────────────┘     │
└──────────────────────────────────────────────────────┘
```

## Vantagens Competitivas

| Aspecto | Civic Pass | Hub Credential |
|---------|------------|----------------|
| Tipos de Credencial | Fixos | Customizáveis |
| Credenciais Regionais | Não | Sim (CPF, CNPJ) |
| Custo por Verificação | Pago | Sem taxa externa |
| Dados do Usuário | Servers Civic | IPFS descentralizado |
| Múltiplos Emissores | Não | Sim |
| Dependência Externa | Alta | Nenhuma |
| Integração Transfer Hook | Manual | Nativa |

## Ângulo do Post

Mostrar que às vezes construir é melhor que comprar. Não é "reinventar a roda" - é resolver um problema específico que soluções genéricas não resolvem.

## Hashtags Sugeridas

#KYC #Compliance #Blockchain #Solana #IdentityVerification #RegTech #SelfSovereignIdentity #SmartContracts
