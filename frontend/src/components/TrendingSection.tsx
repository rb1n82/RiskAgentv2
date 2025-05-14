import { useEffect, useState } from 'react';
import { Card } from './ui/card';

interface MarketData {
  symbol: string;
  type: 'stock' | 'etf' | 'crypto';
  currentPrice: number;
  oneDayAgoPrice: number;
  sevenDayAgoPrice: number;
  thirtyDayAgoPrice: number;
  ninetyDayAgoPrice: number;
  volume: number;
  lastUpdated: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

export default function TrendingSection() {
  const [trendingAssets, setTrendingAssets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/market-data`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Sortiere nach 24h-Volumen und nehme die Top 5
        const sorted = data.sort((a: MarketData, b: MarketData) => b.volume - a.volume);
        setTrendingAssets(sorted.slice(0, 5));
        setLoading(false);
      })
      .catch(error => {
        console.error('Fehler beim Laden der Marktdaten:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-sm">Lade Trending Assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Trending Assets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {trendingAssets.map(asset => {
          const dayChange = ((asset.currentPrice - asset.oneDayAgoPrice) / asset.oneDayAgoPrice) * 100;
          const isPositive = dayChange >= 0;

          return (
            <Card key={asset.symbol} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{asset.symbol.toUpperCase()}</h3>
                  <p className="text-sm text-gray-500">{asset.type}</p>
                </div>
                <div className={`text-right ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  <p className="font-semibold">${asset.currentPrice.toLocaleString()}</p>
                  <p className="text-sm">{isPositive ? '+' : ''}{dayChange.toFixed(2)}%</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
