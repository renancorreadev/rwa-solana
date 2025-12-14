import { apiClient } from './client';

export interface PlatformStats {
  totalValueLocked: number;      // in USD
  activeInvestors: number;       // unique wallet addresses holding tokens
  avgAnnualYield: number;        // percentage (e.g., 6.4 for 6.4%)
  totalProperties: number;       // active properties
  totalCirculatingTokens: number; // total tokens in circulation
  lastUpdated: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Get platform-wide statistics (TVL, active investors, avg yield)
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  // Note: apiClient interceptor already extracts response.data
  const response = await apiClient.get<ApiResponse<PlatformStats>>('/stats/platform') as unknown as ApiResponse<PlatformStats>;
  if (!response.success) {
    throw new Error(response.error || 'Failed to fetch platform stats');
  }
  return response.data;
}

/**
 * Force refresh platform statistics (bypasses cache)
 */
export async function refreshPlatformStats(): Promise<PlatformStats> {
  // Note: apiClient interceptor already extracts response.data
  const response = await apiClient.post<ApiResponse<PlatformStats>>('/stats/refresh') as unknown as ApiResponse<PlatformStats>;
  if (!response.success) {
    throw new Error(response.error || 'Failed to refresh platform stats');
  }
  return response.data;
}
