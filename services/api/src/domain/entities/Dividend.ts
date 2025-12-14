/**
 * Dividend Calendar Domain Entities
 */

// Scheduled Distribution (future payments planned by admin)
export interface ScheduledDistribution {
  id?: number;
  propertyMint: string;
  propertyName?: string;
  scheduledDate: Date;
  estimatedAmountSol?: number;
  estimatedAmountBrl?: number;
  notes?: string;
  status: 'scheduled' | 'deposited' | 'cancelled';
  actualEpochNumber?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Claim History (investor's past claims cached from on-chain)
export interface ClaimHistory {
  id?: number;
  walletAddress: string;
  propertyMint: string;
  propertyName?: string;
  epochNumber: number;
  amountSol: number;
  amountBrl?: number;
  tokenBalanceAtClaim?: number;
  percentageOfProperty?: number;
  claimedAt: Date;
  txSignature?: string;
  syncedAt?: Date;
}

// Revenue Projection (admin's projections for future months)
export interface RevenueProjection {
  id?: number;
  propertyMint: string;
  month: Date;
  projectedRevenueSol?: number;
  projectedRevenueBrl?: number;
  source: 'rental' | 'sale' | 'appreciation' | 'other';
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
}

// Investor Stats (aggregated data)
export interface InvestorDividendStats {
  walletAddress: string;
  totalClaimedSol: number;
  totalClaimedBrl: number;
  averageMonthlyYield: number;
  totalClaims: number;
  firstClaimDate?: Date;
  lastClaimDate?: Date;
}

// Property Yield Info
export interface PropertyYield {
  propertyMint: string;
  propertyName: string;
  totalDistributedSol: number;
  totalDistributedBrl: number;
  investorShareSol: number;
  investorShareBrl: number;
  monthlyAverageYield: number;
  annualizedYield: number;
  lastDistributionDate?: Date;
  nextDistributionDate?: Date;
  investorPercentage: number;
}

// Calendar Entry (for calendar view)
export interface CalendarEntry {
  date: Date;
  type: 'past_claim' | 'scheduled' | 'projected';
  propertyMint: string;
  propertyName?: string;
  amountSol?: number;
  amountBrl?: number;
  status?: string;
  claimed?: boolean;
}

// Dividend Calendar Response
export interface DividendCalendar {
  wallet: string;
  pastClaims: CalendarEntry[];
  upcomingDistributions: CalendarEntry[];
  projectedPayments: CalendarEntry[];
}

// Paginated Claim History Response
export interface ClaimHistoryResponse {
  claims: ClaimHistory[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Projections Response
export interface RevenueProjectionsResponse {
  wallet: string;
  projections: {
    month: Date;
    totalProjectedSol: number;
    totalProjectedBrl: number;
    byProperty: {
      propertyMint: string;
      propertyName: string;
      amountSol: number;
      amountBrl: number;
      investorShare: number;
    }[];
  }[];
  totalYearlyProjection: {
    sol: number;
    brl: number;
  };
}

// Create Scheduled Distribution DTO
export interface CreateScheduledDistributionDTO {
  propertyMint: string;
  scheduledDate: Date;
  estimatedAmountSol?: number;
  estimatedAmountBrl?: number;
  notes?: string;
}

// Update Scheduled Distribution DTO
export interface UpdateScheduledDistributionDTO {
  scheduledDate?: Date;
  estimatedAmountSol?: number;
  estimatedAmountBrl?: number;
  notes?: string;
  status?: 'scheduled' | 'deposited' | 'cancelled';
  actualEpochNumber?: number;
}
