# Fluxos de Negócio

## Visão Geral

Esta seção documenta os principais fluxos de negócio do Hub Token, desde o onboarding do usuário até a distribuição de dividendos.

## Fluxos Principais

```mermaid
graph TB
    subgraph "Onboarding"
        A[Conectar Wallet]
        B[Verificar KYC]
    end

    subgraph "Investimento"
        C[Selecionar Propriedade]
        D[Investir SOL]
        E[Receber Tokens]
    end

    subgraph "Operações"
        F[Transferir Tokens]
        G[Receber Dividendos]
        H[Vender no Secundário]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    F --> H
```

## Lista de Fluxos

| Fluxo | Descrição | Atores |
|-------|-----------|--------|
| [Investimento](./investimento.md) | Como um usuário investe em uma propriedade | Investidor |
| [KYC](./kyc.md) | Processo de verificação de identidade | Investidor, Admin |
| [Dividendos](./dividendos.md) | Distribuição e resgate de rendimentos | Proprietário, Investidor |
| [Transferência](./transferencia.md) | Venda/compra no mercado secundário | Investidores |

---

## Diagrama de Jornada do Usuário

```mermaid
journey
    title Jornada do Investidor Hub Token
    section Descoberta
        Acessar plataforma: 5: Visitante
        Explorar propriedades: 4: Visitante
        Ver detalhes: 4: Visitante
    section Onboarding
        Conectar wallet: 3: Investidor
        Iniciar KYC: 3: Investidor
        Enviar documentos: 2: Investidor
        Aguardar aprovação: 2: Investidor
    section Investimento
        Escolher propriedade: 5: Investidor Verificado
        Definir valor: 4: Investidor Verificado
        Confirmar transação: 4: Investidor Verificado
        Receber tokens: 5: Investidor Verificado
    section Operação
        Acompanhar valorização: 5: Holder
        Receber dividendos: 5: Holder
        Vender tokens: 4: Holder
```

---

## Estados do Usuário

```mermaid
stateDiagram-v2
    [*] --> Visitante: Acessa plataforma

    Visitante --> WalletConectada: Conecta wallet

    WalletConectada --> KycPendente: Inicia KYC
    WalletConectada --> Visitante: Desconecta

    KycPendente --> KycEmAnalise: Submete documentos
    KycPendente --> WalletConectada: Cancela

    KycEmAnalise --> KycAprovado: Aprovado
    KycEmAnalise --> KycRejeitado: Rejeitado

    KycRejeitado --> KycPendente: Tenta novamente

    KycAprovado --> Investidor: Pode investir
    Investidor --> Holder: Possui tokens

    Holder --> Holder: Recebe dividendos
    Holder --> Holder: Transfere tokens
    Holder --> Investidor: Vende tudo
```

---

## Requisitos por Fluxo

### Investimento

| Requisito | Obrigatório | Descrição |
|-----------|-------------|-----------|
| Wallet conectada | Sim | Phantom, Solflare, etc. |
| KYC aprovado | Sim | Credencial Hub válida |
| SOL suficiente | Sim | Para investimento + gas |
| Propriedade ativa | Sim | Status = active |

### Transferência

| Requisito | Obrigatório | Descrição |
|-----------|-------------|-----------|
| Wallet conectada | Sim | Ambas as partes |
| KYC do destinatário | Sim | Transfer Hook verifica |
| Saldo de tokens | Sim | >= quantidade |
| SOL para gas | Sim | ~0.00001 SOL |

### Dividendos

| Requisito | Obrigatório | Descrição |
|-----------|-------------|-----------|
| Ser holder | Sim | Possuir tokens |
| Época depositada | Sim | Revenue depositado |
| Não ter resgatado | Sim | Primeira vez na época |

---

## Próximos Documentos

- [Fluxo de Investimento](./investimento.md)
- [Fluxo de KYC](./kyc.md)
- [Distribuição de Dividendos](./dividendos.md)
- [Transferência de Tokens](./transferencia.md)

---

[← Voltar](../smart-contracts/credential-program.md) | [Próximo: Investimento →](./investimento.md)
