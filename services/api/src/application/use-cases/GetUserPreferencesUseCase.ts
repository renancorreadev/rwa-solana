import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IUserPreferencesRepository } from '../ports/IUserPreferencesRepository';
import { UserPreferencesEntity, NotificationPreferences } from '../../domain/entities/UserPreferences';

export interface UserPreferencesDTO {
  walletAddress: string;
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'BRL' | 'EUR';
  hideBalances: boolean;
  notifications: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

@injectable()
export class GetUserPreferencesUseCase {
  constructor(
    @inject(TOKENS.UserPreferencesRepository)
    private preferencesRepository: IUserPreferencesRepository
  ) {}

  async execute(walletAddress: string): Promise<UserPreferencesDTO> {
    let preferences = await this.preferencesRepository.findByWallet(walletAddress);

    // If no preferences exist, create default ones
    if (!preferences) {
      const defaultPrefs = UserPreferencesEntity.createDefault(walletAddress);
      preferences = await this.preferencesRepository.save(defaultPrefs);
    }

    return {
      walletAddress: preferences.walletAddress,
      theme: preferences.theme,
      currency: preferences.currency,
      hideBalances: preferences.hideBalances,
      notifications: preferences.notifications,
      createdAt: preferences.createdAt.toISOString(),
      updatedAt: preferences.updatedAt.toISOString(),
    };
  }
}
