import { PublicKey, Keypair, Connection, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

export type Network = 'localnet' | 'devnet' | 'mainnet-beta';

function getConnection(network: Network): Connection {
  if (network === 'localnet') {
    return new Connection(process.env.SOLANA_RPC_URL || 'http://localhost:8899', 'confirmed');
  }
  return new Connection(
    process.env.SOLANA_RPC_URL || clusterApiUrl(network === 'mainnet-beta' ? 'mainnet-beta' : 'devnet'),
    'confirmed'
  );
}

function getIssuerKeypair(): Keypair | null {
  const privateKey = process.env.ISSUER_PRIVATE_KEY;
  if (!privateKey) {
    console.warn('ISSUER_PRIVATE_KEY not set - credential issuance will be disabled');
    return null;
  }
  try {
    return Keypair.fromSecretKey(bs58.decode(privateKey));
  } catch {
    console.error('Invalid ISSUER_PRIVATE_KEY format');
    return null;
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  solana: {
    network: (process.env.SOLANA_NETWORK || 'localnet') as Network,
    rpcUrl: process.env.SOLANA_RPC_URL || 'http://localhost:8899',
    get connection() {
      return getConnection(this.network);
    },
  },

  program: {
    credentialProgramId: new PublicKey(
      process.env.CREDENTIAL_PROGRAM_ID || 'FaJ4XGCLeu7eZiMjBEkANko3TRhpjns3cv6R1vZK94Wt'
    ),
    hubTokenProgramId: new PublicKey(
      process.env.HUB_TOKEN_PROGRAM_ID || 'FDfkSAAqk8uweJusJb8MSNRHXGRvFqokNfjw9m8ve6om'
    ),
  },

  admin: {
    // Admin wallet that can access admin panel
    walletAddress: process.env.ADMIN_WALLET || '7XxWTXMiZzEaG54aXQtfsoA78F6CDScpYAjuMHBUbKQ7',
  },

  issuer: {
    get keypair() {
      return getIssuerKeypair();
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  kyc: {
    providerApiKey: process.env.KYC_PROVIDER_API_KEY,
    providerSecret: process.env.KYC_PROVIDER_SECRET,
  },

  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174,http://localhost:3000,https://rwa.hubweb3.com').split(','),
  },
};
