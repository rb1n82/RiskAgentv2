// src/components/PortfolioAssetTable.tsx
import { Portfolio } from "@/lib/types";
import { Bar, calculateSingleAssetVaRAbsolute } from "@/utils/metrics";
import { ArrowUpRight, ArrowDownRight, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useMemo } from "react";

type MarketDataType = Record<string, {
  symbol: string;
  type: string;
  currentPrice: number;
  oneDayAgoPrice: number;
  volume: number;
}>;

interface PortfolioAssetTableProps {
  portfolio: Portfolio;
  barsMap: Record<string, Bar[]>;
  onAssetClick?: (assetId: string) => void;
  onNavigate?: (section: string, params?: any) => void;
}

// Lade-Funktion
async function loadMarketData(): Promise<MarketDataType> {
  const res = await fetch("/data/market_data.json", { cache: "no-cache" });
  if (!res.ok) throw new Error(`Failed to load market data: ${res.statusText}`);
  return res.json();
}

export default function PortfolioAssetTable({
  portfolio,
  barsMap,
  onAssetClick,
  onNavigate
}: PortfolioAssetTableProps) {
  const [marketData, setMarketData] = useState<MarketDataType | null>(null);
   // 1) Markt-Daten einmalig laden
   useEffect(() => {
    loadMarketData()
      .then(data => setMarketData(data))
      .catch(err => {
        console.error(err);
        setMarketData({});
      });
  }, []);

  const assetsWithDetails = useMemo(() => {
    if (!marketData) return [];

    return portfolio.assets
      .filter(a => a.quantity > 0)
      .map(a => {
        // key im JSON finden (case-insensitive)
        const dataKey = Object.keys(marketData).find(key =>
          key.toLowerCase() === a.assetId.toLowerCase()
          || marketData[key].symbol.toLowerCase() === a.assetId.toLowerCase()
        );
        if (!dataKey) return null;
      const snapshot = (marketData as Record<string, any>)[dataKey];
    

      const price     = snapshot.currentPrice as number;
      const oneDay    = snapshot.oneDayAgoPrice as number;
      const change24h = ((price - oneDay) / oneDay) * 100;
      const quantity  = a.quantity;
      const value     = price * quantity;

      const bars      = barsMap[a.assetId] || [];
      const valueAtRisk = calculateSingleAssetVaRAbsolute(bars, quantity);

      return {
        symbol:       snapshot.symbol as string,
        name:         snapshot.symbol as string,
        type:         snapshot.type as string,
        price,
        change24h,
        quantity,
        value,
        valueAtRisk
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [portfolio.assets, barsMap, marketData]);

  const totalValue = assetsWithDetails.reduce((sum, d) => sum + d.value, 0);
  const rows = assetsWithDetails.map(d => ({
    ...d,
    percentOfPortfolio: totalValue > 0 ? (d.value / totalValue) * 100 : 0,
  }));

  if (marketData === null) {
    return <div>Lade Portfolio-Daten…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-2">No assets in this portfolio</p>
        <Button size="sm" className="flex items-center gap-1">
          <Plus size={14} />
          Add your first asset
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 gradient-border animate-scale-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <List size={16} className="text-primary" />
          <h3 className="font-medium">Portfolio Assets</h3>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Asset</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Price</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">24h Change</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Quantity</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Value</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">% of Portfolio</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Risk (VaR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(row => (
              <tr
                key={row.symbol}
                className="hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => {
                  onAssetClick?.(row.symbol);
                  onNavigate?.('asset-detail', { 
                    portfolioId: portfolio.id,
                    assetId: row.symbol 
                  });
                }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                      {row.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-muted-foreground">{row.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {row.price.toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}
                </td>
                <td className="px-4 py-3 text-right font-medium">
  <div className={`inline-flex items-center justify-end ${row.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
    {row.change24h >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
    <span className="ml-1">{row.change24h.toFixed(2)}%</span>
  </div>
</td>
                <td className="px-4 py-3 text-right font-medium">{row.quantity}</td>
                <td className="px-4 py-3 text-right font-medium">
                  {row.value.toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}
                </td>
                <td className="px-4 py-3 text-right font-medium">
                  {row.percentOfPortfolio.toFixed(2)}%
                  <div className="w-full h-1.5 bg-secondary mt-1 rounded-full">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${row.percentOfPortfolio}%` }} />
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-medium text-amber-500">
                  {row.valueAtRisk.toLocaleString('de-DE', { style: 'currency', currency: 'USD' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
