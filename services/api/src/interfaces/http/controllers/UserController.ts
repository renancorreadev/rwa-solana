import { injectable } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { GetUserPreferencesUseCase } from '../../../application/use-cases/GetUserPreferencesUseCase';
import { UpdateUserPreferencesUseCase } from '../../../application/use-cases/UpdateUserPreferencesUseCase';
import { GetUserAnalyticsUseCase } from '../../../application/use-cases/GetUserAnalyticsUseCase';
import { GetUserActivitiesUseCase } from '../../../application/use-cases/GetUserActivitiesUseCase';
import { RecordUserActivityUseCase } from '../../../application/use-cases/RecordUserActivityUseCase';
import { IUserPreferencesRepository } from '../../../application/ports/IUserPreferencesRepository';
import { TOKENS } from '../../../shared/container/tokens';
import { inject } from 'tsyringe';

@injectable()
export class UserController {
  constructor(
    private getPreferencesUseCase: GetUserPreferencesUseCase,
    private updatePreferencesUseCase: UpdateUserPreferencesUseCase,
    private getAnalyticsUseCase: GetUserAnalyticsUseCase,
    private getActivitiesUseCase: GetUserActivitiesUseCase,
    private recordActivityUseCase: RecordUserActivityUseCase,
    @inject(TOKENS.UserPreferencesRepository)
    private preferencesRepository: IUserPreferencesRepository
  ) {}

  // Preferences endpoints
  async getPreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      if (!wallet || wallet.length < 32) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
        return;
      }

      const preferences = await this.getPreferencesUseCase.execute(wallet);

      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;
      const { theme, currency, hideBalances, notifications } = req.body;

      if (!wallet || wallet.length < 32) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
        return;
      }

      const updated = await this.updatePreferencesUseCase.execute(wallet, {
        theme,
        currency,
        hideBalances,
        notifications,
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePreferences(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;

      if (!wallet || wallet.length < 32) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
        return;
      }

      const deleted = await this.preferencesRepository.delete(wallet);

      res.json({
        success: true,
        data: { deleted },
      });
    } catch (error) {
      next(error);
    }
  }

  // Analytics endpoints
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;
      const { timeRange = '30d' } = req.query;

      if (!wallet || wallet.length < 32) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
        return;
      }

      const analytics = await this.getAnalyticsUseCase.execute(wallet, timeRange as string);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getActivities(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = Math.min(parseInt(req.query.pageSize as string) || 20, 100);

      if (!wallet || wallet.length < 32) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
        return;
      }

      const activities = await this.getActivitiesUseCase.execute(wallet, page, pageSize);

      res.json({
        success: true,
        data: activities,
      });
    } catch (error) {
      next(error);
    }
  }

  async recordActivity(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;
      const { type, propertyMint, propertyName, amount, description, metadata } = req.body;

      if (!wallet || wallet.length < 32) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
        return;
      }

      if (!type || !description) {
        res.status(400).json({
          success: false,
          error: 'Type and description are required',
        });
        return;
      }

      const activity = await this.recordActivityUseCase.execute({
        walletAddress: wallet,
        type,
        propertyMint,
        propertyName,
        amount,
        description,
        metadata,
      });

      res.status(201).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  // Export data endpoint
  async exportData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { wallet } = req.params;
      const { format = 'json' } = req.query;

      if (!wallet || wallet.length < 32) {
        res.status(400).json({
          success: false,
          error: 'Invalid wallet address',
        });
        return;
      }

      // Get all user data
      const [preferences, analytics, activities] = await Promise.all([
        this.getPreferencesUseCase.execute(wallet),
        this.getAnalyticsUseCase.execute(wallet, 'all'),
        this.getActivitiesUseCase.execute(wallet, 1, 1000),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        walletAddress: wallet,
        preferences,
        analytics: {
          summary: analytics.summary,
          portfolioHistory: analytics.portfolioHistory,
          allocation: analytics.allocation,
        },
        activities: activities.activities,
      };

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=hub-token-export-${wallet.slice(0, 8)}.csv`);
        res.send(csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=hub-token-export-${wallet.slice(0, 8)}.json`);
        res.json(exportData);
      }
    } catch (error) {
      next(error);
    }
  }

  private convertToCSV(data: any): string {
    const lines: string[] = [];

    // Header info
    lines.push('Hub Token Export');
    lines.push(`Exported At,${data.exportedAt}`);
    lines.push(`Wallet,${data.walletAddress}`);
    lines.push('');

    // Summary
    lines.push('Summary');
    lines.push('Total Invested,Total Revenue,Total Properties,Average Yield,Portfolio Growth');
    lines.push(`${data.analytics.summary.totalInvested},${data.analytics.summary.totalRevenueClaimed},${data.analytics.summary.totalProperties},${data.analytics.summary.averageYield}%,${data.analytics.summary.portfolioGrowth}%`);
    lines.push('');

    // Allocation
    lines.push('Portfolio Allocation');
    lines.push('Property,Value (USD),Percentage');
    for (const alloc of data.analytics.allocation) {
      lines.push(`${alloc.name},${alloc.value},${alloc.percentage}%`);
    }
    lines.push('');

    // Activities
    lines.push('Activities');
    lines.push('Date,Type,Property,Amount,Description');
    for (const activity of data.activities) {
      lines.push(`${activity.timestamp},${activity.type},${activity.propertyName || '-'},${activity.amount || '-'},${activity.description}`);
    }

    return lines.join('\n');
  }
}
