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
  timeframe: "daily" | "weekly" | "monthly" = "daily"
): Promise<RiskMetrics> {

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const returnsMap: Record<string, number[]> = {};
  const weights: Record<string, number> = {};
  let totalValue = 0;
  let ytdValue = 0;

  for (const { assetId, quantity } of portfolio.assets) {
    /** ------------------------------------------------------
     * 1) Schlüssel angleichen  (z. B. "BTC"  → "btc")
     * ----------------------------------------------------- */
    const key = assetId.toLowerCase?.() ?? assetId;
    const raw = Array.isArray(barsMap[key]) ? barsMap[key] : [];

    if (!raw.length) {
      console.error(`❌  barsMap[${key}] ist leer oder undefined`);
      continue;                          // oder throw, je nach Logik
    }

    const bars = pickLastBarPerDay(raw); // <- hier crasht es sonst
    if (bars.length < 2) continue;

    const lastPrice = bars.at(-1)!.adj;
    totalValue += lastPrice * quantity;

    const barYTD = bars.find(b => new Date(b.date) >= startOfYear) ?? bars[0];
    ytdValue += barYTD.adj * quantity;

    const prices = bars.map(b => b.adj);
    returnsMap[key] = computeReturns(prices);
    weights[key]   = lastPrice * quantity;
  }

  // Normalisiere die Gewichte
  for (const k in weights) weights[k] /= totalValue;

  const portfolioR = portfolioReturns(returnsMap, weights);

  const simulatedPrices: number[] = portfolioR.reduce<number[]>((acc, r, i) => {
    if (i === 0) {
      // erster Preis = totalValue × (1 + erster Return)
      acc.push(totalValue * (1 + r));
    } else {
      acc.push(acc[i - 1] * (1 + r));
    }
    return acc;
  }, []);

  const dummyAsset: Asset = {
    id:             "__portfolio__",
    name:           "Portfolio",
    symbol:         "PORT",
    price:          totalValue,
    priceChange24h: 0,
    quantity:       1,
    volatility:     0,
    historicalData: []
  };
  // Berechnung der Kennzahlen
  const metrics = AssetMetricService.calculateAssetMetrics(
    dummyAsset,
    simulatedPrices,
    undefined,
    1,
    timeframe
  );

  // Beta gegen Benchmark (z.B. SPY)
  const benchR = computeReturns(barsMap["SPY"].map(b => b.adj)); // Beispiel für SPY
  const b = beta(portfolioR, benchR);

  return {
    totalValue,
    ytdReturn:  totalValue / ytdValue - 1,
    volatility: metrics.volatility,
    sharpe:     metrics.sharpe,
    maxDrawdown:metrics.maxDrawdown,
    beta: b
    
  };
}
