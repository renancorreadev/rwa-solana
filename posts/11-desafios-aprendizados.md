# Post 11: Desafios e Aprendizados - Bastidores do Desenvolvimento

## Contexto para o Gemini

Este post deve ser mais pessoal e reflexivo, compartilhando desafios reais enfrentados durante o desenvolvimento. Tom honesto e educativo.

## Desafio 1: Transfer Hook do Token-2022

```
O problema:

Quando começamos, a documentação do SPL Token-2022 era escassa.
Transfer Hooks eram uma feature nova.
Poucos exemplos no ecossistema.

A jornada:
├─ Semana 1: "Isso parece simples"
├─ Semana 2: "Por que ExtraAccountMetaList não funciona?"
├─ Semana 3: "Ah, preciso registrar contas ANTES"
├─ Semana 4: "Finalmente entendi o modelo mental"

Aprendizado:
Transfer Hook não é "adicionar lógica na transferência".
É "registrar quais contas extras a transferência precisa,
e o Token Program automaticamente as inclui".

Documentação que criamos:
- ExtraAccountMetaList deve ser inicializado uma vez por mint
- Seeds são avaliados em runtime (dinâmicos)
- Index 3 = destination owner na lista de contas padrão
```

## Desafio 2: Deserialização de Contas Anchor em Go

```
O problema:

Indexador em Go precisa ler contas Anchor.
Anchor não tem SDK oficial para Go.
Deserialização manual de dados binários.

A jornada:
├─ Tentativa 1: Portar IDL para Go struct
│   └─ Problema: Strings em Anchor têm length prefix variável
├─ Tentativa 2: Copiar offsets do TypeScript SDK
│   └─ Problema: Offsets mudam se struct muda
├─ Solução: Deserialização byte-a-byte com validation

Código que funciona:

func parsePropertyState(data []byte) (Property, error) {
    if len(data) < MIN_SIZE {
        return Property{}, fmt.Errorf("invalid size")
    }

    offset := 8  // Skip Anchor discriminator

    // Pubkeys são sempre 32 bytes
    authority := solana.PublicKeyFromBytes(data[offset:offset+32])
    offset += 32

    // Strings: 4 bytes (u32 little-endian) + content
    nameLen := binary.LittleEndian.Uint32(data[offset:offset+4])
    offset += 4

    if offset+int(nameLen) > len(data) {
        return Property{}, fmt.Errorf("name overflow")
    }

    name := string(data[offset:offset+int(nameLen)])
    offset += int(nameLen)

    // ... continua
}

Aprendizado:
Não existe atalho para entender formato binário.
Precisa ler código do Anchor e entender serialização Borsh.
```

## Desafio 3: Conciliar Solana Devnet vs Mainnet

```
O problema:

Devnet tem:
- RPC gratuito e abundante
- Faucet para SOL de teste
- Menos validação de erros

Mainnet tem:
- RPC caro ou rate-limited
- SOL real (custo)
- Validação mais estrita

Bugs que só apareceram em staging:
├─ Conta não rent-exempt (funciona em devnet, falha em mainnet)
├─ Rate limit de RPC público
├─ Timeouts em operações que "sempre funcionavam"

Aprendizado:
- Testar com RPC privado desde cedo
- Simular rate limits em dev
- Budget de compute units explícito
- Sempre calcular rent-exemption
```

## Desafio 4: Clean Architecture vs Velocidade

```
O problema:

Clean Architecture é bom para manutenção.
Mas adiciona boilerplate inicial.
Startup precisa entregar rápido.

Debate interno:
├─ "Vamos fazer rápido e refatorar depois"
├─ "Refatoração nunca acontece"
├─ "Melhor fazer certo desde o início"

Decisão:
Investir em arquitetura desde o início, MAS:
- Não criar abstrações prematuras
- Interface só quando há 2+ implementações
- Use case só para lógica complexa
- Controller pode ter lógica simples

Resultado:
├─ Semana 1-2: Mais lento que "código cowboy"
├─ Mês 2+: Muito mais rápido para adicionar features
└─ Mês 6+: Onboarding de novos devs em 1 dia
```

## Desafio 5: KYC - Civic vs Próprio

```
O problema:

Civic Pass:
- Integração rápida (1-2 semanas)
- Dependência externa
- Sem tipos customizados
- Custo por verificação

Hub Credential próprio:
- Desenvolvimento longo (2-3 meses)
- Controle total
- Tipos brasileiros (CPF, CNPJ)
- Sem custo externo

Decisão:
Começar com Civic para MVP.
Migrar para Hub Credential em paralelo.
Suportar ambos durante transição.

Aprendizado:
Às vezes vale começar com solução pronta
e migrar depois de validar o modelo de negócio.
Mas planejar a migração desde o início.
```

## Desafio 6: Testes de Smart Contract

```
O problema:

Testar smart contracts é diferente de backend tradicional.
Estado persiste entre testes.
Ordem de execução importa.

Erros comuns:
├─ Teste A cria conta, Teste B assume que existe
├─ Teste falha em CI mas passa local
├─ Airdrop de SOL falha por rate limit

Solução:
- Cada teste cria suas próprias contas
- Keypairs únicos por teste
- Setup idempotente
- Retry com backoff para airdrop

describe('invest_in_property', () => {
    let propertyMint: Keypair;
    let investor: Keypair;

    beforeEach(async () => {
        // Criar contas NOVAS para cada teste
        propertyMint = Keypair.generate();
        investor = Keypair.generate();

        // Airdrop com retry
        await airdropWithRetry(investor.publicKey, 10 * LAMPORTS_PER_SOL);

        // Setup completo da propriedade
        await createProperty(propertyMint);
        await initializeVault(propertyMint);
    });

    it('should mint tokens proportional to investment', async () => {
        // Teste isolado
    });
});
```

## Reflexão Final

```
O que funcionou:
✓ Clean Architecture desde o início
✓ Transfer Hooks para compliance automático
✓ Indexador em Go para performance
✓ Eventos detalhados para auditoria

O que faríamos diferente:
△ Começar com Civic e migrar depois
△ Mais testes de integração end-to-end
△ Documentação interna mais cedo
△ Staging environment desde semana 1
```

## Ângulo do Post

Autenticidade e humildade. Mostrar que todo projeto tem desafios. O diferencial é como lidamos com eles.

## Hashtags Sugeridas

#SoftwareDevelopment #LessonsLearned #StartupLife #TechChallenges #Engineering #Blockchain #BuildingInPublic #DeveloperLife
