export interface StockData {
  symbol: string;
  name: string;
  currentPrice: number;
  yesterdayPrice: number;
  thirtyDayPrice: number;
  ninetyDayPrice: number;
  lastUpdate: Date;
}

export interface RiskMetrics {
  symbol: string;
  volatility: number;         // Volatilität (Standardabweichung der Returns)
  valueAtRisk: number;        // 95% VaR
  sharpeRatio: number;        // Sharpe Ratio
  dailyReturn: number;        // Tagesrendite
  thirtyDayReturn: number;    // 30-Tage-Rendite
  ninetyDayReturn: number;    // 90-Tage-Rendite
  maxDrawdown: number;        // Maximaler Drawdown
  lastUpdate: Date;
}

export const MAJOR_STOCKS = [
  // Technologie
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation' },
  { symbol: 'META', name: 'Meta Platforms Inc.' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'AVGO', name: 'Broadcom Inc.' },
  { symbol: 'ADBE', name: 'Adobe Inc.' },
  { symbol: 'CRM', name: 'Salesforce Inc.' },
  { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'CSCO', name: 'Cisco Systems, Inc.' },
  { symbol: 'ORCL', name: 'Oracle Corporation' },
  { symbol: 'ACN', name: 'Accenture plc' },

  // Finanzwesen
  { symbol: 'BRK-B', name: 'Berkshire Hathaway Inc.' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
  { symbol: 'V', name: 'Visa Inc.' },
  { symbol: 'MA', name: 'Mastercard Incorporated' },
  { symbol: 'BAC', name: 'Bank of America Corporation' },
  { symbol: 'WFC', name: 'Wells Fargo & Company' },
  { symbol: 'MS', name: 'Morgan Stanley' },
  { symbol: 'GS', name: 'Goldman Sachs Group, Inc.' },
  { symbol: 'BLK', name: 'BlackRock, Inc.' },
  { symbol: 'SCHW', name: 'Charles Schwab Corporation' },

  // Gesundheitswesen
  { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' },
  { symbol: 'JNJ', name: 'Johnson & Johnson' },
  { symbol: 'LLY', name: 'Eli Lilly and Company' },
  { symbol: 'PFE', name: 'Pfizer Inc.' },
  { symbol: 'ABT', name: 'Abbott Laboratories' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
  { symbol: 'DHR', name: 'Danaher Corporation' },
  { symbol: 'MRK', name: 'Merck & Co., Inc.' },

  // Konsumgüter
  { symbol: 'PG', name: 'Procter & Gamble Company' },
  { symbol: 'KO', name: 'Coca-Cola Company' },
  { symbol: 'PEP', name: 'PepsiCo, Inc.' },
  { symbol: 'COST', name: 'Costco Wholesale Corporation' },
  { symbol: 'WMT', name: 'Walmart Inc.' },
  { symbol: 'MCD', name: "McDonald's Corporation" },
  { symbol: 'NKE', name: 'NIKE, Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },

  // Industrie & Energie
  { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
  { symbol: 'CVX', name: 'Chevron Corporation' },
  { symbol: 'UPS', name: 'United Parcel Service, Inc.' },
  { symbol: 'HON', name: 'Honeywell International Inc.' },
  { symbol: 'CAT', name: 'Caterpillar Inc.' },
  { symbol: 'BA', name: 'Boeing Company' },
  { symbol: 'GE', name: 'General Electric Company' },
  { symbol: 'RTX', name: 'Raytheon Technologies Corporation' }
];

export const MAJOR_ETFS = [
  // US-Markt
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust' },
  { symbol: 'IWM', name: 'iShares Russell 2000 ETF' },
  
  // International
  { symbol: 'EFA', name: 'iShares MSCI EAFE ETF' },
  { symbol: 'VEA', name: 'Vanguard FTSE Developed Markets ETF' },
  { symbol: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF' },
  { symbol: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF' },
  
  // Sektoren
  { symbol: 'XLK', name: 'Technology Select Sector SPDR Fund' },
  { symbol: 'XLF', name: 'Financial Select Sector SPDR Fund' },
  { symbol: 'XLV', name: 'Health Care Select Sector SPDR Fund' },
  { symbol: 'XLE', name: 'Energy Select Sector SPDR Fund' },
  { symbol: 'XLC', name: 'Communication Services Select Sector SPDR Fund' },
  
  // Anleihen
  { symbol: 'AGG', name: 'iShares Core U.S. Aggregate Bond ETF' },
  { symbol: 'BND', name: 'Vanguard Total Bond Market ETF' },
  { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF' },
  { symbol: 'LQD', name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF' },
  { symbol: 'HYG', name: 'iShares iBoxx $ High Yield Corporate Bond ETF' }
]; 