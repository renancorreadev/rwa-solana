/**
 * User Activity Entity
 * Tracks user investment activities and transactions
 */

export type ActivityType =
  | 'investment'
  | 'revenue_claim'
  | 'token_transfer'
  | 'kyc_verified'
  | 'property_view';

export interface UserActivity {
  id: string;
  walletAddress: string;
  type: ActivityType;
  propertyMint?: string;
  propertyName?: string;
  amount?: number;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export class UserActivityEntity implements UserActivity {
  id: string;
  walletAddress: string;
  type: ActivityType;
  propertyMint?: string;
  propertyName?: string;
  amount?: number;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;

  constructor(data: UserActivity) {
    this.id = data.id;
    this.walletAddress = data.walletAddress;
    this.type = data.type;
    this.propertyMint = data.propertyMint;
    this.propertyName = data.propertyName;
    this.amount = data.amount;
    this.description = data.description;
    this.metadata = data.metadata;
    this.timestamp = data.timestamp;
  }

  static createInvestment(
    walletAddress: string,
    propertyMint: string,
    propertyName: string,
    amount: number
  ): UserActivityEntity {
    return new UserActivityEntity({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      walletAddress,
      type: 'investment',
      propertyMint,
      propertyName,
      amount,
      description: `Invested $${amount.toLocaleString()} in ${propertyName}`,
      timestamp: new Date(),
    });
  }

  static createRevenueClaim(
    walletAddress: string,
    propertyMint: string,
    propertyName: string,
    amount: number
  ): UserActivityEntity {
    return new UserActivityEntity({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      walletAddress,
      type: 'revenue_claim',
      propertyMint,
      propertyName,
      amount,
      description: `Claimed $${amount.toLocaleString()} revenue from ${propertyName}`,
      timestamp: new Date(),
    });
  }
}
