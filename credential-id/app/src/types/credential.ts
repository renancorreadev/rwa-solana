import type { PublicKey } from '@solana/web3.js';
import type { BN } from '@coral-xyz/anchor';

export const CredentialType = {
  KycBasic: 'kycBasic',
  KycFull: 'kycFull',
  AccreditedInvestor: 'accreditedInvestor',
  QualifiedPurchaser: 'qualifiedPurchaser',
  BrazilianCpf: 'brazilianCpf',
  BrazilianCnpj: 'brazilianCnpj',
} as const;

export type CredentialType = typeof CredentialType[keyof typeof CredentialType];

export const CredentialStatus = {
  Active: 'active',
  Expired: 'expired',
  Revoked: 'revoked',
  Suspended: 'suspended',
} as const;

export type CredentialStatus = typeof CredentialStatus[keyof typeof CredentialStatus];

export interface UserCredential {
  holder: PublicKey;
  issuer: PublicKey;
  credentialType: CredentialType;
  status: CredentialStatus;
  issuedAt: BN;
  expiresAt: BN;
  lastVerifiedAt: BN;
  metadataUri: string;
  revocationReason: string | null;
  bump: number;
}

export interface CredentialIssuer {
  authority: PublicKey;
  network: PublicKey;
  name: string;
  uri: string;
  isActive: boolean;
  canIssueKyc: boolean;
  canIssueAccredited: boolean;
  credentialsIssued: BN;
  activeCredentials: BN;
  revokedCredentials: BN;
  bump: number;
}

export interface CredentialNetwork {
  admin: PublicKey;
  name: string;
  credentialFee: BN;
  isActive: boolean;
  totalCredentialsIssued: BN;
  activeCredentials: BN;
  totalIssuers: BN;
  bump: number;
}

export interface CredentialModalConfig {
  network: 'localnet' | 'devnet' | 'mainnet-beta';
  programId: string;
  requiredCredentialType?: CredentialType;
  theme?: 'light' | 'dark';
  onSuccess?: (credential: UserCredential) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export interface CredentialState {
  credential: UserCredential | null;
  loading: boolean;
  error: string | null;
  isVerified: boolean;
}
