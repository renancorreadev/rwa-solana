import { KycVerificationRequest, KycSessionResponse } from '../types/credential.js';
interface KycSession {
    sessionId: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    walletAddress: string;
    credentialType: string;
    data: Partial<KycVerificationRequest>;
    createdAt: number;
    expiresAt: number;
    verificationResult?: {
        passed: boolean;
        reason?: string;
        credentialSignature?: string;
    };
}
export declare class KycSessionService {
    createSession(walletAddress: string, credentialType: string): KycSessionResponse;
    getSession(sessionId: string): KycSession | null;
    updateSessionData(sessionId: string, data: Partial<KycVerificationRequest>): KycSession | null;
    processVerification(sessionId: string): Promise<{
        success: boolean;
        session?: KycSession;
        error?: string;
    }>;
    private verifyKycData;
    private validateCPF;
    private validateCNPJ;
    deleteSession(sessionId: string): boolean;
    cleanupExpiredSessions(): number;
}
export declare const kycSessionService: KycSessionService;
export {};
//# sourceMappingURL=kycSessionService.d.ts.map