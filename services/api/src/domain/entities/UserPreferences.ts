/**
 * User Preferences Entity
 * Stores user-specific settings and preferences
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type CurrencyPreference = 'USD' | 'BRL' | 'EUR';

export interface NotificationPreferences {
  revenueAlerts: boolean;
  priceAlerts: boolean;
  newProperties: boolean;
  kycReminders: boolean;
  marketingEmails: boolean;
}

export interface UserPreferences {
  walletAddress: string;
  theme: ThemePreference;
  currency: CurrencyPreference;
  hideBalances: boolean;
  notifications: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export class UserPreferencesEntity implements UserPreferences {
  walletAddress: string;
  theme: ThemePreference;
  currency: CurrencyPreference;
  hideBalances: boolean;
  notifications: NotificationPreferences;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<UserPreferences> & { walletAddress: string }) {
    this.walletAddress = data.walletAddress;
    this.theme = data.theme ?? 'system';
    this.currency = data.currency ?? 'USD';
    this.hideBalances = data.hideBalances ?? false;
    this.notifications = data.notifications ?? {
      revenueAlerts: true,
      priceAlerts: true,
      newProperties: true,
      kycReminders: true,
      marketingEmails: false,
    };
    this.createdAt = data.createdAt ?? new Date();
    this.updatedAt = data.updatedAt ?? new Date();
  }

  static createDefault(walletAddress: string): UserPreferencesEntity {
    return new UserPreferencesEntity({ walletAddress });
  }

  update(data: Partial<Omit<UserPreferences, 'walletAddress' | 'createdAt'>>): void {
    if (data.theme !== undefined) this.theme = data.theme;
    if (data.currency !== undefined) this.currency = data.currency;
    if (data.hideBalances !== undefined) this.hideBalances = data.hideBalances;
    if (data.notifications !== undefined) {
      this.notifications = { ...this.notifications, ...data.notifications };
    }
    this.updatedAt = new Date();
  }
}
