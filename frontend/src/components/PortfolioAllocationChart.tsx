import { useEffect, useState, useMemo } from "react";
import { Portfolio } from "@/lib/types";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PortfolioAllocationChartProps {
  portfolio: Portfolio;
}

type MarketDataType = Record<string, {
  currentPrice: number;
}>;

// Asynchronously load the market_data.json at runtime
async function loadMarketData(): Promise<MarketDataType> {
  const API = import.meta.env.VITE_API_URL;
  if (!API) throw new Error('VITE_API_URL ist nicht gesetzt');

  // Hier rufst du die Express-Route /api/market-data auf
  const url = `${API}/data/market_data.json`;
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Failed to load market data: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export default function PortfolioAllocationChart({ portfolio }: PortfolioAllocationChartProps) {
  const [marketData, setMarketData] = useState<MarketDataType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load market data once on mount
  useEffect(() => {
    loadMarketData()
      .then(data => setMarketData(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Compute allocation when marketData or portfolio change
  const allocation = useMemo(() => {
    if (!marketData) return [];

    const entries = portfolio.assets.filter(a => a.quantity > 0);
    const totalValue = entries.reduce((sum, a) => {
      const price = marketData[a.assetId]?.currentPrice ?? 0;
      return sum + price * a.quantity;
    }, 0);

    const colorPalette = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A28FD0'];

    return entries.map((a, idx) => {
      const price = marketData[a.assetId]?.currentPrice ?? 0;
      const value = price * a.quantity;
      const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;

      return {
        symbol: a.assetId.toUpperCase(),
        value,
        color: colorPalette[idx % colorPalette.length],
        percentage: percentage.toFixed(2),
      };
    });
  }, [marketData, portfolio.assets]);

  return (
    <div className="rounded-lg border border-border bg-card p-5 gradient-border h-[320px] animate-scale-in" style={{ animationDelay: "0ms" }}>
      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-medium">Asset Allocation</h3>
      </div>
      <div className="flex h-[250px] w-full items-center justify-center">
        {loading ? (
          <div className="text-muted-foreground">Lade Daten...</div>
        ) : error ? (
          <div className="text-red-500">Fehler: {error}</div>
        ) : allocation.length === 0 ? (
          <div className="text-muted-foreground">No assets to display</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocation}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius="55%"
                outerRadius="80%"
                dataKey="value"
                nameKey="symbol"
                paddingAngle={2}
              >
                {allocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  value.toLocaleString('de-DE', { style: 'currency', currency: 'USD' }),
                  name
                ]}
                contentStyle={{ backgroundColor: 'rgba(22, 26, 33, 0.9)', borderColor: '#444', borderRadius: 8 }}
              />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
                formatter={(value: string, entry: any, index: number) => {
                  const item = allocation[index];
                  return `${value} (${item.percentage}%)`;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
