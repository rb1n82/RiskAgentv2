import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskMetrics } from "@/lib/types";
import { AlertCircle, AlertTriangle } from "lucide-react";

interface AssetRiskMetricsProps {
  riskMetrics: RiskMetrics;
  timeframe: "daily" | "weekly" | "monthly";
}

export default function AssetRiskMetrics({ riskMetrics, timeframe }: AssetRiskMetricsProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 gradient-border">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={16} className="text-primary" />
        <h3 className="font-medium">Risk Metrics</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Gesamtwert */}
        
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Asset Value</div>
          <div className="text-lg font-medium">
              ${riskMetrics.totalValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </div>
        </div>

        {/* Volatilität */}
        
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Volatility</div>
          <div className="text-lg font-medium">
          {(riskMetrics.volatility * 100).toFixed(2)}%
          </div>
        </div>

        {/* Sharpe Ratio */}
        
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Sharpe Ratio</div>
          <div className="text-lg font-medium">
          {riskMetrics.sharpe.toFixed(2)}
          </div>
        </div>

        {/* Max Drawdown */}
        
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Max Drawdown</div>
          <div className="text-lg font-medium">
          {(riskMetrics.maxDrawdown * 100).toFixed(2)}%
          </div>
        </div>

        {/* Beta */}
        
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Beta</div>
          <div className="text-lg font-medium">
          {riskMetrics.beta !== undefined ? riskMetrics.beta.toFixed(2) : "–"}
          </div>
        </div>

        {/* Value at Risk */}
        
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="text-xs text-muted-foreground mb-1">Value at Risk (95%)</div>
          <div className="text-lg font-medium">
          ${riskMetrics.valueAtRisk?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "0.00"}
          </div>
        </div>
      </div>
    </div>
  );
}
