"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycVerificationRequestSchema = exports.RevokeCredentialSchema = exports.RefreshCredentialSchema = exports.VerifyCredentialSchema = exports.IssueCredentialSchema = exports.CredentialTypeSchema = exports.CredentialStatus = exports.CredentialType = void 0;
const zod_1 = require("zod");
exports.CredentialType = {
    KycBasic: { kycBasic: {} },
    KycFull: { kycFull: {} },
    AccreditedInvestor: { accreditedInvestor: {} },
    QualifiedPurchaser: { qualifiedPurchaser: {} },
    BrazilianCpf: { brazilianCpf: {} },
    BrazilianCnpj: { brazilianCnpj: {} },
};
exports.CredentialStatus = {
    Active: { active: {} },
    Expired: { expired: {} },
    Revoked: { revoked: {} },
    Suspended: { suspended: {} },
};
// Zod schemas for validation
exports.CredentialTypeSchema = zod_1.z.enum([
    'kycBasic',
    'kycFull',
    'accreditedInvestor',
    'qualifiedPurchaser',
    'brazilianCpf',
    'brazilianCnpj',
]);
exports.IssueCredentialSchema = zod_1.z.object({
    userWallet: zod_1.z.string().min(32).max(44),
    credentialType: exports.CredentialTypeSchema,
    expiresInDays: zod_1.z.number().int().min(1).max(365).default(365),
    metadata: zod_1.z.string().max(256).optional(),
});
exports.VerifyCredentialSchema = zod_1.z.object({
    userWallet: zod_1.z.string().min(32).max(44),
    requiredType: exports.CredentialTypeSchema.optional(),
});
exports.RefreshCredentialSchema = zod_1.z.object({
    userWallet: zod_1.z.string().min(32).max(44),
    newExpiresInDays: zod_1.z.number().int().min(1).max(365),
});
exports.RevokeCredentialSchema = zod_1.z.object({
    userWallet: zod_1.z.string().min(32).max(44),
    reason: zod_1.z.string().max(256).optional(),
});
// KYC verification request schema
exports.KycVerificationRequestSchema = zod_1.z.object({
    walletAddress: zod_1.z.string().min(32).max(44),
    credentialType: exports.CredentialTypeSchema,
    // Basic KYC fields
    fullName: zod_1.z.string().min(2).max(100).optional(),
    dateOfBirth: zod_1.z.string().optional(),
    country: zod_1.z.string().length(2).optional(), // ISO 3166-1 alpha-2
    // Brazilian specific
    cpf: zod_1.z.string().length(11).optional(),
    cnpj: zod_1.z.string().length(14).optional(),
    // Accredited investor specific
    annualIncome: zod_1.z.number().optional(),
    netWorth: zod_1.z.number().optional(),
    // Document verification
    documentType: zod_1.z.enum(['passport', 'driverLicense', 'nationalId', 'other']).optional(),
    documentNumber: zod_1.z.string().optional(),
});
//# sourceMappingURL=credential.js.map