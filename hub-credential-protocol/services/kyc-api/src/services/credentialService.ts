import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import { config } from '../config.js';
import {
  IssueCredentialInput,
  RefreshCredentialInput,
  RevokeCredentialInput,
  CredentialResponse,
  VerificationResponse,
} from '../types/credential.js';
import IDL_DATA from '../credential_program_idl.json';

const IDL = IDL_DATA as any;

// Map credential type string to u8
function getCredentialTypeValue(typeStr: string): number {
  const typeMap: Record<string, number> = {
    kycBasic: 0,
    kycFull: 1,
    accreditedInvestor: 2,
    qualifiedPurchaser: 3,
    brazilianCpf: 4,
    brazilianCnpj: 5,
  };
  return typeMap[typeStr] || 0;
}

// Map credential type enum or number to name
// Anchor returns enums as objects like { kycBasic: {} } or as numbers
function getCredentialTypeName(typeValue: any): string {
  // Handle numeric values
  if (typeof typeValue === 'number') {
    const names = ['kycBasic', 'kycFull', 'accreditedInvestor', 'qualifiedPurchaser', 'brazilianCpf', 'brazilianCnpj'];
    return names[typeValue] || 'unknown';
  }
  // Handle Anchor enum objects like { kycBasic: {} }
  if (typeof typeValue === 'object' && typeValue !== null) {
    const keys = Object.keys(typeValue);
    if (keys.length > 0) {
      return keys[0];
    }
  }
  return 'unknown';
}

// Map credential status enum or number to name
// Anchor returns enums as objects like { active: {} } or as numbers
function getCredentialStatusName(statusValue: any): string {
  // Handle numeric values
  if (typeof statusValue === 'number') {
    const statuses = ['active', 'expired', 'revoked', 'suspended'];
    return statuses[statusValue] || 'unknown';
  }
  // Handle Anchor enum objects like { active: {} }
  if (typeof statusValue === 'object' && statusValue !== null) {
    const keys = Object.keys(statusValue);
    if (keys.length > 0) {
      return keys[0];
    }
  }
  return 'unknown';
}

export class CredentialService {
  private connection = config.solana.connection;
  private programId = config.program.credentialProgramId;

  private getProgram(): anchor.Program | null {
    console.log('[getProgram] Starting...');
    const issuerKeypair = config.issuer.keypair;
    console.log('[getProgram] Got issuer keypair:', !!issuerKeypair);
    if (!issuerKeypair) return null;

    console.log('[getProgram] Creating wallet...');
    const wallet = new anchor.Wallet(issuerKeypair);
    console.log('[getProgram] Creating provider...');
    const provider = new anchor.AnchorProvider(this.connection, wallet, {
      commitment: 'confirmed',
    });

    console.log('[getProgram] Creating program with programId:', this.programId.toString());
    try {
      const program = new anchor.Program(IDL as unknown as anchor.Idl, provider);
      console.log('[getProgram] Program created successfully');
      return program;
    } catch (error: any) {
      console.error('[getProgram] Error creating program:', error.message);
      return null;
    }
  }

  private findCredentialPDA(holder: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from('credential'), holder.toBuffer()], this.programId);
  }

  private findNetworkPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from('credential_network')], this.programId);
  }

  private findIssuerPDA(issuerAuthority: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync([Buffer.from('issuer'), issuerAuthority.toBuffer()], this.programId);
  }

  async issueCredential(input: IssueCredentialInput): Promise<CredentialResponse> {
    console.log('[1] issueCredential called with:', input);
    const program = this.getProgram();
    console.log('[2] program:', !!program);
    if (!program) {
      console.log('[3] No program - issuer not configured');
      return { success: false, error: 'Issuer not configured' };
    }

    const issuerKeypair = config.issuer.keypair!;
    console.log('[4] Got issuer keypair');

    try {
      console.log('[5] Issue credential - input:', input);
      const holderPubkey = new PublicKey(input.userWallet);
      const [credentialPDA] = this.findCredentialPDA(holderPubkey);
      const [networkPDA] = this.findNetworkPDA();
      const [issuerPDA] = this.findIssuerPDA(issuerKeypair.publicKey);

      const expiryTimestamp = Math.floor(Date.now() / 1000) + input.expiresInDays * 24 * 60 * 60;
      const credentialType = getCredentialTypeValue(input.credentialType);
      const metadataUri = input.metadata || '';

      console.log('[6] Calling issueCredential with:', {
        credentialType,
        expiryTimestamp,
        metadataUri,
      });

      const tx = await program.methods
        .issueCredential(credentialType, new BN(expiryTimestamp), metadataUri)
        .accounts({
          issuerAuthority: issuerKeypair.publicKey,
          network: networkPDA,
          issuer: issuerPDA,
          holder: holderPubkey,
          credential: credentialPDA,
          systemProgram: SystemProgram.programId,
        })
        .signers([issuerKeypair])
        .rpc();

      console.log('[7] Transaction sent:', tx);

      // Fetch the created credential
      const credentialAccount = await (program.account as any).userCredential.fetch(credentialPDA);

      return {
        success: true,
        credential: {
          publicKey: credentialPDA.toString(),
          user: credentialAccount.holder.toString(),
          issuer: credentialAccount.issuer.toString(),
          credentialType: getCredentialTypeName(credentialAccount.credentialType),
          status: getCredentialStatusName(credentialAccount.status),
          issuedAt: credentialAccount.issuedAt.toNumber(),
          expiresAt: credentialAccount.expiresAt.toNumber(),
          metadata: credentialAccount.metadataUri,
        },
        signature: tx,
      };
    } catch (error: any) {
      console.error('[ERROR] Issue credential error:', error);
      return { success: false, error: error.message || 'Failed to issue credential' };
    }
  }

  async verifyCredential(userWallet: string, requiredType?: string): Promise<VerificationResponse> {
    try {
      const holderPubkey = new PublicKey(userWallet);
      const [credentialPDA] = this.findCredentialPDA(holderPubkey);

      const accountInfo = await this.connection.getAccountInfo(credentialPDA);
      if (!accountInfo) {
        return { success: true, isValid: false, reason: 'No credential found' };
      }

      const program = this.getProgram();
      if (!program) {
        return { success: false, isValid: false, reason: 'Service not configured' };
      }

      const credentialAccount = await (program.account as any).userCredential.fetch(credentialPDA);
      const status = getCredentialStatusName(credentialAccount.status);
      const credentialType = getCredentialTypeName(credentialAccount.credentialType);
      const expiresAt = credentialAccount.expiresAt.toNumber();
      const now = Math.floor(Date.now() / 1000);

      if (status !== 'active') {
        return {
          success: true,
          isValid: false,
          reason: `Credential is ${status}`,
          credential: {
            publicKey: credentialPDA.toString(),
            user: credentialAccount.holder.toString(),
            issuer: credentialAccount.issuer.toString(),
            credentialType,
            status,
            issuedAt: credentialAccount.issuedAt.toNumber(),
            expiresAt,
            metadata: credentialAccount.metadataUri,
          },
        };
      }

      if (expiresAt < now) {
        return {
          success: true,
          isValid: false,
          reason: 'Credential has expired',
          credential: {
            publicKey: credentialPDA.toString(),
            user: credentialAccount.holder.toString(),
            issuer: credentialAccount.issuer.toString(),
            credentialType,
            status: 'expired',
            issuedAt: credentialAccount.issuedAt.toNumber(),
            expiresAt,
            metadata: credentialAccount.metadataUri,
          },
        };
      }

      if (requiredType && credentialType !== requiredType) {
        return {
          success: true,
          isValid: false,
          reason: `Credential type mismatch: required ${requiredType}, got ${credentialType}`,
          credential: {
            publicKey: credentialPDA.toString(),
            user: credentialAccount.holder.toString(),
            issuer: credentialAccount.issuer.toString(),
            credentialType,
            status,
            issuedAt: credentialAccount.issuedAt.toNumber(),
            expiresAt,
            metadata: credentialAccount.metadataUri,
          },
        };
      }

      return {
        success: true,
        isValid: true,
        credential: {
          publicKey: credentialPDA.toString(),
          user: credentialAccount.holder.toString(),
          issuer: credentialAccount.issuer.toString(),
          credentialType,
          status,
          issuedAt: credentialAccount.issuedAt.toNumber(),
          expiresAt,
          metadata: credentialAccount.metadataUri,
        },
      };
    } catch (error: any) {
      console.error('Verify credential error:', error);
      return { success: false, isValid: false, reason: error.message || 'Verification failed' };
    }
  }

  async refreshCredential(input: RefreshCredentialInput): Promise<CredentialResponse> {
    const program = this.getProgram();
    if (!program) {
      return { success: false, error: 'Issuer not configured' };
    }

    const issuerKeypair = config.issuer.keypair!;

    try {
      const holderPubkey = new PublicKey(input.userWallet);
      const [credentialPDA] = this.findCredentialPDA(holderPubkey);
      const [issuerPDA] = this.findIssuerPDA(issuerKeypair.publicKey);

      const newExpiryTimestamp = Math.floor(Date.now() / 1000) + input.newExpiresInDays * 24 * 60 * 60;

      const tx = await program.methods
        .refreshCredential(new BN(newExpiryTimestamp))
        .accounts({
          issuerAuthority: issuerKeypair.publicKey,
          issuer: issuerPDA,
          holder: holderPubkey,
          credential: credentialPDA,
        })
        .signers([issuerKeypair])
        .rpc();

      const credentialAccount = await (program.account as any).userCredential.fetch(credentialPDA);

      return {
        success: true,
        credential: {
          publicKey: credentialPDA.toString(),
          user: credentialAccount.holder.toString(),
          issuer: credentialAccount.issuer.toString(),
          credentialType: getCredentialTypeName(credentialAccount.credentialType),
          status: getCredentialStatusName(credentialAccount.status),
          issuedAt: credentialAccount.issuedAt.toNumber(),
          expiresAt: credentialAccount.expiresAt.toNumber(),
          metadata: credentialAccount.metadataUri,
        },
        signature: tx,
      };
    } catch (error: any) {
      console.error('Refresh credential error:', error);
      return { success: false, error: error.message || 'Failed to refresh credential' };
    }
  }

  async revokeCredential(input: RevokeCredentialInput): Promise<CredentialResponse> {
    const program = this.getProgram();
    if (!program) {
      return { success: false, error: 'Issuer not configured' };
    }

    const issuerKeypair = config.issuer.keypair!;

    try {
      const holderPubkey = new PublicKey(input.userWallet);
      const [credentialPDA] = this.findCredentialPDA(holderPubkey);
      const [issuerPDA] = this.findIssuerPDA(issuerKeypair.publicKey);
      const [networkPDA] = this.findNetworkPDA();

      const tx = await program.methods
        .revokeCredential(input.reason || 'Revoked by issuer')
        .accounts({
          authority: issuerKeypair.publicKey,
          network: networkPDA,
          issuer: issuerPDA,
          holder: holderPubkey,
          credential: credentialPDA,
        })
        .signers([issuerKeypair])
        .rpc();

      const credentialAccount = await (program.account as any).userCredential.fetch(credentialPDA);

      return {
        success: true,
        credential: {
          publicKey: credentialPDA.toString(),
          user: credentialAccount.holder.toString(),
          issuer: credentialAccount.issuer.toString(),
          credentialType: getCredentialTypeName(credentialAccount.credentialType),
          status: getCredentialStatusName(credentialAccount.status),
          issuedAt: credentialAccount.issuedAt.toNumber(),
          expiresAt: credentialAccount.expiresAt.toNumber(),
          metadata: credentialAccount.metadataUri,
        },
        signature: tx,
      };
    } catch (error: any) {
      console.error('Revoke credential error:', error);
      return { success: false, error: error.message || 'Failed to revoke credential' };
    }
  }

  async getCredential(userWallet: string): Promise<CredentialResponse> {
    try {
      const holderPubkey = new PublicKey(userWallet);
      const [credentialPDA] = this.findCredentialPDA(holderPubkey);

      const program = this.getProgram();
      if (!program) {
        const accountInfo = await this.connection.getAccountInfo(credentialPDA);
        if (!accountInfo) {
          return { success: false, error: 'No credential found' };
        }
        return { success: false, error: 'Service not fully configured' };
      }

      const credentialAccount = await (program.account as any).userCredential.fetch(credentialPDA);

      return {
        success: true,
        credential: {
          publicKey: credentialPDA.toString(),
          user: credentialAccount.holder.toString(),
          issuer: credentialAccount.issuer.toString(),
          credentialType: getCredentialTypeName(credentialAccount.credentialType),
          status: getCredentialStatusName(credentialAccount.status),
          issuedAt: credentialAccount.issuedAt.toNumber(),
          expiresAt: credentialAccount.expiresAt.toNumber(),
          metadata: credentialAccount.metadataUri,
        },
      };
    } catch (error: any) {
      if (error.message?.includes('Account does not exist')) {
        return { success: false, error: 'No credential found' };
      }
      console.error('Get credential error:', error);
      return { success: false, error: error.message || 'Failed to get credential' };
    }
  }
}

export const credentialService = new CredentialService();
