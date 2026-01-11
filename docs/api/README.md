# Referência de APIs

## Visão Geral

O Hub Token expõe três APIs REST:

| API | Base URL (Dev) | Base URL (Prod) | Propósito |
|-----|----------------|-----------------|-----------|
| **API Principal** | http://localhost:3004/api/v1 | https://rwa.hubweb3.com/api/v1 | Lógica de negócio |
| **API KYC** | http://localhost:3005/api | https://rwa.hubweb3.com/kyc-api/api | Autenticação e KYC |
| **Indexador** | http://localhost:9090/api/v1 | Interno | Dados blockchain |

## Autenticação

### API Principal
- Maioria dos endpoints: **Pública** (sem auth)
- Endpoints admin: Requerem wallet de admin

### API KYC
- Endpoints de auth: **Públicos**
- Outros endpoints: Requerem **JWT Bearer token**

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Formato de Resposta

### Sucesso

```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Erro

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Descrição do erro",
    "details": [
      {
        "field": "amount",
        "message": "Required"
      }
    ]
  }
}
```

## Códigos HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

---

## Próximos Documentos

- [Endpoints API Principal](./endpoints-api.md)
- [Endpoints API KYC](./endpoints-kyc.md)
- [Endpoints Indexador](./endpoints-indexador.md)

---

[← Voltar](../infraestrutura/variaveis-ambiente.md) | [Próximo: Endpoints API →](./endpoints-api.md)
