import { apiClient, ApiResponse } from './client';

// Types
export interface NotificationPreferences {
  revenueAlerts: boolean;
  priceAlerts: boolean;
  newProperties: boolean;
  kycReminders: boolean;
  marketingEmails: boolean;
}

export interface UserPreferences {
  walletAddress: string;
  theme: 'light' | 'dark' | 'system';
  currency: 'USD' | 'BRL' | 'EUR';
  hideBalances: boolean;
  notifications: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferencesInput {
  theme?: 'light' | 'dark' | 'system';
  currency?: 'USD' | 'BRL' | 'EUR';
  hideBalances?: boolean;
  notifications?: Partial<NotificationPreferences>;
}

export interface AnalyticsSummary {
  totalInvested: number;
  totalRevenueClaimed: number;
  totalProperties: number;
  averageYield: number;
  portfolioGrowth: number;
  topPerformingProperty: {
    mint: string;
    name: string;
    returnPercent: number;
  } | null;
}

export interface PortfolioChartData {
  date: string;
  value: number;
}

export interface AllocationData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export interface RevenueChartData {
  month: string;
  revenue: number;
  projected: number;
}

export interface UserActivity {
  id: string;
  type: string;
  propertyMint?: string;
  propertyName?: string;
  amount?: number;
  description: string;
  timestamp: string;
}

export interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  title: string;
  description: string;
}

export interface UserAnalytics {
  summary: AnalyticsSummary;
  portfolioHistory: PortfolioChartData[];
  allocation: AllocationData[];
  revenueHistory: RevenueChartData[];
  recentActivities: UserActivity[];
  insights: Insight[];
}

export interface PaginatedActivities {
  activities: UserActivity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Functions
export async function getUserPreferences(walletAddress: string): Promise<UserPreferences> {
  const response = await apiClient.get(`/users/${walletAddress}/preferences`) as ApiResponse<UserPreferences>;
  return response.data;
}

export async function updateUserPreferences(
  walletAddress: string,
  preferences: UpdatePreferencesInput
): Promise<UserPreferences> {
  const response = await apiClient.put(`/users/${walletAddress}/preferences`, preferences) as ApiResponse<UserPreferences>;
  return response.data;
}

export async function deleteUserPreferences(walletAddress: string): Promise<{ deleted: boolean }> {
  const response = await apiClient.delete(`/users/${walletAddress}/preferences`) as ApiResponse<{ deleted: boolean }>;
  return response.data;
}

export async function getUserAnalytics(
  walletAddress: string,
  timeRange: '7d' | '30d' | '90d' | '1y' | 'all' = '30d'
): Promise<UserAnalytics> {
  const response = await apiClient.get(`/users/${walletAddress}/analytics`, {
    params: { timeRange }
  }) as ApiResponse<UserAnalytics>;
  return response.data;
}

export async function getUserActivities(
  walletAddress: string,
  page: number = 1,
  pageSize: number = 20
): Promise<PaginatedActivities> {
  const response = await apiClient.get(`/users/${walletAddress}/activities`, {
    params: { page, pageSize }
  }) as ApiResponse<PaginatedActivities>;
  return response.data;
}

export async function recordUserActivity(
  walletAddress: string,
  activity: {
    type: string;
    propertyMint?: string;
    propertyName?: string;
    amount?: number;
    description: string;
    metadata?: Record<string, unknown>;
  }
): Promise<UserActivity> {
  const response = await apiClient.post(`/users/${walletAddress}/activities`, activity) as ApiResponse<UserActivity>;
  return response.data;
}

export async function exportUserData(
  walletAddress: string,
  format: 'json' | 'csv' = 'json'
): Promise<Blob> {
  const response = await apiClient.get(`/users/${walletAddress}/export`, {
    params: { format },
    responseType: 'blob',
  });
  return response as unknown as Blob;
}
