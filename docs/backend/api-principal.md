# API Principal

## Visão Geral

A API Principal é o serviço core que gerencia a lógica de negócios da plataforma Hub Token. Construída com Node.js, TypeScript e Express, segue os princípios de Clean Architecture.

---

## Configuração

### config/index.ts

```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3002'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string(),

  // Solana
  SOLANA_RPC_URL: z.string(),
  PROGRAM_ID: z.string(),
  CREDENTIAL_PROGRAM_ID: z.string(),

  // Admin
  ADMIN_WALLET: z.string(),
  ADMIN_PRIVATE_KEY: z.string().optional(),

  // Treasuries
  PLATFORM_TREASURY: z.string(),
  RESERVE_TREASURY: z.string(),

  // Services
  INDEXER_URL: z.string().default('http://indexer:9090'),

  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
});

export const config = envSchema.parse(process.env);
```

---

## App Setup

### app.ts

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { routes } from './routes';

const app = express();

// Middlewares de segurança
app.use(helmet());
app.use(cors({
  origin: config.CORS_ORIGINS.split(','),
  credentials: true,
}));
app.use(express.json());

// Rate limiting
import rateLimit from 'express-rate-limit';
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
}));

// Rotas
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

export { app };
```

---

## Rotas

### routes/index.ts

```typescript
import { Router } from 'express';
import { propertiesRoutes } from './properties';
import { investRoutes } from './invest';
import { investorsRoutes } from './investors';
import { adminRoutes } from './admin';
import { statsRoutes } from './stats';

const router = Router();

router.use('/properties', propertiesRoutes);
router.use('/invest', investRoutes);
router.use('/investors', investorsRoutes);
router.use('/admin', adminRoutes);
router.use('/stats', statsRoutes);

export { router as routes };
```

### routes/properties.ts

```typescript
import { Router } from 'express';
import { PropertiesController } from '../controllers/PropertiesController';
import { validateQuery, validateParams } from '../middleware/validation';
import { listPropertiesSchema, propertyMintSchema } from '../schemas/properties';

const router = Router();
const controller = new PropertiesController();

// GET /properties
router.get('/',
  validateQuery(listPropertiesSchema),
  controller.list.bind(controller)
);

// GET /properties/:mint
router.get('/:mint',
  validateParams(propertyMintSchema),
  controller.getByMint.bind(controller)
);

export { router as propertiesRoutes };
```

---

## Controllers

### controllers/PropertiesController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { PropertyService } from '../services/PropertyService';
import { IndexerClient } from '../clients/IndexerClient';

export class PropertiesController {
  private propertyService: PropertyService;

  constructor() {
    this.propertyService = new PropertyService(new IndexerClient());
  }

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, type, page = 1, limit = 20 } = req.query;

      const result = await this.propertyService.listProperties({
        status: status as string,
        type: type as string,
        page: Number(page),
        limit: Number(limit),
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getByMint(req: Request, res: Response, next: NextFunction) {
    try {
      const { mint } = req.params;

      const property = await this.propertyService.getPropertyByMint(mint);

      if (!property) {
        return res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: 'Propriedade não encontrada',
          },
        });
      }

      res.json({ data: property });
    } catch (error) {
      next(error);
    }
  }
}
```

### controllers/InvestController.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { InvestService } from '../services/InvestService';
import { SolanaService } from '../services/SolanaService';

export class InvestController {
  private investService: InvestService;

  constructor() {
    this.investService = new InvestService(new SolanaService());
  }

  async getQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const { mint, solAmount } = req.query;

      const quote = await this.investService.calculateQuote(
        mint as string,
        Number(solAmount)
      );

      res.json({ data: quote });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## Services

### services/PropertyService.ts

```typescript
import { IndexerClient } from '../clients/IndexerClient';
import { Property, PropertyListResult } from '../types';

interface ListOptions {
  status?: string;
  type?: string;
  page: number;
  limit: number;
}

export class PropertyService {
  constructor(private indexerClient: IndexerClient) {}

  async listProperties(options: ListOptions): Promise<PropertyListResult> {
    const properties = await this.indexerClient.getProperties();

    let filtered = properties;

    // Filtrar por status
    if (options.status) {
      filtered = filtered.filter(p =>
        options.status === 'active' ? p.status === 1 : p.status === 0
      );
    }

    // Filtrar por tipo
    if (options.type) {
      filtered = filtered.filter(p => p.property_type === options.type);
    }

    // Paginação
    const total = filtered.length;
    const start = (options.page - 1) * options.limit;
    const paginated = filtered.slice(start, start + options.limit);

    // Enriquecer dados
    const enriched = paginated.map(this.enrichProperty);

    return {
      data: enriched,
      meta: {
        page: options.page,
        limit: options.limit,
        total,
      },
    };
  }

  async getPropertyByMint(mint: string): Promise<Property | null> {
    const property = await this.indexerClient.getProperty(mint);

    if (!property) return null;

    return this.enrichProperty(property);
  }

  private enrichProperty(raw: any): Property {
    const circulatingSupply = BigInt(raw.circulating_supply);
    const totalSupply = BigInt(raw.total_supply);
    const soldPercent = Number(circulatingSupply * 100n / totalSupply);

    // Calcular preço por token
    const totalValueUsd = raw.total_value_usd / 100; // centavos para dólares
    const tokensInUnit = Number(totalSupply) / 1e6; // ajustar decimais
    const pricePerToken = totalValueUsd / tokensInUnit;

    return {
      mint: raw.mint,
      propertyStatePda: raw.property_state_pda,
      name: raw.name || 'Propriedade',
      symbol: raw.symbol || 'PROP',
      authority: raw.authority,
      sellerWallet: raw.seller_wallet,
      status: raw.status === 1 ? 'active' : 'paused',
      totalSupply: raw.total_supply,
      circulatingSupply: raw.circulating_supply,
      decimals: raw.decimals,
      propertyType: raw.property_type,
      location: raw.property_address,
      totalValueUsd: raw.total_value_usd,
      annualYield: raw.rental_yield_bps,
      metadataUri: raw.metadata_uri,
      currentEpoch: raw.current_epoch,
      pricePerToken,
      soldPercent,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
    };
  }
}
```

### services/InvestService.ts

```typescript
import { SolanaService } from './SolanaService';
import { config } from '../config';

interface Quote {
  propertyMint: string;
  solAmount: number;
  tokensToReceive: number;
  tokensFormatted: string;
  platformFee: number;
  reserveFee: number;
  sellerAmount: number;
  pricePerToken: number;
  ownership: string;
  platformTreasury: string;
  reserveTreasury: string;
}

export class InvestService {
  // Fee basis points
  private readonly PLATFORM_FEE_BPS = 250;  // 2.5%
  private readonly RESERVE_FEE_BPS = 750;   // 7.5%
  private readonly BPS_DIVISOR = 10000;

  constructor(private solanaService: SolanaService) {}

  async calculateQuote(mint: string, solAmount: number): Promise<Quote> {
    // Buscar dados da propriedade
    const property = await this.solanaService.getPropertyState(mint);

    if (!property) {
      throw new Error('Propriedade não encontrada');
    }

    // Converter SOL para lamports
    const lamports = solAmount * 1e9;

    // Calcular fees
    const platformFee = (lamports * this.PLATFORM_FEE_BPS) / this.BPS_DIVISOR;
    const reserveFee = (lamports * this.RESERVE_FEE_BPS) / this.BPS_DIVISOR;
    const sellerAmount = lamports - platformFee - reserveFee;

    // Calcular tokens a receber
    // Preço baseado no valor total da propriedade
    const totalValueLamports = property.totalValueUsd * 1e7; // USD cents to lamports approximation
    const tokensPerLamport = Number(property.totalSupply) / totalValueLamports;
    const tokensToReceive = Math.floor(sellerAmount * tokensPerLamport);

    // Calcular ownership
    const ownershipPercent = (tokensToReceive / Number(property.totalSupply)) * 100;

    return {
      propertyMint: mint,
      solAmount,
      tokensToReceive,
      tokensFormatted: this.formatTokens(tokensToReceive, property.decimals),
      platformFee: platformFee / 1e9,
      reserveFee: reserveFee / 1e9,
      sellerAmount: sellerAmount / 1e9,
      pricePerToken: totalValueLamports / Number(property.totalSupply) / 1e9,
      ownership: `${ownershipPercent.toFixed(4)}%`,
      platformTreasury: config.PLATFORM_TREASURY,
      reserveTreasury: config.RESERVE_TREASURY,
    };
  }

  private formatTokens(amount: number, decimals: number): string {
    const formatted = amount / Math.pow(10, decimals);
    return formatted.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
```

### services/SolanaService.ts

```typescript
import { Connection, PublicKey, Transaction, Keypair } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { config } from '../config';
import { IDL } from '../idl/hub_token';

export class SolanaService {
  private connection: Connection;
  private program: Program;

  constructor() {
    this.connection = new Connection(config.SOLANA_RPC_URL, 'confirmed');

    // Setup provider para leitura
    const wallet = Wallet.local();
    const provider = new AnchorProvider(this.connection, wallet, {});

    this.program = new Program(
      IDL,
      new PublicKey(config.PROGRAM_ID),
      provider
    );
  }

  async getPropertyState(mint: string) {
    const mintPubkey = new PublicKey(mint);

    // Derivar PDA do estado da propriedade
    const [propertyStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('property'), mintPubkey.toBuffer()],
      this.program.programId
    );

    try {
      const account = await this.program.account.propertyState.fetch(propertyStatePda);
      return {
        pda: propertyStatePda.toBase58(),
        mint: account.mint.toBase58(),
        authority: account.authority.toBase58(),
        sellerWallet: account.sellerWallet.toBase58(),
        status: account.status,
        totalSupply: account.totalSupply.toString(),
        circulatingSupply: account.circulatingSupply.toString(),
        decimals: account.decimals,
        totalValueUsd: account.totalValueUsd.toNumber(),
        rentalYieldBps: account.rentalYieldBps,
        currentEpoch: account.currentEpoch,
      };
    } catch (error) {
      console.error('Error fetching property state:', error);
      return null;
    }
  }

  async getConnection(): Promise<Connection> {
    return this.connection;
  }

  async getLatestBlockhash() {
    return this.connection.getLatestBlockhash();
  }
}
```

---

## Clients

### clients/IndexerClient.ts

```typescript
import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export class IndexerClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.INDEXER_URL,
      timeout: 10000,
    });
  }

  async getProperties() {
    const response = await this.client.get('/api/v1/properties');
    return response.data.data;
  }

  async getProperty(mint: string) {
    try {
      const response = await this.client.get(`/api/v1/properties/${mint}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getInvestorHoldings(wallet: string) {
    const response = await this.client.get(`/api/v1/investors/${wallet}/holdings`);
    return response.data.data;
  }

  async getInvestorTransactions(wallet: string) {
    const response = await this.client.get(`/api/v1/investors/${wallet}/transactions`);
    return response.data.data;
  }

  async getStats() {
    const response = await this.client.get('/api/v1/stats');
    return response.data.data;
  }
}
```

---

## Middleware

### middleware/errorHandler.ts

```typescript
import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Erro interno do servidor';

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
}
```

### middleware/validation.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parâmetros inválidos',
          details: result.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      });
    }

    req.query = result.data;
    next();
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Parâmetros de rota inválidos',
          details: result.error.errors,
        },
      });
    }

    req.params = result.data;
    next();
  };
}

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Corpo da requisição inválido',
          details: result.error.errors,
        },
      });
    }

    req.body = result.data;
    next();
  };
}
```

### middleware/adminAuth.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import nacl from 'tweetnacl';
import bs58 from 'bs58';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const wallet = req.headers['x-admin-wallet'] as string;
  const signature = req.headers['x-admin-signature'] as string;
  const timestamp = req.headers['x-admin-timestamp'] as string;

  if (!wallet || !signature || !timestamp) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Credenciais admin ausentes',
      },
    });
  }

  // Verificar se é a wallet admin
  if (wallet !== config.ADMIN_WALLET) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Wallet não autorizada',
      },
    });
  }

  // Verificar timestamp (máx 5 min)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  if (Math.abs(now - requestTime) > 5 * 60 * 1000) {
    return res.status(401).json({
      error: {
        code: 'EXPIRED',
        message: 'Assinatura expirada',
      },
    });
  }

  // Verificar assinatura
  const message = `Admin:${wallet}:${timestamp}`;
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = bs58.decode(signature);
  const publicKeyBytes = bs58.decode(wallet);

  const isValid = nacl.sign.detached.verify(
    messageBytes,
    signatureBytes,
    publicKeyBytes
  );

  if (!isValid) {
    return res.status(401).json({
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Assinatura inválida',
      },
    });
  }

  next();
}
```

---

## Schemas

### schemas/properties.ts

```typescript
import { z } from 'zod';

export const listPropertiesSchema = z.object({
  status: z.enum(['active', 'paused']).optional(),
  type: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const propertyMintSchema = z.object({
  mint: z.string().length(44).regex(/^[1-9A-HJ-NP-Za-km-z]+$/),
});
```

---

## Testes

### __tests__/services/PropertyService.test.ts

```typescript
import { PropertyService } from '../../src/services/PropertyService';
import { IndexerClient } from '../../src/clients/IndexerClient';

jest.mock('../../src/clients/IndexerClient');

describe('PropertyService', () => {
  let service: PropertyService;
  let mockIndexerClient: jest.Mocked<IndexerClient>;

  beforeEach(() => {
    mockIndexerClient = new IndexerClient() as jest.Mocked<IndexerClient>;
    service = new PropertyService(mockIndexerClient);
  });

  describe('listProperties', () => {
    it('should return paginated properties', async () => {
      mockIndexerClient.getProperties.mockResolvedValue([
        {
          mint: 'test-mint-1',
          status: 1,
          property_type: 'Comercial',
          total_supply: '1000000000',
          circulating_supply: '500000000',
          total_value_usd: 100000000,
          decimals: 6,
        },
        {
          mint: 'test-mint-2',
          status: 0,
          property_type: 'Residencial',
          total_supply: '2000000000',
          circulating_supply: '1000000000',
          total_value_usd: 200000000,
          decimals: 6,
        },
      ]);

      const result = await service.listProperties({
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by status', async () => {
      mockIndexerClient.getProperties.mockResolvedValue([
        { mint: 'test-1', status: 1 },
        { mint: 'test-2', status: 0 },
      ]);

      const result = await service.listProperties({
        status: 'active',
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('active');
    });
  });
});
```

---

## Deploy

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

ENV NODE_ENV=production
ENV PORT=3002

EXPOSE 3002

CMD ["node", "dist/index.js"]
```

---

[← Voltar](./README.md) | [Próximo: API KYC →](./api-kyc.md)
