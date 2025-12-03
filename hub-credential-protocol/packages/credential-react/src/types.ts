import type { PublicKey } from '@solana/web3.js';
import type { BN } from '@coral-xyz/anchor';

/**
 * Credential types supported by the Hub Credential Protocol
 */
export const CredentialType = {
  /** Basic KYC verification */
  KycBasic: 'kycBasic',
  /** Full KYC verification with enhanced due diligence */
  KycFull: 'kycFull',
  /** Accredited investor status (US SEC Rule 501) */
  AccreditedInvestor: 'accreditedInvestor',
  /** Qualified purchaser status */
  QualifiedPurchaser: 'qualifiedPurchaser',
  /** Brazilian CPF (individual tax ID) */
  BrazilianCpf: 'brazilianCpf',
  /** Brazilian CNPJ (company tax ID) */
  BrazilianCnpj: 'brazilianCnpj',
} as const;

export type CredentialType = typeof CredentialType[keyof typeof CredentialType];

/**
 * Status of a credential
 */
export const CredentialStatus = {
  /** Credential is valid and active */
  Active: 'active',
  /** Credential has expired */
  Expired: 'expired',
  /** Credential was revoked by issuer */
  Revoked: 'revoked',
  /** Credential is temporarily suspended */
  Suspended: 'suspended',
} as const;

export type CredentialStatus = typeof CredentialStatus[keyof typeof CredentialStatus];

/**
 * On-chain user credential account data
 */
export interface UserCredential {
  /** Public key of the credential holder */
  holder: PublicKey;
  /** Public key of the issuer authority */
  issuer: PublicKey;
  /** Type of credential */
  credentialType: CredentialType;
  /** Current status */
  status: CredentialStatus;
  /** Unix timestamp when issued */
  issuedAt: BN;
  /** Unix timestamp when it expires */
  expiresAt: BN;
  /** Unix timestamp of last verification */
  lastVerifiedAt: BN;
  /** URI to off-chain metadata (IPFS, etc.) */
  metadataUri: string;
  /** Reason for revocation if revoked */
  revocationReason: string | null;
  /** PDA bump seed */
  bump: number;
}

/**
 * On-chain credential issuer account data
 */
export interface CredentialIssuer {
  /** Authority that controls this issuer */
  authority: PublicKey;
  /** Network this issuer belongs to */
  network: PublicKey;
  /** Display name */
  name: string;
  /** URI to issuer info */
  uri: string;
  /** Whether issuer can issue new credentials */
  isActive: boolean;
  /** Can issue KYC credentials */
  canIssueKyc: boolean;
  /** Can issue accredited investor credentials */
  canIssueAccredited: boolean;
  /** Total credentials issued */
  credentialsIssued: BN;
  /** Currently active credentials */
  activeCredentials: BN;
  /** Revoked credentials count */
  revokedCredentials: BN;
  /** PDA bump seed */
  bump: number;
}

/**
 * On-chain credential network account data
 */
export interface CredentialNetwork {
  /** Admin authority */
  admin: PublicKey;
  /** Network display name */
  name: string;
  /** Fee to issue credential (in lamports) */
  credentialFee: BN;
  /** Whether network is accepting new credentials */
  isActive: boolean;
  /** Total credentials ever issued */
  totalCredentialsIssued: BN;
  /** Currently active credentials */
  activeCredentials: BN;
  /** Total registered issuers */
  totalIssuers: BN;
  /** PDA bump seed */
  bump: number;
}

/**
 * Configuration for the credential provider and modal
 */
export interface CredentialConfig {
  /** Solana network to connect to */
  network: 'localnet' | 'devnet' | 'mainnet-beta';
  /** Program ID (defaults to Hub Credential Protocol) */
  programId?: string;
  /** Required credential type to access gated content */
  requiredCredentialType?: CredentialType;
  /** Theme for the modal */
  theme?: 'light' | 'dark';
  /** Custom RPC endpoint */
  rpcEndpoint?: string;
  /** Callback on successful credential verification */
  onSuccess?: (credential: UserCredential) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Callback when modal closes */
  onClose?: () => void;
}

/**
 * State of the credential context
 */
export interface CredentialState {
  /** User's credential if exists */
  credential: UserCredential | null;
  /** Loading state */
  loading: boolean;
  /** Error message if any */
  error: string | null;
  /** Whether credential is valid and active */
  isVerified: boolean;
}

/**
 * Return type of useCredential hook
 */
export interface UseCredentialReturn {
  /** Current credential state */
  state: CredentialState;
  /** Current config */
  config: CredentialConfig | null;
  /** Fetch/refresh credential data */
  fetchCredential: () => Promise<void>;
  /** Verify credential on-chain */
  verifyCredential: () => Promise<boolean>;
  /** Check if user has valid credential of given type */
  hasValidCredential: (type?: CredentialType) => boolean;
  /** Open the credential modal */
  openModal: () => void;
  /** Close the credential modal */
  closeModal: () => void;
  /** Whether modal is currently open */
  isModalOpen: boolean;
}
