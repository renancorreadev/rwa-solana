import { apiClient } from './client';

export interface InvestmentQuote {
  propertyMint: string;
  propertyName: string;
  tokenAmount: number;
  pricePerToken: number;
  totalUsd: number;
  solPrice: number;
  totalSol: number;
  totalLamports: string;
  breakdown: {
    platformFee: {
      percent: number;
      lamports: string;
      sol: number;
    };
    reserveFund: {
      percent: number;
      lamports: string;
      sol: number;
    };
    seller: {
      percent: number;
      lamports: string;
      sol: number;
    };
  };
  platformTreasury: string;
  seller: string;
  validFor: number;
  timestamp: number;
}

export interface SolPrice {
  symbol: string;
  priceUsd: number;
  timestamp: number;
}

export interface InvestmentResult {
  tokenAccount: string;
  mintSignature: string;
  paymentSignature: string | null;
  kycVerified: boolean;
  tokenAmount: number;
  investorWallet: string;
  propertyMint: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

/**
 * Get current SOL price in USD
 */
export async function getSolPrice(): Promise<SolPrice> {
  const response = await apiClient.get<ApiResponse<SolPrice>>('/invest/price') as unknown as ApiResponse<SolPrice>;
  if (!response.success) {
    throw new Error(response.error || 'Failed to get SOL price');
  }
  return response.data;
}

/**
 * Get investment quote with fee breakdown
 */
export async function getInvestmentQuote(
  propertyMint: string,
  tokenAmount: number
): Promise<InvestmentQuote> {
  const response = await apiClient.get<ApiResponse<InvestmentQuote>>(
    `/invest/quote?propertyMint=${propertyMint}&tokenAmount=${tokenAmount}`
  ) as unknown as ApiResponse<InvestmentQuote>;

  if (!response.success) {
    throw new Error(response.error || 'Failed to get investment quote');
  }
  return response.data;
}

/**
 * Process investment after payment
 */
export async function processInvestment(
  propertyMint: string,
  investorWallet: string,
  tokenAmount: number,
  paymentSignature?: string
): Promise<InvestmentResult> {
  const response = await apiClient.post<ApiResponse<InvestmentResult>>('/invest', {
    propertyMint,
    investorWallet,
    tokenAmount,
    paymentSignature,
  }) as unknown as ApiResponse<InvestmentResult>;

  if (!response.success) {
    throw new Error(response.error || 'Investment failed');
  }
  return response.data;
}
