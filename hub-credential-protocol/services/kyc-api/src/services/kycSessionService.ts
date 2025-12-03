import { v4 as uuidv4 } from 'uuid';
import { KycVerificationRequest, KycSessionResponse } from '../types/credential.js';
import { credentialService } from './credentialService.js';

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

// In-memory session store (use Redis in production)
const sessions = new Map<string, KycSession>();

// Session expiration time (30 minutes)
const SESSION_TTL = 30 * 60 * 1000;

export class KycSessionService {
  createSession(walletAddress: string, credentialType: string): KycSessionResponse {
    const sessionId = uuidv4();
    const now = Date.now();

    const session: KycSession = {
      sessionId,
      status: 'pending',
      walletAddress,
      credentialType,
      data: {},
      createdAt: now,
      expiresAt: now + SESSION_TTL,
    };

    sessions.set(sessionId, session);

    return {
      sessionId,
      status: session.status,
      walletAddress,
      credentialType,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    };
  }

  getSession(sessionId: string): KycSession | null {
    const session = sessions.get(sessionId);
    if (!session) return null;

    // Check expiration
    if (Date.now() > session.expiresAt) {
      sessions.delete(sessionId);
      return null;
    }

    return session;
  }

  updateSessionData(sessionId: string, data: Partial<KycVerificationRequest>): KycSession | null {
    const session = this.getSession(sessionId);
    if (!session) return null;

    session.data = { ...session.data, ...data };
    session.status = 'in_progress';
    sessions.set(sessionId, session);

    return session;
  }

  async processVerification(sessionId: string): Promise<{
    success: boolean;
    session?: KycSession;
    error?: string;
  }> {
    const session = this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found or expired' };
    }

    try {
      // Perform verification based on credential type
      const verificationResult = await this.verifyKycData(session);

      if (verificationResult.passed) {
        // Issue credential on-chain
        console.log('Verification passed, issuing credential...');
        console.log('Session data:', {
          wallet: session.walletAddress,
          type: session.credentialType
        });

        const credentialResult = await credentialService.issueCredential({
          userWallet: session.walletAddress,
          credentialType: session.credentialType as any,
          expiresInDays: 365,
          metadata: JSON.stringify({
            verificationDate: new Date().toISOString(),
            sessionId: session.sessionId,
          }),
        });

        console.log('Credential result:', credentialResult);

        if (credentialResult.success) {
          session.status = 'completed';
          session.verificationResult = {
            passed: true,
            credentialSignature: credentialResult.signature,
          };
        } else {
          session.status = 'failed';
          session.verificationResult = {
            passed: false,
            reason: credentialResult.error,
          };
        }
      } else {
        session.status = 'failed';
        session.verificationResult = {
          passed: false,
          reason: verificationResult.reason,
        };
      }

      sessions.set(sessionId, session);
      return { success: true, session };
    } catch (error: any) {
      session.status = 'failed';
      session.verificationResult = {
        passed: false,
        reason: error.message,
      };
      sessions.set(sessionId, session);
      return { success: false, error: error.message };
    }
  }

  private async verifyKycData(session: KycSession): Promise<{ passed: boolean; reason?: string }> {
    const { credentialType, data } = session;

    // Basic validation rules based on credential type
    switch (credentialType) {
      case 'kycBasic':
        if (!data.fullName || data.fullName.length < 2) {
          return { passed: false, reason: 'Full name is required' };
        }
        if (!data.dateOfBirth) {
          return { passed: false, reason: 'Date of birth is required' };
        }
        if (!data.country) {
          return { passed: false, reason: 'Country is required' };
        }
        break;

      case 'kycFull':
        if (!data.fullName || !data.dateOfBirth || !data.country) {
          return { passed: false, reason: 'Full name, date of birth, and country are required' };
        }
        if (!data.documentType || !data.documentNumber) {
          return { passed: false, reason: 'Document verification is required' };
        }
        break;

      case 'brazilianCpf':
        if (!data.cpf || !this.validateCPF(data.cpf)) {
          return { passed: false, reason: 'Valid CPF is required' };
        }
        if (!data.fullName) {
          return { passed: false, reason: 'Full name is required' };
        }
        break;

      case 'brazilianCnpj':
        if (!data.cnpj || !this.validateCNPJ(data.cnpj)) {
          return { passed: false, reason: 'Valid CNPJ is required' };
        }
        break;

      case 'accreditedInvestor':
        if (!data.fullName || !data.country) {
          return { passed: false, reason: 'Full name and country are required' };
        }
        // US SEC Rule 501 criteria
        if (data.country === 'US') {
          if (
            (!data.annualIncome || data.annualIncome < 200000) &&
            (!data.netWorth || data.netWorth < 1000000)
          ) {
            return {
              passed: false,
              reason:
                'Must have annual income > $200,000 or net worth > $1,000,000 (excluding primary residence)',
            };
          }
        }
        break;

      case 'qualifiedPurchaser':
        if (!data.netWorth || data.netWorth < 5000000) {
          return { passed: false, reason: 'Must have investments of at least $5,000,000' };
        }
        break;

      default:
        return { passed: false, reason: 'Unknown credential type' };
    }

    // In production, integrate with actual KYC providers here
    // For now, we approve if basic validation passes
    return { passed: true };
  }

  private validateCPF(cpf: string): boolean {
    // Remove non-digits
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;

    // Check for all same digits
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validate check digits
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf[i]) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[9])) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf[i]) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf[10])) return false;

    return true;
  }

  private validateCNPJ(cnpj: string): boolean {
    // Remove non-digits
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return false;

    // Check for all same digits
    if (/^(\d)\1+$/.test(cnpj)) return false;

    // Validate check digits
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * weights1[i];
    }
    let remainder = sum % 11;
    let digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cnpj[12])) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * weights2[i];
    }
    remainder = sum % 11;
    let digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cnpj[13])) return false;

    return true;
  }

  deleteSession(sessionId: string): boolean {
    return sessions.delete(sessionId);
  }

  // Cleanup expired sessions (call periodically)
  cleanupExpiredSessions(): number {
    const now = Date.now();
    let count = 0;
    for (const [sessionId, session] of sessions) {
      if (now > session.expiresAt) {
        sessions.delete(sessionId);
        count++;
      }
    }
    return count;
  }
}

export const kycSessionService = new KycSessionService();
