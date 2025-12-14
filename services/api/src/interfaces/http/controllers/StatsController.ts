import { Request, Response } from 'express';
import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../../shared/container/tokens';
import { PlatformStatsService } from '../../../application/services/PlatformStatsService';

@injectable()
export class StatsController {
  constructor(
    @inject(TOKENS.PlatformStatsService) private statsService: PlatformStatsService
  ) {}

  async getPlatformStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.statsService.getPlatformStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('[StatsController] Error fetching platform stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch platform statistics',
      });
    }
  }

  async refreshStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.statsService.refreshStats();

      res.json({
        success: true,
        data: stats,
        message: 'Stats refreshed successfully',
      });
    } catch (error) {
      console.error('[StatsController] Error refreshing stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh platform statistics',
      });
    }
  }
}
