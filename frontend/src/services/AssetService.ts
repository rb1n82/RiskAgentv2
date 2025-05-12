import { Asset, AssetType, PriceData } from '../types/Asset';
import { DataProviderFactory, DataProviderConfig } from './DataProvider';
import { MetricsService } from './MetricsService';

export class AssetService {
  private providers: Map<AssetType, DataProviderConfig> = new Map();
  private cache: Map<string, { data: Asset; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

  constructor(providerConfigs: Partial<Record<AssetType, DataProviderConfig>> = {}) {
    // Standard-Provider konfigurieren
    this.providers.set('CRYPTO', {}); // CoinGecko benötigt keinen API-Key
    this.providers.set('STOCK', providerConfigs.STOCK || {});
    this.providers.set('ETF', providerConfigs.ETF || {});
  }

  /**
   * Konfiguriert einen Provider für einen bestimmten Asset-Typ
   */
  configureProvider(type: AssetType, config: DataProviderConfig): void {
    this.providers.set(type, config);
  }

  /**
   * Lädt ein Asset mit allen aktuellen Daten
   */
  async getAsset(symbol: string, type: AssetType): Promise<Asset> {
    const cacheKey = `${type}:${symbol}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const provider = DataProviderFactory.createProvider(type, this.providers.get(type));
    
    // Basis-Asset-Daten laden
    const assets = await provider.searchAssets(symbol);
    if (assets.length === 0) {
      throw new Error(`Asset nicht gefunden: ${symbol}`);
    }
    
    const asset = assets[0];
    
    // Aktuelle Preisdaten laden
    const currentPrice = await provider.getAssetPrice(symbol);
    asset.currentPrice = currentPrice;
    
    // Historische Daten für verschiedene Zeiträume laden
    const historicalPrices = await provider.getHistoricalPrices(symbol, 365); // 1 Jahr
    
    // Risikometriken berechnen
    asset.riskMetrics = MetricsService.calculateRiskMetrics(asset, historicalPrices);
    
    // Performance berechnen
    asset.performance = this.calculatePerformance(historicalPrices);
    
    // In Cache speichern
    this.cache.set(cacheKey, {
      data: asset,
      timestamp: Date.now()
    });
    
    return asset;
  }

  /**
   * Lädt mehrere Assets gleichzeitig
   */
  async getAssets(assets: Array<{ symbol: string; type: AssetType }>): Promise<Asset[]> {
    return Promise.all(
      assets.map(({ symbol, type }) => this.getAsset(symbol, type))
    );
  }

  /**
   * Berechnet die Performance für verschiedene Zeiträume
   */
  private calculatePerformance(prices: PriceData[]): Asset['performance'] {
    if (prices.length < 2) {
      return {
        daily: 0,
        weekly: 0,
        monthly: 0,
        yearly: 0,
        ytd: 0
      };
    }

    const current = prices[prices.length - 1].price;
    const yesterday = this.findPriceAtDaysAgo(prices, 1);
    const weekAgo = this.findPriceAtDaysAgo(prices, 7);
    const monthAgo = this.findPriceAtDaysAgo(prices, 30);
    const yearAgo = this.findPriceAtDaysAgo(prices, 365);
    const yearStart = this.findPriceAtDate(prices, new Date(new Date().getFullYear(), 0, 1));

    return {
      daily: this.calculateReturn(current, yesterday),
      weekly: this.calculateReturn(current, weekAgo),
      monthly: this.calculateReturn(current, monthAgo),
      yearly: this.calculateReturn(current, yearAgo),
      ytd: this.calculateReturn(current, yearStart)
    };
  }

  private findPriceAtDaysAgo(prices: PriceData[], days: number): number {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    return this.findPriceAtDate(prices, targetDate);
  }

  private findPriceAtDate(prices: PriceData[], date: Date): number {
    const timestamp = date.getTime();
    let closest = prices[0];
    
    for (const price of prices) {
      if (Math.abs(price.timestamp.getTime() - timestamp) < 
          Math.abs(closest.timestamp.getTime() - timestamp)) {
        closest = price;
      }
    }
    
    return closest.price;
  }

  private calculateReturn(current: number, previous: number): number {
    return ((current - previous) / previous) * 100;
  }
} 