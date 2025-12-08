# Como Visualizar Dados na Localnet

Este guia mostra diferentes formas de inspecionar credenciais e transações na sua rede Solana localnet.

## 🔧 Scripts de Inspeção

### 1. Inspecionar Credencial de um Usuário

```bash
npx ts-node inspect-credential.ts <endereço-da-wallet>
```

**Exemplo:**
```bash
npx ts-node inspect-credential.ts 7XxWTXMiZzEaG54aXQtfsoA78F6CDScpYAjuMHBUbKQ7
```

**Mostra:**
- Tipo de credencial (KYC Basic, KYC Full, etc.)
- Status (Active, Revoked, Expired, Suspended)
- Datas de emissão e expiração
- Holder e Issuer
- Metadados JSON
- Validação (✅ válida ou ❌ inválida)

### 2. Listar Todas as Credenciais

```bash
npx ts-node inspect-credential.ts --all
```

**Mostra:**
- Lista todas as credenciais emitidas no programa
- Resumo de cada credencial

### 3. Ver Detalhes de uma Transação

```bash
npx ts-node view-transaction.ts <signature>
```

**Exemplo:**
```bash
npx ts-node view-transaction.ts 5q3hnwhtRzwD7rfhyGNcX7CnPHpLtiPCsszUdZ9jNZycG3qiVwupDycAdGP2TV544T3asztXjMPUwZ6R2wS7caa
```

**Nota:** Transações na localnet são descartadas rapidamente. Para manter histórico, reinicie o validador com:
```bash
solana-test-validator --limit-ledger-size 10000000
```

### 4. Listar Transações Recentes do Programa

```bash
npx ts-node view-transaction.ts --recent [limite]
```

**Exemplo:**
```bash
npx ts-node view-transaction.ts --recent 10
```

## 🔍 Comandos Solana CLI

### Ver Conta de Credencial

```bash
# Primeiro, derive o PDA da credencial
# Seed: "credential" + wallet_address
# Program ID: FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# Ver dados da conta
solana account <PDA-da-credencial>
```

**Exemplo:**
```bash
solana account CzPjrXuNGBf6HB23MgTpm7g6KhBxYnv5NpvUuP1CyBVU
```

### Confirmar Transação

```bash
solana confirm <signature>
```

**Exemplo:**
```bash
solana confirm 5q3hnwhtRzwD7rfhyGNcX7CnPHpLtiPCsszUdZ9jNZycG3qiVwupDycAdGP2TV544T3asztXjMPUwZ6R2wS7caa
```

### Ver Saldo de uma Conta

```bash
solana balance <endereço>
```

### Logs do Programa em Tempo Real

```bash
solana logs <program-id>
```

**Exemplo:**
```bash
solana logs FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
```

## 📊 Informações do Programa

- **Program ID:** `FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt`
- **RPC URL:** `http://localhost:8899`
- **Network:** localnet

## 🎯 PDAs (Program Derived Addresses)

### Network PDA
- **Seed:** `"credential_network"`
- **Derivação:** `[Buffer.from('credential_network')]`

### Issuer PDA
- **Seed:** `"issuer" + issuer_authority_pubkey`
- **Derivação:** `[Buffer.from('issuer'), issuerAuthority.toBuffer()]`

### Credential PDA
- **Seed:** `"credential" + holder_pubkey`
- **Derivação:** `[Buffer.from('credential'), holder.toBuffer()]`

## 📝 Tipos de Credencial

| Valor | Nome | Descrição |
|-------|------|-----------|
| 0 | KycBasic | KYC básico |
| 1 | KycFull | KYC completo |
| 2 | AccreditedInvestor | Investidor credenciado |
| 3 | QualifiedPurchaser | Comprador qualificado |
| 4 | BrazilianCpf | CPF brasileiro |
| 5 | BrazilianCnpj | CNPJ brasileiro |

## 🎨 Status da Credencial

| Valor | Nome | Descrição |
|-------|------|-----------|
| 0 | Active | Credencial ativa |
| 1 | Expired | Credencial expirada |
| 2 | Revoked | Credencial revogada |
| 3 | Suspended | Credencial suspensa |

## 💡 Dicas

1. **Credenciais persistem na localnet**, mesmo que o validador seja reiniciado (se você usar `--ledger` para especificar um diretório persistente).

2. **Transações são descartadas rapidamente** na localnet. Para mantê-las, use `--limit-ledger-size`.

3. **Use os scripts TypeScript** para inspeção formatada e legível.

4. **Monitore logs em tempo real** com `solana logs` durante desenvolvimento.

5. **Para debugging**, adicione `console.log` no código do programa e recompile.

## 🔗 Exemplo Completo de Inspeção

```bash
# 1. Listar todas as credenciais
npx ts-node inspect-credential.ts --all

# 2. Inspecionar credencial específica
npx ts-node inspect-credential.ts 7XxWTXMiZzEaG54aXQtfsoA78F6CDScpYAjuMHBUbKQ7

# 3. Ver conta on-chain
solana account CzPjrXuNGBf6HB23MgTpm7g6KhBxYnv5NpvUuP1CyBVU

# 4. Monitorar novos eventos
solana logs FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt
```

## ✅ Credencial Atual

A credencial emitida recentemente:
- **Holder:** 7XxWTXMiZzEaG54aXQtfsoA78F6CDScpYAjuMHBUbKQ7
- **PDA:** CzPjrXuNGBf6HB23MgTpm7g6KhBxYnv5NpvUuP1CyBVU
- **Tipo:** KYC Basic
- **Status:** Active ✅
- **Expira:** 28/11/2026
- **Transaction:** 5q3hnwhtRzwD7rfhyGNcX7CnPHpLtiPCsszUdZ9jNZycG3qiVwupDycAdGP2TV544T3asztXjMPUwZ6R2wS7caa
