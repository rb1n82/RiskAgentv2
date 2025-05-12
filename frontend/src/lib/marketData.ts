import { Asset, Portfolio } from './types';

// Global market indices
export const marketIndices = {
  volatilityIndex: {
    value: 37.6, // current value (0-100)
    previousValue: 42.3, // previous day's value
    change: -4.7, // daily change
    description: "Market Volatility Index",
    interpretation: {
      0: "Extremely Low Volatility",
      20: "Low Volatility",
      40: "Normal Volatility",
      60: "High Volatility",
      80: "Extreme Volatility"
    }
  },
  sharpeRatio: {
    value: 1.42, // current value
    previousValue: 1.38, // previous value
    change: 0.04, // change
    timeFrame: "30 days", // timeframe for calculation
    description: "Market Sharpe Ratio",
    interpretation: {
      0: "Poor",
      0.5: "Below Average",
      1: "Good",
      1.5: "Very Good",
      2: "Excellent"
    }
  },
  marketCondition: {
    status: "Moderate Growth",
    riskLevel: "Medium",
    sentiment: "Cautiously Optimistic"
  }
};

// Additional imaginary portfolios
export const additionalPortfolios: Portfolio[] = [
  {
    id: "portfolio-4",
    name: "Stablecoin Focus",
    description: "Lower risk portfolio with stablecoin majority",
    assets: [
      { assetId: "btc", quantity: 0.5 },
      { assetId: "eth", quantity: 5 },
      { assetId: "usdc", quantity: 10000 }
    ],
    createdAt: "2023-04-12T09:15:00Z",
    updatedAt: "2023-05-25T11:30:00Z"
  },
  {
    id: "portfolio-5",
    name: "DeFi Explorer",
    description: "Focused on decentralized finance projects",
    assets: [
      { assetId: "eth", quantity: 8 },
      { assetId: "uni", quantity: 500 },
      { assetId: "aave", quantity: 200 },
      { assetId: "comp", quantity: 150 }
    ],
    createdAt: "2023-05-01T14:20:00Z",
    updatedAt: "2023-05-24T16:45:00Z"
  },
  {
    id: "portfolio-6",
    name: "NFT & Metaverse",
    description: "Targeting growth in digital assets space",
    assets: [
      { assetId: "eth", quantity: 12 },
      { assetId: "mana", quantity: 2500 },
      { assetId: "sand", quantity: 3000 },
      { assetId: "axs", quantity: 400 }
    ],
    createdAt: "2023-03-18T10:10:00Z",
    updatedAt: "2023-05-21T09:25:00Z"
  }
];

// Additional cryptocurrency assets
export const additionalAssets: Asset[] = [
  {
    id: "usdc",
    name: "USD Coin",
    symbol: "USDC",
    price: 1.00,
    priceChange24h: 0.01,
    volatility: 0.2, // Very low volatility
    correlations: {
      "btc": 0.12,
      "eth": 0.15,
      "sol": 0.10,
      "bnb": 0.13,
      "xrp": 0.11,
      "ada": 0.09
    },
    historicalData: generateMockHistoricalData(1.00, 90, 0.002)
  },
  {
    id: "uni",
    name: "Uniswap",
    symbol: "UNI",
    price: 5.62,
    priceChange24h: 3.8,
    volatility: 7.2,
    correlations: {
      "btc": 0.76,
      "eth": 0.85,
      "sol": 0.72,
      "bnb": 0.68,
      "xrp": 0.58,
      "ada": 0.64
    },
    historicalData: generateMockHistoricalData(5.62, 90, 0.08)
  },
  {
    id: "aave",
    name: "Aave",
    symbol: "AAVE",
    price: 87.34,
    priceChange24h: -2.3,
    volatility: 6.9,
    correlations: {
      "btc": 0.73,
      "eth": 0.82,
      "sol": 0.71,
      "bnb": 0.65,
      "uni": 0.78
    },
    historicalData: generateMockHistoricalData(87.34, 90, 0.075)
  },
  {
    id: "comp",
    name: "Compound",
    symbol: "COMP",
    price: 47.82,
    priceChange24h: 1.9,
    volatility: 6.6,
    correlations: {
      "btc": 0.68,
      "eth": 0.79,
      "sol": 0.67,
      "uni": 0.76,
      "aave": 0.85
    },
    historicalData: generateMockHistoricalData(47.82, 90, 0.07)
  },
  {
    id: "mana",
    name: "Decentraland",
    symbol: "MANA",
    price: 0.42,
    priceChange24h: 5.7,
    volatility: 9.4,
    correlations: {
      "btc": 0.65,
      "eth": 0.72,
      "sol": 0.68,
      "axs": 0.82,
      "sand": 0.88
    },
    historicalData: generateMockHistoricalData(0.42, 90, 0.1)
  },
  {
    id: "sand",
    name: "The Sandbox",
    symbol: "SAND",
    price: 0.38,
    priceChange24h: 6.3,
    volatility: 9.8,
    correlations: {
      "btc": 0.63,
      "eth": 0.71,
      "sol": 0.67,
      "axs": 0.79,
      "mana": 0.88
    },
    historicalData: generateMockHistoricalData(0.38, 90, 0.11)
  },
  {
    id: "axs",
    name: "Axie Infinity",
    symbol: "AXS",
    price: 6.92,
    priceChange24h: -3.2,
    volatility: 10.2,
    correlations: {
      "btc": 0.60,
      "eth": 0.69,
      "sol": 0.65,
      "mana": 0.82,
      "sand": 0.79
    },
    historicalData: generateMockHistoricalData(6.92, 90, 0.12)
  }
];

// Generate mock historical data with custom volatility
function generateMockHistoricalData(currentPrice: number, days: number, dailyVolatility: number = 0.05) {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Generate random price fluctuations around the current price
    // More recent days are closer to the current price
    const randomFactor = 1 + (Math.random() - 0.5) * 2 * dailyVolatility * (i / days);
    const price = currentPrice * randomFactor;
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: price
    });
  }
  
  return data;
}