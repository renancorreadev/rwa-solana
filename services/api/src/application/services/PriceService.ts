import axios from 'axios';

/**
 * Service for fetching cryptocurrency prices
 */
export class PriceService {
  private cache: Map<string, { price: number; timestamp: number }> = new Map();
  private readonly CACHE_TTL_MS = 60000; // 1 minute cache

  /**
   * Get current SOL price in USD
   * Uses CoinGecko API with caching
   */
  async getSolPrice(): Promise<number> {
    const cached = this.cache.get('SOL');
    const now = Date.now();

    // Return cached price if still valid
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.price;
    }

    try {
      // Try CoinGecko first
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd',
        { timeout: 5000 }
      );

      const price = response.data?.solana?.usd;
      if (price && typeof price === 'number') {
        this.cache.set('SOL', { price, timestamp: now });
        console.log(`[PriceService] SOL price updated: $${price}`);
        return price;
      }

      throw new Error('Invalid price data from CoinGecko');
    } catch (error) {
      console.error('[PriceService] CoinGecko error, trying backup:', error);

      try {
        // Backup: Jupiter Price API
        const jupiterResponse = await axios.get(
          'https://price.jup.ag/v4/price?ids=SOL',
          { timeout: 5000 }
        );

        const jupPrice = jupiterResponse.data?.data?.SOL?.price;
        if (jupPrice && typeof jupPrice === 'number') {
          this.cache.set('SOL', { price: jupPrice, timestamp: now });
          console.log(`[PriceService] SOL price from Jupiter: $${jupPrice}`);
          return jupPrice;
        }

        throw new Error('Invalid price data from Jupiter');
      } catch (backupError) {
        // If both fail, return cached price if available (even if stale)
        if (cached) {
          console.warn('[PriceService] Using stale cached price');
          return cached.price;
        }

        // Last resort fallback price (should not happen in production)
        console.error('[PriceService] All price sources failed, using fallback');
        return 200; // Fallback price
      }
    }
  }

  /**
   * Convert USD amount to SOL lamports
   * @param usdAmount Amount in USD (e.g., 1000 for $1,000)
   * @returns Amount in lamports (1 SOL = 1,000,000,000 lamports)
   */
  async usdToLamports(usdAmount: number): Promise<bigint> {
    const solPrice = await this.getSolPrice();
    const solAmount = usdAmount / solPrice;
    const lamports = Math.floor(solAmount * 1_000_000_000);
    return BigInt(lamports);
  }

  /**
   * Convert lamports to USD
   * @param lamports Amount in lamports
   * @returns Amount in USD
   */
  async lamportsToUsd(lamports: bigint): Promise<number> {
    const solPrice = await this.getSolPrice();
    const solAmount = Number(lamports) / 1_000_000_000;
    return solAmount * solPrice;
  }

  /**
   * Calculate investment breakdown
   * @param tokenAmount Number of tokens to buy
   * @param pricePerTokenUsd Price per token in USD cents
   */
  async calculateInvestment(tokenAmount: number, pricePerTokenUsd: number): Promise<{
    totalUsd: number;
    solPrice: number;
    totalSol: number;
    totalLamports: bigint;
    platformFee: bigint;
    reserveFund: bigint;
    sellerAmount: bigint;
  }> {
    const solPrice = await this.getSolPrice();

    // Price is in cents, convert to dollars
    const totalUsd = (tokenAmount * pricePerTokenUsd) / 100;
    const totalSol = totalUsd / solPrice;
    const totalLamports = BigInt(Math.floor(totalSol * 1_000_000_000));

    // Fee distribution (basis points)
    const PLATFORM_FEE_BPS = 250n;  // 2.5%
    const RESERVE_FEE_BPS = 750n;   // 7.5%
    const BPS_DIVISOR = 10000n;

    const platformFee = (totalLamports * PLATFORM_FEE_BPS) / BPS_DIVISOR;
    const reserveFund = (totalLamports * RESERVE_FEE_BPS) / BPS_DIVISOR;
    const sellerAmount = totalLamports - platformFee - reserveFund;

    return {
      totalUsd,
      solPrice,
      totalSol,
      totalLamports,
      platformFee,
      reserveFund,
      sellerAmount,
    };
  }
}
