# Troubleshooting

## Problemas Comuns

### Docker

#### Container não inicia

```bash
# Ver logs do container
docker compose logs <service-name>

# Verificar status
docker compose ps

# Reconstruir imagem
docker compose build --no-cache <service-name>
docker compose up -d <service-name>
```

#### Porta já em uso

```bash
# Encontrar processo usando a porta
lsof -i :3004

# Ou
netstat -tulpn | grep 3004

# Matar processo (se necessário)
kill -9 <PID>
```

#### Erro de conexão com banco

```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres

# Testar conexão
docker exec -it hub-postgres-dev pg_isready -U postgres

# Verificar DATABASE_URL
docker exec hub-api-dev env | grep DATABASE

# Logs do banco
docker compose logs postgres
```

#### Sem espaço em disco

```bash
# Ver uso de disco
df -h

# Limpar imagens não utilizadas
docker image prune -a

# Limpar volumes órfãos
docker volume prune

# Limpeza completa
docker system prune -a --volumes
```

---

### API Principal

#### 500 Internal Server Error

```bash
# Ver logs detalhados
docker compose logs -f api

# Verificar variáveis de ambiente
docker exec hub-api-dev env

# Testar conexão com indexador
docker exec hub-api-dev curl http://indexer:9090/health
```

#### CORS Error no Frontend

**Sintoma:** `Access-Control-Allow-Origin` header missing

**Solução:**

1. Verificar CORS_ORIGINS no .env:
```bash
CORS_ORIGINS=http://localhost:5173,http://localhost:5174
```

2. Reiniciar API:
```bash
docker compose restart api
```

#### Timeout nas requisições

```bash
# Verificar se indexador está respondendo
curl http://localhost:9090/health

# Verificar latência do RPC Solana
curl -X POST https://api.devnet.solana.com \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'

# Aumentar timeout no código se necessário
```

---

### API KYC

#### JWT Token Inválido

**Sintoma:** `401 Unauthorized` ou `Invalid Token`

**Causas possíveis:**

1. Token expirado
2. JWT_SECRET diferente entre ambientes
3. Token malformado

**Solução:**

```bash
# Verificar JWT_SECRET
docker exec hub-kyc-api-dev env | grep JWT

# Gerar novo token autenticando novamente
# Frontend: desconectar e reconectar wallet
```

#### Assinatura Inválida

**Sintoma:** `Invalid Signature` no /auth/verify

**Causas possíveis:**

1. Nonce expirado (15 min)
2. Mensagem assinada diferente do nonce
3. Wallet diferente

**Debug:**

```javascript
// No frontend, verificar mensagem assinada
console.log('Nonce:', nonce);
console.log('Message to sign:', new TextEncoder().encode(nonce));
console.log('Signature:', signature);
```

---

### Indexador

#### Não está sincronizando

```bash
# Verificar logs
docker compose logs -f indexer

# Verificar status de sync
curl http://localhost:9090/api/v1/sync/status

# Forçar sync
curl -X POST http://localhost:9090/api/v1/sync/trigger
```

#### Erro de decodificação

**Sintoma:** `Error decoding transaction`

**Causas possíveis:**

1. Versão do programa mudou
2. Discriminador de instrução incorreto
3. Estrutura de dados diferente

**Solução:**

```bash
# Verificar program ID
solana program show <PROGRAM_ID>

# Comparar com IDL
cat real_estate_program/target/idl/hub_token.json | jq '.instructions'
```

#### Memória alta

```bash
# Ver uso de memória
docker stats hub-indexer-dev

# Reduzir batch size no .env
INDEXER_BATCH_SIZE=50

# Reiniciar
docker compose restart indexer
```

---

### Frontend

#### Wallet não conecta

**Causas possíveis:**

1. Extensão não instalada
2. Rede incorreta (mainnet vs devnet)
3. Popup bloqueado

**Soluções:**

1. Instalar Phantom/Solflare
2. Mudar rede na wallet para Devnet
3. Permitir popups do site

#### Transação falha

**Sintoma:** `Transaction simulation failed`

```javascript
// Verificar saldo
const balance = await connection.getBalance(publicKey);
console.log('Balance:', balance / 1e9, 'SOL');

// Verificar logs da transação
const logs = await connection.getTransaction(signature);
console.log('Logs:', logs?.meta?.logMessages);
```

**Causas comuns:**

1. Saldo insuficiente
2. Conta não existe
3. Programa pausado
4. Credencial KYC ausente (para transfers)

#### Build falha

```bash
# Limpar cache
rm -rf node_modules
rm -rf dist
npm cache clean --force

# Reinstalar
npm install
npm run build
```

---

### Solana / Anchor

#### Program Deploy Falha

```bash
# Verificar saldo para deploy
solana balance

# Airdrop se necessário (devnet)
solana airdrop 5

# Verificar tamanho do programa
ls -lh target/deploy/hub_token.so

# Se muito grande, otimizar
anchor build -- --features no-entrypoint
```

#### Account Not Found

```bash
# Verificar se PDA existe
solana account <PDA_ADDRESS>

# Derivar PDA corretamente
# Em JavaScript:
const [pda] = PublicKey.findProgramAddressSync(
  [Buffer.from('property'), mintPubkey.toBuffer()],
  programId
);
```

#### Custom Program Error

**Sintoma:** `custom program error: 0x1770`

```bash
# Converter hex para decimal
python3 -c "print(0x1770)"  # 6000

# Verificar erro no IDL
cat target/idl/hub_token.json | jq '.errors[] | select(.code == 6000)'
```

**Erros comuns do Hub Token:**

| Código | Nome | Descrição |
|--------|------|-----------|
| 6000 | Unauthorized | Caller não autorizado |
| 6001 | InvalidStatus | Status da propriedade inválido |
| 6002 | InsufficientFunds | Saldo insuficiente |
| 6003 | InvalidCredential | Credencial KYC inválida |
| 6004 | ExpiredCredential | Credencial expirada |
| 6005 | NoClaimableAmount | Nenhum dividendo para resgatar |

---

### Banco de Dados

#### Conexão Recusada

```bash
# Verificar se container está rodando
docker compose ps postgres

# Testar conexão
docker exec -it hub-postgres-dev pg_isready -U postgres

# Ver logs
docker compose logs postgres
```

#### Migrations Falham

```bash
# Verificar estado das migrations
docker exec -it hub-postgres-dev psql -U postgres -d hub_indexer \
  -c "SELECT * FROM _prisma_migrations"

# Reset (CUIDADO: apaga dados)
docker exec -it hub-postgres-dev psql -U postgres -d hub_indexer \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Re-rodar migrations
docker compose restart api
```

#### Dados Inconsistentes

```bash
# Verificar contagem
docker exec -it hub-postgres-dev psql -U postgres -d hub_indexer \
  -c "SELECT COUNT(*) FROM properties"

# Comparar com blockchain
curl http://localhost:9090/api/v1/stats

# Se necessário, reindexar
docker exec -it hub-postgres-dev psql -U postgres -d hub_indexer \
  -c "UPDATE sync_state SET last_slot = 0"
docker compose restart indexer
```

---

## Logs e Debug

### Habilitar Debug Logs

```bash
# API
LOG_LEVEL=debug docker compose up api

# Frontend
VITE_DEBUG=true npm run dev
```

### Ver Logs em Tempo Real

```bash
# Todos os serviços
docker compose logs -f

# Serviço específico
docker compose logs -f api kyc-api

# Últimas 100 linhas
docker compose logs --tail=100 api
```

### Logs do Solana

```bash
# Logs do programa em tempo real
solana logs <PROGRAM_ID>

# Filtrar por tipo
solana logs <PROGRAM_ID> 2>&1 | grep -i error
```

---

## Performance

### Lentidão Geral

```bash
# Ver uso de recursos
docker stats

# Verificar disco
df -h

# Verificar memória
free -h

# Verificar CPU
top
```

### Otimizações

1. **Indexador:** Reduzir `INDEXER_BATCH_SIZE`
2. **API:** Adicionar cache Redis
3. **Frontend:** Habilitar gzip no nginx
4. **Banco:** Adicionar índices

```sql
-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_transactions_created
ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_investors_balance
ON investors(balance DESC) WHERE balance > 0;
```

---

## Contato e Suporte

- **Issues:** https://github.com/hub-token/platform/issues
- **Documentação:** https://docs.hubtoken.io
- **Discord:** https://discord.gg/hubtoken

---

[← Voltar](./rodar-local.md) | [Início da Documentação →](../README.md)
