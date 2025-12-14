import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { TOKENS } from '../../../shared/container/tokens';
import { IDividendRepository } from '../../../application/ports/IDividendRepository';
import {
  DividendCalendar,
  CalendarEntry,
  ClaimHistoryResponse,
  RevenueProjectionsResponse,
} from '../../../domain/entities/Dividend';

@injectable()
export class DividendController {
  constructor(
    @inject(TOKENS.DividendRepository) private dividendRepository: IDividendRepository
  ) {}

  /**
   * GET /api/v1/dividends/calendar/:wallet
   * Returns the dividend calendar for a wallet
   */
  async getCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      if (!wallet) {
        res.status(400).json({ success: false, error: 'Wallet address is required' });
        return;
      }

      // Get past claims
      const { claims } = await this.dividendRepository.getClaimHistory(wallet, 50, 0);
      const pastClaims: CalendarEntry[] = claims.map(claim => ({
        date: claim.claimedAt,
        type: 'past_claim' as const,
        propertyMint: claim.propertyMint,
        propertyName: claim.propertyName,
        amountSol: claim.amountSol,
        amountBrl: claim.amountBrl,
        claimed: true,
      }));

      // Get upcoming scheduled distributions
      const upcoming = await this.dividendRepository.getUpcomingDistributions(20);
      const upcomingDistributions: CalendarEntry[] = upcoming.map(dist => ({
        date: dist.scheduledDate,
        type: 'scheduled' as const,
        propertyMint: dist.propertyMint,
        propertyName: dist.propertyName,
        amountSol: dist.estimatedAmountSol,
        amountBrl: dist.estimatedAmountBrl,
        status: dist.status,
        claimed: false,
      }));

      // For projections, we'd need to calculate based on investor holdings
      // For now, return empty array - this can be expanded later
      const projectedPayments: CalendarEntry[] = [];

      const calendar: DividendCalendar = {
        wallet,
        pastClaims,
        upcomingDistributions,
        projectedPayments,
      };

      res.json({ success: true, data: calendar });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dividends/history/:wallet
   * Returns paginated claim history for a wallet
   */
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = (page - 1) * limit;

      if (!wallet) {
        res.status(400).json({ success: false, error: 'Wallet address is required' });
        return;
      }

      const { claims, total } = await this.dividendRepository.getClaimHistory(wallet, limit, offset);

      const response: ClaimHistoryResponse = {
        claims,
        total,
        page,
        limit,
        hasMore: offset + claims.length < total,
      };

      res.json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dividends/stats/:wallet
   * Returns dividend statistics for a wallet
   */
  async getStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      if (!wallet) {
        res.status(400).json({ success: false, error: 'Wallet address is required' });
        return;
      }

      const stats = await this.dividendRepository.getInvestorStats(wallet);
      const monthlyClaims = await this.dividendRepository.getMonthlyClaimsByWallet(wallet, 12);

      // Get next scheduled distribution
      const upcoming = await this.dividendRepository.getUpcomingDistributions(1);
      const nextDistribution = upcoming.length > 0 ? {
        date: upcoming[0].scheduledDate,
        propertyName: upcoming[0].propertyName,
        estimatedAmount: upcoming[0].estimatedAmountSol,
      } : null;

      res.json({
        success: true,
        data: {
          ...stats,
          monthlyClaims,
          nextDistribution,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dividends/yields/:wallet
   * Returns yield information per property for a wallet
   */
  async getPropertyYields(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      if (!wallet) {
        res.status(400).json({ success: false, error: 'Wallet address is required' });
        return;
      }

      // Get unique properties from claim history
      const { claims } = await this.dividendRepository.getClaimHistory(wallet, 1000, 0);
      const propertyMints = [...new Set(claims.map(c => c.propertyMint))];

      const yields = await Promise.all(
        propertyMints.map(mint => this.dividendRepository.getPropertyYieldStats(mint, wallet))
      );

      res.json({
        success: true,
        data: yields.filter(y => y !== null),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dividends/upcoming
   * Returns all upcoming scheduled distributions
   */
  async getUpcoming(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const upcoming = await this.dividendRepository.getUpcomingDistributions(limit);

      res.json({ success: true, data: upcoming });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/dividends/projections/:wallet
   * Returns revenue projections for a wallet
   */
  async getProjections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      if (!wallet) {
        res.status(400).json({ success: false, error: 'Wallet address is required' });
        return;
      }

      // Get unique properties from claim history
      const { claims } = await this.dividendRepository.getClaimHistory(wallet, 1000, 0);
      const propertyMints = [...new Set(claims.map(c => c.propertyMint))];

      // Get projections for each property
      const allProjections = await Promise.all(
        propertyMints.map(async mint => {
          const projections = await this.dividendRepository.getProjections(mint);
          return { mint, projections };
        })
      );

      // Group by month
      const monthlyProjections: Map<string, any> = new Map();

      for (const { mint, projections } of allProjections) {
        for (const proj of projections) {
          const monthKey = proj.month.toISOString().substring(0, 7);
          if (!monthlyProjections.has(monthKey)) {
            monthlyProjections.set(monthKey, {
              month: proj.month,
              totalProjectedSol: 0,
              totalProjectedBrl: 0,
              byProperty: [],
            });
          }
          const entry = monthlyProjections.get(monthKey);
          entry.totalProjectedSol += proj.projectedRevenueSol || 0;
          entry.totalProjectedBrl += proj.projectedRevenueBrl || 0;
          entry.byProperty.push({
            propertyMint: mint,
            propertyName: '', // Would need to fetch from property data
            amountSol: proj.projectedRevenueSol || 0,
            amountBrl: proj.projectedRevenueBrl || 0,
            investorShare: 0, // Would need to calculate based on holdings
          });
        }
      }

      const response: RevenueProjectionsResponse = {
        wallet,
        projections: Array.from(monthlyProjections.values()),
        totalYearlyProjection: {
          sol: Array.from(monthlyProjections.values()).reduce((sum, m) => sum + m.totalProjectedSol, 0),
          brl: Array.from(monthlyProjections.values()).reduce((sum, m) => sum + m.totalProjectedBrl, 0),
        },
      };

      res.json({ success: true, data: response });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Admin Endpoints ====================

  /**
   * POST /api/v1/admin/dividends/schedule
   * Creates a new scheduled distribution
   */
  async createScheduledDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyMint, scheduledDate, estimatedAmountSol, estimatedAmountBrl, notes, propertyName } = req.body;

      if (!propertyMint || !scheduledDate) {
        res.status(400).json({
          success: false,
          error: 'propertyMint and scheduledDate are required',
        });
        return;
      }

      const distribution = await this.dividendRepository.createScheduledDistribution(
        {
          propertyMint,
          scheduledDate: new Date(scheduledDate),
          estimatedAmountSol,
          estimatedAmountBrl,
          notes,
        },
        propertyName
      );

      res.status(201).json({ success: true, data: distribution });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/admin/dividends/schedule/:id
   * Updates a scheduled distribution
   */
  async updateScheduledDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { scheduledDate, estimatedAmountSol, estimatedAmountBrl, notes, status, actualEpochNumber } = req.body;

      const distribution = await this.dividendRepository.updateScheduledDistribution(
        parseInt(id),
        {
          scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
          estimatedAmountSol,
          estimatedAmountBrl,
          notes,
          status,
          actualEpochNumber,
        }
      );

      if (!distribution) {
        res.status(404).json({ success: false, error: 'Distribution not found' });
        return;
      }

      res.json({ success: true, data: distribution });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/dividends/schedule/:id
   * Deletes a scheduled distribution
   */
  async deleteScheduledDistribution(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await this.dividendRepository.deleteScheduledDistribution(parseInt(id));

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Distribution not found' });
        return;
      }

      res.json({ success: true, message: 'Distribution deleted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/dividends/schedules
   * Lists all scheduled distributions for admin
   */
  async listScheduledDistributions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { propertyMint, status } = req.query;

      let distributions;
      if (propertyMint) {
        distributions = await this.dividendRepository.getDistributionsByProperty(propertyMint as string);
      } else {
        distributions = await this.dividendRepository.getUpcomingDistributions(100);
      }

      // Filter by status if provided
      if (status) {
        distributions = distributions.filter(d => d.status === status);
      }

      res.json({ success: true, data: distributions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/dividends/cache-claim
   * Caches a claim from on-chain data
   */
  async cacheClaim(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const claim = req.body;

      if (!claim.walletAddress || !claim.propertyMint || claim.epochNumber === undefined) {
        res.status(400).json({
          success: false,
          error: 'walletAddress, propertyMint, and epochNumber are required',
        });
        return;
      }

      const savedClaim = await this.dividendRepository.saveClaimToCache({
        ...claim,
        claimedAt: claim.claimedAt ? new Date(claim.claimedAt) : new Date(),
      });

      res.status(201).json({ success: true, data: savedClaim });
    } catch (error) {
      next(error);
    }
  }
}
