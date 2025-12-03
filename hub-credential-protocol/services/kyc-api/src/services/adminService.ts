/**
 * Admin Service - Property Management for Hub Token Program
 *
 * This service handles administrative operations:
 * - Create property mints
 * - Mint tokens to investors
 * - Deposit revenue
 * - Manage properties
 */

import * as anchor from '@coral-xyz/anchor';
import { BN } from '@coral-xyz/anchor';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { config } from '../config.js';
import HUB_TOKEN_IDL from '../hub_token_program.json';

// Program constants
const PROPERTY_STATE_SEED = Buffer.from('property_state');
const EXTRA_ACCOUNT_METAS_SEED = Buffer.from('extra_account_metas');
const REVENUE_VAULT_SEED = Buffer.from('revenue_vault');
const REVENUE_EPOCH_SEED = Buffer.from('revenue_epoch');
const CREDENTIAL_SEED = Buffer.from('credential');

// Hub Credential Program ID
const HUB_CREDENTIAL_PROGRAM_ID = config.program.credentialProgramId;

export interface PropertyDetails {
  propertyType: string;
  location: string;
  totalValueUsd: number;
  valuePerToken: number;
  annualYieldPercent: number;
  propertyAddress: string;
  metadataUri?: string; // IPFS URI for property metadata
}

export interface CreatePropertyParams {
  name: string;
  symbol: string;
  decimals?: number;
  totalSupply: number;
  details: PropertyDetails;
}

export interface MintTokensParams {
  propertyMint: string;
  investorWallet: string;
  amount: number;
}

export interface DepositRevenueParams {
  propertyMint: string;
  epochNumber: number;
  amountSol: number;
}

export interface PropertyInfo {
  mint: string;
  name: string;
  symbol: string;
  authority: string;
  totalSupply: string;
  circulatingSupply: string;
  isActive: boolean;
  details: PropertyDetails;
  createdAt: number;
  metadataUri?: string;
}

class AdminService {
  private connection: Connection;
  private program: anchor.Program | null = null;

  constructor() {
    this.connection = config.solana.connection;
  }

  private getProgram(): anchor.Program {
    if (!this.program) {
      const issuerKeypair = config.issuer.keypair;
      if (!issuerKeypair) {
        throw new Error('Issuer keypair not configured');
      }

      const wallet = {
        publicKey: issuerKeypair.publicKey,
        signTransaction: async <T extends Transaction>(tx: T): Promise<T> => {
          tx.sign(issuerKeypair);
          return tx;
        },
        signAllTransactions: async <T extends Transaction>(txs: T[]): Promise<T[]> => {
          txs.forEach(tx => tx.sign(issuerKeypair));
          return txs;
        },
      };

      const provider = new anchor.AnchorProvider(
        this.connection,
        wallet as any,
        { commitment: 'confirmed' }
      );

      this.program = new anchor.Program(
        HUB_TOKEN_IDL as any,
        provider
      );
    }
    return this.program;
  }

  /**
   * Verify admin wallet authorization
   */
  isAdminWallet(walletAddress: string): boolean {
    return walletAddress === config.admin.walletAddress;
  }

  /**
   * Create a new property mint
   */
  async createProperty(params: CreatePropertyParams): Promise<{
    mint: string;
    propertyState: string;
    signature: string;
  }> {
    const program = this.getProgram();
    const issuerKeypair = config.issuer.keypair!;

    // Generate new mint keypair
    const mintKeypair = Keypair.generate();

    // Derive PropertyState PDA
    const [propertyStatePDA] = PublicKey.findProgramAddressSync(
      [PROPERTY_STATE_SEED, mintKeypair.publicKey.toBuffer()],
      program.programId
    );

    // Derive ExtraAccountMetaList PDA
    const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
      [EXTRA_ACCOUNT_METAS_SEED, mintKeypair.publicKey.toBuffer()],
      program.programId
    );

    // Convert PropertyDetails to program format
    const programDetails = {
      propertyType: params.details.propertyType,
      location: params.details.location,
      totalValueUsd: new BN(params.details.totalValueUsd),
      valuePerToken: new BN(Math.floor(params.details.valuePerToken * 1e6)), // 6 decimals
      annualYieldPercent: params.details.annualYieldPercent * 100, // basis points
      propertyAddress: params.details.propertyAddress,
      metadataUri: params.details.metadataUri || '', // IPFS metadata URI
    };

    console.log('Creating property mint...');
    console.log('  Mint:', mintKeypair.publicKey.toString());
    console.log('  PropertyState:', propertyStatePDA.toString());
    console.log('  ExtraAccountMetas:', extraAccountMetaListPDA.toString());

    const signature = await program.methods
      .createPropertyMint(
        params.name,
        params.symbol,
        params.decimals || 6,
        new BN(params.totalSupply),
        programDetails
      )
      .accounts({
        authority: issuerKeypair.publicKey,
        mint: mintKeypair.publicKey,
        propertyState: propertyStatePDA,
        extraAccountMetaList: extraAccountMetaListPDA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuerKeypair, mintKeypair])
      .rpc();

    console.log('Property created! Signature:', signature);

    return {
      mint: mintKeypair.publicKey.toString(),
      propertyState: propertyStatePDA.toString(),
      signature,
    };
  }

  /**
   * Mint tokens to an investor (requires investor to have valid KYC credential)
   */
  async mintTokens(params: MintTokensParams): Promise<{
    signature: string;
    tokenAccount: string;
  }> {
    const program = this.getProgram();
    const issuerKeypair = config.issuer.keypair!;

    const mintPubkey = new PublicKey(params.propertyMint);
    const investorPubkey = new PublicKey(params.investorWallet);

    // Derive PropertyState PDA
    const [propertyStatePDA] = PublicKey.findProgramAddressSync(
      [PROPERTY_STATE_SEED, mintPubkey.toBuffer()],
      program.programId
    );

    // Derive investor's credential PDA
    const [investorCredentialPDA] = PublicKey.findProgramAddressSync(
      [CREDENTIAL_SEED, investorPubkey.toBuffer()],
      HUB_CREDENTIAL_PROGRAM_ID
    );

    // Get investor's associated token account
    const investorTokenAccount = getAssociatedTokenAddressSync(
      mintPubkey,
      investorPubkey,
      false,
      TOKEN_2022_PROGRAM_ID
    );

    console.log('Minting tokens...');
    console.log('  Mint:', mintPubkey.toString());
    console.log('  Investor:', investorPubkey.toString());
    console.log('  Amount:', params.amount);
    console.log('  Token Account:', investorTokenAccount.toString());
    console.log('  Credential:', investorCredentialPDA.toString());

    const signature = await program.methods
      .mintPropertyTokens(new BN(params.amount))
      .accounts({
        authority: issuerKeypair.publicKey,
        investor: investorPubkey,
        propertyState: propertyStatePDA,
        mint: mintPubkey,
        investorTokenAccount: investorTokenAccount,
        investorCredential: investorCredentialPDA,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuerKeypair])
      .rpc();

    console.log('Tokens minted! Signature:', signature);

    return {
      signature,
      tokenAccount: investorTokenAccount.toString(),
    };
  }

  /**
   * Deposit revenue for distribution to token holders
   */
  async depositRevenue(params: DepositRevenueParams): Promise<{
    signature: string;
    revenueVault: string;
    revenueEpoch: string;
  }> {
    const program = this.getProgram();
    const issuerKeypair = config.issuer.keypair!;

    const mintPubkey = new PublicKey(params.propertyMint);
    const amountLamports = new BN(params.amountSol * LAMPORTS_PER_SOL);

    // Derive PropertyState PDA
    const [propertyStatePDA] = PublicKey.findProgramAddressSync(
      [PROPERTY_STATE_SEED, mintPubkey.toBuffer()],
      program.programId
    );

    // Derive Revenue Vault PDA
    const [revenueVaultPDA] = PublicKey.findProgramAddressSync(
      [REVENUE_VAULT_SEED, mintPubkey.toBuffer()],
      program.programId
    );

    // Derive Revenue Epoch PDA
    const epochBuffer = Buffer.alloc(8);
    epochBuffer.writeBigUInt64LE(BigInt(params.epochNumber));
    const [revenueEpochPDA] = PublicKey.findProgramAddressSync(
      [REVENUE_EPOCH_SEED, mintPubkey.toBuffer(), epochBuffer],
      program.programId
    );

    console.log('Depositing revenue...');
    console.log('  Property:', mintPubkey.toString());
    console.log('  Epoch:', params.epochNumber);
    console.log('  Amount:', params.amountSol, 'SOL');
    console.log('  Revenue Vault:', revenueVaultPDA.toString());
    console.log('  Revenue Epoch:', revenueEpochPDA.toString());

    const signature = await program.methods
      .depositRevenue(new BN(params.epochNumber), amountLamports)
      .accounts({
        authority: issuerKeypair.publicKey,
        propertyState: propertyStatePDA,
        mint: mintPubkey,
        revenueVault: revenueVaultPDA,
        revenueEpoch: revenueEpochPDA,
        systemProgram: SystemProgram.programId,
      })
      .signers([issuerKeypair])
      .rpc();

    console.log('Revenue deposited! Signature:', signature);

    return {
      signature,
      revenueVault: revenueVaultPDA.toString(),
      revenueEpoch: revenueEpochPDA.toString(),
    };
  }

  /**
   * Get all properties from the program
   */
  async getProperties(): Promise<PropertyInfo[]> {
    const program = this.getProgram();

    try {
      const accounts = await (program.account as any).propertyState.all();

      return accounts.map((acc: any) => ({
        mint: acc.account.mint.toString(),
        name: acc.account.propertyName,
        symbol: acc.account.propertySymbol,
        authority: acc.account.authority.toString(),
        totalSupply: acc.account.totalSupply.toString(),
        circulatingSupply: acc.account.circulatingSupply.toString(),
        isActive: acc.account.isActive,
        details: {
          propertyType: acc.account.details.propertyType,
          location: acc.account.details.location,
          totalValueUsd: acc.account.details.totalValueUsd.toNumber(),
          valuePerToken: acc.account.details.valuePerToken.toNumber() / 1e6,
          annualYieldPercent: acc.account.details.annualYieldPercent / 100,
          propertyAddress: acc.account.details.propertyAddress,
          metadataUri: acc.account.details.metadataUri || '',
        },
        createdAt: acc.account.createdAt.toNumber(),
        metadataUri: acc.account.details.metadataUri || '',
      }));
    } catch (error) {
      console.error('Error fetching properties:', error);
      return [];
    }
  }

  /**
   * Get property by mint address
   */
  async getProperty(mintAddress: string): Promise<PropertyInfo | null> {
    const program = this.getProgram();
    const mintPubkey = new PublicKey(mintAddress);

    const [propertyStatePDA] = PublicKey.findProgramAddressSync(
      [PROPERTY_STATE_SEED, mintPubkey.toBuffer()],
      program.programId
    );

    try {
      const account = await (program.account as any).propertyState.fetch(propertyStatePDA);

      return {
        mint: account.mint.toString(),
        name: account.propertyName,
        symbol: account.propertySymbol,
        authority: account.authority.toString(),
        totalSupply: account.totalSupply.toString(),
        circulatingSupply: account.circulatingSupply.toString(),
        isActive: account.isActive,
        details: {
          propertyType: account.details.propertyType,
          location: account.details.location,
          totalValueUsd: account.details.totalValueUsd.toNumber(),
          valuePerToken: account.details.valuePerToken.toNumber() / 1e6,
          annualYieldPercent: account.details.annualYieldPercent / 100,
          propertyAddress: account.details.propertyAddress,
          metadataUri: account.details.metadataUri || '',
        },
        createdAt: account.createdAt.toNumber(),
        metadataUri: account.details.metadataUri || '',
      };
    } catch (error) {
      console.error('Error fetching property:', error);
      return null;
    }
  }

  /**
   * Toggle property active status
   */
  async togglePropertyStatus(mintAddress: string): Promise<{
    signature: string;
    isActive: boolean;
  }> {
    const program = this.getProgram();
    const issuerKeypair = config.issuer.keypair!;
    const mintPubkey = new PublicKey(mintAddress);

    const [propertyStatePDA] = PublicKey.findProgramAddressSync(
      [PROPERTY_STATE_SEED, mintPubkey.toBuffer()],
      program.programId
    );

    const signature = await program.methods
      .togglePropertyStatus()
      .accounts({
        authority: issuerKeypair.publicKey,
        propertyState: propertyStatePDA,
        mint: mintPubkey,
      })
      .signers([issuerKeypair])
      .rpc();

    // Fetch new status
    const account = await (program.account as any).propertyState.fetch(propertyStatePDA);

    return {
      signature,
      isActive: account.isActive,
    };
  }
}

export const adminService = new AdminService();
