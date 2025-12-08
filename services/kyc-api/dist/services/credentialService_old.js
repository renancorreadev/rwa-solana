"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.credentialService = exports.CredentialService = void 0;
const web3_js_1 = require("@solana/web3.js");
const anchor = __importStar(require("@coral-xyz/anchor"));
const anchor_1 = require("@coral-xyz/anchor");
const config_js_1 = require("../config.js");
const credential_program_idl_json_1 = __importDefault(require("../credential_program_idl.json"));
const IDL = credential_program_idl_json_1.default;
function getCredentialTypeValue(typeStr) {
    const typeMap = {
        kycBasic: { kycBasic: {} },
        kycFull: { kycFull: {} },
        accreditedInvestor: { accreditedInvestor: {} },
        qualifiedPurchaser: { qualifiedPurchaser: {} },
        brazilianCpf: { brazilianCpf: {} },
        brazilianCnpj: { brazilianCnpj: {} },
    };
    return typeMap[typeStr] || { kycBasic: {} };
}
function getCredentialTypeName(typeObj) {
    if (typeObj.kycBasic)
        return 'kycBasic';
    if (typeObj.kycFull)
        return 'kycFull';
    if (typeObj.accreditedInvestor)
        return 'accreditedInvestor';
    if (typeObj.qualifiedPurchaser)
        return 'qualifiedPurchaser';
    if (typeObj.brazilianCpf)
        return 'brazilianCpf';
    if (typeObj.brazilianCnpj)
        return 'brazilianCnpj';
    return 'unknown';
}
function getCredentialStatusName(statusObj) {
    if (statusObj.active)
        return 'active';
    if (statusObj.expired)
        return 'expired';
    if (statusObj.revoked)
        return 'revoked';
    if (statusObj.suspended)
        return 'suspended';
    return 'unknown';
}
class CredentialService {
    connection = config_js_1.config.solana.connection;
    programId = config_js_1.config.program.credentialProgramId;
    getProgram() {
        console.log('[getProgram] Starting...');
        const issuerKeypair = config_js_1.config.issuer.keypair;
        console.log('[getProgram] Got issuer keypair:', !!issuerKeypair);
        if (!issuerKeypair)
            return null;
        console.log('[getProgram] Creating wallet...');
        const wallet = new anchor.Wallet(issuerKeypair);
        console.log('[getProgram] Creating provider...');
        const provider = new anchor.AnchorProvider(this.connection, wallet, {
            commitment: 'confirmed',
        });
        console.log('[getProgram] Creating program with programId:', this.programId.toString());
        console.log('[getProgram] IDL:', JSON.stringify(IDL).substring(0, 100));
        try {
            // Add programId to IDL
            const idlWithAddress = {
                ...IDL,
                address: this.programId.toString()
            };
            const program = new anchor.Program(idlWithAddress, provider);
            console.log('[getProgram] Program created successfully');
            return program;
        }
        catch (error) {
            console.error('[getProgram] Error creating program:', error.message);
            return null;
        }
    }
    findCredentialPDA(user) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('credential'), user.toBuffer()], this.programId);
    }
    findNetworkPDA() {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('network')], this.programId);
    }
    findIssuerPDA(issuer) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('issuer'), issuer.toBuffer()], this.programId);
    }
    async issueCredential(input) {
        console.log('[1] issueCredential called with:', input);
        const program = this.getProgram();
        console.log('[2] program:', !!program);
        if (!program) {
            console.log('[3] No program - issuer not configured');
            return { success: false, error: 'Issuer not configured' };
        }
        const issuerKeypair = config_js_1.config.issuer.keypair;
        console.log('[4] Got issuer keypair');
        try {
            console.log('[5] Issue credential - input:', input);
            const userPubkey = new web3_js_1.PublicKey(input.userWallet);
            const [credentialPDA] = this.findCredentialPDA(userPubkey);
            const [networkPDA] = this.findNetworkPDA();
            const [issuerPDA] = this.findIssuerPDA(issuerKeypair.publicKey);
            const expiresAt = Math.floor(Date.now() / 1000) + input.expiresInDays * 24 * 60 * 60;
            const credentialType = getCredentialTypeValue(input.credentialType);
            const metadata = input.metadata || '';
            console.log('About to call program.methods with:', { credentialType, expiresAt, metadata });
            console.log('BN constructor:', typeof anchor_1.BN);
            console.log('Creating BN with value:', expiresAt);
            const bnExpiry = new anchor_1.BN(expiresAt);
            console.log('BN created:', bnExpiry.toString());
            const tx = await program.methods
                .issueCredential(credentialType, bnExpiry, metadata)
                .accounts({
                credential: credentialPDA,
                user: userPubkey,
                issuer: issuerKeypair.publicKey,
                issuerAccount: issuerPDA,
                network: networkPDA,
                systemProgram: web3_js_1.SystemProgram.programId,
            })
                .signers([issuerKeypair])
                .rpc();
            // Fetch the created credential
            const credentialAccount = await program.account.userCredential.fetch(credentialPDA);
            return {
                success: true,
                credential: {
                    publicKey: credentialPDA.toString(),
                    user: credentialAccount.user.toString(),
                    issuer: credentialAccount.issuer.toString(),
                    credentialType: getCredentialTypeName(credentialAccount.credentialType),
                    status: getCredentialStatusName(credentialAccount.status),
                    issuedAt: credentialAccount.issuedAt.toNumber(),
                    expiresAt: credentialAccount.expiresAt.toNumber(),
                    metadata: credentialAccount.metadata,
                },
                signature: tx,
            };
        }
        catch (error) {
            console.error('Issue credential error:', error);
            return { success: false, error: error.message || 'Failed to issue credential' };
        }
    }
    async verifyCredential(userWallet, requiredType) {
        try {
            const userPubkey = new web3_js_1.PublicKey(userWallet);
            const [credentialPDA] = this.findCredentialPDA(userPubkey);
            const accountInfo = await this.connection.getAccountInfo(credentialPDA);
            if (!accountInfo) {
                return { success: true, isValid: false, reason: 'No credential found' };
            }
            const program = this.getProgram();
            if (!program) {
                return { success: false, isValid: false, reason: 'Service not configured' };
            }
            const credentialAccount = await program.account.userCredential.fetch(credentialPDA);
            const status = getCredentialStatusName(credentialAccount.status);
            const credentialType = getCredentialTypeName(credentialAccount.credentialType);
            const expiresAt = credentialAccount.expiresAt.toNumber();
            const now = Math.floor(Date.now() / 1000);
            // Check status
            if (status !== 'active') {
                return {
                    success: true,
                    isValid: false,
                    reason: `Credential is ${status}`,
                    credential: {
                        publicKey: credentialPDA.toString(),
                        user: credentialAccount.user.toString(),
                        issuer: credentialAccount.issuer.toString(),
                        credentialType,
                        status,
                        issuedAt: credentialAccount.issuedAt.toNumber(),
                        expiresAt,
                        metadata: credentialAccount.metadata,
                    },
                };
            }
            // Check expiration
            if (expiresAt < now) {
                return {
                    success: true,
                    isValid: false,
                    reason: 'Credential has expired',
                    credential: {
                        publicKey: credentialPDA.toString(),
                        user: credentialAccount.user.toString(),
                        issuer: credentialAccount.issuer.toString(),
                        credentialType,
                        status: 'expired',
                        issuedAt: credentialAccount.issuedAt.toNumber(),
                        expiresAt,
                        metadata: credentialAccount.metadata,
                    },
                };
            }
            // Check required type
            if (requiredType && credentialType !== requiredType) {
                return {
                    success: true,
                    isValid: false,
                    reason: `Credential type mismatch: required ${requiredType}, got ${credentialType}`,
                    credential: {
                        publicKey: credentialPDA.toString(),
                        user: credentialAccount.user.toString(),
                        issuer: credentialAccount.issuer.toString(),
                        credentialType,
                        status,
                        issuedAt: credentialAccount.issuedAt.toNumber(),
                        expiresAt,
                        metadata: credentialAccount.metadata,
                    },
                };
            }
            return {
                success: true,
                isValid: true,
                credential: {
                    publicKey: credentialPDA.toString(),
                    user: credentialAccount.user.toString(),
                    issuer: credentialAccount.issuer.toString(),
                    credentialType,
                    status,
                    issuedAt: credentialAccount.issuedAt.toNumber(),
                    expiresAt,
                    metadata: credentialAccount.metadata,
                },
            };
        }
        catch (error) {
            console.error('Verify credential error:', error);
            return { success: false, isValid: false, reason: error.message || 'Verification failed' };
        }
    }
    async refreshCredential(input) {
        const program = this.getProgram();
        if (!program) {
            return { success: false, error: 'Issuer not configured' };
        }
        const issuerKeypair = config_js_1.config.issuer.keypair;
        try {
            const userPubkey = new web3_js_1.PublicKey(input.userWallet);
            const [credentialPDA] = this.findCredentialPDA(userPubkey);
            const [issuerPDA] = this.findIssuerPDA(issuerKeypair.publicKey);
            const newExpiresAt = Math.floor(Date.now() / 1000) + input.newExpiresInDays * 24 * 60 * 60;
            const tx = await program.methods
                .refreshCredential(new anchor_1.BN(newExpiresAt))
                .accounts({
                credential: credentialPDA,
                issuer: issuerKeypair.publicKey,
                issuerAccount: issuerPDA,
            })
                .signers([issuerKeypair])
                .rpc();
            const credentialAccount = await program.account.userCredential.fetch(credentialPDA);
            return {
                success: true,
                credential: {
                    publicKey: credentialPDA.toString(),
                    user: credentialAccount.user.toString(),
                    issuer: credentialAccount.issuer.toString(),
                    credentialType: getCredentialTypeName(credentialAccount.credentialType),
                    status: getCredentialStatusName(credentialAccount.status),
                    issuedAt: credentialAccount.issuedAt.toNumber(),
                    expiresAt: credentialAccount.expiresAt.toNumber(),
                    metadata: credentialAccount.metadata,
                },
                signature: tx,
            };
        }
        catch (error) {
            console.error('Refresh credential error:', error);
            return { success: false, error: error.message || 'Failed to refresh credential' };
        }
    }
    async revokeCredential(input) {
        const program = this.getProgram();
        if (!program) {
            return { success: false, error: 'Issuer not configured' };
        }
        const issuerKeypair = config_js_1.config.issuer.keypair;
        try {
            const userPubkey = new web3_js_1.PublicKey(input.userWallet);
            const [credentialPDA] = this.findCredentialPDA(userPubkey);
            const [issuerPDA] = this.findIssuerPDA(issuerKeypair.publicKey);
            const tx = await program.methods
                .revokeCredential()
                .accounts({
                credential: credentialPDA,
                issuer: issuerKeypair.publicKey,
                issuerAccount: issuerPDA,
            })
                .signers([issuerKeypair])
                .rpc();
            const credentialAccount = await program.account.userCredential.fetch(credentialPDA);
            return {
                success: true,
                credential: {
                    publicKey: credentialPDA.toString(),
                    user: credentialAccount.user.toString(),
                    issuer: credentialAccount.issuer.toString(),
                    credentialType: getCredentialTypeName(credentialAccount.credentialType),
                    status: getCredentialStatusName(credentialAccount.status),
                    issuedAt: credentialAccount.issuedAt.toNumber(),
                    expiresAt: credentialAccount.expiresAt.toNumber(),
                    metadata: credentialAccount.metadata,
                },
                signature: tx,
            };
        }
        catch (error) {
            console.error('Revoke credential error:', error);
            return { success: false, error: error.message || 'Failed to revoke credential' };
        }
    }
    async getCredential(userWallet) {
        try {
            const userPubkey = new web3_js_1.PublicKey(userWallet);
            const [credentialPDA] = this.findCredentialPDA(userPubkey);
            const program = this.getProgram();
            if (!program) {
                // Try to read account without program
                const accountInfo = await this.connection.getAccountInfo(credentialPDA);
                if (!accountInfo) {
                    return { success: false, error: 'No credential found' };
                }
                return { success: false, error: 'Service not fully configured' };
            }
            const credentialAccount = await program.account.userCredential.fetch(credentialPDA);
            return {
                success: true,
                credential: {
                    publicKey: credentialPDA.toString(),
                    user: credentialAccount.user.toString(),
                    issuer: credentialAccount.issuer.toString(),
                    credentialType: getCredentialTypeName(credentialAccount.credentialType),
                    status: getCredentialStatusName(credentialAccount.status),
                    issuedAt: credentialAccount.issuedAt.toNumber(),
                    expiresAt: credentialAccount.expiresAt.toNumber(),
                    metadata: credentialAccount.metadata,
                },
            };
        }
        catch (error) {
            if (error.message?.includes('Account does not exist')) {
                return { success: false, error: 'No credential found' };
            }
            console.error('Get credential error:', error);
            return { success: false, error: error.message || 'Failed to get credential' };
        }
    }
}
exports.CredentialService = CredentialService;
exports.credentialService = new CredentialService();
//# sourceMappingURL=credentialService_old.js.map