
import { Bitcoin, DollarSign, BarChart, LineChart } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import GaugeChart from "@/components/GaugeChart";
import TrendingSection from "@/components/TrendingSection";
import VolatilityIndexCard from "@/components/VolatilityIndexCard";
import SPYChart from "@/components/SPYChart";
import { MarketDataEntry } from "@/lib/types";
import { useState, useEffect } from "react";

async function loadMarketData(): Promise<MarketDataEntry> {
  const res = await fetch(`/data/market_data.json`, { cache: 'no-cache' });
  if (!res.ok) {
    throw new Error(`Fehler beim Laden: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export default function Dashboard() {
  const [timeframe, setTimeframe] = useState<"daily"|"weekly"|"monthly">("daily");
  const [marketData, setMarketData] = useState<MarketDataEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) Daten beim Mount laden
  useEffect(() => {
    loadMarketData()
      .then(data => {
        setMarketData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // 2) Loading / Error / No-Data abfangen
  if (loading) return <div>Lade Marktdaten…</div>;
  if (error)   return <div className="text-red-500">Fehler: {error}</div>;
  if (!marketData) return <div>Keine Marktdaten verfügbar</div>;
  
  // SPY (S&P 500) und BTC aus den JSON-Daten
  const spy: MarketDataEntry = marketData!['SPY'];
const btc: MarketDataEntry = marketData!['bitcoin'];

  // Tages-Change in Prozent berechnen
  const calcChange = (current: number, previous: number) =>
    ((current - previous) / previous * 100);

  const stats = {
    spyPrice: spy.currentPrice,
    spyChange: Number(calcChange(spy.currentPrice, spy.oneDayAgoPrice).toFixed(2)),
    btcPrice: btc.currentPrice,
    btcChange: Number(calcChange(btc.currentPrice, btc.oneDayAgoPrice).toFixed(2)),
    tradingVolume: spy.volume,        // evtl. optional
    volumeChange: calcChange(spy.volume, spy.volume), // placeholder
  };

  // Formatieren von Preisen
  const formatCurrency = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value/1_000_000_000).toFixed(2)}B`;
    if (value >= 1_000_000)     return `$${(value/1_000_000).toFixed(2)}M`;
    if (value >= 1_000)         return `$${(value/1_000).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      {/* Zeitrahmen-Umschalter */}
      

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* SPY */}
        <StatsCard
          title="S&P 500 (SPY)"
          value={formatCurrency(stats.spyPrice)}
          change={stats.spyChange}
          timeframe={timeframe}
          icon={<BarChart size={20} className="text-chart-blue" />}
          colorClass="from-blue-500/20 to-blue-600/5"
          animationDelay="0ms"
        />

        {/* VIX */}
        <VolatilityIndexCard
          animationDelay="50ms"
          timeframe={timeframe}
        />

        {/* BTC */}
        <StatsCard
          title="Bitcoin"
          value={formatCurrency(stats.btcPrice)}
          change={stats.btcChange}
          timeframe={timeframe}
          icon={<Bitcoin size={20} className="text-chart-green" />}
          colorClass="from-green-500/20 to-green-600/5"
          animationDelay="100ms"
        />

        {/* 24h Trading Volume (optional) */}
        <StatsCard
          title="24h Volume (Placeholder)"
          value={formatCurrency(stats.tradingVolume)}
          change={stats.volumeChange}
          timeframe={timeframe}
          icon={<LineChart size={20} className="text-chart-purple" />}
          colorClass="from-purple-500/20 to-purple-600/5"
          animationDelay="150ms"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 md:gap-6">
      
        <SPYChart 
          timeframe={timeframe}
          animationDelay="0ms"
        />
      
      
        <GaugeChart 
          value={100 /* Beispielwert */}
          dailyChange={NaN}
          weeklyChange={NaN}
          monthlyChange={NaN}
          timeframe={timeframe}
        />
      
      </div>

      <TrendingSection />
    </div>
  );
}
