import { UserActivity } from '../../domain/entities/UserActivity';

export interface PortfolioSnapshot {
  walletAddress: string;
  totalValueUsd: number;
  totalProperties: number;
  holdings: Array<{
    propertyMint: string;
    propertyName: string;
    balance: string;
    valueUsd: number;
  }>;
  snapshotDate: Date;
}

export interface AnalyticsSummary {
  totalInvested: number;
  totalRevenueClaimed: number;
  totalProperties: number;
  averageYield: number;
  portfolioGrowth: number; // percentage
  topPerformingProperty: {
    mint: string;
    name: string;
    returnPercent: number;
  } | null;
}

export interface IUserAnalyticsRepository {
  // Activities
  getActivities(walletAddress: string, limit?: number, offset?: number): Promise<UserActivity[]>;
  createActivity(activity: Omit<UserActivity, 'id'>): Promise<UserActivity>;
  getActivityCount(walletAddress: string): Promise<number>;

  // Portfolio snapshots
  getPortfolioHistory(walletAddress: string, days?: number): Promise<PortfolioSnapshot[]>;
  savePortfolioSnapshot(snapshot: Omit<PortfolioSnapshot, 'snapshotDate'> & { snapshotDate?: Date }): Promise<PortfolioSnapshot>;
  getLatestSnapshot(walletAddress: string): Promise<PortfolioSnapshot | null>;

  // Analytics
  getAnalyticsSummary(walletAddress: string): Promise<AnalyticsSummary>;
}
