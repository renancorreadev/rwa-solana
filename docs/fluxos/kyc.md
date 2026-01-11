# Fluxo de KYC (Know Your Customer)

## Visão Geral

O processo de KYC é obrigatório para qualquer operação na plataforma Hub Token. Ele garante que apenas investidores verificados possam comprar, vender ou transferir tokens.

## Por que KYC?

```
┌─────────────────────────────────────────────────────────────┐
│                    MOTIVOS DO KYC                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚖️  COMPLIANCE REGULATÓRIO                                 │
│      CVM, BACEN, Lei 14.478/2022                           │
│                                                             │
│  🛡️  PREVENÇÃO À LAVAGEM                                    │
│      AML/CFT requirements                                   │
│                                                             │
│  🔒  PROTEÇÃO DOS INVESTIDORES                              │
│      Apenas pessoas reais e verificadas                    │
│                                                             │
│  📊  RASTREABILIDADE                                        │
│      Auditoria de todas as transações                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Fluxo Completo

```mermaid
sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant KYC as KYC API
    participant DB as PostgreSQL
    participant CRED as Credential Program
    participant ADMIN as Admin

    Note over U,FE: 1. Início do Processo
    U->>FE: Acessa /kyc
    FE->>FE: Verifica wallet conectada

    Note over FE,KYC: 2. Criar Sessão KYC
    FE->>KYC: POST /api/kyc/session
    Note over KYC: body: { wallet }
    KYC->>DB: Insert session (status: pending)
    KYC-->>FE: { sessionId: "abc123" }

    Note over U,FE: 3. Preencher Dados
    U->>FE: Informa dados pessoais
    Note over FE: Nome, CPF, Data Nasc,
    Note over FE: Endereço, etc.

    FE->>KYC: PUT /api/kyc/session/:id
    Note over KYC: body: { personalData }
    KYC->>DB: Update session data
    KYC-->>FE: { status: "data_received" }

    Note over U,FE: 4. Upload de Documentos
    U->>FE: Seleciona arquivos
    Note over FE: RG/CNH frente e verso
    Note over FE: Selfie com documento

    FE->>KYC: POST /api/kyc/upload
    KYC->>KYC: Upload para IPFS
    KYC->>DB: Salvar referencias
    KYC-->>FE: { uploaded: true }

    Note over U,KYC: 5. Submeter para Análise
    U->>FE: Clica "Enviar"
    FE->>KYC: POST /api/kyc/session/:id/submit
    KYC->>DB: Update status: submitted
    KYC-->>FE: { status: "under_review" }

    Note over KYC,ADMIN: 6. Verificação (Off-chain)
    ADMIN->>KYC: Acessa painel admin
    KYC->>DB: Lista sessões pendentes
    ADMIN->>ADMIN: Analisa documentos
    ADMIN->>ADMIN: Verifica PEP/Sanções

    alt Aprovado
        Note over ADMIN,CRED: 7a. Emitir Credencial
        ADMIN->>KYC: POST /api/credentials/issue
        KYC->>CRED: issue_credential(user, type)
        CRED->>CRED: Criar HubCredential PDA
        CRED-->>KYC: Success
        KYC->>DB: Update: approved
        KYC-->>FE: WebSocket: approved!
        FE-->>U: 🎉 KYC Aprovado!
    else Rejeitado
        Note over ADMIN,KYC: 7b. Rejeitar
        ADMIN->>KYC: POST /api/kyc/reject
        KYC->>DB: Update: rejected
        KYC-->>FE: WebSocket: rejected
        FE-->>U: ❌ KYC Rejeitado (motivo)
    end
```

---

## Estados da Sessão KYC

```mermaid
stateDiagram-v2
    [*] --> pending: Criar sessão

    pending --> data_received: Enviar dados pessoais
    data_received --> documents_uploaded: Upload docs
    documents_uploaded --> submitted: Submeter

    submitted --> under_review: Admin inicia análise
    under_review --> approved: Aprovado
    under_review --> rejected: Rejeitado
    under_review --> additional_info: Precisa mais info

    additional_info --> submitted: Reenvia

    rejected --> pending: Tenta novamente

    approved --> [*]
```

---

## Dados Coletados

### Pessoa Física (CPF)

| Campo | Obrigatório | Validação |
|-------|-------------|-----------|
| Nome completo | Sim | Min 3 caracteres |
| CPF | Sim | Válido (11 dígitos) |
| Data de nascimento | Sim | Maior de 18 anos |
| E-mail | Sim | Formato válido |
| Telefone | Sim | Formato brasileiro |
| Endereço completo | Sim | CEP válido |
| Profissão | Sim | - |
| Renda mensal | Sim | Faixa |

### Pessoa Jurídica (CNPJ)

| Campo | Obrigatório | Validação |
|-------|-------------|-----------|
| Razão Social | Sim | - |
| CNPJ | Sim | Válido (14 dígitos) |
| Nome Fantasia | Não | - |
| Data de constituição | Sim | - |
| Endereço sede | Sim | CEP válido |
| Representante legal | Sim | Nome + CPF |
| Contrato social | Sim | Documento |

---

## Documentos Aceitos

### Identificação (um dos seguintes)

```
┌─────────────────────────────────────────────────────────────┐
│                  DOCUMENTOS DE IDENTIDADE                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📄 RG (Carteira de Identidade)                            │
│     • Frente e verso                                        │
│     • Emitido há menos de 10 anos                          │
│                                                             │
│  🚗 CNH (Carteira de Motorista)                            │
│     • Frente e verso                                        │
│     • Dentro da validade                                    │
│                                                             │
│  🛂 Passaporte                                              │
│     • Página com foto                                       │
│     • Dentro da validade                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Comprovante de Residência

- Conta de luz, água ou gás (últimos 3 meses)
- Fatura de cartão de crédito
- Extrato bancário
- Contrato de aluguel

### Selfie

- Foto segurando o documento
- Rosto e documento visíveis
- Boa iluminação

---

## Verificações Realizadas

### Automáticas

| Verificação | Descrição |
|-------------|-----------|
| **Validação de CPF/CNPJ** | Dígitos verificadores |
| **OCR de documentos** | Extração automática de dados |
| **Face match** | Compara selfie com documento |
| **Liveness** | Detecta se é foto de foto |

### Manuais (Admin)

| Verificação | Descrição |
|-------------|-----------|
| **PEP** | Pessoa Exposta Politicamente |
| **Sanções** | Listas OFAC, ONU, etc. |
| **Mídia negativa** | Notícias adversas |
| **Consistência** | Dados vs documentos |

---

## API Endpoints

### Criar Sessão

```http
POST /api/kyc/session
Content-Type: application/json

{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw"
}

Response:
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

### Enviar Dados

```http
PUT /api/kyc/session/:sessionId
Content-Type: application/json

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
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100"
    }
  }
}
```

### Upload de Documentos

```http
POST /api/kyc/upload
Content-Type: multipart/form-data

sessionId: 550e8400-e29b-41d4-a716-446655440000
documentType: identity_front
file: [binary]

Response:
{
  "uploaded": true,
  "documentType": "identity_front",
  "ipfsHash": "QmXxx..."
}
```

### Submeter para Análise

```http
POST /api/kyc/session/:sessionId/submit

Response:
{
  "status": "submitted",
  "message": "Sua solicitação foi enviada para análise"
}
```

### Verificar Status

```http
GET /api/kyc/session/:sessionId

Response:
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "approved",
  "credentialType": "BrazilianCpf",
  "expiresAt": "2027-01-15T10:00:00Z"
}
```

---

## Interface do Usuário

### Tela de KYC

```
┌─────────────────────────────────────────────────────────────┐
│                    VERIFICAÇÃO KYC                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Progresso                                                  │
│  [██████████░░░░░░░░░░░░░░░░░░] 40%                        │
│                                                             │
│  ✅ Dados pessoais                                          │
│  ✅ Documentos enviados                                     │
│  ⏳ Selfie                                                  │
│  ○ Em análise                                              │
│  ○ Aprovado                                                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ETAPA 3: Selfie com Documento                             │
│                                                             │
│  Tire uma foto sua segurando o documento de identidade     │
│  ao lado do rosto.                                         │
│                                                             │
│  Dicas:                                                     │
│  • Boa iluminação                                          │
│  • Documento legível                                        │
│  • Rosto sem obstruções                                    │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │                                                       │ │
│  │                    [📷 CÂMERA]                        │ │
│  │                                                       │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────────────┐  ┌──────────────────────────────┐ │
│  │       VOLTAR        │  │          CONTINUAR           │ │
│  └─────────────────────┘  └──────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Tipos de Credencial Emitida

| Cenário | Credencial | Validade |
|---------|------------|----------|
| PF Brasileiro | `BrazilianCpf` | 2 anos |
| PJ Brasileiro | `BrazilianCnpj` | 1 ano |
| KYC Básico (internacional) | `KycBasic` | 1 ano |
| KYC Completo | `KycFull` | 2 anos |
| Investidor Acreditado (US) | `AccreditedInvestor` | 1 ano |

---

## Renovação de Credencial

### Quando Renovar?

- 30 dias antes da expiração
- Sistema notifica automaticamente
- Processo simplificado se dados não mudaram

### Fluxo de Renovação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant KYC as KYC API
    participant CRED as Credential

    U->>KYC: POST /api/credentials/refresh
    KYC->>KYC: Verificar credencial atual
    KYC->>KYC: Validar dados ainda corretos

    alt Dados válidos
        KYC->>CRED: refresh_credential()
        CRED-->>KYC: Nova validade
        KYC-->>U: Renovado!
    else Dados desatualizados
        KYC-->>U: Necessário novo KYC
    end
```

---

## Segurança e Privacidade

### Armazenamento de Dados

| Dado | Onde | Criptografia |
|------|------|--------------|
| Dados pessoais | PostgreSQL | AES-256 |
| Documentos | IPFS (Pinata) | Encrypted |
| Credencial | Solana (on-chain) | Público (sem PII) |

### LGPD Compliance

- Dados mínimos necessários
- Direito ao esquecimento
- Portabilidade de dados
- Consentimento explícito

---

## Erros Comuns

| Erro | Causa | Solução |
|------|-------|---------|
| Documento ilegível | Foto escura/borrada | Refazer com boa luz |
| CPF inválido | Dígitos incorretos | Verificar digitação |
| Face match falhou | Selfie diferente | Nova selfie |
| Documento vencido | Validade expirada | Usar doc válido |

---

[← Voltar](./investimento.md) | [Próximo: Dividendos →](./dividendos.md)
