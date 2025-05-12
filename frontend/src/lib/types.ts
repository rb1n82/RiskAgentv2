export type Section = 
  | 'dashboard' 
  | 'portfolios' 
  | 'portfolio-detail' 
  | 'asset-detail' 
  | 'new-portfolio' 
  | 'edit-portfolio'
  | 'assets'
  | 'crypto-assets'
  | 'stock-assets'
  | 'etf-assets';

export interface Asset {
    id: string;
    name: string;
    symbol: string;
    price: number;
    priceChange24h: number;
    volatility: number; // Daily volatility (%)
    correlations?: Record<string, number>; // Correlation with other assets
    historicalData: { date: string; price: number }[];
    quantity?: number;  // Optionale Menge für das Asset
  }
  
  export interface PortfolioAsset {
    assetId: string;
    quantity: number;
  }
  
  export interface Portfolio {
    id: string;
    name: string;
    description: string;
    assets: PortfolioAsset[];
    createdAt: string;
    updatedAt: string;
  }
  
  export interface RiskMetrics {
    totalValue:   number;      // Gesamtwert des Portfolios
    ytdReturn?:   number;      // Year-to-date Return (z.B. 0.123 für +12.3%)
    volatility:   number;      // annualisierte Volatilität als Dezimal (0.2 = 20%)
    sharpe:       number;      // Sharpe Ratio
    maxDrawdown:  number;      // maximaler Drawdown in Dezimal (0.15 = 15%)
    beta?:        number;      // Beta gegen Benchmark
    valueAtRisk?: number;  // Value at Risk (95%)
  }
  
  export interface AssetAllocation {
    assetId: string;
    symbol: string;
    percentage: number;
    value: number;
    color: string;
  }

  export interface MarketDataEntry {
    symbol: string;
    type: string;
    currentPrice: number;
    oneDayAgoPrice: number;
    sevenDayAgoPrice: number;
    thirtyDayAgoPrice: number;
    ninetyDayAgoPrice: number;
    volume: number;
    lastUpdated: number;
  }