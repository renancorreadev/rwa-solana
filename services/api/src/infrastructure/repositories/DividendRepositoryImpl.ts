import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { PostgresDatabase } from '../database/PostgresDatabase';
import { IDividendRepository } from '../../application/ports/IDividendRepository';
import {
  ScheduledDistribution,
  ClaimHistory,
  RevenueProjection,
  InvestorDividendStats,
  PropertyYield,
  CreateScheduledDistributionDTO,
  UpdateScheduledDistributionDTO,
} from '../../domain/entities/Dividend';

// Row types for database mapping
interface ScheduledDistributionRow {
  id: number;
  property_mint: string;
  property_name: string | null;
  scheduled_date: Date;
  estimated_amount_sol: string | null;
  estimated_amount_brl: string | null;
  notes: string | null;
  status: string;
  actual_epoch_number: number | null;
  created_at: Date;
  updated_at: Date;
}

interface ClaimHistoryRow {
  id: number;
  wallet_address: string;
  property_mint: string;
  property_name: string | null;
  epoch_number: number;
  amount_sol: string;
  amount_brl: string | null;
  token_balance_at_claim: string | null;
  percentage_of_property: string | null;
  claimed_at: Date;
  tx_signature: string | null;
  synced_at: Date;
}

interface RevenueProjectionRow {
  id: number;
  property_mint: string;
  month: Date;
  projected_revenue_sol: string | null;
  projected_revenue_brl: string | null;
  source: string;
  notes: string | null;
  created_by: string | null;
  created_at: Date;
}

@injectable()
export class DividendRepositoryImpl implements IDividendRepository {
  constructor(
    @inject(TOKENS.Database) private db: PostgresDatabase
  ) {}

  // ==================== Scheduled Distributions ====================

  async getUpcomingDistributions(limit: number = 10): Promise<ScheduledDistribution[]> {
    const result = await this.db.query<ScheduledDistributionRow>(
      `SELECT * FROM scheduled_distributions
       WHERE scheduled_date >= CURRENT_DATE AND status = 'scheduled'
       ORDER BY scheduled_date ASC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map(this.mapScheduledDistributionRow);
  }

  async getDistributionsByProperty(propertyMint: string): Promise<ScheduledDistribution[]> {
    const result = await this.db.query<ScheduledDistributionRow>(
      `SELECT * FROM scheduled_distributions
       WHERE property_mint = $1
       ORDER BY scheduled_date DESC`,
      [propertyMint]
    );
    return result.rows.map(this.mapScheduledDistributionRow);
  }

  async getScheduledDistributionById(id: number): Promise<ScheduledDistribution | null> {
    const result = await this.db.query<ScheduledDistributionRow>(
      'SELECT * FROM scheduled_distributions WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return null;
    return this.mapScheduledDistributionRow(result.rows[0]);
  }

  async createScheduledDistribution(
    data: CreateScheduledDistributionDTO,
    propertyName?: string
  ): Promise<ScheduledDistribution> {
    const result = await this.db.query<ScheduledDistributionRow>(
      `INSERT INTO scheduled_distributions
       (property_mint, property_name, scheduled_date, estimated_amount_sol, estimated_amount_brl, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
       RETURNING *`,
      [
        data.propertyMint,
        propertyName || null,
        data.scheduledDate,
        data.estimatedAmountSol || null,
        data.estimatedAmountBrl || null,
        data.notes || null,
      ]
    );
    return this.mapScheduledDistributionRow(result.rows[0]);
  }

  async updateScheduledDistribution(
    id: number,
    data: UpdateScheduledDistributionDTO
  ): Promise<ScheduledDistribution | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.scheduledDate !== undefined) {
      updates.push(`scheduled_date = $${paramIndex++}`);
      values.push(data.scheduledDate);
    }
    if (data.estimatedAmountSol !== undefined) {
      updates.push(`estimated_amount_sol = $${paramIndex++}`);
      values.push(data.estimatedAmountSol);
    }
    if (data.estimatedAmountBrl !== undefined) {
      updates.push(`estimated_amount_brl = $${paramIndex++}`);
      values.push(data.estimatedAmountBrl);
    }
    if (data.notes !== undefined) {
      updates.push(`notes = $${paramIndex++}`);
      values.push(data.notes);
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(data.status);
    }
    if (data.actualEpochNumber !== undefined) {
      updates.push(`actual_epoch_number = $${paramIndex++}`);
      values.push(data.actualEpochNumber);
    }

    if (updates.length === 0) {
      return this.getScheduledDistributionById(id);
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await this.db.query<ScheduledDistributionRow>(
      `UPDATE scheduled_distributions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;
    return this.mapScheduledDistributionRow(result.rows[0]);
  }

  async deleteScheduledDistribution(id: number): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM scheduled_distributions WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // ==================== Claim History Cache ====================

  async getClaimHistory(
    walletAddress: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<{ claims: ClaimHistory[]; total: number }> {
    const countResult = await this.db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM claim_history_cache WHERE wallet_address = $1',
      [walletAddress]
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const result = await this.db.query<ClaimHistoryRow>(
      `SELECT * FROM claim_history_cache
       WHERE wallet_address = $1
       ORDER BY claimed_at DESC
       LIMIT $2 OFFSET $3`,
      [walletAddress, limit, offset]
    );

    return {
      claims: result.rows.map(this.mapClaimHistoryRow),
      total,
    };
  }

  async getClaimHistoryByProperty(
    walletAddress: string,
    propertyMint: string
  ): Promise<ClaimHistory[]> {
    const result = await this.db.query<ClaimHistoryRow>(
      `SELECT * FROM claim_history_cache
       WHERE wallet_address = $1 AND property_mint = $2
       ORDER BY claimed_at DESC`,
      [walletAddress, propertyMint]
    );
    return result.rows.map(this.mapClaimHistoryRow);
  }

  async saveClaimToCache(claim: ClaimHistory): Promise<ClaimHistory> {
    const result = await this.db.query<ClaimHistoryRow>(
      `INSERT INTO claim_history_cache
       (wallet_address, property_mint, property_name, epoch_number, amount_sol, amount_brl,
        token_balance_at_claim, percentage_of_property, claimed_at, tx_signature)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (wallet_address, property_mint, epoch_number) DO UPDATE SET
         amount_sol = EXCLUDED.amount_sol,
         amount_brl = EXCLUDED.amount_brl,
         tx_signature = EXCLUDED.tx_signature,
         synced_at = NOW()
       RETURNING *`,
      [
        claim.walletAddress,
        claim.propertyMint,
        claim.propertyName || null,
        claim.epochNumber,
        claim.amountSol,
        claim.amountBrl || null,
        claim.tokenBalanceAtClaim || null,
        claim.percentageOfProperty || null,
        claim.claimedAt,
        claim.txSignature || null,
      ]
    );
    return this.mapClaimHistoryRow(result.rows[0]);
  }

  async getRecentClaims(limit: number = 10): Promise<ClaimHistory[]> {
    const result = await this.db.query<ClaimHistoryRow>(
      `SELECT * FROM claim_history_cache
       ORDER BY claimed_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows.map(this.mapClaimHistoryRow);
  }

  // ==================== Revenue Projections ====================

  async getProjections(propertyMint: string): Promise<RevenueProjection[]> {
    const result = await this.db.query<RevenueProjectionRow>(
      `SELECT * FROM revenue_projections
       WHERE property_mint = $1
       ORDER BY month ASC`,
      [propertyMint]
    );
    return result.rows.map(this.mapRevenueProjectionRow);
  }

  async getProjectionsForMonth(month: Date): Promise<RevenueProjection[]> {
    const result = await this.db.query<RevenueProjectionRow>(
      `SELECT * FROM revenue_projections
       WHERE DATE_TRUNC('month', month) = DATE_TRUNC('month', $1::date)
       ORDER BY property_mint`,
      [month]
    );
    return result.rows.map(this.mapRevenueProjectionRow);
  }

  async saveProjection(projection: RevenueProjection): Promise<RevenueProjection> {
    const result = await this.db.query<RevenueProjectionRow>(
      `INSERT INTO revenue_projections
       (property_mint, month, projected_revenue_sol, projected_revenue_brl, source, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (property_mint, month) DO UPDATE SET
         projected_revenue_sol = EXCLUDED.projected_revenue_sol,
         projected_revenue_brl = EXCLUDED.projected_revenue_brl,
         source = EXCLUDED.source,
         notes = EXCLUDED.notes
       RETURNING *`,
      [
        projection.propertyMint,
        projection.month,
        projection.projectedRevenueSol || null,
        projection.projectedRevenueBrl || null,
        projection.source || 'rental',
        projection.notes || null,
        projection.createdBy || null,
      ]
    );
    return this.mapRevenueProjectionRow(result.rows[0]);
  }

  async deleteProjection(propertyMint: string, month: Date): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM revenue_projections
       WHERE property_mint = $1 AND DATE_TRUNC('month', month) = DATE_TRUNC('month', $2::date)`,
      [propertyMint, month]
    );
    return (result.rowCount ?? 0) > 0;
  }

  // ==================== Statistics ====================

  async getInvestorStats(walletAddress: string): Promise<InvestorDividendStats> {
    const result = await this.db.query<{
      total_sol: string;
      total_brl: string;
      total_claims: string;
      first_claim: Date | null;
      last_claim: Date | null;
    }>(
      `SELECT
         COALESCE(SUM(amount_sol), 0) as total_sol,
         COALESCE(SUM(amount_brl), 0) as total_brl,
         COUNT(*) as total_claims,
         MIN(claimed_at) as first_claim,
         MAX(claimed_at) as last_claim
       FROM claim_history_cache
       WHERE wallet_address = $1`,
      [walletAddress]
    );

    const row = result.rows[0];
    const totalClaims = parseInt(row.total_claims, 10);
    const totalSol = parseFloat(row.total_sol);

    // Calculate average monthly yield (claims per month)
    let avgMonthlyYield = 0;
    if (row.first_claim && row.last_claim && totalClaims > 0) {
      const firstClaim = new Date(row.first_claim);
      const lastClaim = new Date(row.last_claim);
      const monthsDiff = Math.max(1,
        (lastClaim.getFullYear() - firstClaim.getFullYear()) * 12 +
        (lastClaim.getMonth() - firstClaim.getMonth()) + 1
      );
      avgMonthlyYield = totalSol / monthsDiff;
    }

    return {
      walletAddress,
      totalClaimedSol: totalSol,
      totalClaimedBrl: parseFloat(row.total_brl),
      averageMonthlyYield: avgMonthlyYield,
      totalClaims,
      firstClaimDate: row.first_claim || undefined,
      lastClaimDate: row.last_claim || undefined,
    };
  }

  async getPropertyYieldStats(
    propertyMint: string,
    investorWallet?: string
  ): Promise<PropertyYield | null> {
    // Get total distributed for this property
    const totalResult = await this.db.query<{
      total_sol: string;
      total_brl: string;
      last_claim: Date | null;
    }>(
      `SELECT
         COALESCE(SUM(amount_sol), 0) as total_sol,
         COALESCE(SUM(amount_brl), 0) as total_brl,
         MAX(claimed_at) as last_claim
       FROM claim_history_cache
       WHERE property_mint = $1`,
      [propertyMint]
    );

    // Get next scheduled distribution
    const nextResult = await this.db.query<ScheduledDistributionRow>(
      `SELECT * FROM scheduled_distributions
       WHERE property_mint = $1 AND scheduled_date >= CURRENT_DATE AND status = 'scheduled'
       ORDER BY scheduled_date ASC
       LIMIT 1`,
      [propertyMint]
    );

    // Get property name
    const nameResult = await this.db.query<{ property_name: string }>(
      `SELECT property_name FROM claim_history_cache WHERE property_mint = $1 LIMIT 1`,
      [propertyMint]
    );

    const propertyName = nameResult.rows[0]?.property_name || propertyMint.substring(0, 8);
    const totalSol = parseFloat(totalResult.rows[0].total_sol);
    const totalBrl = parseFloat(totalResult.rows[0].total_brl);

    // If investor wallet provided, get their share
    let investorShareSol = 0;
    let investorShareBrl = 0;
    let investorPercentage = 0;

    if (investorWallet) {
      const investorResult = await this.db.query<{
        total_sol: string;
        total_brl: string;
        avg_percentage: string;
      }>(
        `SELECT
           COALESCE(SUM(amount_sol), 0) as total_sol,
           COALESCE(SUM(amount_brl), 0) as total_brl,
           COALESCE(AVG(percentage_of_property), 0) as avg_percentage
         FROM claim_history_cache
         WHERE property_mint = $1 AND wallet_address = $2`,
        [propertyMint, investorWallet]
      );
      investorShareSol = parseFloat(investorResult.rows[0].total_sol);
      investorShareBrl = parseFloat(investorResult.rows[0].total_brl);
      investorPercentage = parseFloat(investorResult.rows[0].avg_percentage);
    }

    return {
      propertyMint,
      propertyName,
      totalDistributedSol: totalSol,
      totalDistributedBrl: totalBrl,
      investorShareSol,
      investorShareBrl,
      monthlyAverageYield: 0, // Would need more data to calculate
      annualizedYield: 0, // Would need property value to calculate
      lastDistributionDate: totalResult.rows[0].last_claim || undefined,
      nextDistributionDate: nextResult.rows[0]?.scheduled_date || undefined,
      investorPercentage,
    };
  }

  // ==================== Aggregations ====================

  async getTotalClaimedByWallet(walletAddress: string): Promise<{ sol: number; brl: number }> {
    const result = await this.db.query<{ total_sol: string; total_brl: string }>(
      `SELECT
         COALESCE(SUM(amount_sol), 0) as total_sol,
         COALESCE(SUM(amount_brl), 0) as total_brl
       FROM claim_history_cache
       WHERE wallet_address = $1`,
      [walletAddress]
    );
    return {
      sol: parseFloat(result.rows[0].total_sol),
      brl: parseFloat(result.rows[0].total_brl),
    };
  }

  async getMonthlyClaimsByWallet(
    walletAddress: string,
    months: number = 12
  ): Promise<{ month: Date; totalSol: number; totalBrl: number }[]> {
    const result = await this.db.query<{
      month: Date;
      total_sol: string;
      total_brl: string;
    }>(
      `SELECT
         DATE_TRUNC('month', claimed_at) as month,
         COALESCE(SUM(amount_sol), 0) as total_sol,
         COALESCE(SUM(amount_brl), 0) as total_brl
       FROM claim_history_cache
       WHERE wallet_address = $1
         AND claimed_at >= NOW() - INTERVAL '${months} months'
       GROUP BY DATE_TRUNC('month', claimed_at)
       ORDER BY month DESC`,
      [walletAddress]
    );
    return result.rows.map(row => ({
      month: row.month,
      totalSol: parseFloat(row.total_sol),
      totalBrl: parseFloat(row.total_brl),
    }));
  }

  // ==================== Row Mappers ====================

  private mapScheduledDistributionRow(row: ScheduledDistributionRow): ScheduledDistribution {
    return {
      id: row.id,
      propertyMint: row.property_mint,
      propertyName: row.property_name || undefined,
      scheduledDate: row.scheduled_date,
      estimatedAmountSol: row.estimated_amount_sol ? parseFloat(row.estimated_amount_sol) : undefined,
      estimatedAmountBrl: row.estimated_amount_brl ? parseFloat(row.estimated_amount_brl) : undefined,
      notes: row.notes || undefined,
      status: row.status as 'scheduled' | 'deposited' | 'cancelled',
      actualEpochNumber: row.actual_epoch_number || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapClaimHistoryRow(row: ClaimHistoryRow): ClaimHistory {
    return {
      id: row.id,
      walletAddress: row.wallet_address,
      propertyMint: row.property_mint,
      propertyName: row.property_name || undefined,
      epochNumber: row.epoch_number,
      amountSol: parseFloat(row.amount_sol),
      amountBrl: row.amount_brl ? parseFloat(row.amount_brl) : undefined,
      tokenBalanceAtClaim: row.token_balance_at_claim ? parseFloat(row.token_balance_at_claim) : undefined,
      percentageOfProperty: row.percentage_of_property ? parseFloat(row.percentage_of_property) : undefined,
      claimedAt: row.claimed_at,
      txSignature: row.tx_signature || undefined,
      syncedAt: row.synced_at,
    };
  }

  private mapRevenueProjectionRow(row: RevenueProjectionRow): RevenueProjection {
    return {
      id: row.id,
      propertyMint: row.property_mint,
      month: row.month,
      projectedRevenueSol: row.projected_revenue_sol ? parseFloat(row.projected_revenue_sol) : undefined,
      projectedRevenueBrl: row.projected_revenue_brl ? parseFloat(row.projected_revenue_brl) : undefined,
      source: row.source as 'rental' | 'sale' | 'appreciation' | 'other',
      notes: row.notes || undefined,
      createdBy: row.created_by || undefined,
      createdAt: row.created_at,
    };
  }
}
