import { Asset, RiskMetrics } from "@/lib/types";

export class AssetMetricService {
  private static readonly RISK_FREE_RATE = 0.02; // 2% als risikofreier Zinssatz

  /**
   * Berechnet die täglichen Renditen aus Preisdaten
   */
  private static calculateReturns(prices: number[]): number[] {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    return returns;
  }

  /**
   * Berechnet die Volatilität basierend auf historischen Preisdaten
   */
  private static calculateVolatility(prices: number[], timeframe: "daily" | "weekly" | "monthly"): number {
    if (prices.length < 2) return 0;
    
    const returns = this.calculateReturns(prices);
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    
    const squaredDiffs = returns.map(ret => Math.pow(ret - meanReturn, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);
    
    // Annualisierung je nach Zeitraum
    const annualizationFactor = (timeframe === "daily" ? 252 : timeframe === "weekly" ? 52 : 12);
    return Math.sqrt(variance * annualizationFactor);
  }

  /**
   * Berechnet die Sharpe Ratio
   */
  private static calculateSharpeRatio(prices: number[], timeframe: "daily" | "weekly" | "monthly"): number {
    if (prices.length < 2) return 0;
    
    const returns = this.calculateReturns(prices);
    const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = this.calculateVolatility(prices, timeframe);  // Übergabe von timeframe hier
    const factor = timeframe === "daily"   ? 252
                : timeframe === "weekly"  ? 52
                :                             12;
    
    return (meanReturn * factor - this.RISK_FREE_RATE) / volatility;
  }

  /**
   * Berechnet den maximalen Drawdown
   */
  private static calculateMaxDrawdown(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    let maxDrawdown = 0;
    let peak = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > peak) {
        peak = prices[i];
      }
      const drawdown = (peak - prices[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }

  /**
   * Berechnet den Value at Risk (95%)
   */
  private static calculateValueAtRisk(prices: number[], quantity: number): number {
    if (prices.length < 2) return 0;
    
    const returns = this.calculateReturns(prices);
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const varIndex = Math.floor(0.05 * sortedReturns.length);
    const varReturn = sortedReturns[varIndex];
    
    return Math.abs(varReturn * prices[prices.length - 1] * quantity);
  }

  /**
   * Berechnet Beta gegenüber einem Benchmark
   */
  private static calculateBeta(assetPrices: number[], benchmarkPrices: number[]): number {
    if (assetPrices.length < 2 || benchmarkPrices.length < 2) return 1;
    
    const assetReturns = this.calculateReturns(assetPrices);
    const benchmarkReturns = this.calculateReturns(benchmarkPrices);
    
    const covariance = this.calculateCovariance(assetReturns, benchmarkReturns);
    const benchmarkVariance = this.calculateVariance(benchmarkReturns);
    
    return covariance / benchmarkVariance;
  }

  /**
   * Berechnet die Kovarianz zwischen zwei Rendite-Reihen
   */
  private static calculateCovariance(returns1: number[], returns2: number[]): number {
    if (returns1.length !== returns2.length || returns1.length < 2) return 0;
    
    const mean1 = returns1.reduce((sum, ret) => sum + ret, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, ret) => sum + ret, 0) / returns2.length;
    
    const sum = returns1.reduce((acc, ret1, i) => {
      const ret2 = returns2[i];
      return acc + (ret1 - mean1) * (ret2 - mean2);
    }, 0);
    
    return sum / (returns1.length - 1);
  }

  /**
   * Berechnet die Varianz einer Rendite-Reihe
   */
  private static calculateVariance(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);
  }

  /**
   * Berechnet alle Risikometriken für ein einzelnes Asset
   */
  static calculateAssetMetrics(
    asset: Asset,
    historicalPrices: number[],
    benchmarkPrices?: number[],
    quantity: number = 1,
    timeframe: "daily" | "weekly" | "monthly" = "daily"  // timeframe hier als Argument
  ): RiskMetrics {
    const volatility = this.calculateVolatility(historicalPrices, timeframe);  // Übergabe von timeframe
    const sharpeRatio = this.calculateSharpeRatio(historicalPrices, timeframe);  // Übergabe von timeframe
    const maxDrawdown = this.calculateMaxDrawdown(historicalPrices);
    const valueAtRisk = this.calculateValueAtRisk(historicalPrices, quantity);
    
    const metrics: RiskMetrics = {
      totalValue: asset.price * quantity,
      volatility,
      sharpe: sharpeRatio,
      maxDrawdown,
      valueAtRisk
    };
  
    // Beta nur berechnen, wenn Benchmark-Daten verfügbar
    if (benchmarkPrices && benchmarkPrices.length > 0) {
      metrics.beta = this.calculateBeta(historicalPrices, benchmarkPrices);
    }
  
    return metrics;
  }

}
