import fs from 'fs/promises';
import path from 'path';
import {
  computeReturns,
  portfolioReturns,
  annualizedVol,
  annualizedReturn,
  sharpe,
  maxDrawdown,
  beta
} from '../../utils/metrics';
import { mockPortfolios } from '../../lib/mockData';

interface Bar { date: string; adj: number; vol: number; }

async function loadSeries(sym: string): Promise<Bar[]> {
  const p = path.resolve('data', 'timeseries', `${sym}.json`);
  try {
    return JSON.parse(await fs.readFile(p, 'utf-8'));
  } catch {
    return [];
  }
}

async function computePortfolioMetrics() {
  const benchBars = await loadSeries('SWDA'); // z.B. MSCI World ETF als Benchmark
  const benchPrices = benchBars.map(b => b.adj);
  const benchR = computeReturns(benchPrices);

  const results = [];

  for (const port of mockPortfolios) {
    // 1) Lade alle Asset-Bars
    const seriesMap: Record<string, Bar[]> = {};
    for (const { assetId } of port.assets) {
      seriesMap[assetId] = await loadSeries(assetId);
    }

    // 2) Preise → Returns
    const returnsMap: Record<string, number[]> = {};
    for (const [sym, bars] of Object.entries(seriesMap)) {
      returnsMap[sym] = computeReturns(bars.map(b => b.adj));
    }

    // 3) Gewichte berechnen (Quantity × letzter Preis, normiert)
    const marketValues = port.assets.map(a => {
      const bars = seriesMap[a.assetId];
      const lastPrice = bars.at(-1)?.adj ?? 0;
      return a.quantity * lastPrice;
    });
    const totalMV = marketValues.reduce((a, b) => a + b, 0);
    const weights: Record<string, number> = {};
    port.assets.forEach((a, i) => {
      weights[a.assetId] = marketValues[i] / totalMV;
    });

    // 4) Portfolio-Returns & Kennzahlen
    const portR = portfolioReturns(returnsMap, weights);
    const vol   = annualizedVol(portR);
    const ret   = annualizedReturn(portR);
    const sr    = sharpe(portR);
    const mdd   = maxDrawdown(portR);
    const b     = beta(portR, benchR);

    results.push({
      portfolioId: port.id,
      volatility:    vol,
      annualReturn:  ret,
      sharpe:        sr,
      maxDrawdown:   mdd,
      beta:          b
    });
  }

  return results;
}
