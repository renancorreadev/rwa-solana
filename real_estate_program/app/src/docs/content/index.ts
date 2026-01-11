import { DocContent } from '../types';

// ===========================================
// PORTUGUESE CONTENT - COMPLETE DOCUMENTATION
// ===========================================

const contentPT: Record<string, DocContent[]> = {
  // ========== INTRODUCTION ==========
  'introduction': [
    { type: 'heading', level: 1, text: 'Bem-vindo ao Kota', id: 'welcome' },
    { type: 'paragraph', text: 'Kota é uma plataforma descentralizada de tokenização de ativos imobiliários construída na blockchain Solana. Nossa missão é democratizar o acesso ao mercado imobiliário, permitindo que qualquer pessoa invista em propriedades fracionadas com total transparência e segurança.' },
    { type: 'card-grid', cards: [
      { title: 'Quickstart', description: 'Comece a desenvolver em minutos', icon: 'rocket', link: '/docs/quickstart' },
      { title: 'Arquitetura', description: 'Entenda como o sistema funciona', icon: 'architecture', link: '/docs/architecture' },
      { title: 'API Reference', description: 'Documentação completa das APIs', icon: 'api', link: '/docs/api-overview' },
      { title: 'Smart Contracts', description: 'Explore os programas Solana', icon: 'code', link: '/docs/kota-program' },
    ]},
    { type: 'heading', level: 2, text: 'Por que Kota?', id: 'why-kota' },
    { type: 'paragraph', text: 'O mercado imobiliário tradicional apresenta diversas barreiras: alto capital inicial, iliquidez, falta de transparência e processos burocráticos. O Kota resolve esses problemas através da tokenização.' },
    { type: 'table', headers: ['Aspecto', 'Tradicional', 'Kota'], rows: [
      ['Investimento Mínimo', 'R$ 100.000+', 'A partir de R$ 100'],
      ['Liquidez', 'Meses/Anos', 'Instantânea (24/7)'],
      ['Transparência', 'Limitada', 'Total (Blockchain)'],
      ['Custos', 'Altos (6-8%)', 'Baixos (2.5%)'],
      ['Dividendos', 'Manual', 'Automático'],
      ['Compliance', 'Manual', 'On-chain (KYC)'],
    ]},
    { type: 'heading', level: 2, text: 'Visão Geral da Arquitetura', id: 'architecture-overview' },
    { type: 'diagram', mermaid: `graph TB
    subgraph Frontend
        UI[React App]
        WA[Wallet Adapter]
    end
    subgraph Backend
        API[API Principal]
        KYC[API KYC]
        IDX[Indexador]
    end
    subgraph Solana
        SOL[Solana RPC]
        KP[Kota Program]
        CP[Credential Program]
    end
    subgraph Database
        PG[(PostgreSQL)]
    end
    UI --> API
    UI --> KYC
    UI --> WA
    WA --> SOL
    API --> PG
    KYC --> SOL
    IDX --> SOL
    IDX --> PG
    SOL --> KP
    SOL --> CP` },
    { type: 'heading', level: 2, text: 'Principais Características', id: 'features' },
    { type: 'list', ordered: false, items: [
      '**Tokenização SPL Token-2022** - Cada propriedade é representada por tokens fungíveis com Transfer Hook para compliance',
      '**KYC On-chain** - Credenciais de verificação armazenadas na blockchain Solana',
      '**Distribuição Automática de Dividendos** - Sistema de epochs para distribuição proporcional de receitas',
      '**Escrow Inteligente** - Liberação progressiva de fundos baseada em milestones de venda',
      '**Compliance Integrado** - Transfer Hook valida credenciais KYC em cada transferência',
    ]},
    { type: 'heading', level: 2, text: 'Stack Tecnológico', id: 'tech-stack' },
    { type: 'code', language: 'yaml', filename: 'stack.yaml', code: `# Blockchain
solana: v1.18+
anchor: v0.30.1
token-standard: SPL Token-2022

# Backend
api: Node.js + TypeScript + Express
kyc-api: Node.js + TypeScript + Express
indexer: Go 1.21+
database: PostgreSQL 15

# Frontend
framework: React 18 + Vite
styling: Tailwind CSS
state: TanStack Query + Zustand
wallet: @solana/wallet-adapter` },
    { type: 'callout', variant: 'info', title: 'Rede Atual', text: 'O Kota está atualmente deployado na **Devnet** da Solana. Para produção, será utilizada a Mainnet-Beta.' },
    { type: 'heading', level: 2, text: 'Program IDs', id: 'program-ids' },
    { type: 'code', language: 'bash', filename: 'Program Addresses', code: `# Kota Program (Tokenização)
FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om

# Credential Program (KYC)
FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt` },
  ],

  // ========== QUICKSTART ==========
  'quickstart': [
    { type: 'heading', level: 1, text: 'Quickstart', id: 'quickstart' },
    { type: 'paragraph', text: 'Este guia vai te ajudar a configurar o ambiente de desenvolvimento do Kota e rodar a plataforma localmente em poucos minutos.' },
    { type: 'callout', variant: 'info', title: 'Pré-requisitos', text: 'Certifique-se de ter instalado: **Node.js 20+**, **Docker 24+**, **Go 1.21+** e **Git**.' },
    { type: 'heading', level: 2, text: '1. Clone o Repositório', id: 'clone-repo' },
    { type: 'code', language: 'bash', code: `git clone https://github.com/kota-platform/platform.git
cd platform` },
    { type: 'heading', level: 2, text: '2. Configure as Variáveis de Ambiente', id: 'env-setup' },
    { type: 'code', language: 'bash', code: `# Copiar arquivo de configuração principal
cp .env.example .env

# Configurar serviços
cp services/api/.env.example services/api/.env
cp services/kyc-api/.env.example services/kyc-api/.env
cp services/indexer/.env.example services/indexer/.env
cp real_estate_program/app/.env.example real_estate_program/app/.env` },
    { type: 'heading', level: 2, text: '3. Inicie com Docker Compose', id: 'docker-start' },
    { type: 'code', language: 'bash', code: `# Iniciar todos os serviços
docker compose up -d

# Verificar status
docker compose ps

# Ver logs em tempo real
docker compose logs -f` },
    { type: 'heading', level: 2, text: '4. Verifique os Serviços', id: 'verify-services' },
    { type: 'table', headers: ['Serviço', 'URL', 'Descrição'], rows: [
      ['Frontend', 'http://localhost:5174', 'Interface React'],
      ['API Principal', 'http://localhost:3004/api/v1', 'Lógica de negócio'],
      ['API KYC', 'http://localhost:3005/api', 'Autenticação e KYC'],
      ['Indexador', 'http://localhost:9090', 'Dados da blockchain'],
      ['PostgreSQL', 'localhost:5436', 'Banco de dados'],
    ]},
    { type: 'code', language: 'bash', filename: 'Health Checks', code: `# Verificar API Principal
curl http://localhost:3004/api/v1/health

# Verificar API KYC
curl http://localhost:3005/api/health

# Verificar Indexador
curl http://localhost:9090/health` },
    { type: 'callout', variant: 'warning', title: 'Wallet Necessária', text: 'Para interagir com a plataforma, você precisará de uma wallet Solana como **Phantom** ou **Solflare** configurada para a **Devnet**.' },
    { type: 'heading', level: 2, text: '5. Configure sua Wallet', id: 'wallet-setup' },
    { type: 'code', language: 'bash', code: `# Instalar Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Configurar para Devnet
solana config set --url devnet

# Gerar nova wallet de teste
solana-keygen new -o ~/.config/solana/dev-wallet.json

# Solicitar SOL de teste
solana airdrop 5` },
  ],

  // ========== ARCHITECTURE ==========
  'architecture': [
    { type: 'heading', level: 1, text: 'Arquitetura', id: 'architecture' },
    { type: 'paragraph', text: 'O Kota utiliza uma arquitetura moderna e escalável, combinando smart contracts Solana com serviços backend e um frontend React.' },
    { type: 'heading', level: 2, text: 'Visão Geral dos Componentes', id: 'components-overview' },
    { type: 'diagram', mermaid: `graph LR
    subgraph Cliente
        FE[Frontend React]
        WA[Wallet Adapter]
    end
    subgraph APIs
        API[API Principal<br/>Node.js:3004]
        KYC[KYC API<br/>Node.js:3005]
    end
    subgraph Indexação
        IDX[Indexador<br/>Go:9090]
        PG[(PostgreSQL<br/>:5436)]
    end
    subgraph Blockchain
        RPC[Solana RPC]
        HP[Kota Program]
        CP[Credential Program]
    end
    FE --> API
    FE --> KYC
    FE --> WA
    WA --> RPC
    API --> PG
    KYC --> RPC
    IDX --> RPC
    IDX --> PG
    RPC --> HP
    RPC --> CP` },
    { type: 'heading', level: 2, text: 'Camadas da Arquitetura', id: 'layers' },
    { type: 'heading', level: 3, text: 'Frontend (React + Vite)', id: 'frontend-layer' },
    { type: 'list', ordered: false, items: [
      '**React 18** com TypeScript para tipagem estática',
      '**Vite** para build rápido e HMR',
      '**Tailwind CSS** para estilização',
      '**TanStack Query** para gerenciamento de estado servidor',
      '**Zustand** para estado local',
      '**@solana/wallet-adapter** para conexão com wallets',
    ]},
    { type: 'heading', level: 3, text: 'API Principal (Node.js)', id: 'api-layer' },
    { type: 'paragraph', text: 'Segue o padrão **Clean Architecture** (Ports & Adapters):' },
    { type: 'code', language: 'text', code: `src/
├── interfaces/          # Controllers, Routes, Middleware
├── application/         # Use Cases, DTOs, Services
├── domain/             # Entities, Value Objects, Interfaces
└── infrastructure/     # Repositories, Adapters, Config` },
    { type: 'heading', level: 3, text: 'Indexador (Go)', id: 'indexer-layer' },
    { type: 'paragraph', text: 'Serviço em Go que monitora a blockchain e indexa dados no PostgreSQL:' },
    { type: 'list', ordered: false, items: [
      'Polling a cada 60 segundos',
      'Decodificação de contas Anchor',
      'Fetch de metadados IPFS',
      'Persistência no PostgreSQL',
    ]},
    { type: 'heading', level: 3, text: 'Smart Contracts (Anchor)', id: 'contracts-layer' },
    { type: 'table', headers: ['Programa', 'Responsabilidade'], rows: [
      ['Kota Program', 'Tokenização de propriedades, investimentos, dividendos'],
      ['Credential Program', 'Emissão e verificação de credenciais KYC'],
    ]},
    { type: 'heading', level: 2, text: 'Fluxo de Dados', id: 'data-flow' },
    { type: 'diagram', mermaid: `sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant API as API
    participant BC as Blockchain
    participant IDX as Indexador
    participant DB as PostgreSQL
    U->>FE: Conecta wallet
    FE->>BC: Verifica KYC
    BC-->>FE: Credencial válida
    U->>FE: Investe em propriedade
    FE->>BC: Envia transação
    BC-->>FE: Confirmação
    IDX->>BC: Polling (60s)
    BC-->>IDX: Novos dados
    IDX->>DB: Persiste
    FE->>API: Busca portfolio
    API->>DB: Query
    DB-->>API: Dados
    API-->>FE: Portfolio` },
  ],

  // ========== TOKENIZATION ==========
  'tokenization': [
    { type: 'heading', level: 1, text: 'Tokenização de Imóveis', id: 'tokenization' },
    { type: 'paragraph', text: 'A tokenização transforma propriedades imobiliárias em tokens digitais na blockchain Solana, permitindo investimento fracionado, liquidez instantânea e transparência total.' },
    { type: 'heading', level: 2, text: 'Como Funciona', id: 'how-it-works' },
    { type: 'diagram', mermaid: `graph TD
    A[Propriedade Física] --> B[Avaliação e Due Diligence]
    B --> C[Documentação Legal]
    C --> D[Criação do Token SPL-2022]
    D --> E[Configuração Transfer Hook]
    E --> F[Listagem na Plataforma]
    F --> G[Investidores Compram Tokens]
    G --> H[Recebem Dividendos]` },
    { type: 'heading', level: 2, text: 'Processo de Tokenização', id: 'tokenization-process' },
    { type: 'steps', steps: [
      { title: 'Avaliação do Imóvel', content: 'Propriedade é avaliada por profissionais certificados e tem sua documentação verificada.' },
      { title: 'Estruturação Legal', content: 'Criação de SPV (Special Purpose Vehicle) ou estrutura legal apropriada.' },
      { title: 'Criação do Token', content: 'Token SPL Token-2022 é criado representando 100% da propriedade.' },
      { title: 'Configuração de Compliance', content: 'Transfer Hook é configurado para validar KYC em todas as transferências.' },
      { title: 'Listagem', content: 'Propriedade é listada na plataforma com detalhes e documentação.' },
    ]},
    { type: 'heading', level: 2, text: 'Token SPL Token-2022', id: 'spl-token-2022' },
    { type: 'paragraph', text: 'Utilizamos o padrão **SPL Token-2022** (Token Extensions) que oferece funcionalidades avançadas:' },
    { type: 'table', headers: ['Extensão', 'Uso no Kota'], rows: [
      ['Transfer Hook', 'Validação de KYC em cada transferência'],
      ['Metadata', 'Informações da propriedade on-chain'],
      ['Permanent Delegate', 'Recuperação em caso de emergência'],
    ]},
    { type: 'code', language: 'rust', filename: 'Estrutura do Token', code: `// Criação do mint com Transfer Hook
let mint = Mint::new_with_extensions(
    &mint_keypair,
    decimals,
    &[
        ExtensionType::TransferHook,
        ExtensionType::MetadataPointer,
    ],
)?;

// Configurar Transfer Hook para validar KYC
transfer_hook::initialize(
    &program_id,
    &mint,
    &transfer_hook_program_id,
)?;` },
    { type: 'heading', level: 2, text: 'Benefícios da Tokenização', id: 'benefits' },
    { type: 'table', headers: ['Benefício', 'Descrição'], rows: [
      ['Fracionamento', 'Invista a partir de pequenos valores (R$ 100)'],
      ['Liquidez', 'Negocie tokens 24/7 sem intermediários'],
      ['Transparência', 'Todas as transações registradas na blockchain'],
      ['Automação', 'Dividendos distribuídos automaticamente'],
      ['Compliance', 'KYC verificado on-chain em cada transferência'],
      ['Custos Reduzidos', 'Sem cartórios, sem corretores, taxas mínimas'],
    ]},
  ],

  // ========== INVESTMENT FLOW ==========
  'investment-flow': [
    { type: 'heading', level: 1, text: 'Fluxo de Investimento', id: 'investment-flow' },
    { type: 'paragraph', text: 'O processo de investimento no Kota é simples e transparente, utilizando smart contracts para garantir segurança e automação.' },
    { type: 'heading', level: 2, text: 'Visão Geral do Fluxo', id: 'flow-overview' },
    { type: 'diagram', mermaid: `sequenceDiagram
    participant I as Investidor
    participant W as Wallet
    participant FE as Frontend
    participant KP as Kota Program
    participant CP as Credential Program
    I->>W: Conecta wallet
    W->>FE: Wallet conectada
    FE->>CP: Verifica credencial KYC
    CP-->>FE: Credencial válida
    I->>FE: Seleciona propriedade
    I->>FE: Define valor investimento
    FE->>W: Solicita assinatura
    W->>KP: Envia transação invest()
    KP->>KP: Valida KYC via Transfer Hook
    KP->>KP: Calcula tokens
    KP->>KP: Distribui fees
    KP->>KP: Minta tokens
    KP-->>W: Tokens recebidos
    W-->>FE: Sucesso` },
    { type: 'heading', level: 2, text: 'Etapas do Investimento', id: 'steps' },
    { type: 'steps', steps: [
      { title: 'Conectar Wallet', content: 'Conecte sua wallet Solana (Phantom, Solflare, Backpack, etc.)' },
      { title: 'Completar KYC', content: 'Verifique sua identidade para obter credencial on-chain (válida por 2 anos)' },
      { title: 'Escolher Propriedade', content: 'Navegue pelas propriedades disponíveis, analise yield, localização e documentação' },
      { title: 'Definir Valor', content: 'Escolha quanto deseja investir (mínimo R$ 100 ou equivalente em SOL)' },
      { title: 'Confirmar Transação', content: 'Revise os detalhes e assine a transação na sua wallet' },
      { title: 'Receber Tokens', content: 'Tokens são mintados diretamente para sua wallet' },
    ]},
    { type: 'heading', level: 2, text: 'Distribuição de Fees', id: 'fees' },
    { type: 'paragraph', text: 'Quando você investe, o valor é distribuído da seguinte forma:' },
    { type: 'table', headers: ['Destino', 'Percentual', 'Descrição'], rows: [
      ['Vendedor (Escrow)', '96.5%', 'Valor principal, liberado conforme milestones'],
      ['Plataforma', '2.0%', 'Taxa de serviço da plataforma'],
      ['Reserva', '1.5%', 'Fundo de manutenção e emergências'],
    ]},
    { type: 'code', language: 'rust', filename: 'Cálculo de Fees', code: `// Constantes de fee (em basis points)
const PLATFORM_FEE_BPS: u64 = 200;   // 2.0%
const RESERVE_FEE_BPS: u64 = 150;    // 1.5%
const BPS_DIVISOR: u64 = 10_000;

// Cálculo
let platform_fee = amount * PLATFORM_FEE_BPS / BPS_DIVISOR;
let reserve_fee = amount * RESERVE_FEE_BPS / BPS_DIVISOR;
let seller_amount = amount - platform_fee - reserve_fee;

// Tokens mintados baseado no valor para o vendedor
let tokens = (seller_amount * total_supply) / total_value_usd;` },
    { type: 'heading', level: 2, text: 'Sistema de Escrow', id: 'escrow' },
    { type: 'paragraph', text: 'O valor investido vai para um **escrow inteligente** que libera fundos progressivamente:' },
    { type: 'table', headers: ['Milestone', '% Liberado', 'Condição'], rows: [
      ['Inicial', '30%', 'Ao atingir 30% das vendas'],
      ['Intermediário', '30%', 'Ao atingir 60% das vendas'],
      ['Final', '40%', 'Ao atingir 100% das vendas'],
    ]},
  ],

  // ========== DIVIDENDS ==========
  'dividends': [
    { type: 'heading', level: 1, text: 'Distribuição de Dividendos', id: 'dividends' },
    { type: 'paragraph', text: 'O sistema de dividendos do Kota utiliza epochs para distribuir receitas de forma proporcional e transparente aos detentores de tokens.' },
    { type: 'heading', level: 2, text: 'Sistema de Epochs', id: 'epochs' },
    { type: 'paragraph', text: 'Uma **epoch** representa um período de distribuição de dividendos. Quando receita é depositada, uma nova epoch é criada com um snapshot do supply atual.' },
    { type: 'diagram', mermaid: `graph LR
    A[Admin deposita receita] --> B[Nova Epoch criada]
    B --> C[Snapshot do supply]
    C --> D[Investidores podem claim]
    D --> E[Dividendo = balance/supply * total]` },
    { type: 'heading', level: 2, text: 'Cálculo do Dividendo', id: 'calculation' },
    { type: 'code', language: 'typescript', code: `// Fórmula do dividendo
const shareholderDividend = (
  holderBalance / totalSupplyAtEpoch
) * epochRevenue;

// Exemplo:
// - Holder tem 1.000 tokens
// - Total supply na epoch: 100.000 tokens
// - Receita da epoch: 10 SOL
// - Dividendo = (1000 / 100000) * 10 = 0.1 SOL` },
    { type: 'heading', level: 2, text: 'Fluxo de Distribuição', id: 'distribution-flow' },
    { type: 'steps', steps: [
      { title: 'Depósito de Receita', content: 'Admin deposita receita via `deposit_revenue()` criando nova epoch' },
      { title: 'Snapshot', content: 'Sistema registra o supply circulante no momento do depósito' },
      { title: 'Disponibilização', content: 'Dividendos ficam disponíveis para resgate imediatamente' },
      { title: 'Claim', content: 'Investidores chamam `claim()` para resgatar seus dividendos' },
      { title: 'Transferência', content: 'SOL é transferido diretamente para a wallet do investidor' },
    ]},
    { type: 'code', language: 'rust', filename: 'deposit_revenue.rs', code: `pub fn deposit_revenue(
    ctx: Context<DepositRevenue>,
    epoch: u32,
    amount: u64,
) -> Result<()> {
    let property = &mut ctx.accounts.property_state;

    // Verificar que é a próxima epoch
    require!(epoch == property.current_epoch + 1, InvalidEpoch);

    // Criar registro da epoch
    let epoch_state = &mut ctx.accounts.epoch_state;
    epoch_state.property = property.mint;
    epoch_state.epoch = epoch;
    epoch_state.total_amount = amount;
    epoch_state.total_supply_at_epoch = property.circulating_supply;
    epoch_state.deposited_at = Clock::get()?.unix_timestamp;

    // Transferir para vault
    transfer_sol(&ctx.accounts.authority, &ctx.accounts.vault, amount)?;

    property.current_epoch = epoch;
    Ok(())
}` },
    { type: 'callout', variant: 'info', title: 'Importante', text: 'Dividendos não resgatados **não expiram**. Você pode fazer claim a qualquer momento.' },
  ],

  // ========== KYC CREDENTIALS ==========
  'kyc-credentials': [
    { type: 'heading', level: 1, text: 'KYC e Credenciais', id: 'kyc-credentials' },
    { type: 'paragraph', text: 'O Kota implementa verificação de identidade (KYC) on-chain através do **Credential Program**, garantindo compliance regulatório de forma descentralizada.' },
    { type: 'heading', level: 2, text: 'Por que KYC On-chain?', id: 'why-onchain' },
    { type: 'list', ordered: false, items: [
      '**Privacidade** - Nenhum dado pessoal é armazenado on-chain, apenas hashes criptográficos',
      '**Portabilidade** - Uma verificação vale para toda a plataforma',
      '**Compliance** - Transfer Hook impede transferências para wallets sem KYC',
      '**Transparência** - Status verificável publicamente',
    ]},
    { type: 'heading', level: 2, text: 'Tipos de Credenciais', id: 'credential-types' },
    { type: 'table', headers: ['Tipo', 'Descrição', 'Validade', 'Requisitos'], rows: [
      ['KycBasic', 'Verificação básica', '2 anos', 'Nome, email, telefone'],
      ['KycFull', 'Verificação completa', '2 anos', 'Documentos, selfie, comprovante'],
      ['AccreditedInvestor', 'Investidor qualificado', '1 ano', 'Comprovação de renda/patrimônio'],
      ['BrazilianCpf', 'CPF brasileiro', '2 anos', 'Validação na Receita Federal'],
      ['BrazilianCnpj', 'CNPJ brasileiro', '2 anos', 'Validação para PJ'],
    ]},
    { type: 'heading', level: 2, text: 'Fluxo de Verificação', id: 'verification-flow' },
    { type: 'diagram', mermaid: `sequenceDiagram
    participant U as Usuário
    participant FE as Frontend
    participant API as KYC API
    participant IPFS as IPFS
    participant CP as Credential Program
    U->>FE: Inicia verificação
    FE->>API: Cria sessão KYC
    API-->>FE: Session ID
    U->>FE: Preenche dados
    U->>FE: Upload documentos
    FE->>IPFS: Armazena documentos
    IPFS-->>FE: CID
    FE->>API: Submete para análise
    API->>API: Verifica documentos
    API->>CP: Issue credential
    CP-->>API: Credencial emitida
    API-->>FE: KYC aprovado` },
    { type: 'heading', level: 2, text: 'Estrutura da Credencial', id: 'credential-structure' },
    { type: 'code', language: 'rust', filename: 'UserCredential Account', code: `#[account]
pub struct UserCredential {
    pub wallet: Pubkey,              // Wallet do usuário
    pub issuer: Pubkey,              // Emissor da credencial
    pub credential_type: CredentialType,
    pub status: CredentialStatus,    // Active, Expired, Revoked
    pub issued_at: i64,              // Timestamp de emissão
    pub expires_at: i64,             // Timestamp de expiração
    pub metadata_hash: [u8; 32],     // Hash dos dados (IPFS)
    pub bump: u8,
}

// PDA Seed: ["credential", wallet.key()]` },
    { type: 'heading', level: 2, text: 'Status da Credencial', id: 'credential-status' },
    { type: 'table', headers: ['Status', 'Descrição', 'Pode Transferir?'], rows: [
      ['Active', 'Credencial válida e ativa', 'Sim'],
      ['Expired', 'Credencial expirou, precisa renovar', 'Não'],
      ['Revoked', 'Credencial revogada por violação', 'Não'],
      ['Suspended', 'Temporariamente suspensa', 'Não'],
    ]},
  ],

  // ========== TRANSFER HOOK ==========
  'transfer-hook': [
    { type: 'heading', level: 1, text: 'Transfer Hook', id: 'transfer-hook' },
    { type: 'paragraph', text: 'O Transfer Hook é uma extensão do SPL Token-2022 que permite executar lógica customizada em cada transferência de tokens. No Kota, é usado para validar credenciais KYC.' },
    { type: 'callout', variant: 'warning', title: 'Obrigatório', text: 'O Transfer Hook é invocado **automaticamente** pelo runtime do Token-2022 em cada transferência. **Não pode ser bypassado ou ignorado.**' },
    { type: 'heading', level: 2, text: 'Como Funciona', id: 'how-it-works' },
    { type: 'diagram', mermaid: `sequenceDiagram
    participant S as Sender
    participant T as Token Program
    participant TH as Transfer Hook
    participant CP as Credential Program
    participant R as Receiver
    S->>T: transfer(amount)
    T->>TH: execute_transfer_hook()
    TH->>CP: Busca credencial do receiver
    CP-->>TH: Credencial
    TH->>TH: Valida status = Active
    TH->>TH: Valida não expirou
    alt Credencial válida
        TH-->>T: OK
        T->>R: Tokens transferidos
    else Credencial inválida
        TH-->>T: Error
        T-->>S: Transação falha
    end` },
    { type: 'heading', level: 2, text: 'Implementação', id: 'implementation' },
    { type: 'code', language: 'rust', filename: 'transfer_hook.rs', code: `pub fn transfer_hook(ctx: Context<TransferHook>, amount: u64) -> Result<()> {
    // Buscar credencial do destinatário
    let credential = &ctx.accounts.destination_credential;

    // Verificar status ativo
    require!(
        credential.status == CredentialStatus::Active,
        KotaError::InvalidCredential
    );

    // Verificar não expirou
    let now = Clock::get()?.unix_timestamp;
    require!(
        credential.expires_at > now,
        KotaError::ExpiredCredential
    );

    msg!("Transfer Hook: KYC validated for {} tokens", amount);
    Ok(())
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    #[account(
        seeds = [b"credential", destination.key().as_ref()],
        bump,
        seeds::program = credential_program.key()
    )]
    pub destination_credential: Account<'info, UserCredential>,

    /// CHECK: Validated by Token-2022
    pub destination: AccountInfo<'info>,

    pub credential_program: Program<'info, CredentialProgram>,
}` },
    { type: 'heading', level: 2, text: 'Cenários de Falha', id: 'failure-scenarios' },
    { type: 'table', headers: ['Cenário', 'Erro', 'Solução'], rows: [
      ['Sem credencial', 'InvalidCredential', 'Destinatário deve completar KYC'],
      ['Credencial expirada', 'ExpiredCredential', 'Destinatário deve renovar KYC'],
      ['Credencial revogada', 'InvalidCredential', 'Destinatário está bloqueado'],
    ]},
  ],

  // ========== KOTA PROGRAM ==========
  'kota-program': [
    { type: 'heading', level: 1, text: 'Kota Program', id: 'kota-program' },
    { type: 'paragraph', text: 'O Kota Program é o smart contract principal da plataforma, responsável pela tokenização de propriedades, processamento de investimentos e distribuição de dividendos.' },
    { type: 'code', language: 'bash', filename: 'Program ID', code: 'FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om' },
    { type: 'heading', level: 2, text: 'Visão Geral', id: 'overview' },
    { type: 'table', headers: ['Característica', 'Valor'], rows: [
      ['Framework', 'Anchor 0.30.1'],
      ['Token Standard', 'SPL Token-2022'],
      ['Extensões', 'Transfer Hook, Metadata'],
      ['Rede', 'Devnet (atual) / Mainnet (prod)'],
    ]},
    { type: 'heading', level: 2, text: 'Instruções', id: 'instructions' },
    { type: 'table', headers: ['Instrução', 'Descrição', 'Autorização'], rows: [
      ['create_property_mint', 'Cria nova propriedade tokenizada', 'Admin'],
      ['mint_property_tokens', 'Minta tokens para investidor', 'Admin'],
      ['burn_property_tokens', 'Queima tokens (redemption)', 'Holder'],
      ['invest_in_property', 'Processa investimento', 'Usuário KYC'],
      ['deposit_revenue', 'Deposita receita para dividendos', 'Admin'],
      ['claim', 'Resgata dividendos', 'Holder'],
      ['transfer_hook', 'Valida KYC em transferências', 'Automático'],
      ['toggle_property_status', 'Ativa/desativa propriedade', 'Admin'],
    ]},
    { type: 'heading', level: 2, text: 'PropertyState', id: 'property-state' },
    { type: 'code', language: 'rust', filename: 'PropertyState Account', code: `#[account]
pub struct PropertyState {
    // Identificação
    pub mint: Pubkey,                    // Token mint address
    pub authority: Pubkey,               // Pode mintar e atualizar
    pub seller_wallet: Pubkey,           // Recebe 96.5% dos investimentos

    // Token Info
    pub property_name: String,           // Max 50 chars
    pub property_symbol: String,         // Max 10 chars (ticker)
    pub total_supply: u64,               // Max tokens mintáveis
    pub circulating_supply: u64,         // Tokens em circulação
    pub decimals: u8,                    // Casas decimais (geralmente 6)

    // Detalhes da Propriedade
    pub details: PropertyDetails,

    // Status
    pub is_active: bool,                 // Minting habilitado?
    pub current_epoch: u32,              // Epoch atual de dividendos

    // Timestamps
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

// PDA Seed: ["property", mint.key()]` },
    { type: 'heading', level: 2, text: 'PropertyDetails', id: 'property-details' },
    { type: 'code', language: 'rust', filename: 'PropertyDetails Struct', code: `#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct PropertyDetails {
    pub property_type: String,           // "residential", "commercial", etc
    pub location: String,                // Endereço ou cidade
    pub total_value_usd: u64,            // Valor total em centavos USD
    pub annual_yield: u32,               // Yield anual em basis points
    pub metadata_uri: String,            // IPFS URI para metadados completos
    pub image: String,                   // IPFS hash da imagem principal
}` },
    { type: 'heading', level: 2, text: 'Erros', id: 'errors' },
    { type: 'table', headers: ['Código', 'Nome', 'Descrição'], rows: [
      ['6000', 'Unauthorized', 'Caller não tem permissão'],
      ['6001', 'InvalidStatus', 'Propriedade está inativa'],
      ['6002', 'InsufficientFunds', 'Saldo insuficiente'],
      ['6003', 'InvalidCredential', 'Credencial KYC inválida'],
      ['6004', 'ExpiredCredential', 'Credencial KYC expirada'],
      ['6005', 'NoClaimableAmount', 'Nenhum dividendo disponível'],
      ['6006', 'AlreadyClaimed', 'Epoch já foi resgatada'],
      ['6007', 'InvalidEpoch', 'Número de epoch inválido'],
      ['6008', 'SupplyExceeded', 'Supply máximo atingido'],
    ]},
  ],

  // ========== CREDENTIAL PROGRAM ==========
  'credential-program': [
    { type: 'heading', level: 1, text: 'Credential Program', id: 'credential-program' },
    { type: 'paragraph', text: 'O Credential Program gerencia a emissão, renovação e revogação de credenciais KYC na blockchain Solana.' },
    { type: 'code', language: 'bash', filename: 'Program ID', code: 'FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt' },
    { type: 'heading', level: 2, text: 'Arquitetura', id: 'architecture' },
    { type: 'diagram', mermaid: `graph TB
    subgraph Contas
        CN[CredentialNetwork]
        CI[CredentialIssuer]
        UC[UserCredential]
    end
    subgraph Instruções
        IN[initialize_network]
        RI[register_issuer]
        IC[issue_credential]
        VC[verify_credential]
        RC[revoke_credential]
        RF[refresh_credential]
    end
    IN --> CN
    RI --> CI
    IC --> UC
    VC --> UC
    RC --> UC
    RF --> UC` },
    { type: 'heading', level: 2, text: 'Contas', id: 'accounts' },
    { type: 'heading', level: 3, text: 'CredentialNetwork', id: 'credential-network' },
    { type: 'code', language: 'rust', code: `#[account]
pub struct CredentialNetwork {
    pub admin: Pubkey,           // Admin da rede
    pub total_issuers: u32,      // Contagem de issuers
    pub total_credentials: u64,  // Contagem total
    pub is_paused: bool,         // Pausa global
    pub bump: u8,
}
// PDA Seed: ["network"]` },
    { type: 'heading', level: 3, text: 'CredentialIssuer', id: 'credential-issuer' },
    { type: 'code', language: 'rust', code: `#[account]
pub struct CredentialIssuer {
    pub authority: Pubkey,       // Wallet do issuer
    pub name: String,            // Nome do issuer
    pub is_active: bool,         // Pode emitir?
    pub credentials_issued: u64, // Contagem
    pub bump: u8,
}
// PDA Seed: ["issuer", authority.key()]` },
    { type: 'heading', level: 3, text: 'UserCredential', id: 'user-credential' },
    { type: 'code', language: 'rust', code: `#[account]
pub struct UserCredential {
    pub wallet: Pubkey,
    pub issuer: Pubkey,
    pub credential_type: CredentialType,
    pub status: CredentialStatus,
    pub issued_at: i64,
    pub expires_at: i64,
    pub metadata_hash: [u8; 32],
    pub bump: u8,
}
// PDA Seed: ["credential", wallet.key()]` },
    { type: 'heading', level: 2, text: 'Instruções', id: 'instructions' },
    { type: 'table', headers: ['Instrução', 'Descrição', 'Autorização'], rows: [
      ['initialize_network', 'Inicializa a rede de credenciais', 'Deploy'],
      ['register_issuer', 'Registra novo emissor KYC', 'Admin'],
      ['issue_credential', 'Emite credencial para wallet', 'Issuer'],
      ['verify_credential', 'Verifica status (view)', 'Público'],
      ['revoke_credential', 'Revoga credencial', 'Issuer/Admin'],
      ['refresh_credential', 'Renova credencial existente', 'Issuer'],
    ]},
  ],

  // ========== INSTRUCTIONS ==========
  'instructions': [
    { type: 'heading', level: 1, text: 'Instruções dos Smart Contracts', id: 'instructions' },
    { type: 'paragraph', text: 'Referência completa de todas as instruções disponíveis nos programas Kota e Credential.' },
    { type: 'heading', level: 2, text: 'Kota Program', id: 'kota-instructions' },
    { type: 'heading', level: 3, text: 'create_property_mint', id: 'create-property' },
    { type: 'code', language: 'rust', code: `pub fn create_property_mint(
    ctx: Context<CreatePropertyMint>,
    name: String,              // Nome da propriedade (max 50)
    symbol: String,            // Símbolo do token (max 10)
    decimals: u8,              // Casas decimais (geralmente 6)
    total_supply: u64,         // Supply máximo
    details: PropertyDetails,  // Metadados da propriedade
) -> Result<()>` },
    { type: 'heading', level: 3, text: 'invest_in_property', id: 'invest' },
    { type: 'code', language: 'rust', code: `pub fn invest_in_property(
    ctx: Context<InvestInProperty>,
    amount: u64,  // Valor em lamports (SOL)
) -> Result<()>

// Contas necessárias:
// - investor: Signer (pagador)
// - property_state: Propriedade alvo
// - investor_token_account: ATA do investidor
// - credential: PDA da credencial KYC
// - platform_treasury: Wallet da plataforma
// - reserve_treasury: Wallet de reserva
// - escrow: Escrow da propriedade` },
    { type: 'heading', level: 3, text: 'deposit_revenue', id: 'deposit' },
    { type: 'code', language: 'rust', code: `pub fn deposit_revenue(
    ctx: Context<DepositRevenue>,
    epoch: u32,    // Número da epoch (deve ser current + 1)
    amount: u64,   // Valor em lamports
) -> Result<()>` },
    { type: 'heading', level: 3, text: 'claim', id: 'claim' },
    { type: 'code', language: 'rust', code: `pub fn claim(
    ctx: Context<Claim>,
    epoch: u32,  // Epoch para resgatar
) -> Result<()>

// Retorna erro se:
// - Epoch não existe
// - Já foi resgatado
// - Nenhum valor disponível` },
    { type: 'heading', level: 2, text: 'Credential Program', id: 'credential-instructions' },
    { type: 'heading', level: 3, text: 'issue_credential', id: 'issue' },
    { type: 'code', language: 'rust', code: `pub fn issue_credential(
    ctx: Context<IssueCredential>,
    credential_type: CredentialType,
    metadata_hash: [u8; 32],  // Hash SHA256 dos dados
    expires_in_days: u16,     // Validade em dias
) -> Result<()>` },
    { type: 'heading', level: 3, text: 'revoke_credential', id: 'revoke' },
    { type: 'code', language: 'rust', code: `pub fn revoke_credential(
    ctx: Context<RevokeCredential>,
    reason: String,  // Motivo da revogação
) -> Result<()>` },
  ],

  // ========== ACCOUNTS ==========
  'accounts': [
    { type: 'heading', level: 1, text: 'Contas e PDAs', id: 'accounts' },
    { type: 'paragraph', text: 'Os programas utilizam Program Derived Addresses (PDAs) para armazenar dados de forma determinística.' },
    { type: 'heading', level: 2, text: 'O que são PDAs?', id: 'what-are-pdas' },
    { type: 'paragraph', text: 'PDAs são endereços derivados deterministicamente a partir de seeds e um program ID. Não possuem chave privada, então apenas o programa pode assinar por elas.' },
    { type: 'code', language: 'rust', code: `// Derivação de PDA
let (pda, bump) = Pubkey::find_program_address(
    &[b"property", mint.key().as_ref()],
    program_id
);` },
    { type: 'heading', level: 2, text: 'PDAs do Kota Program', id: 'kota-pdas' },
    { type: 'table', headers: ['Conta', 'Seeds', 'Descrição'], rows: [
      ['PropertyState', '["property", mint]', 'Estado da propriedade'],
      ['EpochState', '["epoch", property, epoch_bytes]', 'Estado de uma epoch'],
      ['InvestorState', '["investor", property, wallet]', 'Estado do investidor'],
      ['Escrow', '["escrow", property]', 'Escrow de fundos'],
      ['DividendVault', '["vault", property]', 'Vault de dividendos'],
    ]},
    { type: 'heading', level: 2, text: 'PDAs do Credential Program', id: 'credential-pdas' },
    { type: 'table', headers: ['Conta', 'Seeds', 'Descrição'], rows: [
      ['CredentialNetwork', '["network"]', 'Config global da rede'],
      ['CredentialIssuer', '["issuer", authority]', 'Emissor registrado'],
      ['UserCredential', '["credential", wallet]', 'Credencial do usuário'],
    ]},
    { type: 'heading', level: 2, text: 'Exemplo de Derivação', id: 'derivation-example' },
    { type: 'code', language: 'typescript', filename: 'TypeScript', code: `import { PublicKey } from '@solana/web3.js';

// Derivar PDA de PropertyState
const [propertyPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("property"), mint.toBuffer()],
  KOTA_PROGRAM_ID
);

// Derivar PDA de UserCredential
const [credentialPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("credential"), wallet.toBuffer()],
  CREDENTIAL_PROGRAM_ID
);` },
  ],

  // ========== API OVERVIEW ==========
  'api-overview': [
    { type: 'heading', level: 1, text: 'Visão Geral das APIs', id: 'api-overview' },
    { type: 'paragraph', text: 'O Kota possui duas APIs principais que trabalham em conjunto para fornecer uma experiência completa.' },
    { type: 'diagram', mermaid: `graph LR
    FE[Frontend] --> API[API Principal<br/>:3004]
    FE --> KYC[KYC API<br/>:3005]
    API --> DB[(PostgreSQL)]
    API --> RPC[Solana RPC]
    KYC --> RPC
    KYC --> DB` },
    { type: 'heading', level: 2, text: 'Serviços', id: 'services' },
    { type: 'table', headers: ['API', 'Porta', 'Responsabilidade'], rows: [
      ['API Principal', '3004', 'Propriedades, investimentos, portfolio, analytics'],
      ['KYC API', '3005', 'Autenticação wallet, KYC sessions, credenciais'],
      ['Indexador', '9090', 'Indexação de dados da blockchain'],
    ]},
    { type: 'heading', level: 2, text: 'Autenticação', id: 'authentication' },
    { type: 'paragraph', text: 'A autenticação utiliza **Sign-In with Solana** - assinatura de mensagem com a wallet:' },
    { type: 'code', language: 'typescript', code: `// 1. Solicitar nonce
const { nonce } = await fetch('/api/auth/nonce', {
  method: 'POST',
  body: JSON.stringify({ wallet: publicKey.toString() })
}).then(r => r.json());

// 2. Assinar mensagem
const message = \`Sign this message to authenticate: \${nonce}\`;
const signature = await signMessage(new TextEncoder().encode(message));

// 3. Verificar e obter JWT
const { token } = await fetch('/api/auth/verify', {
  method: 'POST',
  body: JSON.stringify({
    wallet: publicKey.toString(),
    signature: bs58.encode(signature),
    message
  })
}).then(r => r.json());

// 4. Usar JWT nas requisições
headers: { Authorization: \`Bearer \${token}\` }` },
    { type: 'heading', level: 2, text: 'Rate Limiting', id: 'rate-limiting' },
    { type: 'callout', variant: 'warning', title: 'Limite', text: '**100 requisições** por IP a cada **15 minutos**. Exceder o limite resulta em erro 429.' },
  ],

  // ========== API PRINCIPAL ==========
  'api-principal': [
    { type: 'heading', level: 1, text: 'API Principal', id: 'api-principal' },
    { type: 'paragraph', text: 'Serviço Node.js responsável pela lógica de negócio, gerenciamento de propriedades e cálculos de investimento.' },
    { type: 'code', language: 'bash', code: 'Base URL: http://localhost:3004/api/v1' },
    { type: 'heading', level: 2, text: 'Arquitetura', id: 'architecture' },
    { type: 'paragraph', text: 'Segue **Clean Architecture** com as seguintes camadas:' },
    { type: 'code', language: 'text', code: `src/
├── interfaces/          # Controllers, Routes, Middleware
│   └── http/
│       ├── routes/      # Definição das rotas
│       └── controllers/ # Handlers HTTP
├── application/         # Casos de uso
│   ├── useCases/        # Lógica de negócio
│   └── dtos/            # Data Transfer Objects
├── domain/              # Entidades e interfaces
│   ├── entities/        # Modelos de domínio
│   └── repositories/    # Interfaces de repositório
└── infrastructure/      # Implementações
    ├── repositories/    # Acesso a dados
    ├── services/        # Serviços externos
    └── config/          # Configurações` },
    { type: 'heading', level: 2, text: 'Principais Endpoints', id: 'endpoints' },
    { type: 'table', headers: ['Método', 'Endpoint', 'Descrição'], rows: [
      ['GET', '/properties', 'Lista propriedades'],
      ['GET', '/properties/:mint', 'Detalhes da propriedade'],
      ['GET', '/investors/:wallet/portfolio', 'Portfolio do investidor'],
      ['GET', '/investors/:wallet/claimable', 'Dividendos pendentes'],
      ['GET', '/users/:wallet/preferences', 'Preferências do usuário'],
      ['PUT', '/users/:wallet/preferences', 'Atualiza preferências'],
      ['GET', '/users/:wallet/activities', 'Histórico de atividades'],
      ['GET', '/dividends', 'Calendário de dividendos'],
      ['GET', '/stats', 'Estatísticas da plataforma'],
    ]},
  ],

  // ========== API KYC ==========
  'api-kyc': [
    { type: 'heading', level: 1, text: 'API KYC', id: 'api-kyc' },
    { type: 'paragraph', text: 'Serviço dedicado à autenticação via wallet, gerenciamento de sessões KYC e emissão de credenciais.' },
    { type: 'code', language: 'bash', code: 'Base URL: http://localhost:3005/api' },
    { type: 'heading', level: 2, text: 'Fluxo de Autenticação', id: 'auth-flow' },
    { type: 'diagram', mermaid: `sequenceDiagram
    participant C as Cliente
    participant A as KYC API
    participant W as Wallet
    C->>A: POST /auth/nonce {wallet}
    A-->>C: {nonce}
    C->>W: signMessage(nonce)
    W-->>C: signature
    C->>A: POST /auth/verify {wallet, signature}
    A->>A: Verifica assinatura Ed25519
    A-->>C: {token: JWT}` },
    { type: 'heading', level: 2, text: 'Endpoints de Auth', id: 'auth-endpoints' },
    { type: 'table', headers: ['Método', 'Endpoint', 'Descrição'], rows: [
      ['POST', '/auth/nonce', 'Gera nonce para assinatura'],
      ['POST', '/auth/verify', 'Verifica assinatura e retorna JWT'],
      ['GET', '/auth/me', 'Retorna dados do usuário autenticado'],
    ]},
    { type: 'heading', level: 2, text: 'Endpoints de KYC', id: 'kyc-endpoints' },
    { type: 'table', headers: ['Método', 'Endpoint', 'Descrição'], rows: [
      ['POST', '/kyc/session', 'Cria nova sessão KYC'],
      ['GET', '/kyc/session/:id', 'Status da sessão'],
      ['PUT', '/kyc/session/:id', 'Atualiza dados da sessão'],
      ['POST', '/kyc/session/:id/submit', 'Submete para verificação'],
    ]},
    { type: 'heading', level: 2, text: 'Endpoints de Credenciais', id: 'credential-endpoints' },
    { type: 'table', headers: ['Método', 'Endpoint', 'Descrição'], rows: [
      ['GET', '/credentials/:wallet', 'Verifica credencial'],
      ['POST', '/credentials/verify', 'Valida credencial on-chain'],
      ['POST', '/credentials/issue', 'Emite credencial (Admin)'],
      ['POST', '/credentials/refresh', 'Renova credencial (Admin)'],
      ['POST', '/credentials/revoke', 'Revoga credencial (Admin)'],
    ]},
  ],

  // ========== INDEXER ==========
  'indexer': [
    { type: 'heading', level: 1, text: 'Indexador', id: 'indexer' },
    { type: 'paragraph', text: 'Serviço Go que monitora a blockchain Solana e indexa transações do Kota Program para consulta eficiente.' },
    { type: 'code', language: 'bash', code: 'Base URL: http://localhost:9090' },
    { type: 'heading', level: 2, text: 'Arquitetura', id: 'architecture' },
    { type: 'diagram', mermaid: `graph TB
    subgraph Indexer
        SC[Scheduler<br/>60s interval]
        SY[Syncer]
        DC[Decoder]
        PR[Processor]
    end
    SC --> SY
    SY --> RPC[Solana RPC]
    RPC --> DC
    DC --> PR
    PR --> DB[(PostgreSQL)]
    subgraph IPFS
        IP[Pinata Gateway]
    end
    SY --> IP` },
    { type: 'heading', level: 2, text: 'Funcionamento', id: 'how-it-works' },
    { type: 'steps', steps: [
      { title: 'Scheduler', content: 'Dispara sincronização a cada 60 segundos' },
      { title: 'Syncer', content: 'Busca novas contas do programa na blockchain' },
      { title: 'Decoder', content: 'Decodifica dados das contas Anchor' },
      { title: 'IPFS Fetch', content: 'Busca metadados do Pinata Gateway' },
      { title: 'Processor', content: 'Persiste dados no PostgreSQL' },
    ]},
    { type: 'heading', level: 2, text: 'Endpoints', id: 'endpoints' },
    { type: 'table', headers: ['Método', 'Endpoint', 'Descrição'], rows: [
      ['GET', '/health', 'Health check'],
      ['GET', '/properties', 'Lista propriedades indexadas'],
      ['GET', '/properties/:mint', 'Detalhes da propriedade'],
    ]},
    { type: 'heading', level: 2, text: 'Schema do Banco', id: 'schema' },
    { type: 'code', language: 'sql', code: `CREATE TABLE properties (
    id SERIAL PRIMARY KEY,
    mint VARCHAR(44) UNIQUE NOT NULL,
    property_state_pda VARCHAR(44) NOT NULL,
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    authority VARCHAR(44) NOT NULL,
    seller_wallet VARCHAR(44),
    status VARCHAR(20) DEFAULT 'active',
    total_supply BIGINT DEFAULT 0,
    circulating_supply BIGINT DEFAULT 0,
    decimals INTEGER DEFAULT 0,
    property_type VARCHAR(50),
    location VARCHAR(255),
    total_value_usd BIGINT DEFAULT 0,
    annual_yield BIGINT DEFAULT 0,
    metadata_uri TEXT,
    image TEXT,
    current_epoch BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_indexed_slot BIGINT DEFAULT 0
);

CREATE INDEX idx_properties_mint ON properties(mint);
CREATE INDEX idx_properties_status ON properties(status);` },
  ],

  // ========== ENDPOINTS PROPERTIES ==========
  'endpoints-properties': [
    { type: 'heading', level: 1, text: 'Endpoints: Properties', id: 'endpoints-properties' },
    { type: 'heading', level: 2, text: 'GET /properties', id: 'list-properties' },
    { type: 'paragraph', text: 'Lista todas as propriedades tokenizadas.' },
    { type: 'code', language: 'bash', code: `curl http://localhost:3004/api/v1/properties` },
    { type: 'code', language: 'json', filename: 'Response', code: `{
  "success": true,
  "data": [
    {
      "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
      "name": "Edifício Aurora",
      "symbol": "AURORA",
      "propertyType": "commercial",
      "location": "São Paulo, SP",
      "totalValueUsd": 150000000,
      "annualYield": 850,
      "totalSupply": 1000000,
      "circulatingSupply": 450000,
      "image": "ipfs://QmXxx...",
      "status": "active"
    }
  ]
}` },
    { type: 'heading', level: 2, text: 'GET /properties/:mint', id: 'get-property' },
    { type: 'paragraph', text: 'Retorna detalhes completos de uma propriedade.' },
    { type: 'code', language: 'bash', code: `curl http://localhost:3004/api/v1/properties/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU` },
    { type: 'code', language: 'json', filename: 'Response', code: `{
  "success": true,
  "data": {
    "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "name": "Edifício Aurora",
    "symbol": "AURORA",
    "authority": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "sellerWallet": "Gx7fJoNKwRMVBj8nPQYVfq39TkMqLYC9SrCZWoEXsGT",
    "propertyType": "commercial",
    "location": "São Paulo, SP",
    "totalValueUsd": 150000000,
    "annualYield": 850,
    "totalSupply": 1000000,
    "circulatingSupply": 450000,
    "decimals": 6,
    "metadataUri": "ipfs://QmYyy...",
    "image": "ipfs://QmXxx...",
    "status": "active",
    "currentEpoch": 3,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}` },
  ],

  // ========== ENDPOINTS INVESTMENT ==========
  'endpoints-investment': [
    { type: 'heading', level: 1, text: 'Endpoints: Investment', id: 'endpoints-investment' },
    { type: 'heading', level: 2, text: 'GET /invest/quote', id: 'get-quote' },
    { type: 'paragraph', text: 'Calcula quote para um investimento antes de executar.' },
    { type: 'code', language: 'bash', code: `curl "http://localhost:3004/api/v1/invest/quote?mint=7xKXtg...&solAmount=10"` },
    { type: 'code', language: 'json', filename: 'Response', code: `{
  "success": true,
  "data": {
    "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "solAmount": 10,
    "solAmountLamports": 10000000000,
    "tokensToReceive": 1500,
    "platformFee": 0.2,
    "reserveFee": 0.15,
    "sellerAmount": 9.65,
    "pricePerToken": 0.00667,
    "percentageOfProperty": 0.15
  }
}` },
    { type: 'heading', level: 2, text: 'POST /invest', id: 'post-invest' },
    { type: 'paragraph', text: 'Inicia processo de investimento (retorna transação para assinar).' },
    { type: 'code', language: 'bash', code: `curl -X POST http://localhost:3004/api/v1/invest \\
  -H "Authorization: Bearer <jwt>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "mint": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "amount": 10000000000
  }'` },
  ],

  // ========== ENDPOINTS AUTH ==========
  'endpoints-auth': [
    { type: 'heading', level: 1, text: 'Endpoints: Authentication', id: 'endpoints-auth' },
    { type: 'heading', level: 2, text: 'POST /auth/nonce', id: 'request-nonce' },
    { type: 'code', language: 'bash', code: `curl -X POST http://localhost:3005/api/auth/nonce \\
  -H "Content-Type: application/json" \\
  -d '{"wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw"}'` },
    { type: 'code', language: 'json', filename: 'Response', code: `{
  "nonce": "a1b2c3d4e5f6...",
  "expiresAt": "2024-01-15T11:00:00Z"
}` },
    { type: 'heading', level: 2, text: 'POST /auth/verify', id: 'verify-signature' },
    { type: 'code', language: 'bash', code: `curl -X POST http://localhost:3005/api/auth/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
    "signature": "3xYz...",
    "message": "Sign this message to authenticate: a1b2c3d4e5f6..."
  }'` },
    { type: 'code', language: 'json', filename: 'Response', code: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": "24h",
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw"
}` },
    { type: 'heading', level: 2, text: 'GET /auth/me', id: 'get-current-user' },
    { type: 'code', language: 'bash', code: `curl http://localhost:3005/api/auth/me \\
  -H "Authorization: Bearer <jwt>"` },
  ],

  // ========== ENDPOINTS KYC ==========
  'endpoints-kyc': [
    { type: 'heading', level: 1, text: 'Endpoints: KYC Sessions', id: 'endpoints-kyc' },
    { type: 'heading', level: 2, text: 'POST /kyc/session', id: 'create-session' },
    { type: 'code', language: 'bash', code: `curl -X POST http://localhost:3005/api/kyc/session \\
  -H "Authorization: Bearer <jwt>" \\
  -H "Content-Type: application/json" \\
  -d '{"credentialType": "KycFull"}'` },
    { type: 'code', language: 'json', filename: 'Response', code: `{
  "sessionId": "sess_abc123",
  "status": "pending",
  "credentialType": "KycFull",
  "expiresAt": "2024-01-15T12:00:00Z"
}` },
    { type: 'heading', level: 2, text: 'PUT /kyc/session/:id', id: 'update-session' },
    { type: 'code', language: 'bash', code: `curl -X PUT http://localhost:3005/api/kyc/session/sess_abc123 \\
  -H "Authorization: Bearer <jwt>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fullName": "João Silva",
    "cpf": "123.456.789-00",
    "dateOfBirth": "1990-05-15",
    "address": "Rua Example, 123"
  }'` },
    { type: 'heading', level: 2, text: 'POST /kyc/session/:id/submit', id: 'submit-session' },
    { type: 'code', language: 'bash', code: `curl -X POST http://localhost:3005/api/kyc/session/sess_abc123/submit \\
  -H "Authorization: Bearer <jwt>"` },
  ],

  // ========== ENDPOINTS CREDENTIALS ==========
  'endpoints-credentials': [
    { type: 'heading', level: 1, text: 'Endpoints: Credentials', id: 'endpoints-credentials' },
    { type: 'heading', level: 2, text: 'GET /credentials/:wallet', id: 'get-credential' },
    { type: 'code', language: 'bash', code: `curl http://localhost:3005/api/credentials/AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw` },
    { type: 'code', language: 'json', filename: 'Response', code: `{
  "wallet": "AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw",
  "credentialType": "KycFull",
  "status": "Active",
  "issuedAt": "2024-01-10T10:00:00Z",
  "expiresAt": "2026-01-10T10:00:00Z",
  "issuer": "Gx7fJoNKwRMVBj8nPQYVfq39TkMqLYC9SrCZWoEXsGT"
}` },
    { type: 'heading', level: 2, text: 'POST /credentials/issue (Admin)', id: 'issue-credential' },
    { type: 'code', language: 'bash', code: `curl -X POST http://localhost:3005/api/credentials/issue \\
  -H "Authorization: Bearer <admin-jwt>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "wallet": "TargetWalletAddress...",
    "credentialType": "KycFull",
    "expiresInDays": 730
  }'` },
  ],

  // ========== DOCKER ==========
  'docker': [
    { type: 'heading', level: 1, text: 'Docker & Containers', id: 'docker' },
    { type: 'paragraph', text: 'O Kota utiliza Docker Compose para orquestrar todos os serviços em containers.' },
    { type: 'heading', level: 2, text: 'Serviços', id: 'services' },
    { type: 'table', headers: ['Serviço', 'Imagem', 'Porta Externa', 'Porta Interna'], rows: [
      ['postgres', 'postgres:15-alpine', '5436', '5432'],
      ['indexer', 'Build local (Go)', '9090', '9090'],
      ['api', 'Build local (Node)', '3004', '3002'],
      ['kyc-api', 'Build local (Node)', '3005', '3001'],
      ['frontend', 'Build local (React)', '5174', '5173'],
    ]},
    { type: 'heading', level: 2, text: 'Comandos Úteis', id: 'commands' },
    { type: 'code', language: 'bash', code: `# Iniciar todos os serviços
docker compose up -d

# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f api

# Parar todos os serviços
docker compose down

# Rebuild de um serviço
docker compose build api
docker compose up -d api

# Acessar shell do container
docker compose exec api sh

# Ver status dos containers
docker compose ps

# Limpar volumes (CUIDADO: apaga dados)
docker compose down -v` },
    { type: 'heading', level: 2, text: 'docker-compose.yml', id: 'compose-file' },
    { type: 'code', language: 'yaml', code: `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    ports:
      - "5436:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hub_indexer
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  indexer:
    build:
      context: ./services/indexer
    ports:
      - "9090:9090"
    depends_on:
      postgres:
        condition: service_healthy
    env_file:
      - ./services/indexer/.env

  api:
    build:
      context: ./services/api
      dockerfile: Dockerfile.dev
    ports:
      - "3004:3002"
    depends_on:
      - postgres
      - indexer
    env_file:
      - ./services/api/.env

  kyc-api:
    build:
      context: ./services/kyc-api
    ports:
      - "3005:3001"
    env_file:
      - ./services/kyc-api/.env

  frontend:
    build:
      context: ./real_estate_program/app
    ports:
      - "5174:5173"
    depends_on:
      - api
      - kyc-api

volumes:
  postgres-data:

networks:
  default:
    name: hub-network` },
  ],

  // ========== ENVIRONMENT ==========
  'environment': [
    { type: 'heading', level: 1, text: 'Variáveis de Ambiente', id: 'environment' },
    { type: 'paragraph', text: 'Configuração das variáveis de ambiente para cada serviço.' },
    { type: 'heading', level: 2, text: 'Variáveis Globais (.env)', id: 'global' },
    { type: 'code', language: 'bash', filename: '.env', code: `# Solana Configuration
SOLANA_RPC_URL=http://host.docker.internal:8899
SOLANA_WS_URL=ws://host.docker.internal:8900
SOLANA_NETWORK=localnet  # localnet | devnet | mainnet-beta

# Program IDs
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# Admin
ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
ISSUER_PRIVATE_KEY=` },
    { type: 'heading', level: 2, text: 'API Principal', id: 'api-env' },
    { type: 'code', language: 'bash', filename: 'services/api/.env', code: `PORT=3002
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hub_indexer

# Solana
SOLANA_RPC_URL=http://host.docker.internal:8899
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# IPFS (Pinata)
PINATA_API_KEY=your_key
PINATA_SECRET_KEY=your_secret

# CORS
CORS_ORIGINS=http://localhost:5174,http://localhost:3000` },
    { type: 'heading', level: 2, text: 'KYC API', id: 'kyc-env' },
    { type: 'code', language: 'bash', filename: 'services/kyc-api/.env', code: `PORT=3001
NODE_ENV=development

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
CREDENTIAL_PROGRAM_ID=FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt

# Admin & Issuer
ADMIN_WALLET=AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw
ISSUER_PRIVATE_KEY=base58_encoded_key

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGINS=http://localhost:5174` },
    { type: 'heading', level: 2, text: 'Indexador', id: 'indexer-env' },
    { type: 'code', language: 'bash', filename: 'services/indexer/.env', code: `# Solana
SOLANA_RPC_URL=http://host.docker.internal:8899
PROGRAM_ID=FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om

# Database
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/hub_indexer

# Server
SERVER_HOST=0.0.0.0
SERVER_PORT=9090

# Indexer
INDEXER_INTERVAL=60s
INDEXER_ENABLED=true` },
  ],

  // ========== DEPLOYMENT ==========
  'deployment': [
    { type: 'heading', level: 1, text: 'Deploy', id: 'deployment' },
    { type: 'paragraph', text: 'Guia para deploy em produção.' },
    { type: 'heading', level: 2, text: 'Checklist de Produção', id: 'checklist' },
    { type: 'list', ordered: false, items: [
      'Variáveis de ambiente configuradas para produção',
      'SSL/TLS configurado (HTTPS)',
      'Backup do banco configurado',
      'Monitoramento configurado (logs, métricas)',
      'Rate limiting ajustado',
      'CORS restrito aos domínios de produção',
      'Secrets em vault seguro (não em .env)',
      'RPC URL apontando para Mainnet-Beta',
    ]},
    { type: 'heading', level: 2, text: 'Deploy com Docker Compose', id: 'docker-deploy' },
    { type: 'code', language: 'bash', code: `# Usar compose de produção
docker compose -f docker-compose.prod.yml up -d

# Verificar logs
docker compose -f docker-compose.prod.yml logs -f` },
    { type: 'callout', variant: 'warning', title: 'Importante', text: 'Nunca use `localnet` em produção. Configure `SOLANA_NETWORK=mainnet-beta` e use um RPC provider confiável como Helius, QuickNode ou Triton.' },
  ],

  // ========== LOCAL DEVELOPMENT ==========
  'local-development': [
    { type: 'heading', level: 1, text: 'Desenvolvimento Local', id: 'local-development' },
    { type: 'paragraph', text: 'Guia completo para configurar o ambiente de desenvolvimento.' },
    { type: 'heading', level: 2, text: 'Pré-requisitos', id: 'prerequisites' },
    { type: 'list', ordered: false, items: [
      '**Node.js 20+** - Runtime JavaScript',
      '**Go 1.21+** - Para o indexador',
      '**Docker 24+** - Containers',
      '**Solana CLI 1.18+** - Interação com blockchain',
      '**Anchor 0.30+** - Framework de smart contracts',
      '**Rust 1.70+** - Compilação dos programas',
    ]},
    { type: 'heading', level: 2, text: 'Instalação do Solana CLI', id: 'solana-install' },
    { type: 'code', language: 'bash', code: `# Instalar Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/v1.18.0/install)"

# Adicionar ao PATH
export PATH="/home/$USER/.local/share/solana/install/active_release/bin:$PATH"

# Verificar instalação
solana --version` },
    { type: 'heading', level: 2, text: 'Instalação do Anchor', id: 'anchor-install' },
    { type: 'code', language: 'bash', code: `# Instalar Anchor via cargo
cargo install --git https://github.com/coral-xyz/anchor anchor-cli --tag v0.30.1

# Verificar
anchor --version` },
    { type: 'heading', level: 2, text: 'Validator Local', id: 'local-validator' },
    { type: 'code', language: 'bash', code: `# Iniciar validator local
solana-test-validator

# Em outro terminal, configurar para localnet
solana config set --url localhost

# Criar wallet de teste
solana-keygen new -o ~/.config/solana/id.json

# Airdrop SOL
solana airdrop 100` },
  ],

  // ========== TESTING ==========
  'testing': [
    { type: 'heading', level: 1, text: 'Testes', id: 'testing' },
    { type: 'paragraph', text: 'Guia para executar e escrever testes.' },
    { type: 'heading', level: 2, text: 'Smart Contracts', id: 'smart-contract-tests' },
    { type: 'code', language: 'bash', code: `# Navegar para o programa
cd real_estate_program

# Rodar testes Anchor
anchor test

# Rodar testes específicos
anchor test -- --test-filter "create property"` },
    { type: 'heading', level: 2, text: 'APIs', id: 'api-tests' },
    { type: 'code', language: 'bash', code: `# API Principal
cd services/api
npm test

# KYC API
cd services/kyc-api
npm test` },
    { type: 'heading', level: 2, text: 'Frontend', id: 'frontend-tests' },
    { type: 'code', language: 'bash', code: `cd real_estate_program/app
npm test` },
  ],

  // ========== TROUBLESHOOTING ==========
  'troubleshooting': [
    { type: 'heading', level: 1, text: 'Troubleshooting', id: 'troubleshooting' },
    { type: 'paragraph', text: 'Soluções para problemas comuns.' },
    { type: 'heading', level: 2, text: 'Docker', id: 'docker-issues' },
    { type: 'heading', level: 3, text: 'Container não inicia', id: 'container-not-starting' },
    { type: 'code', language: 'bash', code: `# Ver logs detalhados
docker compose logs api

# Verificar se portas estão em uso
lsof -i :3004

# Rebuild sem cache
docker compose build --no-cache api` },
    { type: 'heading', level: 3, text: 'Erro de conexão com banco', id: 'db-connection' },
    { type: 'code', language: 'bash', code: `# Verificar se postgres está rodando
docker compose ps postgres

# Testar conexão
docker compose exec postgres psql -U postgres -c "SELECT 1"` },
    { type: 'heading', level: 2, text: 'Wallet', id: 'wallet-issues' },
    { type: 'heading', level: 3, text: 'Não conecta', id: 'wallet-not-connecting' },
    { type: 'list', ordered: false, items: [
      'Verifique se está na rede correta (Devnet)',
      'Limpe cache do navegador',
      'Tente outra wallet (Phantom, Solflare)',
      'Verifique se tem SOL suficiente para fees',
    ]},
    { type: 'heading', level: 2, text: 'Transações', id: 'transaction-issues' },
    { type: 'heading', level: 3, text: 'Transação falha com "Invalid Credential"', id: 'invalid-credential' },
    { type: 'paragraph', text: 'Sua credencial KYC está inválida, expirada ou não existe. Verifique:' },
    { type: 'code', language: 'bash', code: `# Verificar credencial
curl http://localhost:3005/api/credentials/SUA_WALLET_AQUI` },
    { type: 'heading', level: 3, text: 'Transação falha com "Insufficient Funds"', id: 'insufficient-funds' },
    { type: 'code', language: 'bash', code: `# Verificar saldo
solana balance

# Airdrop (só funciona em devnet)
solana airdrop 5` },
  ],
};

// ===========================================
// ENGLISH CONTENT - COMPLETE DOCUMENTATION
// ===========================================

const contentEN: Record<string, DocContent[]> = {
  'introduction': [
    { type: 'heading', level: 1, text: 'Welcome to Kota', id: 'welcome' },
    { type: 'paragraph', text: 'Kota is a decentralized real estate tokenization platform built on the Solana blockchain. Our mission is to democratize access to the real estate market, allowing anyone to invest in fractional properties with full transparency and security.' },
    { type: 'card-grid', cards: [
      { title: 'Quickstart', description: 'Start developing in minutes', icon: 'rocket', link: '/docs/quickstart' },
      { title: 'Architecture', description: 'Understand how the system works', icon: 'architecture', link: '/docs/architecture' },
      { title: 'API Reference', description: 'Complete API documentation', icon: 'api', link: '/docs/api-overview' },
      { title: 'Smart Contracts', description: 'Explore Solana programs', icon: 'code', link: '/docs/kota-program' },
    ]},
    { type: 'heading', level: 2, text: 'Why Kota?', id: 'why-kota' },
    { type: 'paragraph', text: 'Traditional real estate has many barriers: high capital requirements, illiquidity, lack of transparency, and bureaucratic processes. Kota solves these through tokenization.' },
    { type: 'table', headers: ['Aspect', 'Traditional', 'Kota'], rows: [
      ['Minimum Investment', '$20,000+', 'From $20'],
      ['Liquidity', 'Months/Years', 'Instant (24/7)'],
      ['Transparency', 'Limited', 'Full (Blockchain)'],
      ['Costs', 'High (6-8%)', 'Low (2.5%)'],
      ['Dividends', 'Manual', 'Automatic'],
      ['Compliance', 'Manual', 'On-chain (KYC)'],
    ]},
    { type: 'heading', level: 2, text: 'Architecture Overview', id: 'architecture-overview' },
    { type: 'diagram', mermaid: `graph TB
    subgraph Frontend
        UI[React App]
        WA[Wallet Adapter]
    end
    subgraph Backend
        API[Main API]
        KYC[KYC API]
        IDX[Indexer]
    end
    subgraph Solana
        SOL[Solana RPC]
        KP[Kota Program]
        CP[Credential Program]
    end
    subgraph Database
        PG[(PostgreSQL)]
    end
    UI --> API
    UI --> KYC
    UI --> WA
    WA --> SOL
    API --> PG
    KYC --> SOL
    IDX --> SOL
    IDX --> PG
    SOL --> KP
    SOL --> CP` },
    { type: 'heading', level: 2, text: 'Key Features', id: 'features' },
    { type: 'list', ordered: false, items: [
      '**SPL Token-2022 Tokenization** - Each property is represented by fungible tokens with Transfer Hook for compliance',
      '**On-chain KYC** - Verification credentials stored on Solana blockchain',
      '**Automatic Dividend Distribution** - Epoch system for proportional revenue distribution',
      '**Smart Escrow** - Progressive fund release based on sales milestones',
      '**Integrated Compliance** - Transfer Hook validates KYC credentials on each transfer',
    ]},
    { type: 'heading', level: 2, text: 'Tech Stack', id: 'tech-stack' },
    { type: 'code', language: 'yaml', filename: 'stack.yaml', code: `# Blockchain
solana: v1.18+
anchor: v0.30.1
token-standard: SPL Token-2022

# Backend
api: Node.js + TypeScript + Express
kyc-api: Node.js + TypeScript + Express
indexer: Go 1.21+
database: PostgreSQL 15

# Frontend
framework: React 18 + Vite
styling: Tailwind CSS
state: TanStack Query + Zustand
wallet: @solana/wallet-adapter` },
    { type: 'callout', variant: 'info', title: 'Current Network', text: 'Kota is currently deployed on Solana **Devnet**. Mainnet-Beta will be used for production.' },
    { type: 'heading', level: 2, text: 'Program IDs', id: 'program-ids' },
    { type: 'code', language: 'bash', filename: 'Program Addresses', code: `# Kota Program (Tokenization)
FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om

# Credential Program (KYC)
FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt` },
  ],

  'quickstart': contentPT['quickstart'].map(item => {
    if (item.type === 'heading' && item.text === 'Quickstart') return item;
    if (item.type === 'paragraph') return { ...item, text: item.text.replace('Este guia vai te ajudar', 'This guide will help you').replace('poucos minutos', 'minutes') };
    return item;
  }),

  'architecture': contentPT['architecture'],
  'tokenization': contentPT['tokenization'],
  'investment-flow': contentPT['investment-flow'],
  'dividends': contentPT['dividends'],
  'kyc-credentials': contentPT['kyc-credentials'],
  'transfer-hook': contentPT['transfer-hook'],
  'kota-program': contentPT['kota-program'],
  'credential-program': contentPT['credential-program'],
  'instructions': contentPT['instructions'],
  'accounts': contentPT['accounts'],
  'api-overview': contentPT['api-overview'],
  'api-principal': contentPT['api-principal'],
  'api-kyc': contentPT['api-kyc'],
  'indexer': contentPT['indexer'],
  'endpoints-properties': contentPT['endpoints-properties'],
  'endpoints-investment': contentPT['endpoints-investment'],
  'endpoints-auth': contentPT['endpoints-auth'],
  'endpoints-kyc': contentPT['endpoints-kyc'],
  'endpoints-credentials': contentPT['endpoints-credentials'],
  'docker': contentPT['docker'],
  'environment': contentPT['environment'],
  'deployment': contentPT['deployment'],
  'local-development': contentPT['local-development'],
  'testing': contentPT['testing'],
  'troubleshooting': contentPT['troubleshooting'],
};

// ===========================================
// EXPORTS
// ===========================================

export function getDocsContent(pageId: string, lang: string): DocContent[] | undefined {
  const content = lang === 'en' ? contentEN : contentPT;
  return content[pageId];
}

export const docsContent = contentPT;

const titlesPT: Record<string, string> = {
  'introduction': 'Introdução',
  'quickstart': 'Quickstart',
  'architecture': 'Arquitetura',
  'tokenization': 'Tokenização de Imóveis',
  'investment-flow': 'Fluxo de Investimento',
  'dividends': 'Distribuição de Dividendos',
  'kyc-credentials': 'KYC e Credenciais',
  'transfer-hook': 'Transfer Hook',
  'kota-program': 'Kota Program',
  'credential-program': 'Credential Program',
  'instructions': 'Instruções',
  'accounts': 'Contas e PDAs',
  'api-overview': 'Visão Geral das APIs',
  'api-principal': 'API Principal',
  'api-kyc': 'API KYC',
  'indexer': 'Indexador',
  'endpoints-properties': 'Properties',
  'endpoints-investment': 'Investment',
  'endpoints-auth': 'Authentication',
  'endpoints-kyc': 'KYC Sessions',
  'endpoints-credentials': 'Credentials',
  'docker': 'Docker & Containers',
  'environment': 'Variáveis de Ambiente',
  'deployment': 'Deploy',
  'local-development': 'Desenvolvimento Local',
  'testing': 'Testes',
  'troubleshooting': 'Troubleshooting',
};

const titlesEN: Record<string, string> = {
  'introduction': 'Introduction',
  'quickstart': 'Quickstart',
  'architecture': 'Architecture',
  'tokenization': 'Real Estate Tokenization',
  'investment-flow': 'Investment Flow',
  'dividends': 'Dividend Distribution',
  'kyc-credentials': 'KYC & Credentials',
  'transfer-hook': 'Transfer Hook',
  'kota-program': 'Kota Program',
  'credential-program': 'Credential Program',
  'instructions': 'Instructions',
  'accounts': 'Accounts & PDAs',
  'api-overview': 'API Overview',
  'api-principal': 'Main API',
  'api-kyc': 'KYC API',
  'indexer': 'Indexer',
  'endpoints-properties': 'Properties',
  'endpoints-investment': 'Investment',
  'endpoints-auth': 'Authentication',
  'endpoints-kyc': 'KYC Sessions',
  'endpoints-credentials': 'Credentials',
  'docker': 'Docker & Containers',
  'environment': 'Environment Variables',
  'deployment': 'Deployment',
  'local-development': 'Local Development',
  'testing': 'Testing',
  'troubleshooting': 'Troubleshooting',
};

export function getPageTitle(id: string, lang: string): string {
  const titles = lang === 'en' ? titlesEN : titlesPT;
  return titles[id] || id;
}
