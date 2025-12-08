import { z } from 'zod';
export declare const CredentialType: {
    readonly KycBasic: {
        readonly kycBasic: {};
    };
    readonly KycFull: {
        readonly kycFull: {};
    };
    readonly AccreditedInvestor: {
        readonly accreditedInvestor: {};
    };
    readonly QualifiedPurchaser: {
        readonly qualifiedPurchaser: {};
    };
    readonly BrazilianCpf: {
        readonly brazilianCpf: {};
    };
    readonly BrazilianCnpj: {
        readonly brazilianCnpj: {};
    };
};
export type CredentialTypeKey = keyof typeof CredentialType;
export declare const CredentialStatus: {
    readonly Active: {
        readonly active: {};
    };
    readonly Expired: {
        readonly expired: {};
    };
    readonly Revoked: {
        readonly revoked: {};
    };
    readonly Suspended: {
        readonly suspended: {};
    };
};
export type CredentialStatusKey = keyof typeof CredentialStatus;
export declare const CredentialTypeSchema: z.ZodEnum<["kycBasic", "kycFull", "accreditedInvestor", "qualifiedPurchaser", "brazilianCpf", "brazilianCnpj"]>;
export declare const IssueCredentialSchema: z.ZodObject<{
    userWallet: z.ZodString;
    credentialType: z.ZodEnum<["kycBasic", "kycFull", "accreditedInvestor", "qualifiedPurchaser", "brazilianCpf", "brazilianCnpj"]>;
    expiresInDays: z.ZodDefault<z.ZodNumber>;
    metadata: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userWallet: string;
    credentialType: "kycBasic" | "kycFull" | "accreditedInvestor" | "qualifiedPurchaser" | "brazilianCpf" | "brazilianCnpj";
    expiresInDays: number;
    metadata?: string | undefined;
}, {
    userWallet: string;
    credentialType: "kycBasic" | "kycFull" | "accreditedInvestor" | "qualifiedPurchaser" | "brazilianCpf" | "brazilianCnpj";
    expiresInDays?: number | undefined;
    metadata?: string | undefined;
}>;
export declare const VerifyCredentialSchema: z.ZodObject<{
    userWallet: z.ZodString;
    requiredType: z.ZodOptional<z.ZodEnum<["kycBasic", "kycFull", "accreditedInvestor", "qualifiedPurchaser", "brazilianCpf", "brazilianCnpj"]>>;
}, "strip", z.ZodTypeAny, {
    userWallet: string;
    requiredType?: "kycBasic" | "kycFull" | "accreditedInvestor" | "qualifiedPurchaser" | "brazilianCpf" | "brazilianCnpj" | undefined;
}, {
    userWallet: string;
    requiredType?: "kycBasic" | "kycFull" | "accreditedInvestor" | "qualifiedPurchaser" | "brazilianCpf" | "brazilianCnpj" | undefined;
}>;
export declare const RefreshCredentialSchema: z.ZodObject<{
    userWallet: z.ZodString;
    newExpiresInDays: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    userWallet: string;
    newExpiresInDays: number;
}, {
    userWallet: string;
    newExpiresInDays: number;
}>;
export declare const RevokeCredentialSchema: z.ZodObject<{
    userWallet: z.ZodString;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userWallet: string;
    reason?: string | undefined;
}, {
    userWallet: string;
    reason?: string | undefined;
}>;
export declare const KycVerificationRequestSchema: z.ZodObject<{
    walletAddress: z.ZodString;
    credentialType: z.ZodEnum<["kycBasic", "kycFull", "accreditedInvestor", "qualifiedPurchaser", "brazilianCpf", "brazilianCnpj"]>;
    fullName: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    cpf: z.ZodOptional<z.ZodString>;
    cnpj: z.ZodOptional<z.ZodString>;
    annualIncome: z.ZodOptional<z.ZodNumber>;
    netWorth: z.ZodOptional<z.ZodNumber>;
    documentType: z.ZodOptional<z.ZodEnum<["passport", "driverLicense", "nationalId", "other"]>>;
    documentNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    credentialType: "kycBasic" | "kycFull" | "accreditedInvestor" | "qualifiedPurchaser" | "brazilianCpf" | "brazilianCnpj";
    walletAddress: string;
    fullName?: string | undefined;
    dateOfBirth?: string | undefined;
    country?: string | undefined;
    cpf?: string | undefined;
    cnpj?: string | undefined;
    annualIncome?: number | undefined;
    netWorth?: number | undefined;
    documentType?: "passport" | "driverLicense" | "nationalId" | "other" | undefined;
    documentNumber?: string | undefined;
}, {
    credentialType: "kycBasic" | "kycFull" | "accreditedInvestor" | "qualifiedPurchaser" | "brazilianCpf" | "brazilianCnpj";
    walletAddress: string;
    fullName?: string | undefined;
    dateOfBirth?: string | undefined;
    country?: string | undefined;
    cpf?: string | undefined;
    cnpj?: string | undefined;
    annualIncome?: number | undefined;
    netWorth?: number | undefined;
    documentType?: "passport" | "driverLicense" | "nationalId" | "other" | undefined;
    documentNumber?: string | undefined;
}>;
export type IssueCredentialInput = z.infer<typeof IssueCredentialSchema>;
export type VerifyCredentialInput = z.infer<typeof VerifyCredentialSchema>;
export type RefreshCredentialInput = z.infer<typeof RefreshCredentialSchema>;
export type RevokeCredentialInput = z.infer<typeof RevokeCredentialSchema>;
export type KycVerificationRequest = z.infer<typeof KycVerificationRequestSchema>;
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
//# sourceMappingURL=credential.d.ts.map