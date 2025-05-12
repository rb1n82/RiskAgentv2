import { Asset, RiskMetrics, PriceData } from '../types/Asset';

export class MetricsService {
  private static readonly RISK_FREE_RATE = 0.03; // 3% als Beispiel
  
  /**
   * Berechnet die Volatilität basierend auf historischen Preisdaten
   */
  static calculateVolatility(prices: PriceData[], period: number = 30): number {
    if (prices.length < 2) return 0;
    
    const returns = this.calculateReturns(prices);
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    const squaredDiffs = returns.map(ret => Math.pow(ret - meanReturn, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);
    
    return Math.sqrt(variance * 252); // Annualisierte Volatilität
  }

  /**
   * Berechnet die Sharpe Ratio
   */
  static calculateSharpeRatio(prices: PriceData[]): number {
    if (prices.length < 2) return 0;
    
    const returns = this.calculateReturns(prices);
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = this.calculateVolatility(prices);
    
    return (meanReturn * 252 - this.RISK_FREE_RATE) / volatility;
  }

  /**
   * Berechnet den maximalen Drawdown
   */
  static calculateMaxDrawdown(prices: PriceData[]): number {
    if (prices.length < 2) return 0;
    
    let maxPrice = prices[0].price;
    let maxDrawdown = 0;
    
    for (const priceData of prices) {
      if (priceData.price > maxPrice) {
        maxPrice = priceData.price;
      }
      
      const drawdown = (maxPrice - priceData.price) / maxPrice;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  /**
   * Berechnet Beta gegenüber einem Benchmark
   */
  static calculateBeta(assetPrices: PriceData[], benchmarkPrices: PriceData[]): number {
    if (assetPrices.length < 2 || benchmarkPrices.length < 2) return 1;
    
    const assetReturns = this.calculateReturns(assetPrices);
    const benchmarkReturns = this.calculateReturns(benchmarkPrices);
    
    const covariance = this.calculateCovariance(assetReturns, benchmarkReturns);
    const benchmarkVariance = this.calculateVariance(benchmarkReturns);
    
    return covariance / benchmarkVariance;
  }

  /**
   * Berechnet alle Risikomessgrößen für ein Asset
   */
  static calculateRiskMetrics(
    asset: Asset, 
    historicalPrices: PriceData[], 
    benchmarkPrices?: PriceData[]
  ): RiskMetrics {
    const volatility = this.calculateVolatility(historicalPrices);
    const sharpeRatio = this.calculateSharpeRatio(historicalPrices);
    const maxDrawdown = this.calculateMaxDrawdown(historicalPrices);
    
    const metrics: RiskMetrics = {
      volatility,
      sharpeRatio,
      maxDrawdown,
    };

    // Beta nur berechnen wenn Benchmark-Daten verfügbar
    if (benchmarkPrices && benchmarkPrices.length > 0) {
      metrics.beta = this.calculateBeta(historicalPrices, benchmarkPrices);
    }

    return metrics;
  }

  // Hilfsfunktionen
  private static calculateReturns(prices: PriceData[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(
        (prices[i].price - prices[i-1].price) / prices[i-1].price
      );
    }
    return returns;
  }

  private static calculateCovariance(returns1: number[], returns2: number[]): number {
    const mean1 = returns1.reduce((sum, val) => sum + val, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, val) => sum + val, 0) / returns2.length;
    
    let covariance = 0;
    for (let i = 0; i < returns1.length; i++) {
      covariance += (returns1[i] - mean1) * (returns2[i] - mean2);
    }
    
    return covariance / (returns1.length - 1);
  }

  private static calculateVariance(returns: number[]): number {
    const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
    return returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (returns.length - 1);
  }
} 