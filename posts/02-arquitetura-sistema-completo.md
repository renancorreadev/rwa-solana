# Post 2: Arquitetura do Sistema - Visão Técnica

## Contexto para o Gemini

Este post deve mostrar a arquitetura completa do sistema Kota do ponto de vista de um arquiteto de software.

## Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│         React 18 + Vite + Tailwind CSS              │
│         Solana Wallet Adapter + i18next             │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────┐
│                 BACKEND                              │
│  ┌──────────────┐  │  ┌──────────────┐              │
│  │ API Principal│  │  │   KYC API    │              │
│  │  Node.js     │  │  │   Node.js    │              │
│  │  Port: 3004  │  │  │  Port: 3005  │              │
│  │ Clean Arch   │  │  │              │              │
│  └──────┬───────┘  │  └──────┬───────┘              │
│         │          │         │                       │
│  ┌──────┴──────────┴─────────┴───────┐              │
│  │           Go Indexer               │              │
│  │           Port: 9090               │              │
│  └──────────────┬────────────────────┘              │
│                 │                                    │
│  ┌──────────────┴────────────────────┐              │
│  │          PostgreSQL               │              │
│  │          Port: 5436               │              │
│  └───────────────────────────────────┘              │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────┼───────────────────────────────┐
│               BLOCKCHAIN (Solana)                    │
│  ┌──────────────────┴──────────────────┐            │
│  │           Solana RPC                 │            │
│  └──────┬─────────────────────┬────────┘            │
│         │                     │                      │
│  ┌──────┴───────┐     ┌───────┴──────┐              │
│  │ Kota Program │     │  Credential  │              │
│  │  (Token)     │     │   Program    │              │
│  │ FDfk...6om   │     │  FaJ4...94Wt │              │
│  └──────────────┘     └──────────────┘              │
└─────────────────────────────────────────────────────┘
```

## Componentes Detalhados

### Frontend
- **React 18** com Vite para build rápido
- **Tailwind CSS** para design system consistente
- **Solana Wallet Adapter** suportando 10+ wallets
- **React Query** para cache e sincronização de estado
- **Zustand** para estado local leve
- **i18next** para internacionalização (PT/EN)

### Backend - API Principal
- **Node.js + TypeScript + Express**
- **Clean Architecture** com 4 camadas:
  - Domain (Entities)
  - Application (Use Cases)
  - Infrastructure (Adapters)
  - Interfaces (HTTP Controllers)
- **TSyringe** para injeção de dependência
- **Responsabilidades**: Propriedades, investimentos, portfolio, analytics

### Backend - KYC API
- **Node.js + TypeScript + Express**
- **Responsabilidades**: Autenticação wallet, sessões KYC, credenciais
- **Segurança**: Helmet, CORS, Rate Limiting (100 req/15min)
- **Sign-In with Solana**: Autenticação via assinatura Ed25519

### Indexer
- **Go 1.21+** para alta performance
- **Gin** como framework HTTP
- **Responsabilidades**: Indexação de dados on-chain
- **Padrão**: Polling a cada 60 segundos
- **Fallback**: API pode consultar on-chain se indexer indisponível

### Blockchain
- **Kota Program**: Tokenização, investimentos, dividendos
- **Credential Program**: KYC e credenciais on-chain
- **Anchor Framework 0.30.1** para desenvolvimento

## Decisões Arquiteturais Chave

1. **Clean Architecture no Backend**: Desacoplamento total entre domínio e infraestrutura
2. **Go para Indexer**: Performance crítica para polling de blockchain
3. **Dois Programas Separados**: Separação de responsabilidades (Token vs Credential)
4. **PostgreSQL para Cache**: Queries rápidas sem sobrecarregar RPC

## Ângulo do Post

Mostrar que tokenização de ativos reais exige uma arquitetura robusta e bem planejada. Não é só "smart contract" - é um sistema completo com múltiplas camadas.

## Hashtags Sugeridas

#SoftwareArchitecture #CleanArchitecture #SystemDesign #Solana #Blockchain #NodeJS #Golang #React #TypeScript
