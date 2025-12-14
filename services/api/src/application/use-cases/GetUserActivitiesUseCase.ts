import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IUserAnalyticsRepository } from '../ports/IUserAnalyticsRepository';

export interface UserActivityDTO {
  id: string;
  type: string;
  propertyMint?: string;
  propertyName?: string;
  amount?: number;
  description: string;
  timestamp: string;
}

export interface PaginatedActivitiesDTO {
  activities: UserActivityDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@injectable()
export class GetUserActivitiesUseCase {
  constructor(
    @inject(TOKENS.UserAnalyticsRepository)
    private analyticsRepository: IUserAnalyticsRepository
  ) {}

  async execute(
    walletAddress: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<PaginatedActivitiesDTO> {
    const offset = (page - 1) * pageSize;

    const [activities, total] = await Promise.all([
      this.analyticsRepository.getActivities(walletAddress, pageSize, offset),
      this.analyticsRepository.getActivityCount(walletAddress),
    ]);

    return {
      activities: activities.map(a => ({
        id: a.id,
        type: a.type,
        propertyMint: a.propertyMint,
        propertyName: a.propertyName,
        amount: a.amount,
        description: a.description,
        timestamp: a.timestamp.toISOString(),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
