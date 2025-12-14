import { UserPreferences } from '../../domain/entities/UserPreferences';

export interface IUserPreferencesRepository {
  findByWallet(walletAddress: string): Promise<UserPreferences | null>;
  save(preferences: UserPreferences): Promise<UserPreferences>;
  update(walletAddress: string, data: Partial<UserPreferences>): Promise<UserPreferences | null>;
  delete(walletAddress: string): Promise<boolean>;
}
