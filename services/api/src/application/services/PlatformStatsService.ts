import { injectable, inject } from 'tsyringe';
import axios from 'axios';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { TOKENS } from '../../shared/container/tokens';
import { Config } from '../../infrastructure/config/Config';
import { SolanaConnectionAdapter } from '../../infrastructure/solana/SolanaConnectionAdapter';

export interface PlatformStats {
  totalValueLocked: number;      // in USD
  activeInvestors: number;       // unique wallet addresses holding tokens
  avgAnnualYield: number;        // percentage (e.g., 6.4 for 6.4%)
  totalProperties: number;       // active properties
  totalCirculatingTokens: number; // total tokens in circulation
  lastUpdated: string;
}

interface PropertyFromIndexer {
  mint: string;
  totalValueUsd: number;
  annualYield: number;
  circulatingSupply: number | string;
  status: string;
}

@injectable()
export class PlatformStatsService {
  private cachedStats: PlatformStats | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_TTL_MS = 60000; // 1 minute cache

  constructor(
    @inject(TOKENS.Config) private config: Config,
    @inject(TOKENS.SolanaConnection) private solanaConnection: SolanaConnectionAdapter
  ) {}

  async getPlatformStats(): Promise<PlatformStats> {
    // Return cached stats if still valid
    const now = Date.now();
    if (this.cachedStats && (now - this.lastFetchTime) < this.CACHE_TTL_MS) {
      return this.cachedStats;
    }

    try {
      // Fetch properties from indexer
      const indexerUrl = this.config.indexer.url;
      const response = await axios.get(`${indexerUrl}/api/v1/properties`);

      if (!response.data?.success || !Array.isArray(response.data?.data)) {
        throw new Error('Failed to fetch properties from indexer');
      }

      const properties: PropertyFromIndexer[] = response.data.data;
      const activeProperties = properties.filter(p => p.status === 'active');

      // Calculate TVL (totalValueUsd is stored in cents in DB)
      const totalValueLocked = activeProperties.reduce((sum, p) => {
        return sum + (Number(p.totalValueUsd) / 100);
      }, 0);

      // Calculate average annual yield (stored as basis points, e.g., 480 = 4.8%)
      const avgAnnualYield = activeProperties.length > 0
        ? activeProperties.reduce((sum, p) => sum + Number(p.annualYield), 0) / activeProperties.length / 100
        : 0;

      // Calculate total circulating tokens
      const totalCirculatingTokens = activeProperties.reduce((sum, p) => {
        return sum + Number(p.circulatingSupply || 0);
      }, 0);

      // Get active investors count from on-chain token accounts
      const activeInvestors = await this.getActiveInvestorsCount(activeProperties);

      const stats: PlatformStats = {
        totalValueLocked,
        activeInvestors,
        avgAnnualYield,
        totalProperties: activeProperties.length,
        totalCirculatingTokens,
        lastUpdated: new Date().toISOString(),
      };

      // Cache the results
      this.cachedStats = stats;
      this.lastFetchTime = now;

      return stats;
    } catch (error) {
      console.error('[PlatformStatsService] Error fetching stats:', error);

      // Return cached stats if available, even if expired
      if (this.cachedStats) {
        return this.cachedStats;
      }

      // Return default stats on error
      return {
        totalValueLocked: 0,
        activeInvestors: 0,
        avgAnnualYield: 0,
        totalProperties: 0,
        totalCirculatingTokens: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  private async getActiveInvestorsCount(properties: PropertyFromIndexer[]): Promise<number> {
    try {
      const connection = this.solanaConnection.getConnection();
      const uniqueHolders = new Set<string>();

      // For each property mint, get token accounts
      for (const property of properties) {
        try {
          const mint = new PublicKey(property.mint);

          // Get all token accounts for this mint (Token-2022)
          const tokenAccounts = await connection.getTokenLargestAccounts(mint);

          // Filter accounts with balance > 0
          for (const account of tokenAccounts.value) {
            if (account.uiAmount && account.uiAmount > 0) {
              // Get the owner of this token account
              const accountInfo = await connection.getParsedAccountInfo(account.address);
              if (accountInfo.value?.data && 'parsed' in accountInfo.value.data) {
                const owner = accountInfo.value.data.parsed?.info?.owner;
                if (owner && owner !== property.mint) {
                  // Don't count the mint authority or system accounts
                  uniqueHolders.add(owner);
                }
              }
            }
          }
        } catch (err) {
          console.warn(`[PlatformStatsService] Error fetching holders for ${property.mint}:`, err);
        }
      }

      return uniqueHolders.size;
    } catch (error) {
      console.error('[PlatformStatsService] Error counting investors:', error);

      // Fallback: estimate based on properties with circulating supply > 0
      const propertiesWithCirculation = properties.filter(
        p => Number(p.circulatingSupply || 0) > 0
      );

      // Return minimum of 1 per property with circulation (conservative estimate)
      return propertiesWithCirculation.length;
    }
  }

  // Force refresh stats (bypass cache)
  async refreshStats(): Promise<PlatformStats> {
    this.cachedStats = null;
    this.lastFetchTime = 0;
    return this.getPlatformStats();
  }
}
