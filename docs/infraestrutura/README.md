# Infraestrutura

## Visão Geral

O Hub Token utiliza uma infraestrutura containerizada com **Docker** para garantir consistência entre ambientes de desenvolvimento, staging e produção.

## Arquitetura de Infraestrutura

```mermaid
graph TB
    subgraph "Rede Externa"
        USER[Usuários]
        DNS[DNS / CloudFlare]
    end

    subgraph "Servidor"
        subgraph "Docker Network: hub-network"
            NGINX[Nginx<br/>:80/:443]
            KONG[Kong Gateway<br/>:8000]

            subgraph "Serviços"
                FE[Frontend<br/>:5173]
                API[API<br/>:3002]
                KYC[KYC API<br/>:3001]
                IDX[Indexador<br/>:9090]
            end

            PG[(PostgreSQL<br/>:5432)]
        end
    end

    subgraph "Externo"
        SOL[Solana RPC]
        IPFS[IPFS/Pinata]
    end

    USER --> DNS
    DNS --> NGINX
    NGINX --> KONG

    KONG --> FE
    KONG --> API
    KONG --> KYC

    API --> PG
    API --> IDX
    KYC --> PG

    IDX --> PG
    IDX --> SOL

    API --> SOL
    API --> IPFS
    KYC --> SOL
```

## Serviços Docker

| Serviço | Imagem Base | Porta Interna | Porta Externa (Dev) |
|---------|-------------|---------------|---------------------|
| PostgreSQL | postgres:15-alpine | 5432 | 5436 |
| Indexador | golang:1.21-alpine | 9090 | 9090 |
| API | node:20-alpine | 3002 | 3004 |
| KYC API | node:20-alpine | 3001 | 3005 |
| Frontend | node:20-alpine + nginx | 5173 | 5174 |

## Estrutura de Arquivos

```
/home/ubuntu/services/solana/
├── docker-compose.yml          # Desenvolvimento
├── docker-compose.prod.yml     # Produção
├── .env                        # Variáveis raiz
│
├── services/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── .env
│   │   └── src/
│   │
│   ├── kyc-api/
│   │   ├── Dockerfile
│   │   ├── .env
│   │   └── src/
│   │
│   └── indexer/
│       ├── Dockerfile
│       ├── .env
│       └── cmd/
│
└── real_estate_program/
    └── app/
        ├── Dockerfile
        ├── nginx.conf
        └── src/
```

---

## Próximos Documentos

- [Docker e Containers](./docker.md)
- [Variáveis de Ambiente](./variaveis-ambiente.md)
- [Deploy e CI/CD](./deploy.md)

---

[← Voltar](../fluxos/transferencia.md) | [Próximo: Docker →](./docker.md)
