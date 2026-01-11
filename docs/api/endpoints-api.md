# Endpoints da API Principal

**Base URL:** `http://localhost:3004/api/v1` (dev) | `https://rwa.hubweb3.com/api/v1` (prod)

---

## Properties (Propriedades)

### Listar Propriedades

```http
GET /properties
```

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `status` | string | `active` ou `paused` |
| `type` | string | Tipo do imóvel |
| `page` | number | Página (default: 1) |
| `limit` | number | Itens por página (default: 20) |

**Response:**

```json
{
  "data": [
    {
      "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "name": "Edifício Torre Norte",
      "symbol": "TORRE",
      "status": "active",
      "totalSupply": "5000000000000",
      "circulatingSupply": "1250000000000",
      "propertyType": "Comercial",
      "location": "Av. Paulista, 1000 - São Paulo",
      "totalValueUsd": 3000000000,
      "annualYield": 850,
      "image": "https://gateway.pinata.cloud/ipfs/...",
      "pricePerToken": 0.006,
      "soldPercent": 25
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

---

### Obter Propriedade

```http
GET /properties/:mint
```

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mint` | string | Endereço do mint (base58) |

**Response:**

```json
{
  "data": {
    "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "propertyStatePda": "9yZYu...",
    "name": "Edifício Torre Norte",
    "symbol": "TORRE",
    "authority": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "sellerWallet": "34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH",
    "status": "active",
    "totalSupply": "5000000000000",
    "circulatingSupply": "1250000000000",
    "decimals": 6,
    "propertyType": "Comercial",
    "location": "Av. Paulista, 1000 - São Paulo",
    "totalValueUsd": 3000000000,
    "annualYield": 850,
    "metadataUri": "https://gateway.pinata.cloud/ipfs/...",
    "image": "https://gateway.pinata.cloud/ipfs/...",
    "currentEpoch": 5,
    "pricePerToken": 0.006,
    "soldPercent": 25,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z"
  }
}
```

---

## Investment (Investimento)

### Obter Quote

```http
GET /invest/quote
```

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `mint` | string | Endereço do mint |
| `solAmount` | number | Quantidade de SOL |

**Response:**

```json
{
  "data": {
    "propertyMint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "solAmount": 10,
    "tokensToReceive": 1666666666,
    "tokensFormatted": "1,666.67",
    "platformFee": 0.25,
    "reserveFee": 0.75,
    "sellerAmount": 9.0,
    "pricePerToken": 0.000006,
    "ownership": "0.0333%",
    "platformTreasury": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "reserveTreasury": "34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH"
  }
}
```

---

## Investors (Investidores)

### Portfólio do Investidor

```http
GET /investors/:wallet/portfolio
```

**Response:**

```json
{
  "data": {
    "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "totalValueUsd": 15000.50,
    "totalProperties": 3,
    "holdings": [
      {
        "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        "name": "Edifício Torre Norte",
        "symbol": "TORRE",
        "balance": "1666666666",
        "balanceFormatted": "1,666.67",
        "valueUsd": 10000.00,
        "ownership": "0.0333%",
        "unclaimedDividends": 50.5
      }
    ]
  }
}
```

### Dividendos Disponíveis

```http
GET /investors/:wallet/claimable
```

**Response:**

```json
{
  "data": {
    "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "totalClaimable": 150.75,
    "properties": [
      {
        "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        "name": "Edifício Torre Norte",
        "claimable": 100.50,
        "epochs": [
          { "epoch": 5, "amount": 50.25 },
          { "epoch": 4, "amount": 50.25 }
        ]
      }
    ]
  }
}
```

---

## User (Usuário)

### Obter Preferências

```http
GET /users/:wallet/preferences
```

**Response:**

```json
{
  "data": {
    "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "theme": "dark",
    "currency": "BRL",
    "hideBalances": false,
    "notifications": {
      "email": false,
      "push": true,
      "investmentUpdates": true,
      "dividendAlerts": true
    }
  }
}
```

### Atualizar Preferências

```http
PUT /users/:wallet/preferences
Content-Type: application/json
```

**Body:**

```json
{
  "theme": "dark",
  "currency": "USD",
  "hideBalances": true,
  "notifications": {
    "email": true,
    "dividendAlerts": true
  }
}
```

### Histórico de Atividades

```http
GET /users/:wallet/activities
```

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `page` | number | Página |
| `limit` | number | Itens por página |
| `type` | string | Filtrar por tipo |

**Response:**

```json
{
  "data": [
    {
      "id": 1,
      "activityType": "invest",
      "propertyMint": "7xKXtg...",
      "propertyName": "Edifício Torre Norte",
      "amount": 10.0,
      "description": "Investimento de 10 SOL",
      "metadata": {
        "txSignature": "5xK9...",
        "tokensReceived": "1666666666"
      },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

---

## Admin

### Criar Propriedade

```http
POST /admin/properties
Content-Type: application/json
```

**Body:**

```json
{
  "name": "Edifício Torre Norte",
  "symbol": "TORRE",
  "decimals": 6,
  "totalSupply": "5000000000000",
  "sellerWallet": "34JKXfYohYJx3gH7BtGwuGWrozz57tHoZp6ZPZChpxHH",
  "propertyDetails": {
    "propertyAddress": "Av. Paulista, 1000 - São Paulo",
    "propertyType": "Comercial",
    "totalValueUsd": 3000000000,
    "rentalYieldBps": 850,
    "metadataUri": "https://gateway.pinata.cloud/ipfs/..."
  }
}
```

**Response:**

```json
{
  "data": {
    "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "propertyStatePda": "9yZYu...",
    "txSignature": "5xK9..."
  }
}
```

### Mintar Tokens

```http
POST /admin/mint
Content-Type: application/json
```

**Body:**

```json
{
  "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "investor": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "amount": "1000000000"
}
```

### Depositar Revenue

```http
POST /admin/revenue
Content-Type: application/json
```

**Body:**

```json
{
  "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
  "epoch": 6,
  "amount": 500000000000
}
```

---

## Stats (Estatísticas)

### Estatísticas da Plataforma

```http
GET /stats/platform
```

**Response:**

```json
{
  "data": {
    "totalValueLocked": 125000000,
    "totalProperties": 5,
    "activeInvestors": 1250,
    "avgAnnualYield": 8.5,
    "totalTransactions": 15000
  }
}
```

---

## Health

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "solana": true,
    "indexer": true
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

---

## Erros Comuns

### 400 - Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados inválidos",
    "details": [
      { "field": "solAmount", "message": "Must be positive" }
    ]
  }
}
```

### 404 - Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Propriedade não encontrada"
  }
}
```

### 500 - Server Error

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Erro interno do servidor"
  }
}
```

---

[← Voltar](./README.md) | [Próximo: Endpoints KYC →](./endpoints-kyc.md)
