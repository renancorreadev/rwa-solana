import { z } from 'zod';

export const CredentialType = {
  KycBasic: { kycBasic: {} },
  KycFull: { kycFull: {} },
  AccreditedInvestor: { accreditedInvestor: {} },
  QualifiedPurchaser: { qualifiedPurchaser: {} },
  BrazilianCpf: { brazilianCpf: {} },
  BrazilianCnpj: { brazilianCnpj: {} },
} as const;

export type CredentialTypeKey = keyof typeof CredentialType;

export const CredentialStatus = {
  Active: { active: {} },
  Expired: { expired: {} },
  Revoked: { revoked: {} },
  Suspended: { suspended: {} },
} as const;

export type CredentialStatusKey = keyof typeof CredentialStatus;

// Zod schemas for validation
export const CredentialTypeSchema = z.enum([
  'kycBasic',
  'kycFull',
  'accreditedInvestor',
  'qualifiedPurchaser',
  'brazilianCpf',
  'brazilianCnpj',
]);

export const IssueCredentialSchema = z.object({
  userWallet: z.string().min(32).max(44),
  credentialType: CredentialTypeSchema,
  expiresInDays: z.number().int().min(1).max(365).default(365),
  metadata: z.string().max(256).optional(),
});

export const VerifyCredentialSchema = z.object({
  userWallet: z.string().min(32).max(44),
  requiredType: CredentialTypeSchema.optional(),
});

export const RefreshCredentialSchema = z.object({
  userWallet: z.string().min(32).max(44),
  newExpiresInDays: z.number().int().min(1).max(365),
});

export const RevokeCredentialSchema = z.object({
  userWallet: z.string().min(32).max(44),
  reason: z.string().max(256).optional(),
});

// KYC verification request schema
export const KycVerificationRequestSchema = z.object({
  walletAddress: z.string().min(32).max(44),
  credentialType: CredentialTypeSchema,
  // Basic KYC fields
  fullName: z.string().min(2).max(100).optional(),
  dateOfBirth: z.string().optional(),
  country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
  // Brazilian specific
  cpf: z.string().length(11).optional(),
  cnpj: z.string().length(14).optional(),
  // Accredited investor specific
  annualIncome: z.number().optional(),
  netWorth: z.number().optional(),
  // Document verification
  documentType: z.enum(['passport', 'driverLicense', 'nationalId', 'other']).optional(),
  documentNumber: z.string().optional(),
});

export type IssueCredentialInput = z.infer<typeof IssueCredentialSchema>;
export type VerifyCredentialInput = z.infer<typeof VerifyCredentialSchema>;
export type RefreshCredentialInput = z.infer<typeof RefreshCredentialSchema>;
export type RevokeCredentialInput = z.infer<typeof RevokeCredentialSchema>;
export type KycVerificationRequest = z.infer<typeof KycVerificationRequestSchema>;

// Response types
export interface CredentialResponse {
  success: boolean;
  credential?: {
    publicKey: string;
    user: string;
    issuer: string;
    credentialType: string;
    status: string;
    issuedAt: number;
    expiresAt: number;
    metadata: string;
  };
  signature?: string;
  error?: string;
}

export interface VerificationResponse {
  success: boolean;
  isValid: boolean;
  credential?: CredentialResponse['credential'];
  reason?: string;
}

export interface KycSessionResponse {
  sessionId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  walletAddress: string;
  credentialType: string;
  createdAt: number;
  expiresAt: number;
}
