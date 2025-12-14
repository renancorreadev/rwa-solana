import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { IUserPreferencesRepository } from '../ports/IUserPreferencesRepository';
import { NotificationPreferences, ThemePreference, CurrencyPreference } from '../../domain/entities/UserPreferences';

export interface UpdatePreferencesInput {
  theme?: ThemePreference;
  currency?: CurrencyPreference;
  hideBalances?: boolean;
  notifications?: Partial<NotificationPreferences>;
}

export interface UpdatePreferencesDTO {
  walletAddress: string;
  theme: ThemePreference;
  currency: CurrencyPreference;
  hideBalances: boolean;
  notifications: NotificationPreferences;
  updatedAt: string;
}

@injectable()
export class UpdateUserPreferencesUseCase {
  constructor(
    @inject(TOKENS.UserPreferencesRepository)
    private preferencesRepository: IUserPreferencesRepository
  ) {}

  async execute(walletAddress: string, input: UpdatePreferencesInput): Promise<UpdatePreferencesDTO> {
    // Get existing preferences or create default
    let existing = await this.preferencesRepository.findByWallet(walletAddress);

    const updateData: any = {};

    if (input.theme !== undefined) {
      updateData.theme = input.theme;
    }
    if (input.currency !== undefined) {
      updateData.currency = input.currency;
    }
    if (input.hideBalances !== undefined) {
      updateData.hideBalances = input.hideBalances;
    }
    if (input.notifications !== undefined) {
      // Merge with existing notifications
      const existingNotifications = existing?.notifications ?? {
        revenueAlerts: true,
        priceAlerts: true,
        newProperties: true,
        kycReminders: true,
        marketingEmails: false,
      };
      updateData.notifications = {
        ...existingNotifications,
        ...input.notifications,
      };
    }

    const updated = await this.preferencesRepository.update(walletAddress, updateData);

    if (!updated) {
      throw new Error('Failed to update preferences');
    }

    return {
      walletAddress: updated.walletAddress,
      theme: updated.theme,
      currency: updated.currency,
      hideBalances: updated.hideBalances,
      notifications: updated.notifications,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
