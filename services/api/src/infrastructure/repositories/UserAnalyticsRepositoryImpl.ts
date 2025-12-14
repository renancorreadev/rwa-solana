import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { PostgresDatabase } from '../database/PostgresDatabase';
import {
  IUserAnalyticsRepository,
  PortfolioSnapshot,
  AnalyticsSummary
} from '../../application/ports/IUserAnalyticsRepository';
import { UserActivity, UserActivityEntity, ActivityType } from '../../domain/entities/UserActivity';

interface ActivityRow {
  id: number;
  wallet_address: string;
  activity_type: string;
  property_mint: string | null;
  property_name: string | null;
  amount: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: Date;
}

interface SnapshotRow {
  id: number;
  wallet_address: string;
  total_value_usd: string;
  total_properties: number;
  holdings: any;
  snapshot_date: Date;
  created_at: Date;
}

@injectable()
export class UserAnalyticsRepositoryImpl implements IUserAnalyticsRepository {
  constructor(
    @inject(TOKENS.Database) private db: PostgresDatabase
  ) {}

  // Activities
  async getActivities(walletAddress: string, limit: number = 50, offset: number = 0): Promise<UserActivity[]> {
    const result = await this.db.query<ActivityRow>(
      `SELECT * FROM user_activities
       WHERE wallet_address = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [walletAddress, limit, offset]
    );

    return result.rows.map(this.mapActivityRowToEntity);
  }

  async createActivity(activity: Omit<UserActivity, 'id'>): Promise<UserActivity> {
    const result = await this.db.query<ActivityRow>(
      `INSERT INTO user_activities (wallet_address, activity_type, property_mint, property_name, amount, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        activity.walletAddress,
        activity.type,
        activity.propertyMint || null,
        activity.propertyName || null,
        activity.amount || null,
        activity.description,
        activity.metadata ? JSON.stringify(activity.metadata) : null
      ]
    );

    return this.mapActivityRowToEntity(result.rows[0]);
  }

  async getActivityCount(walletAddress: string): Promise<number> {
    const result = await this.db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM user_activities WHERE wallet_address = $1',
      [walletAddress]
    );
    return parseInt(result.rows[0].count, 10);
  }

  // Portfolio snapshots
  async getPortfolioHistory(walletAddress: string, days: number = 30): Promise<PortfolioSnapshot[]> {
    const result = await this.db.query<SnapshotRow>(
      `SELECT * FROM portfolio_snapshots
       WHERE wallet_address = $1
         AND snapshot_date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY snapshot_date ASC`,
      [walletAddress]
    );

    return result.rows.map(this.mapSnapshotRowToEntity);
  }

  async savePortfolioSnapshot(snapshot: Omit<PortfolioSnapshot, 'snapshotDate'> & { snapshotDate?: Date }): Promise<PortfolioSnapshot> {
    const snapshotDate = snapshot.snapshotDate || new Date();

    const result = await this.db.query<SnapshotRow>(
      `INSERT INTO portfolio_snapshots (wallet_address, total_value_usd, total_properties, holdings, snapshot_date)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (wallet_address, snapshot_date) DO UPDATE SET
         total_value_usd = EXCLUDED.total_value_usd,
         total_properties = EXCLUDED.total_properties,
         holdings = EXCLUDED.holdings
       RETURNING *`,
      [
        snapshot.walletAddress,
        snapshot.totalValueUsd,
        snapshot.totalProperties,
        JSON.stringify(snapshot.holdings),
        snapshotDate.toISOString().split('T')[0]
      ]
    );

    return this.mapSnapshotRowToEntity(result.rows[0]);
  }

  async getLatestSnapshot(walletAddress: string): Promise<PortfolioSnapshot | null> {
    const result = await this.db.query<SnapshotRow>(
      `SELECT * FROM portfolio_snapshots
       WHERE wallet_address = $1
       ORDER BY snapshot_date DESC
       LIMIT 1`,
      [walletAddress]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSnapshotRowToEntity(result.rows[0]);
  }

  // Analytics
  async getAnalyticsSummary(walletAddress: string): Promise<AnalyticsSummary> {
    // Get total invested from investment activities
    const investedResult = await this.db.query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM user_activities
       WHERE wallet_address = $1 AND activity_type = 'investment'`,
      [walletAddress]
    );

    // Get total revenue claimed
    const revenueResult = await this.db.query<{ total: string }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM user_activities
       WHERE wallet_address = $1 AND activity_type = 'revenue_claim'`,
      [walletAddress]
    );

    // Get portfolio snapshots for growth calculation
    const snapshots = await this.getPortfolioHistory(walletAddress, 30);

    let portfolioGrowth = 0;
    let totalProperties = 0;

    if (snapshots.length >= 2) {
      const oldest = snapshots[0];
      const latest = snapshots[snapshots.length - 1];
      totalProperties = latest.totalProperties;

      if (oldest.totalValueUsd > 0) {
        portfolioGrowth = ((latest.totalValueUsd - oldest.totalValueUsd) / oldest.totalValueUsd) * 100;
      }
    } else if (snapshots.length === 1) {
      totalProperties = snapshots[0].totalProperties;
    }

    // Calculate average yield (simplified - you'd want real data here)
    const totalInvested = parseFloat(investedResult.rows[0].total);
    const totalRevenueClaimed = parseFloat(revenueResult.rows[0].total);
    const averageYield = totalInvested > 0 ? (totalRevenueClaimed / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalRevenueClaimed,
      totalProperties,
      averageYield,
      portfolioGrowth,
      topPerformingProperty: null, // Would need more data to calculate this
    };
  }

  private mapActivityRowToEntity(row: ActivityRow): UserActivityEntity {
    return new UserActivityEntity({
      id: row.id.toString(),
      walletAddress: row.wallet_address,
      type: row.activity_type as ActivityType,
      propertyMint: row.property_mint || undefined,
      propertyName: row.property_name || undefined,
      amount: row.amount ? parseFloat(row.amount) : undefined,
      description: row.description,
      metadata: row.metadata || undefined,
      timestamp: row.created_at,
    });
  }

  private mapSnapshotRowToEntity(row: SnapshotRow): PortfolioSnapshot {
    return {
      walletAddress: row.wallet_address,
      totalValueUsd: parseFloat(row.total_value_usd),
      totalProperties: row.total_properties,
      holdings: row.holdings || [],
      snapshotDate: row.snapshot_date,
    };
  }
}
