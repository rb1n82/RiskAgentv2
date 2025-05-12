export type AssetType = 'CRYPTO' | 'STOCK' | 'ETF' | 'BOND';

export interface BaseAsset {
  id: string;
  name: string;
  symbol: string;
  type: AssetType;
  description?: string;
  lastUpdated: Date;
}

export interface PriceData {
  price: number;
  timestamp: Date;
  volume24h: number;
  period?: 'current' | 'oneDay' | 'sevenDays' | 'thirtyDays' | 'ninetyDays' | 'oneYear' | 'threeYears' | 'tenYears';
}

export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  beta?: number;
  alpha?: number;
  rSquared?: number;
}

export interface AssetPerformance {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
  ytd: number;
}

export interface Asset extends BaseAsset {
  currentPrice: PriceData;
  performance: AssetPerformance;
  riskMetrics: RiskMetrics;
  metadata: Record<string, any>; // Typ-spezifische Metadaten
} 