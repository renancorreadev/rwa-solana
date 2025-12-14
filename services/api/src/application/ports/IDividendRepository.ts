import {
  ScheduledDistribution,
  ClaimHistory,
  RevenueProjection,
  InvestorDividendStats,
  PropertyYield,
  CreateScheduledDistributionDTO,
  UpdateScheduledDistributionDTO,
} from '../../domain/entities/Dividend';

export interface IDividendRepository {
  // Scheduled Distributions
  getUpcomingDistributions(limit?: number): Promise<ScheduledDistribution[]>;
  getDistributionsByProperty(propertyMint: string): Promise<ScheduledDistribution[]>;
  getScheduledDistributionById(id: number): Promise<ScheduledDistribution | null>;
  createScheduledDistribution(data: CreateScheduledDistributionDTO, propertyName?: string): Promise<ScheduledDistribution>;
  updateScheduledDistribution(id: number, data: UpdateScheduledDistributionDTO): Promise<ScheduledDistribution | null>;
  deleteScheduledDistribution(id: number): Promise<boolean>;

  // Claim History Cache
  getClaimHistory(
    walletAddress: string,
    limit?: number,
    offset?: number
  ): Promise<{ claims: ClaimHistory[]; total: number }>;
  getClaimHistoryByProperty(
    walletAddress: string,
    propertyMint: string
  ): Promise<ClaimHistory[]>;
  saveClaimToCache(claim: ClaimHistory): Promise<ClaimHistory>;
  getRecentClaims(limit?: number): Promise<ClaimHistory[]>;

  // Revenue Projections
  getProjections(propertyMint: string): Promise<RevenueProjection[]>;
  getProjectionsForMonth(month: Date): Promise<RevenueProjection[]>;
  saveProjection(projection: RevenueProjection): Promise<RevenueProjection>;
  deleteProjection(propertyMint: string, month: Date): Promise<boolean>;

  // Statistics
  getInvestorStats(walletAddress: string): Promise<InvestorDividendStats>;
  getPropertyYieldStats(
    propertyMint: string,
    investorWallet?: string
  ): Promise<PropertyYield | null>;

  // Aggregations
  getTotalClaimedByWallet(walletAddress: string): Promise<{ sol: number; brl: number }>;
  getMonthlyClaimsByWallet(
    walletAddress: string,
    months?: number
  ): Promise<{ month: Date; totalSol: number; totalBrl: number }[]>;
}
