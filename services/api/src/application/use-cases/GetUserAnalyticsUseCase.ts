import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IUserAnalyticsRepository, AnalyticsSummary, PortfolioSnapshot } from '../ports/IUserAnalyticsRepository';
import { IPropertyRepository } from '../ports/IPropertyRepository';
import { IInvestorRepository } from '../ports/IInvestorRepository';
import { UserActivity } from '../../domain/entities/UserActivity';

export interface PortfolioChartData {
  date: string;
  value: number;
}

export interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  projected: number;
}

export interface UserAnalyticsDTO {
  summary: AnalyticsSummary;
  portfolioHistory: PortfolioChartData[];
  allocation: AllocationData[];
  revenueHistory: RevenueChartData[];
  recentActivities: UserActivity[];
  insights: {
    type: 'positive' | 'negative' | 'neutral';
    title: string;
    description: string;
  }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

@injectable()
export class GetUserAnalyticsUseCase {
  constructor(
    @inject(TOKENS.UserAnalyticsRepository)
    private analyticsRepository: IUserAnalyticsRepository,
    @inject(TOKENS.PropertyRepository)
    private propertyRepository: IPropertyRepository,
    @inject(TOKENS.InvestorRepository)
    private investorRepository: IInvestorRepository
  ) {}

  async execute(walletAddress: string, timeRange: string = '30d'): Promise<UserAnalyticsDTO> {
    const days = this.parseTimeRange(timeRange);

    // Get analytics summary
    const summary = await this.analyticsRepository.getAnalyticsSummary(walletAddress);

    // Get portfolio history
    const portfolioSnapshots = await this.analyticsRepository.getPortfolioHistory(walletAddress, days);
    const portfolioHistory = this.formatPortfolioHistory(portfolioSnapshots);

    // Get current allocation from investor holdings
    const allocation = await this.getCurrentAllocation(walletAddress);

    // Get revenue history (from activities)
    const revenueHistory = await this.getRevenueHistory(walletAddress, days);

    // Get recent activities
    const recentActivities = await this.analyticsRepository.getActivities(walletAddress, 10);

    // Generate insights
    const insights = this.generateInsights(summary, portfolioHistory, allocation);

    return {
      summary,
      portfolioHistory,
      allocation,
      revenueHistory,
      recentActivities,
      insights,
    };
  }

  private parseTimeRange(timeRange: string): number {
    switch (timeRange) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      case 'all': return 1825; // 5 years
      default: return 30;
    }
  }

  private formatPortfolioHistory(snapshots: PortfolioSnapshot[]): PortfolioChartData[] {
    return snapshots.map(s => ({
      date: s.snapshotDate.toISOString().split('T')[0],
      value: s.totalValueUsd,
    }));
  }

  private async getCurrentAllocation(walletAddress: string): Promise<AllocationData[]> {
    try {
      const properties = await this.propertyRepository.findAll();
      const propertyMints = properties.map(p => p.mint);
      const holdings = await this.investorRepository.getHoldings(walletAddress, propertyMints);

      if (holdings.length === 0) {
        return [];
      }

      let totalValue = 0;
      const allocations: AllocationData[] = [];

      for (const holding of holdings) {
        const property = properties.find(p => p.mint === holding.propertyMint);
        if (!property) continue;

        const decimalsMultiplier = Math.pow(10, property.decimals);
        const balanceTokens = Number(holding.balance) / decimalsMultiplier;
        const totalSupplyTokens = Number(property.totalSupply) / decimalsMultiplier;
        const totalValueDollars = property.details.totalValueUsd / 100;
        const valuePerToken = totalSupplyTokens > 0 ? totalValueDollars / totalSupplyTokens : 0;
        const valueUsd = valuePerToken * balanceTokens;

        if (valueUsd > 0) {
          totalValue += valueUsd;
          allocations.push({
            name: property.name,
            value: valueUsd,
            percentage: 0, // Will calculate after
            color: COLORS[allocations.length % COLORS.length],
          });
        }
      }

      // Calculate percentages
      return allocations.map(a => ({
        ...a,
        percentage: totalValue > 0 ? (a.value / totalValue) * 100 : 0,
      }));
    } catch {
      return [];
    }
  }

  private async getRevenueHistory(walletAddress: string, days: number): Promise<RevenueChartData[]> {
    const activities = await this.analyticsRepository.getActivities(walletAddress, 1000);
    const revenueActivities = activities.filter(a => a.type === 'revenue_claim');

    // Group by month
    const monthlyRevenue = new Map<string, number>();

    for (const activity of revenueActivities) {
      const date = new Date(activity.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const current = monthlyRevenue.get(monthKey) || 0;
      monthlyRevenue.set(monthKey, current + (activity.amount || 0));
    }

    // Generate last N months
    const result: RevenueChartData[] = [];
    const now = new Date();
    const monthsToShow = Math.min(Math.ceil(days / 30), 12);

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      result.push({
        month: monthName,
        revenue: monthlyRevenue.get(monthKey) || 0,
        projected: 0, // Could calculate based on yield
      });
    }

    return result;
  }

  private generateInsights(
    summary: AnalyticsSummary,
    portfolioHistory: PortfolioChartData[],
    allocation: AllocationData[]
  ): UserAnalyticsDTO['insights'] {
    const insights: UserAnalyticsDTO['insights'] = [];

    // Portfolio growth insight
    if (summary.portfolioGrowth > 5) {
      insights.push({
        type: 'positive',
        title: 'Strong Portfolio Growth',
        description: `Your portfolio has grown ${summary.portfolioGrowth.toFixed(1)}% in the last period.`,
      });
    } else if (summary.portfolioGrowth < -5) {
      insights.push({
        type: 'negative',
        title: 'Portfolio Decline',
        description: `Your portfolio has declined ${Math.abs(summary.portfolioGrowth).toFixed(1)}% recently.`,
      });
    }

    // Diversification insight
    if (allocation.length === 1) {
      insights.push({
        type: 'neutral',
        title: 'Consider Diversifying',
        description: 'Your portfolio is concentrated in a single property. Consider diversifying.',
      });
    } else if (allocation.length >= 3) {
      insights.push({
        type: 'positive',
        title: 'Well Diversified',
        description: `You own tokens in ${allocation.length} different properties.`,
      });
    }

    // Yield insight
    if (summary.averageYield > 8) {
      insights.push({
        type: 'positive',
        title: 'High Yield Portfolio',
        description: `Your average yield of ${summary.averageYield.toFixed(1)}% is above market average.`,
      });
    }

    // Revenue claimed insight
    if (summary.totalRevenueClaimed > 0) {
      insights.push({
        type: 'positive',
        title: 'Revenue Earned',
        description: `You've claimed $${summary.totalRevenueClaimed.toLocaleString()} in revenue.`,
      });
    }

    return insights;
  }
}
