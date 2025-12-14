import { injectable, inject } from 'tsyringe';
import { TOKENS } from '../../shared/container/tokens';
import { PostgresDatabase } from '../database/PostgresDatabase';
import { IUserPreferencesRepository } from '../../application/ports/IUserPreferencesRepository';
import {
  UserPreferences,
  UserPreferencesEntity,
  ThemePreference,
  CurrencyPreference,
  NotificationPreferences
} from '../../domain/entities/UserPreferences';

interface UserPreferencesRow {
  id: number;
  wallet_address: string;
  theme: string;
  currency: string;
  hide_balances: boolean;
  notifications: NotificationPreferences;
  created_at: Date;
  updated_at: Date;
}

@injectable()
export class UserPreferencesRepositoryImpl implements IUserPreferencesRepository {
  constructor(
    @inject(TOKENS.Database) private db: PostgresDatabase
  ) {}

  async findByWallet(walletAddress: string): Promise<UserPreferences | null> {
    const result = await this.db.query<UserPreferencesRow>(
      'SELECT * FROM user_preferences WHERE wallet_address = $1',
      [walletAddress]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async save(preferences: UserPreferences): Promise<UserPreferences> {
    const result = await this.db.query<UserPreferencesRow>(
      `INSERT INTO user_preferences (wallet_address, theme, currency, hide_balances, notifications)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (wallet_address) DO UPDATE SET
         theme = EXCLUDED.theme,
         currency = EXCLUDED.currency,
         hide_balances = EXCLUDED.hide_balances,
         notifications = EXCLUDED.notifications,
         updated_at = NOW()
       RETURNING *`,
      [
        preferences.walletAddress,
        preferences.theme,
        preferences.currency,
        preferences.hideBalances,
        JSON.stringify(preferences.notifications)
      ]
    );

    return this.mapRowToEntity(result.rows[0]);
  }

  async update(walletAddress: string, data: Partial<UserPreferences>): Promise<UserPreferences | null> {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.theme !== undefined) {
      updates.push(`theme = $${paramIndex++}`);
      values.push(data.theme);
    }
    if (data.currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`);
      values.push(data.currency);
    }
    if (data.hideBalances !== undefined) {
      updates.push(`hide_balances = $${paramIndex++}`);
      values.push(data.hideBalances);
    }
    if (data.notifications !== undefined) {
      updates.push(`notifications = $${paramIndex++}`);
      values.push(JSON.stringify(data.notifications));
    }

    if (updates.length === 0) {
      return this.findByWallet(walletAddress);
    }

    updates.push('updated_at = NOW()');
    values.push(walletAddress);

    const result = await this.db.query<UserPreferencesRow>(
      `UPDATE user_preferences SET ${updates.join(', ')} WHERE wallet_address = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      // Create new if not exists
      const defaultPrefs = UserPreferencesEntity.createDefault(walletAddress);
      if (data.theme) defaultPrefs.theme = data.theme;
      if (data.currency) defaultPrefs.currency = data.currency;
      if (data.hideBalances !== undefined) defaultPrefs.hideBalances = data.hideBalances;
      if (data.notifications) defaultPrefs.notifications = { ...defaultPrefs.notifications, ...data.notifications };
      return this.save(defaultPrefs);
    }

    return this.mapRowToEntity(result.rows[0]);
  }

  async delete(walletAddress: string): Promise<boolean> {
    const result = await this.db.query(
      'DELETE FROM user_preferences WHERE wallet_address = $1',
      [walletAddress]
    );
    return (result.rowCount ?? 0) > 0;
  }

  private mapRowToEntity(row: UserPreferencesRow): UserPreferencesEntity {
    return new UserPreferencesEntity({
      walletAddress: row.wallet_address,
      theme: row.theme as ThemePreference,
      currency: row.currency as CurrencyPreference,
      hideBalances: row.hide_balances,
      notifications: row.notifications,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
