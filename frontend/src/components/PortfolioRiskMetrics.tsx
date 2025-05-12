// src/components/PortfolioRiskMetrics.tsx
import { useState, useEffect } from "react";
import { RiskMetrics } from "@/lib/types";
import { AlertCircle } from "lucide-react";
import { computePortfolioMetrics } from "@/services/portfolioMetricService";
import { Bar } from "@/utils/metrics";  // Importiere die Funktion Bar

interface PortfolioRiskMetricsProps {
  riskMetrics: RiskMetrics | null;
  title?: string;
  timeframe?: "daily" | "weekly" | "monthly";
  barsMap: Record<string, Bar[]>;  // Füge barsMap als Prop hinzu
  portfolio: { assets: { assetId: string; quantity: number }[] }; // Portfolio als Prop
}

export default function PortfolioRiskMetrics({ 
  riskMetrics,
  title = "Risk Metrics",
  timeframe = "daily",
  barsMap,  
  portfolio  // Portfolio als Prop
}: PortfolioRiskMetricsProps) {
  const [calculatedMetrics, setCalculatedMetrics] = useState<RiskMetrics | null>(null);

  useEffect(() => {
    console.log("useEffect ausgeführt");
    console.log("Portfolio:", portfolio);
    console.log("BarsMap:", barsMap);

    async function fetchRiskMetrics() {
      console.log("useEffect ausgeführt");
      console.log("Portfolio:", portfolio);
      console.log("BarsMap:", barsMap);

      try {
        const metrics = await computePortfolioMetrics(portfolio, barsMap, timeframe);  // Berechnungen mit timeframe
        console.log("Berechnete Risiko-Kennzahlen:", metrics);
        setCalculatedMetrics(metrics);  // Setze die berechneten Metriken
      } catch (error) {
        console.error("Fehler bei der Berechnung der Risiko-Kennzahlen:", error);
      }
    }

    if (portfolio && barsMap) {
      fetchRiskMetrics();
    }
  }, [portfolio, barsMap, timeframe]);  // Achte darauf, dass 'timeframe' als Abhängigkeit mit aufgenommen wird!

  if (!calculatedMetrics) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 gradient-border">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={16} className="text-primary" />
          <h3 className="font-medium">{title}</h3>
        </div>
        <div className="h-28 flex items-center justify-center">
          <p className="text-muted-foreground">Calculating risk data, please wait...</p>
        </div>
      </div>
    );
  }

  // Formatierungsfunktionen
  const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;
  const fmtNumber = (n: number) =>
    n.toLocaleString("de-DE", { style: "currency", currency: "USD" });

  return (
    <div className="rounded-lg border border-border bg-card p-5 gradient-border">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={16} className="text-primary" />
        <h3 className="font-medium">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Gesamtwert */}
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Portfolio Value</div>
          <div className="text-lg font-medium">{fmtNumber(calculatedMetrics.totalValue)}</div>
        </div>

        {/* YTD-Rendite */}
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">YTD Return</div>
          <div className="text-lg font-medium">
            {fmtPct(calculatedMetrics.ytdReturn)}
          </div>
        </div>

        {/* Volatilität */}
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Volatility ({timeframe})</div>
          <div className="text-lg font-medium">
            {fmtPct(calculatedMetrics.volatility)}
          </div>
        </div>

        {/* Sharpe */}
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Sharpe Ratio</div>
          <div className="text-lg font-medium">
            {calculatedMetrics.sharpe.toFixed(2)}
          </div>
        </div>

        {/* Max Drawdown */}
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Max Drawdown</div>
          <div className="text-lg font-medium text-red-500">
            {fmtPct(calculatedMetrics.maxDrawdown)}
          </div>
        </div>

        {/* Beta */}
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Beta</div>
          <div className="text-lg font-medium">
            {calculatedMetrics.beta !== undefined ? calculatedMetrics.beta.toFixed(2) : "–"}
          </div>
        </div>
      </div>
    </div>
  );
}
