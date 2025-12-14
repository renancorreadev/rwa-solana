import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IUserAnalyticsRepository } from '../ports/IUserAnalyticsRepository';
import { ActivityType, UserActivityEntity } from '../../domain/entities/UserActivity';

export interface RecordActivityInput {
  walletAddress: string;
  type: ActivityType;
  propertyMint?: string;
  propertyName?: string;
  amount?: number;
  description: string;
  metadata?: Record<string, unknown>;
}

export interface RecordedActivityDTO {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

@injectable()
export class RecordUserActivityUseCase {
  constructor(
    @inject(TOKENS.UserAnalyticsRepository)
    private analyticsRepository: IUserAnalyticsRepository
  ) {}

  async execute(input: RecordActivityInput): Promise<RecordedActivityDTO> {
    const activity = await this.analyticsRepository.createActivity({
      walletAddress: input.walletAddress,
      type: input.type,
      propertyMint: input.propertyMint,
      propertyName: input.propertyName,
      amount: input.amount,
      description: input.description,
      metadata: input.metadata,
      timestamp: new Date(),
    });

    return {
      id: activity.id,
      type: activity.type,
      description: activity.description,
      timestamp: activity.timestamp.toISOString(),
    };
  }
}
