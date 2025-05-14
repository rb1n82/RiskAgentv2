// src/utils/metrics.ts

// 1) Basis-Funktionen
export function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function std(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(
    xs.reduce((acc, x) => acc + (x - m) ** 2, 0) / (xs.length - 1)
  );
}

// 2) Returns aus Preisen
export function computeReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push(prices[i] / prices[i - 1] - 1);
  }
  return returns;
}

// 3) Portfolio-Return (gewichtet)
export function portfolioReturns(
  returnsMap: Record<string, number[]>,
  weights: Record<string, number>
): number[] {
  const n = Math.min(
    ...Object.values(returnsMap).map(r => r.length)
  );
  const port: number[] = [];
  for (let t = 0; t < n; t++) {
    let sum = 0;
    for (const sym in returnsMap) {
      sum += (weights[sym] ?? 0) * returnsMap[sym][t];
    }
    port.push(sum);
  }
  return port;
}

// 4) Annualisierte Kennzahlen
export function annualizedVol(
  returns: number[], 
  tradingDays = 252, 
  timeframe: "daily" | "weekly" | "monthly" = "daily"
): number {
  let adjustedReturns = returns;
  
  // Anpassung je nach Zeitraum
  if (timeframe === "weekly") {
    adjustedReturns = returns.filter((_, index) => index % 5 === 0);  // Annahme: 5 Handelstage pro Woche
  } else if (timeframe === "monthly") {
    adjustedReturns = returns.filter((_, index) => index % 20 === 0); // Annahme: 20 Handelstage pro Monat
  }

  const vol = std(adjustedReturns);
  return vol * Math.sqrt(tradingDays);  // Annualisierte Volatilität
}

export function annualizedReturn(
  returns: number[],
  tradingDays = 252
): number {
  return mean(returns) * tradingDays;
}

// 5) Sharpe-Ratio
export function sharpe(
  returns: number[],
  rfAnnual = 0.02,
  tradingDays = 252
): number {
  const mu = annualizedReturn(returns, tradingDays);
  const vol = annualizedVol(returns, tradingDays);
  return (mu - rfAnnual) / vol;
}

// 6) Max Drawdown
export function maxDrawdown(returns: number[]): number {
  let cumulative = 1;
  let peak = 1;
  let maxDD = 0;
  for (const r of returns) {
    cumulative *= 1 + r;
    peak = Math.max(peak, cumulative);
    maxDD = Math.max(maxDD, (peak - cumulative) / peak);
  }
  return maxDD;
}

// 7) Beta vs. Benchmark
export function beta(
  assetReturns: number[],
  benchReturns: number[]
): number {
  const n = Math.min(assetReturns.length, benchReturns.length);
  const a = assetReturns.slice(0, n);
  const b = benchReturns.slice(0, n);
  const mA = mean(a);
  const mB = mean(b);
  let cov = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    cov += (a[i] - mA) * (b[i] - mB);
    varB += (b[i] - mB) ** 2;
  }
  return cov / varB;
}

// --- Typ für einzelne Asset-Zeitreihen ----------------------------
export interface Bar {
  date: string;   // YYYY-MM-DD
  adj: number;    // Adjusted Close
}

// 8) Einzel-Asset Risiko-Kennzahlen (VaR %, CVaR %)
export interface AssetMetrics {
  returns: number[];      // tägliche Returns
  volatility: number;     // annualisierte Volatilität
  sharpe: number;         // Sharpe-Ratio
  maxDrawdown: number;    // maximaler Drawdown
  var95: number;          // 95% VaR (prozentualer Verlust)
  cvar95: number;         // 95% CVaR (prozentualer Verlust)
}

/**
 * Berechnet alle gängigen Kennzahlen für eine Asset-Zeitreihe.
 * @param bars Array von Bars mit adjusted Close
 * @param rfAnnual risikofreier Zinssatz p.a. (Default = 2%)
 */
export function computeAssetMetrics(
  bars: Bar[],
  rfAnnual = 0.02
): AssetMetrics {
  const prices = bars.map(b => b.adj);
  const R = computeReturns(prices);

  const vol = annualizedVol(R);
  const ret = annualizedReturn(R);
  const sr = sharpe(R, rfAnnual);
  const mdd = maxDrawdown(R);

  const sorted = [...R].sort((a, b) => a - b);
  const idx = Math.floor(0.05 * sorted.length);
  const var95 = -sorted[idx] * 100;

  const tail = sorted.slice(0, idx + 1);
  const cvar95 =
    -(tail.reduce((sum, x) => sum + x, 0) / tail.length) * 100;

  return { returns: R, volatility: vol, sharpe: sr, maxDrawdown: mdd, var95, cvar95 };
}

// 9) Nur prozentualen VaR zurückgeben ------------------------------
/**
 * Liefert den 95% VaR in Prozent für eine Asset-Zeitreihe.
 */
export function calculateAssetVaRPercent(
  bars: Bar[],
  rfAnnual = 0.02
): number {
  return computeAssetMetrics(bars, rfAnnual).var95;
}

// 10) Absoluten VaR (Betrag) berechnen ------------------------------
/**
 * Berechnet den absoluten 95% VaR in Währungseinheiten.
 */
export function calculateSingleAssetVaRAbsolute(
  bars: Bar[],
  quantity: number,
  rfAnnual = 0.02
): number {
  if (!bars || bars.length < 2) {
    // Kein oder zu wenig Data Points → VaR = 0 oder NaN, je nachdem
    return 0;
  }
  const varPct = computeAssetMetrics(bars, rfAnnual).var95 / 100;
  const lastPrice = bars.at(-1)!.adj;
  return varPct * lastPrice * quantity;
}
