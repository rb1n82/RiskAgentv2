import { StockData, RiskMetrics } from '../types/StockTypes';

export interface MarketDataStore {
  stockData: Record<string, StockData>;
  riskMetrics: Record<string, RiskMetrics>;
  lastUpdate: string;
}

export const marketData: MarketDataStore = {
  stockData: {},
  riskMetrics: {},
  lastUpdate: new Date().toISOString()
};

export const updateMarketData = (
  newStockData: Record<string, StockData>,
  newRiskMetrics: Record<string, RiskMetrics>
) => {
  marketData.stockData = newStockData;
  marketData.riskMetrics = newRiskMetrics;
  marketData.lastUpdate = new Date().toISOString();
}; 