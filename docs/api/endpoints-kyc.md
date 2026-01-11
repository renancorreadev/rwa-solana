# Endpoints da API KYC

**Base URL:** `http://localhost:3005/api` (dev) | `https://rwa.hubweb3.com/kyc-api/api` (prod)

---

## Authentication (Autenticação)

### Solicitar Nonce

Obtém um nonce para assinatura com a wallet.

```http
POST /auth/nonce
Content-Type: application/json
```

**Body:**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw"
}
```

**Response:**

```json
{
  "nonce": "Hub Token Authentication: abc123xyz789",
  "expiresAt": "2025-01-15T10:15:00Z"
}
```

---

### Verificar Assinatura

Verifica a assinatura e retorna JWT.

```http
POST /auth/verify
Content-Type: application/json
```

**Body:**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "signature": "base58-encoded-signature",
  "nonce": "Hub Token Authentication: abc123xyz789"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-01-22T10:00:00Z",
  "user": {
    "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "hasCredential": true,
    "credentialStatus": "active"
  }
}
```

---

### Obter Usuário Atual

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "hasCredential": true,
  "credentialType": "BrazilianCpf",
  "credentialStatus": "active",
  "expiresAt": "2027-01-15T00:00:00Z"
}
```

---

## Credentials (Credenciais)

### Verificar Credencial

Verifica se uma wallet possui credencial válida.

```http
GET /credentials/:wallet
```

**Path Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `wallet` | string | Endereço da wallet (base58) |

**Response (com credencial):**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "hasCredential": true,
  "credential": {
    "pda": "9yZYu...",
    "type": "BrazilianCpf",
    "status": "active",
    "issuer": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "issuedAt": "2025-01-15T00:00:00Z",
    "expiresAt": "2027-01-15T00:00:00Z",
    "metadataUri": "https://..."
  },
  "isValid": true,
  "isExpired": false
}
```

**Response (sem credencial):**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "hasCredential": false,
  "isValid": false
}
```

---

### Emitir Credencial (Admin)

```http
POST /credentials/issue
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "credentialType": "BrazilianCpf",
  "validityDays": 730,
  "metadataUri": "https://gateway.pinata.cloud/ipfs/..."
}
```

**Credential Types:**

| Tipo | Valor |
|------|-------|
| KycBasic | `KycBasic` |
| KycFull | `KycFull` |
| AccreditedInvestor | `AccreditedInvestor` |
| QualifiedPurchaser | `QualifiedPurchaser` |
| BrazilianCpf | `BrazilianCpf` |
| BrazilianCnpj | `BrazilianCnpj` |

**Response:**

```json
{
  "success": true,
  "credential": {
    "pda": "9yZYu...",
    "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "type": "BrazilianCpf",
    "expiresAt": "2027-01-15T00:00:00Z"
  },
  "txSignature": "5xK9..."
}
```

---

### Renovar Credencial (Admin)

```http
POST /credentials/refresh
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "validityDays": 730
}
```

**Response:**

```json
{
  "success": true,
  "newExpiresAt": "2027-01-15T00:00:00Z",
  "txSignature": "5xK9..."
}
```

---

### Revogar Credencial (Admin)

```http
POST /credentials/revoke
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "reason": "Documentação fraudulenta"
}
```

**Response:**

```json
{
  "success": true,
  "txSignature": "5xK9..."
}
```

---

## KYC Sessions (Sessões KYC)

### Criar Sessão

```http
POST /kyc/session
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw"
}
```

**Response:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "createdAt": "2025-01-15T10:00:00Z",
  "expiresAt": "2025-01-15T11:00:00Z"
}
```

---

### Obter Status da Sessão

```http
GET /kyc/session/:sessionId
Authorization: Bearer <token>
```

**Response:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "status": "documents_uploaded",
  "progress": 60,
  "steps": {
    "personalData": true,
    "documents": true,
    "selfie": false,
    "submitted": false,
    "approved": false
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Status Possíveis:**

| Status | Descrição |
|--------|-----------|
| `pending` | Sessão criada |
| `data_received` | Dados pessoais recebidos |
| `documents_uploaded` | Documentos enviados |
| `submitted` | Enviado para análise |
| `under_review` | Em análise |
| `additional_info` | Precisa informação adicional |
| `approved` | Aprovado |
| `rejected` | Rejeitado |

---

### Atualizar Dados da Sessão

```http
PUT /kyc/session/:sessionId
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "personalData": {
    "fullName": "João da Silva",
    "cpf": "123.456.789-00",
    "birthDate": "1990-05-15",
    "email": "joao@email.com",
    "phone": "+5511999999999",
    "address": {
      "street": "Av. Paulista",
      "number": "1000",
      "complement": "Apto 101",
      "neighborhood": "Bela Vista",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    },
    "occupation": "Engenheiro",
    "incomeRange": "10000-20000"
  }
}
```

**Response:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "data_received",
  "message": "Dados pessoais salvos com sucesso"
}
```

---

### Upload de Documento

```http
POST /kyc/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `sessionId` | string | ID da sessão |
| `documentType` | string | Tipo do documento |
| `file` | file | Arquivo (JPG, PNG, PDF) |

**Document Types:**

| Tipo | Descrição |
|------|-----------|
| `identity_front` | RG/CNH frente |
| `identity_back` | RG/CNH verso |
| `selfie` | Selfie com documento |
| `proof_of_address` | Comprovante de residência |

**Response:**

```json
{
  "uploaded": true,
  "documentType": "identity_front",
  "ipfsHash": "QmXxx...",
  "fileName": "rg_frente.jpg"
}
```

---

### Submeter para Análise

```http
POST /kyc/session/:sessionId/submit
Authorization: Bearer <token>
```

**Response:**

```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "submitted",
  "message": "Sua solicitação foi enviada para análise. Você será notificado quando houver uma atualização.",
  "estimatedTime": "24-48 horas"
}
```

---

## Admin KYC

### Listar Sessões Pendentes

```http
GET /admin/kyc/sessions
Authorization: Bearer <admin-token>
```

**Query Parameters:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `status` | string | Filtrar por status |
| `page` | number | Página |
| `limit` | number | Itens por página |

**Response:**

```json
{
  "data": [
    {
      "sessionId": "550e8400-e29b-41d4-a716-446655440000",
      "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
      "status": "submitted",
      "personalData": {
        "fullName": "João da Silva",
        "cpf": "***.***.789-00"
      },
      "documents": [
        { "type": "identity_front", "ipfsHash": "QmXxx..." },
        { "type": "identity_back", "ipfsHash": "QmYyy..." },
        { "type": "selfie", "ipfsHash": "QmZzz..." }
      ],
      "submittedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15
  }
}
```

### Aprovar KYC

```http
POST /admin/kyc/sessions/:sessionId/approve
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**

```json
{
  "credentialType": "BrazilianCpf",
  "validityDays": 730,
  "notes": "Documentação válida"
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "credentialPda": "9yZYu...",
  "txSignature": "5xK9..."
}
```

### Rejeitar KYC

```http
POST /admin/kyc/sessions/:sessionId/reject
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Body:**

```json
{
  "reason": "Documento ilegível",
  "canRetry": true
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "rejected"
}
```

---

## Rate Limiting

A API KYC possui rate limiting mais restritivo:

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/auth/*` | 20 req | 15 min |
| `/kyc/*` | 50 req | 15 min |
| `/credentials/*` | 100 req | 15 min |
| `/admin/*` | 200 req | 15 min |

**Response quando limitado:**

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 900

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas requisições. Tente novamente em 15 minutos.",
    "retryAfter": 900
  }
}
```

---

[← Voltar](./endpoints-api.md) | [Próximo: Endpoints Indexador →](./endpoints-indexador.md)
