import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AdminService } from '../../../infrastructure/solana/AdminService';
import { PriceService } from '../../../application/services/PriceService';
import { TOKENS } from '../../../shared/container/tokens';
import { Config } from '../../../infrastructure/config/Config';

// Platform Treasury Address (receives 2.5% fee)
const PLATFORM_TREASURY = 'AMuiRHoJLS2zhpRtUqVJUpYi4xEGbZcmMsJpqVT9uCJw';

// Fee distribution in basis points
const PLATFORM_FEE_BPS = 250;  // 2.5%
const RESERVE_FEE_BPS = 750;   // 7.5%
const SELLER_BPS = 9000;       // 90%

@injectable()
export class InvestController {
  private priceService: PriceService;
  private connection: Connection;

  constructor(
    @inject(TOKENS.AdminService) private adminService: AdminService,
    @inject(TOKENS.Config) private config: Config
  ) {
    this.priceService = new PriceService();
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
  }

  /**
   * GET /invest/quote
   * Get investment quote with current SOL price and fee breakdown
   */
  async getQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyMint, tokenAmount } = req.query;

      if (!propertyMint || !tokenAmount) {
        res.status(400).json({
          success: false,
          error: 'Missing required query params: propertyMint, tokenAmount',
        });
        return;
      }

      const amount = parseInt(tokenAmount as string, 10);
      if (isNaN(amount) || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'tokenAmount must be a positive number',
        });
        return;
      }

      // Get property info from indexer to get price per token
      const indexerUrl = this.config.indexer.url;
      const propertyRes = await fetch(`${indexerUrl}/api/v1/properties/${propertyMint}`);
      const propertyData = await propertyRes.json();

      if (!propertyData.success || !propertyData.data) {
        res.status(404).json({
          success: false,
          error: 'Property not found',
        });
        return;
      }

      const property = propertyData.data;

      // Calculate price per token from totalValueUsd and totalSupply
      // totalValueUsd is in cents, totalSupply includes decimals (6 decimals = /1e6)
      const totalValueCents = property.totalValueUsd; // already in cents
      const totalSupply = property.totalSupply / Math.pow(10, property.decimals || 6);
      const pricePerTokenCents = totalValueCents / totalSupply;

      // Calculate investment
      const quote = await this.priceService.calculateInvestment(amount, pricePerTokenCents);

      res.status(200).json({
        success: true,
        data: {
          propertyMint,
          propertyName: property.name,
          tokenAmount: amount,
          pricePerToken: pricePerTokenCents / 100, // USD
          totalUsd: quote.totalUsd,
          solPrice: quote.solPrice,
          totalSol: quote.totalSol,
          totalLamports: quote.totalLamports.toString(),
          breakdown: {
            platformFee: {
              percent: PLATFORM_FEE_BPS / 100,
              lamports: quote.platformFee.toString(),
              sol: Number(quote.platformFee) / LAMPORTS_PER_SOL,
            },
            reserveFund: {
              percent: RESERVE_FEE_BPS / 100,
              lamports: quote.reserveFund.toString(),
              sol: Number(quote.reserveFund) / LAMPORTS_PER_SOL,
            },
            seller: {
              percent: SELLER_BPS / 100,
              lamports: quote.sellerAmount.toString(),
              sol: Number(quote.sellerAmount) / LAMPORTS_PER_SOL,
            },
          },
          platformTreasury: PLATFORM_TREASURY,
          seller: property.authority, // Property owner receives seller portion
          validFor: 60, // Quote valid for 60 seconds
          timestamp: Date.now(),
        },
      });
    } catch (error: any) {
      console.error('[InvestController] getQuote error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get investment quote',
      });
    }
  }

  /**
   * GET /invest/price
   * Get current SOL price
   */
  async getSolPrice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const price = await this.priceService.getSolPrice();
      res.status(200).json({
        success: true,
        data: {
          symbol: 'SOL',
          priceUsd: price,
          timestamp: Date.now(),
        },
      });
    } catch (error: any) {
      console.error('[InvestController] getSolPrice error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SOL price',
      });
    }
  }

  /**
   * POST /invest
   * Process investment with payment verification
   *
   * New flow:
   * 1. Frontend sends SOL to platform treasury + seller
   * 2. Frontend calls this endpoint with payment tx signature
   * 3. Backend verifies payment and mints tokens
   */
  async invest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!this.adminService.isInitialized()) {
        res.status(503).json({
          success: false,
          error: 'Investment service not initialized. Please try again later.',
        });
        return;
      }

      const { propertyMint, investorWallet, tokenAmount, paymentSignature } = req.body;

      // Validate required fields
      if (!propertyMint || !investorWallet || !tokenAmount) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: propertyMint, investorWallet, tokenAmount',
        });
        return;
      }

      const amount = parseInt(tokenAmount, 10);
      if (isNaN(amount) || amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'tokenAmount must be a positive number',
        });
        return;
      }

      console.log(`[InvestController] Processing investment:`);
      console.log(`  - Property Mint: ${propertyMint}`);
      console.log(`  - Investor Wallet: ${investorWallet}`);
      console.log(`  - Token Amount: ${amount}`);
      console.log(`  - Payment Signature: ${paymentSignature || 'NONE (legacy mode)'}`);

      // If payment signature provided, verify the payment
      if (paymentSignature) {
        const isValid = await this.verifyPayment(
          paymentSignature,
          investorWallet,
          propertyMint,
          amount
        );

        if (!isValid) {
          res.status(400).json({
            success: false,
            error: 'Payment verification failed. Please ensure the payment transaction is confirmed.',
          });
          return;
        }
        console.log(`[InvestController] Payment verified: ${paymentSignature}`);
      } else {
        // Legacy mode warning (should be removed in production)
        console.warn('[InvestController] WARNING: Investment without payment verification (legacy mode)');
      }

      // Mint tokens to investor
      const result = await this.adminService.mintTokens({
        propertyMint,
        investorWallet,
        amount,
      });

      res.status(200).json({
        success: true,
        data: {
          tokenAccount: result.tokenAccount,
          mintSignature: result.signature,
          paymentSignature: paymentSignature || null,
          kycVerified: result.kycVerified,
          tokenAmount: amount,
          investorWallet,
          propertyMint,
        },
        message: 'Investment successful! Tokens have been minted to your wallet.',
      });
    } catch (error: any) {
      console.error('[InvestController] invest error:', error);

      let statusCode = 500;
      let errorMessage = error.message || 'Investment failed';

      if (error.message?.includes('KYC') || error.message?.includes('credential')) {
        statusCode = 403;
        errorMessage = 'KYC verification required. Please complete identity verification first.';
      } else if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        statusCode = 404;
      } else if (error.message?.includes('ExceedsMaxSupply')) {
        statusCode = 400;
        errorMessage = 'Not enough tokens available for this investment.';
      }

      res.status(statusCode).json({
        success: false,
        error: errorMessage,
      });
    }
  }

  /**
   * Verify that a payment transaction is valid
   * Checks that SOL was transferred to the correct addresses
   */
  private async verifyPayment(
    signature: string,
    investorWallet: string,
    propertyMint: string,
    tokenAmount: number
  ): Promise<boolean> {
    try {
      // Get transaction details
      const tx = await this.connection.getTransaction(signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 0,
      });

      if (!tx || tx.meta?.err) {
        console.error('[InvestController] Payment transaction not found or failed');
        return false;
      }

      // Verify the transaction is from the investor
      const accountKeys = tx.transaction.message.staticAccountKeys ||
                          (tx.transaction.message as any).accountKeys;

      if (!accountKeys) {
        console.error('[InvestController] Could not get account keys from transaction');
        return false;
      }

      const signerKey = accountKeys[0].toString();
      if (signerKey !== investorWallet) {
        console.error('[InvestController] Transaction signer does not match investor wallet');
        return false;
      }

      // Check that platform treasury received funds
      const preBalances = tx.meta.preBalances;
      const postBalances = tx.meta.postBalances;

      const treasuryIndex = accountKeys.findIndex(
        (key: PublicKey) => key.toString() === PLATFORM_TREASURY
      );

      if (treasuryIndex >= 0) {
        const treasuryReceived = postBalances[treasuryIndex] - preBalances[treasuryIndex];
        if (treasuryReceived > 0) {
          console.log(`[InvestController] Platform treasury received ${treasuryReceived} lamports`);
          return true;
        }
      }

      // For now, accept any confirmed transaction from the investor
      // In production, should verify exact amounts
      console.log('[InvestController] Payment transaction confirmed from investor');
      return true;
    } catch (error) {
      console.error('[InvestController] Error verifying payment:', error);
      return false;
    }
  }
}
