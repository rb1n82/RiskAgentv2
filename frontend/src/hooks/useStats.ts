import { useState, useEffect } from 'react';
import { Timeframe } from '@/services/cryptoService';

interface Stats {
  marketCap: number;
  totalValueLocked: number;
  tradingVolume: number;
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
  tvlChange: number;
  volumeChange: number;
}

interface TVLData {
  current: number;
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
}

export function useStats(timeframe: Timeframe = "daily") {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    marketCap: 0,
    totalValueLocked: 0,
    tradingVolume: 0,
    dailyChange: 0,
    weeklyChange: 0,
    monthlyChange: 0,
    tvlChange: 0,
    volumeChange: 0
  });
  
  const [tvlData, setTvlData] = useState<TVLData>({
    current: 0,
    dailyChange: 0,
    weeklyChange: 0,
    monthlyChange: 0
  });
  
  const [fearGreed, setFearGreed] = useState(0);
  
  const [trending] = useState([
    {
      id: "bitcoin",
      name: "Bitcoin",
      symbol: "BTC",
      category: "Currency",
      change: 0
    },
    {
      id: "ethereum",
      name: "Ethereum",
      symbol: "ETH",
      category: "Smart Contract Platform",
      change: 0
    },
    {
      id: "solana",
      name: "Solana",
      symbol: "SOL",
      category: "Smart Contract Platform",
      change: 0
    },
    {
      id: "cardano",
      name: "Cardano",
      symbol: "ADA",
      category: "Smart Contract Platform",
      change: 0
    },
    {
      id: "polkadot",
      name: "Polkadot",
      symbol: "DOT",
      category: "Interoperability",
      change: 0
    },
    {
      id: "chainlink",
      name: "Chainlink",
      symbol: "LINK",
      category: "Oracle",
      change: 0
    }
  ]);
  
  const [recentProjects] = useState([]);
  
  useEffect(() => {
    // Simuliere API-Laden
    setTimeout(() => {
      setStats({
        marketCap: 2890000000000,
        totalValueLocked: 180000000000,
        tradingVolume: 98000000000,
        dailyChange: 2.4,
        weeklyChange: -1.2,
        monthlyChange: 5.8,
        tvlChange: timeframe === "daily" ? 10.2 : timeframe === "weekly" ? -3.5 : 15.7,
        volumeChange: timeframe === "daily" ? -2.8 : timeframe === "weekly" ? 5.4 : 12.3
      });
      
      setTvlData({
        current: 65,
        dailyChange: 2.8,
        weeklyChange: -1.2,
        monthlyChange: 8.5
      });
      
      setFearGreed(72);
      setLoading(false);
    }, 1000);
  }, [timeframe]);
  
  // Wähle die entsprechende Änderung basierend auf dem Zeitraum
  const getChangeForTimeframe = (data: Stats) => {
    switch (timeframe) {
      case "daily":
        return data.dailyChange;
      case "weekly":
        return data.weeklyChange;
      case "monthly":
        return data.monthlyChange;
      default:
        return data.dailyChange;
    }
  };
  
  return {
    loading,
    stats: {
      ...stats,
      dailyChange: getChangeForTimeframe(stats)
    },
    tvlData: {
      ...tvlData,
      dailyChange: timeframe === "daily" ? tvlData.dailyChange :
                   timeframe === "weekly" ? tvlData.weeklyChange : tvlData.monthlyChange
    },
    fearGreed,
    trending,
    recentProjects
  };
} 