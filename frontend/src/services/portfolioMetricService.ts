// src/services/portfolioMetricsService.ts
import { computeReturns, portfolioReturns, annualizedVol, annualizedReturn, sharpe, maxDrawdown, beta } from "@/utils/metrics";
import type { Bar } from "@/utils/metrics";
import type { RiskMetrics } from "@/lib/types";
import { AssetMetricService } from "@/services/assetMetricService";
import type { Asset } from "@/lib/types";
import { format } from "date-fns";
/**
 * Berechnet alle Risiko-Kennzahlen für ein Portfolio.
 *
 * @param portfolio Das Portfolio mit Assets und deren Mengen.
 * @param barsMap  Ein Record von assetId → Bar[] (Zeitreihe aller Assets).
 * @param timeframe Zeitrahmen ("daily", "weekly", "monthly")
 * @returns RiskMetrics mit totalValue, ytdReturn, volatility, sharpe, maxDrawdown, beta.
 */

function pickLastBarPerDay(bars: Bar[]): Bar[] {
  const lastPerDay = new Map<string, Bar>();
  // sicherstellen, dass die Bars chronologisch sind
  bars
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach(bar => {
      const day = format(new Date(bar.date), "yyyy-MM-dd");
      lastPerDay.set(day, bar);
    });
  return Array.from(lastPerDay.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export async function computePortfolioMetrics(
  portfolio: { assets: { assetId: string; quantity: number }[] },
  barsMap: Record<string, Bar[]>,
  timeframe: "daily"|"weekly"|"monthly" = "daily"
): Promise<RiskMetrics> {

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const returnsMap: Record<string, number[]> = {};
  const weights: Record<string, number> = {};
  let totalValue = 0;
  let ytdValue   = 0;

  // 1) Sammle Preise, YTD und mappe auf returnsMap & weights
  for (const { assetId, quantity } of portfolio.assets) {
    const raw = barsMap[assetId] ?? [];
    const bars = pickLastBarPerDay(raw);
    if (bars.length < 2) continue;

    const lastPrice = bars.at(-1)!.adj;
    totalValue += lastPrice * quantity;

    const barYTD = bars.find(b => new Date(b.date) >= startOfYear) ?? bars[0];
    ytdValue   += barYTD.adj * quantity;

    const prices = bars.map(b => b.adj);
    returnsMap[assetId] = computeReturns(prices);
    weights[assetId]    = lastPrice * quantity;
  }

  // 2) Sichern gegen leeres Portfolio
  const symbols = Object.keys(returnsMap);
  if (symbols.length === 0 || totalValue <= 0) {
    return { totalValue, ytdReturn: 0, volatility: 0, sharpe: 0, maxDrawdown: 0, beta: 0 };
  }

  // 3) Gewichte normalisieren
  for (const s of symbols) {
    weights[s] /= totalValue;
  }

  // 4) Portfolio-Renditen & simulierte Preise
  const portfolioR = portfolioReturns(returnsMap, weights);
  const simulatedPrices = portfolioR.reduce<number[]>((acc, r, i) => {
    acc.push(i === 0 ? totalValue * (1 + r) : acc[i - 1] * (1 + r));
    return acc;
  }, []);

  // 5) Metriken berechnen
  const dummy: Asset = { id: "__port__", name: "Portfolio", symbol: "PORT", price: totalValue, priceChange24h: 0, quantity:1, volatility:0, historicalData: [] };
  const metrics = AssetMetricService.calculateAssetMetrics(dummy, simulatedPrices, undefined, 1);

  // 6) Beta nur bei vorhandenem Benchmark
  let betaValue = 0;
  if ((barsMap["SPY"] ?? []).length >= 2) {
    const benchPrices = barsMap["SPY"].map(b => b.adj);
    betaValue = beta(portfolioR, computeReturns(benchPrices));
  }

  return {
    totalValue,
    ytdReturn:   totalValue / ytdValue - 1,
    volatility:  metrics.volatility,
    sharpe:      metrics.sharpe,
    maxDrawdown: metrics.maxDrawdown,
    beta:        betaValue
  };
}
