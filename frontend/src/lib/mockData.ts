import { Asset, Portfolio } from './types';

export const mockPortfolios: Portfolio[] = [
  {
    id: "portfolio-1",
    name: "Conservative Portfolio",
    description: "Low-risk portfolio focused on established cryptocurrencies",
    assets: [
      { assetId: "bitcoin", quantity: 2.5 },
      { assetId: "ethereum", quantity: 25 }
    ],
    createdAt: "2023-01-15T12:00:00Z",
    updatedAt: "2023-05-20T09:30:00Z"
  },
  {
    id: "portfolio-2",
    name: "Balanced Growth",
    description: "Moderate risk with diversified holdings",
    assets: [
      { assetId: "bitcoin", quantity: 1.2 },
      { assetId: "ethereum", quantity: 15 },
      { assetId: "solana", quantity: 75 }
    ],
    createdAt: "2023-02-10T10:15:00Z",
    updatedAt: "2023-05-18T14:45:00Z"
  },
  {
    id: "portfolio-3",
    name: "High Risk/Reward",
    description: "Aggressive portfolio targeting high growth potential",
    assets: [
      { assetId: "solana", quantity: 150 }
    ],
    createdAt: "2023-03-05T08:20:00Z",
    updatedAt: "2023-05-22T16:10:00Z"
  }
];

// Generate mock historical data for assets
function generateMockHistoricalData(currentPrice: number, days: number) {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Generate random price fluctuations around the current price
    // More recent days are closer to the current price
    const randomFactor = 1 + (Math.random() - 0.5) * 0.2 * (i / days);
    const price = currentPrice * randomFactor;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: price
    });
  }
  
  return data;
}

// Existing market stats from the original file
export const marketStats = {
  marketCap: 2475387615293,
  bitcoinPrice: 61284.23,
  totalValueLocked: 46892651287,
  tradingVolume: 87291865421,
  dailyChange: 2.3,
  weeklyChange: -4.8
};

export const tvlGaugeData = {
  current: 46892651287,
  dailyChange: 10.2,
  weeklyChange: 68.7
};

export const fearGreedIndex = {
  value: 72,
  indicator: "Greed",
  previousValue: 65,
  previousChange: 7
};

export const trendingTokens = [
  { id: 1, name: "Solana", symbol: "SOL", category: "Project", change: 12.4 },
  { id: 2, name: "Render", symbol: "RNDR", category: "Project", change: 8.7 },
  { id: 3, name: "Arbitrum", symbol: "ARB", category: "Platform", change: -3.2 },
  { id: 4, name: "Jupiter", symbol: "JUP", category: "Platform", change: 15.3 },
  { id: 5, name: "Aptos", symbol: "APT", category: "Project", change: 9.1 },
  { id: 6, name: "Mantle", symbol: "MNT", category: "Platform", change: 4.3 },
  { id: 7, name: "Base", symbol: "BASE", category: "Platform", change: 21.8 },
  { id: 8, name: "Celestia", symbol: "TIA", category: "Project", change: 11.9 },
];

export const recentlyAddedProjects = [
  { id: 1, name: "Ethena", symbol: "ENA", brokerScore: 7.8, price: 0.42, priceChange: 8.7, rank: 78 },
  { id: 2, name: "Dyson", symbol: "DYS", brokerScore: 6.9, price: 1.24, priceChange: -4.2, rank: 126 },
  { id: 3, name: "Wormhole", symbol: "W", brokerScore: 8.2, price: 0.89, priceChange: 12.3, rank: 65 },
  { id: 4, name: "Jupiter", symbol: "JUP", brokerScore: 8.7, price: 0.74, priceChange: 15.3, rank: 52 },
  { id: 5, name: "Eigenlayer", symbol: "EIGEN", brokerScore: 7.4, price: 2.18, priceChange: 3.5, rank: 89 },
  { id: 6, name: "Blast", symbol: "BLAST", brokerScore: 6.8, price: 0.32, priceChange: -2.8, rank: 142 },
  { id: 7, name: "Pyth", symbol: "PYTH", brokerScore: 8.5, price: 0.56, priceChange: 7.6, rank: 74 },
];

export const cryptoCategories = [
  { id: "all", name: "All" },
  { id: "project", name: "Projects" },
  { id: "platform", name: "Platforms" },
  { id: "fund", name: "Funds" },
];