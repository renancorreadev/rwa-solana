# Frontend

## Visão Geral

O Frontend do Hub Token é uma aplicação React moderna construída com Vite, TypeScript e Tailwind CSS. Oferece uma interface para investidores interagirem com a plataforma de tokenização de imóveis.

---

## Stack Tecnológico

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.x | UI Library |
| TypeScript | 5.x | Type Safety |
| Vite | 5.x | Build Tool |
| Tailwind CSS | 3.x | Styling |
| React Router | 6.x | Routing |
| TanStack Query | 5.x | Server State |
| Zustand | 4.x | Client State |
| @solana/web3.js | 1.x | Solana SDK |
| @solana/wallet-adapter | 0.x | Wallet Connection |

---

## Estrutura do Projeto

```
real_estate_program/app/
├── public/
│   └── assets/               # Assets estáticos
├── src/
│   ├── main.tsx              # Entry point
│   ├── App.tsx               # Root component
│   ├── index.css             # Global styles
│   ├── vite-env.d.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.tsx    # Layout principal
│   │   │   ├── Header.tsx    # Header com navegação
│   │   │   ├── Sidebar.tsx   # Sidebar desktop
│   │   │   └── MobileNav.tsx # Navegação mobile
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Loading.tsx
│   │   │
│   │   ├── property/
│   │   │   ├── PropertyCard.tsx
│   │   │   ├── PropertyDetails.tsx
│   │   │   └── PropertyList.tsx
│   │   │
│   │   ├── investment/
│   │   │   ├── InvestModal.tsx
│   │   │   ├── InvestmentQuote.tsx
│   │   │   └── InvestmentHistory.tsx
│   │   │
│   │   ├── wallet/
│   │   │   ├── WalletConnectButton.tsx
│   │   │   └── WalletModal.tsx
│   │   │
│   │   └── kyc/
│   │       ├── KycStatus.tsx
│   │       ├── KycForm.tsx
│   │       └── DocumentUpload.tsx
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Properties.tsx
│   │   ├── PropertyDetail.tsx
│   │   ├── Portfolio.tsx
│   │   ├── KYC.tsx
│   │   └── Admin.tsx
│   │
│   ├── hooks/
│   │   ├── useProperties.ts
│   │   ├── useInvest.ts
│   │   ├── usePortfolio.ts
│   │   ├── useAuth.ts
│   │   └── useKyc.ts
│   │
│   ├── services/
│   │   ├── api.ts            # Cliente API Principal
│   │   ├── kyc-api.ts        # Cliente API KYC
│   │   └── solana.ts         # Utilitários Solana
│   │
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   │
│   ├── types/
│   │   ├── property.ts
│   │   ├── investment.ts
│   │   └── kyc.ts
│   │
│   ├── utils/
│   │   ├── format.ts
│   │   ├── solana.ts
│   │   └── validation.ts
│   │
│   └── config/
│       └── index.ts
│
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── nginx.conf
└── Dockerfile
```

---

## Configuração

### config/index.ts

```typescript
export const config = {
  // APIs
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3004/api/v1',
  kycApiUrl: import.meta.env.VITE_KYC_API_URL || 'http://localhost:3005/api',

  // Solana
  solanaRpcUrl: import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  solanaNetwork: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',

  // Program IDs
  programId: import.meta.env.VITE_PROGRAM_ID || 'FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om',
  credentialProgramId: import.meta.env.VITE_CREDENTIAL_PROGRAM_ID || 'FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt',

  // Admin
  adminWallet: import.meta.env.VITE_ADMIN_WALLET || 'AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw',

  // Treasuries
  platformTreasury: import.meta.env.VITE_PLATFORM_TREASURY,
  reserveTreasury: import.meta.env.VITE_RESERVE_TREASURY,
};
```

---

## Entry Point

### main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider } from './providers/WalletProvider';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <App />
        </WalletProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

---

## Wallet Provider

### providers/WalletProvider.tsx

```tsx
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { config } from '../config';

import '@solana/wallet-adapter-react-ui/styles.css';

interface Props {
  children: ReactNode;
}

export const WalletProvider: FC<Props> = ({ children }) => {
  const endpoint = useMemo(() => config.solanaRpcUrl, []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
```

---

## Rotas

### App.tsx

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Properties } from './pages/Properties';
import { PropertyDetail } from './pages/PropertyDetail';
import { Portfolio } from './pages/Portfolio';
import { KYC } from './pages/KYC';
import { Admin } from './pages/Admin';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAdmin } = useAuth();

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/properties" element={<Properties />} />
        <Route path="/properties/:mint" element={<PropertyDetail />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/kyc" element={<KYC />} />
        <Route
          path="/admin/*"
          element={isAdmin ? <Admin /> : <Navigate to="/" />}
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}

export default App;
```

---

## Services

### services/api.ts

```typescript
import axios from 'axios';
import { config } from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  timeout: 10000,
});

// Properties
export const getProperties = async (params?: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get('/properties', { params });
  return response.data;
};

export const getProperty = async (mint: string) => {
  const response = await api.get(`/properties/${mint}`);
  return response.data.data;
};

// Investment
export const getInvestQuote = async (mint: string, solAmount: number) => {
  const response = await api.get('/invest/quote', {
    params: { mint, solAmount },
  });
  return response.data.data;
};

// Portfolio
export const getPortfolio = async (wallet: string) => {
  const response = await api.get(`/investors/${wallet}/portfolio`);
  return response.data.data;
};

export const getClaimable = async (wallet: string) => {
  const response = await api.get(`/investors/${wallet}/claimable`);
  return response.data.data;
};

// Stats
export const getPlatformStats = async () => {
  const response = await api.get('/stats/platform');
  return response.data.data;
};

export default api;
```

### services/kyc-api.ts

```typescript
import axios from 'axios';
import { config } from '../config';
import { useAuthStore } from '../stores/authStore';

const kycApi = axios.create({
  baseURL: config.kycApiUrl,
  timeout: 10000,
});

// Interceptor para adicionar token
kycApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const getNonce = async (wallet: string) => {
  const response = await kycApi.post('/auth/nonce', { wallet });
  return response.data;
};

export const verifySignature = async (
  wallet: string,
  signature: string,
  nonce: string
) => {
  const response = await kycApi.post('/auth/verify', {
    wallet,
    signature,
    nonce,
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await kycApi.get('/auth/me');
  return response.data;
};

// Credentials
export const getCredential = async (wallet: string) => {
  const response = await kycApi.get(`/credentials/${wallet}`);
  return response.data;
};

// KYC Sessions
export const createKycSession = async () => {
  const response = await kycApi.post('/kyc/session');
  return response.data;
};

export const getKycSession = async (sessionId: string) => {
  const response = await kycApi.get(`/kyc/session/${sessionId}`);
  return response.data;
};

export const updateKycSession = async (sessionId: string, data: any) => {
  const response = await kycApi.put(`/kyc/session/${sessionId}`, data);
  return response.data;
};

export const uploadDocument = async (
  sessionId: string,
  documentType: string,
  file: File
) => {
  const formData = new FormData();
  formData.append('sessionId', sessionId);
  formData.append('documentType', documentType);
  formData.append('file', file);

  const response = await kycApi.post('/kyc/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const submitKycSession = async (sessionId: string) => {
  const response = await kycApi.post(`/kyc/session/${sessionId}/submit`);
  return response.data;
};

export default kycApi;
```

---

## Hooks

### hooks/useProperties.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { getProperties, getProperty } from '../services/api';

export function useProperties(params?: {
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['properties', params],
    queryFn: () => getProperties(params),
  });
}

export function useProperty(mint: string) {
  return useQuery({
    queryKey: ['property', mint],
    queryFn: () => getProperty(mint),
    enabled: !!mint,
  });
}
```

### hooks/useAuth.ts

```typescript
import { useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { useAuthStore } from '../stores/authStore';
import { getNonce, verifySignature, getCurrentUser } from '../services/kyc-api';
import { config } from '../config';

export function useAuth() {
  const { publicKey, signMessage, connected } = useWallet();
  const { token, user, setToken, setUser, logout } = useAuthStore();

  const isAdmin = publicKey?.toBase58() === config.adminWallet;

  const authenticate = useCallback(async () => {
    if (!publicKey || !signMessage) {
      throw new Error('Wallet não conectada');
    }

    const wallet = publicKey.toBase58();

    // Obter nonce
    const { nonce } = await getNonce(wallet);

    // Assinar mensagem
    const message = new TextEncoder().encode(nonce);
    const signatureBytes = await signMessage(message);
    const signature = bs58.encode(signatureBytes);

    // Verificar e obter token
    const response = await verifySignature(wallet, signature, nonce);

    setToken(response.token);
    setUser(response.user);

    return response;
  }, [publicKey, signMessage, setToken, setUser]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      const user = await getCurrentUser();
      setUser(user);
    } catch (error) {
      logout();
    }
  }, [token, setUser, logout]);

  // Auto-refresh user quando conectar
  useEffect(() => {
    if (connected && token) {
      refreshUser();
    }
  }, [connected, token, refreshUser]);

  // Logout quando desconectar wallet
  useEffect(() => {
    if (!connected && token) {
      logout();
    }
  }, [connected, token, logout]);

  return {
    isAuthenticated: !!token,
    isAdmin,
    user,
    authenticate,
    logout,
    refreshUser,
  };
}
```

### hooks/useInvest.ts

```typescript
import { useCallback, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { getInvestQuote } from '../services/api';
import { config } from '../config';

interface InvestResult {
  success: boolean;
  signature?: string;
  error?: string;
}

export function useInvest() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const getQuote = useCallback(async (mint: string, solAmount: number) => {
    return getInvestQuote(mint, solAmount);
  }, []);

  const invest = useCallback(async (
    mint: string,
    solAmount: number
  ): Promise<InvestResult> => {
    if (!publicKey) {
      return { success: false, error: 'Wallet não conectada' };
    }

    setLoading(true);

    try {
      const quote = await getQuote(mint, solAmount);
      const lamports = Math.floor(solAmount * LAMPORTS_PER_SOL);

      // Calcular fees
      const platformFeeLamports = Math.floor(lamports * 0.025); // 2.5%
      const reserveFeeLamports = Math.floor(lamports * 0.075);  // 7.5%
      const sellerLamports = lamports - platformFeeLamports - reserveFeeLamports;

      // Construir transação com múltiplas transferências
      const transaction = new Transaction();

      // Transferência para Platform Treasury
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(config.platformTreasury),
          lamports: platformFeeLamports,
        })
      );

      // Transferência para Reserve Treasury
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(config.reserveTreasury),
          lamports: reserveFeeLamports,
        })
      );

      // Transferência para Seller/Escrow
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(quote.sellerWallet),
          lamports: sellerLamports,
        })
      );

      // Enviar transação
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      const signature = await sendTransaction(transaction, connection);

      // Aguardar confirmação
      await connection.confirmTransaction(signature, 'confirmed');

      return { success: true, signature };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [publicKey, connection, sendTransaction, getQuote]);

  return {
    getQuote,
    invest,
    loading,
  };
}
```

---

## Stores

### stores/authStore.ts

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  wallet: string;
  hasCredential: boolean;
  credentialType?: string;
  credentialStatus?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,

      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'hub-token-auth',
    }
  )
);
```

---

## Componentes

### components/wallet/WalletConnectButton.tsx

```tsx
import { FC, useState, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createPortal } from 'react-dom';
import { useAuth } from '../../hooks/useAuth';

export const WalletConnectButton: FC = () => {
  const { connected, publicKey, disconnect } = useWallet();
  const { isAuthenticated, authenticate, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConnect = useCallback(async () => {
    if (connected && !isAuthenticated) {
      setLoading(true);
      try {
        await authenticate();
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [connected, isAuthenticated, authenticate]);

  const handleDisconnect = () => {
    logout();
    disconnect();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!connected) {
    // Usar portal para garantir posicionamento correto
    return createPortal(
      <WalletMultiButton className="!bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" />,
      document.body
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!isAuthenticated && (
        <button
          onClick={handleConnect}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
        >
          {loading ? 'Autenticando...' : 'Autenticar'}
        </button>
      )}

      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-lg">
        <span className="text-gray-300 text-sm">
          {formatAddress(publicKey!.toBase58())}
        </span>
        <button
          onClick={handleDisconnect}
          className="text-red-400 hover:text-red-300 text-sm"
        >
          Desconectar
        </button>
      </div>
    </div>
  );
};
```

### components/property/PropertyCard.tsx

```tsx
import { FC } from 'react';
import { Link } from 'react-router-dom';
import { Property } from '../../types/property';

interface Props {
  property: Property;
}

export const PropertyCard: FC<Props> = ({ property }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Link
      to={`/properties/${property.mint}`}
      className="block bg-gray-800/50 rounded-xl overflow-hidden hover:bg-gray-800/70 transition-all border border-gray-700/50 hover:border-purple-500/50"
    >
      {/* Image */}
      <div className="aspect-video bg-gray-700 relative overflow-hidden">
        {property.image && (
          <img
            src={property.image}
            alt={property.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute top-2 right-2 px-2 py-1 bg-green-600/90 rounded text-xs text-white">
          {property.annualYield / 100}% a.a.
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white mb-1">
          {property.name}
        </h3>
        <p className="text-gray-400 text-sm mb-3">{property.location}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-500 text-xs">Valor Total</span>
            <p className="text-white font-medium">
              {formatCurrency(property.totalValueUsd / 100)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Por Token</span>
            <p className="text-white font-medium">
              {formatCurrency(property.pricePerToken)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Vendido</span>
            <span>{property.soldPercent.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"
              style={{ width: `${property.soldPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
};
```

---

## Estilos

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
        },
      },
      animation: {
        'float-orb': 'float-orb 20s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'float-orb': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '33%': { transform: 'translate(30px, -50px)' },
          '66%': { transform: 'translate(-20px, 20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
```

---

## Build & Deploy

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          solana: ['@solana/web3.js', '@solana/wallet-adapter-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
```

### Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
```

---

[← Voltar](../backend/indexador.md) | [Próximo: Infraestrutura →](../infraestrutura/README.md)
