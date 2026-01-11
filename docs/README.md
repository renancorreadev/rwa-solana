# Hub Token - Plataforma de Tokenização de Imóveis

## Documentação Técnica Completa

**Versão:** 1.0
**Rede:** Solana (Devnet/Mainnet)
**Última Atualização:** Dezembro 2025

---

## Sobre Este Projeto

O **Hub Token** é uma plataforma completa de **tokenização de ativos imobiliários (RWA - Real World Assets)** construída na blockchain Solana. A plataforma permite que investidores comprem frações de imóveis através de tokens, recebam dividendos proporcionais à sua participação e negociem seus tokens no mercado secundário com total compliance regulatório.

---

## Índice da Documentação

### 1. Visão Geral
- [Introdução e Propósito](./01-visao-geral/README.md)
- [Problema e Solução](./01-visao-geral/problema-solucao.md)
- [Stack Tecnológico](./01-visao-geral/stack-tecnologico.md)

### 2. Arquitetura do Sistema
- [Visão Geral da Arquitetura](./arquitetura/README.md)
- [Diagrama de Componentes](./arquitetura/componentes.md)
- [Comunicação entre Serviços](./arquitetura/comunicacao.md)
- [Banco de Dados](./arquitetura/banco-dados.md)

### 3. Smart Contracts (Programas Solana)
- [Visão Geral dos Contratos](./smart-contracts/README.md)
- [Hub Token Program](./smart-contracts/hub-token-program.md)
- [Credential Program (KYC)](./smart-contracts/credential-program.md)
- [Estruturas de Dados](./smart-contracts/estruturas-dados.md)
- [Instruções e Funções](./smart-contracts/instrucoes.md)

### 4. Serviços Backend
- [Visão Geral dos Serviços](./backend/README.md)
- [API Principal](./backend/api-principal.md)
- [API de KYC](./backend/api-kyc.md)
- [Indexador Blockchain](./backend/indexador.md)

### 5. Frontend React
- [Visão Geral do Frontend](./frontend/README.md)
- [Estrutura de Componentes](./frontend/componentes.md)
- [Gerenciamento de Estado](./frontend/estado.md)
- [Integração com Wallet](./frontend/wallet.md)

### 6. Fluxos de Negócio
- [Visão Geral dos Fluxos](./fluxos/README.md)
- [Fluxo de Investimento](./fluxos/investimento.md)
- [Fluxo de KYC](./fluxos/kyc.md)
- [Distribuição de Dividendos](./fluxos/dividendos.md)
- [Transferência de Tokens](./fluxos/transferencia.md)

### 7. Infraestrutura
- [Visão Geral da Infraestrutura](./infraestrutura/README.md)
- [Docker e Containers](./infraestrutura/docker.md)
- [Variáveis de Ambiente](./infraestrutura/variaveis-ambiente.md)
- [Deploy e CI/CD](./infraestrutura/deploy.md)

### 8. Referência de APIs
- [Visão Geral das APIs](./api/README.md)
- [Endpoints da API Principal](./api/endpoints-api.md)
- [Endpoints da API KYC](./api/endpoints-kyc.md)
- [Endpoints do Indexador](./api/endpoints-indexador.md)

### 9. Guias
- [Como Rodar Localmente](./guias/rodar-local.md)
- [Como Fazer Deploy](./guias/deploy.md)
- [Troubleshooting](./guias/troubleshooting.md)

---

## Acesso Rápido

### IDs dos Programas Solana

| Programa | Program ID |
|----------|------------|
| Hub Token Program | `FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om` |
| Credential Program | `FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt` |

### Carteiras Importantes

| Carteira | Endereço | Propósito |
|----------|----------|-----------|
| Admin | `AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw` | Administração da plataforma |
| Reserve Treasury | `34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH` | Fundo de reserva (7.5%) |

### URLs de Produção

| Serviço | URL |
|---------|-----|
| Frontend | https://rwa.hubweb3.com |
| API | https://rwa.hubweb3.com/api/v1 |
| KYC API | https://rwa.hubweb3.com/kyc-api |

### Portas dos Serviços

| Serviço | Desenvolvimento | Produção |
|---------|-----------------|----------|
| Frontend | 5174 | 5173 |
| API Principal | 3004 | 3002 |
| API KYC | 3005 | 3001 |
| Indexador | 9090 | 9090 |
| PostgreSQL | 5436 | 5432 |
| Kong Gateway | 8000 | 8000 |

---

## Arquitetura em Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                         (React + TypeScript)                             │
│                              Port: 5173                                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           KONG GATEWAY                                   │
│                         (API Gateway)                                    │
│                              Port: 8000                                  │
└───────────┬─────────────────────┬─────────────────────┬─────────────────┘
            │                     │                     │
            ▼                     ▼                     ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│    API PRINCIPAL  │ │     API KYC       │ │    INDEXADOR      │
│    (Node.js)      │ │    (Node.js)      │ │      (Go)         │
│    Port: 3002     │ │    Port: 3001     │ │    Port: 9090     │
└─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘
          │                     │                     │
          └──────────┬──────────┴──────────┬──────────┘
                     │                     │
                     ▼                     ▼
          ┌───────────────────┐ ┌───────────────────────┐
          │    PostgreSQL     │ │   Solana Blockchain   │
          │    Port: 5432     │ │   (Devnet/Mainnet)    │
          └───────────────────┘ └───────────────────────┘
```

---

## Distribuição de Taxas

Quando um investidor realiza um investimento, o valor é distribuído da seguinte forma:

| Destino | Porcentagem | Descrição |
|---------|-------------|-----------|
| **Plataforma** | 2.5% | Taxa da plataforma Hub Token |
| **Fundo de Reserva** | 7.5% | Manutenção e proteção do imóvel |
| **Vendedor** | 90% | Valor repassado ao proprietário |

---

## Contato e Suporte

Para dúvidas técnicas ou suporte, entre em contato através dos canais oficiais.

---

**Copyright © 2025 Hub Token. Todos os direitos reservados.**
