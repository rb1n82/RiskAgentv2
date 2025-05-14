import { Activity } from "lucide-react";
import StatsCard from "./StatsCard";
import { useState, useEffect } from "react";

interface VolatilityIndexCardProps {
  animationDelay?: string;
  timeframe: "daily" | "weekly" | "monthly";
}

async function calculateVIX(windowSize =30) {
  const API = import.meta.env.VITE_API_URL;
  if (!API) throw new Error('VITE_API_URL ist nicht gesetzt');
  const response = await fetch(`${API}/data/timeseries/SPY.json`, { cache: "no-cache" });
  const data = await response.json();

  // Adjusted Close-Preise extrahieren
  const closes = data.map(item => item.adj);

  // Nur die letzten (windowSize + 1) Kurse nehmen
  const recent = closes.slice(-windowSize - 1);

  // Log-Renditen der letzten windowSize Tage
  const logReturns = [];
  for (let i = 1; i < recent.length; i++) {
    logReturns.push(Math.log(recent[i] / recent[i - 1]));
  }

  // Sample-Standardabweichung der Renditen
  const mean = logReturns.reduce((sum, x) => sum + x, 0) / logReturns.length;
  const variance = logReturns
    .reduce((sum, x) => sum + (x - mean) ** 2, 0)
    / (logReturns.length - 1);
  const dailyVol = Math.sqrt(variance);

  // Annualisieren und in Prozent umrechnen
  const annualizedVol = dailyVol * Math.sqrt(252);
  return annualizedVol * 100;  // z. B. 16.2  → 16.2 %
}

export default function VolatilityIndexCard({ animationDelay, timeframe }: VolatilityIndexCardProps) {
  

  const [vix, setVix] = useState(null);

  useEffect(() => {
    const fetchVix = async () => {
      const vixValue = await calculateVIX();
      setVix(vixValue);
    };

    fetchVix();
  }, []);

  return (
    <StatsCard 
      title="Volatility Index" 
      value={vix ? vix.toFixed(2) : "Loading..."} // Zeige den berechneten VIX-Wert
      change={null}
      timeframe={timeframe}
      icon={<Activity size={20} className="text-chart-red" />}
      colorClass="from-red-500/20 to-red-600/5"
      animationDelay={animationDelay}
    />
  );
}
