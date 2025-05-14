import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import TrendingSection from './TrendingSection';

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

const API_BASE_URL = import.meta.env.VITE_API_URL; // Basis-URL für die API

export default function StockDashboard() {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lade alle Marktdaten in einem einzigen Aufruf
    fetch(`${API_BASE_URL}/api/market-data`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const allData: Record<string, MarketData> = {};
        data.forEach((asset: MarketData) => {
          allData[asset.symbol] = asset;
        });
        setMarketData(allData);
        setLoading(false);
      })
      .catch(error => {
        console.error('Fehler beim Laden der Marktdaten:', error);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p>Lade Marktdaten...</p>
        </div>
      </div>
    );
  }

  // Gruppiere Assets nach Typ
  const stocks = Object.values(marketData).filter(a => a.type === 'stock');
  const etfs = Object.values(marketData).filter(a => a.type === 'etf');
  const cryptos = Object.values(marketData).filter(a => a.type === 'crypto');

  const renderAssetCard = (asset: MarketData) => {
    // Platzhalter statt Berechnung
    const dayChange = `P${asset.symbol}`;
    const weekChange = `P${asset.symbol}`;
    const monthChange = `P${asset.symbol}`;
    const isPositive = true;

    return (
      <Card key={asset.symbol} className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{asset.symbol.toUpperCase()}</h3>
            <p className="text-sm text-gray-500">{asset.type}</p>
          </div>
          <div className={`text-right text-green-500`}>
            <p className="font-semibold">P{asset.currentPrice}</p>
            <p className="text-sm">P{dayChange}</p>
          </div>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-gray-500">7D</p>
            <p className="text-green-500">P{weekChange}</p>
          </div>
          <div>
            <p className="text-gray-500">30D</p>
            <p className="text-green-500">P{monthChange}</p>
          </div>
          <div>
            <p className="text-gray-500">Vol</p>
            <p>P{asset.volume}</p>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      <TrendingSection />
      
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">Aktien</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stocks.map(renderAssetCard)}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">ETFs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {etfs.map(renderAssetCard)}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Kryptowährungen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cryptos.map(renderAssetCard)}
          </div>
        </div>
      </div>
    </div>
  );
} 
