import { apiClient, ApiResponse } from './client';

// Types
export interface CalendarEntry {
  date: string;
  type: 'past_claim' | 'scheduled' | 'projected';
  propertyMint: string;
  propertyName?: string;
  amountSol?: number;
  amountBrl?: number;
  status?: string;
  claimed?: boolean;
}

export interface DividendCalendar {
  wallet: string;
  pastClaims: CalendarEntry[];
  upcomingDistributions: CalendarEntry[];
  projectedPayments: CalendarEntry[];
}

export interface ClaimHistory {
  id: number;
  walletAddress: string;
  propertyMint: string;
  propertyName?: string;
  epochNumber: number;
  amountSol: number;
  amountBrl?: number;
  tokenBalanceAtClaim?: number;
  percentageOfProperty?: number;
  claimedAt: string;
  txSignature?: string;
}

export interface ClaimHistoryResponse {
  claims: ClaimHistory[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface MonthlyClaimsData {
  month: string;
  totalSol: number;
  totalBrl: number;
}

export interface NextDistribution {
  date: string;
  propertyName?: string;
  estimatedAmount?: number;
}

export interface InvestorDividendStats {
  walletAddress: string;
  totalClaimedSol: number;
  totalClaimedBrl: number;
  averageMonthlyYield: number;
  totalClaims: number;
  firstClaimDate?: string;
  lastClaimDate?: string;
  monthlyClaims: MonthlyClaimsData[];
  nextDistribution: NextDistribution | null;
}

export interface PropertyYield {
  propertyMint: string;
  propertyName: string;
  totalDistributedSol: number;
  totalDistributedBrl: number;
  investorShareSol: number;
  investorShareBrl: number;
  monthlyAverageYield: number;
  annualizedYield: number;
  lastDistributionDate?: string;
  nextDistributionDate?: string;
  investorPercentage: number;
}

export interface ScheduledDistribution {
  id: number;
  propertyMint: string;
  propertyName?: string;
  scheduledDate: string;
  estimatedAmountSol?: number;
  estimatedAmountBrl?: number;
  notes?: string;
  status: 'scheduled' | 'deposited' | 'cancelled';
  actualEpochNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectionByProperty {
  propertyMint: string;
  propertyName: string;
  amountSol: number;
  amountBrl: number;
  investorShare: number;
}

export interface MonthlyProjection {
  month: string;
  totalProjectedSol: number;
  totalProjectedBrl: number;
  byProperty: ProjectionByProperty[];
}

export interface RevenueProjectionsResponse {
  wallet: string;
  projections: MonthlyProjection[];
  totalYearlyProjection: {
    sol: number;
    brl: number;
  };
}

// API Functions

/**
 * Get dividend calendar for a wallet
 */
export async function getDividendCalendar(walletAddress: string): Promise<DividendCalendar> {
  const response = await apiClient.get(`/dividends/calendar/${walletAddress}`) as ApiResponse<DividendCalendar>;
  return response.data;
}

/**
 * Get paginated claim history for a wallet
 */
export async function getClaimHistory(
  walletAddress: string,
  page: number = 1,
  limit: number = 20
): Promise<ClaimHistoryResponse> {
  const response = await apiClient.get(`/dividends/history/${walletAddress}`, {
    params: { page, limit }
  }) as ApiResponse<ClaimHistoryResponse>;
  return response.data;
}

/**
 * Get dividend statistics for a wallet
 */
export async function getDividendStats(walletAddress: string): Promise<InvestorDividendStats> {
  const response = await apiClient.get(`/dividends/stats/${walletAddress}`) as ApiResponse<InvestorDividendStats>;
  return response.data;
}

/**
 * Get yield information per property for a wallet
 */
export async function getPropertyYields(walletAddress: string): Promise<PropertyYield[]> {
  const response = await apiClient.get(`/dividends/yields/${walletAddress}`) as ApiResponse<PropertyYield[]>;
  return response.data;
}

/**
 * Get upcoming scheduled distributions
 */
export async function getUpcomingDistributions(limit: number = 20): Promise<ScheduledDistribution[]> {
  const response = await apiClient.get(`/dividends/upcoming`, {
    params: { limit }
  }) as ApiResponse<ScheduledDistribution[]>;
  return response.data;
}

/**
 * Get revenue projections for a wallet
 */
export async function getRevenueProjections(walletAddress: string): Promise<RevenueProjectionsResponse> {
  const response = await apiClient.get(`/dividends/projections/${walletAddress}`) as ApiResponse<RevenueProjectionsResponse>;
  return response.data;
}

// Admin API Functions

/**
 * Create a new scheduled distribution
 */
export async function createScheduledDistribution(data: {
  propertyMint: string;
  propertyName?: string;
  scheduledDate: string;
  estimatedAmountSol?: number;
  estimatedAmountBrl?: number;
  notes?: string;
}): Promise<ScheduledDistribution> {
  const response = await apiClient.post('/admin/dividends/schedule', data) as ApiResponse<ScheduledDistribution>;
  return response.data;
}

/**
 * Update a scheduled distribution
 */
export async function updateScheduledDistribution(
  id: number,
  data: Partial<{
    scheduledDate: string;
    estimatedAmountSol: number;
    estimatedAmountBrl: number;
    notes: string;
    status: 'scheduled' | 'deposited' | 'cancelled';
    actualEpochNumber: number;
  }>
): Promise<ScheduledDistribution> {
  const response = await apiClient.put(`/admin/dividends/schedule/${id}`, data) as ApiResponse<ScheduledDistribution>;
  return response.data;
}

/**
 * Delete a scheduled distribution
 */
export async function deleteScheduledDistribution(id: number): Promise<{ message: string }> {
  const response = await apiClient.delete(`/admin/dividends/schedule/${id}`) as ApiResponse<{ message: string }>;
  return response.data;
}

/**
 * List all scheduled distributions (admin)
 */
export async function listScheduledDistributions(params?: {
  propertyMint?: string;
  status?: string;
}): Promise<ScheduledDistribution[]> {
  const response = await apiClient.get('/admin/dividends/schedules', { params }) as ApiResponse<ScheduledDistribution[]>;
  return response.data;
}
