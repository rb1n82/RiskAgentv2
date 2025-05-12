import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Portfolio, Asset, RiskMetrics } from './types';
// import { calculateRiskMetrics, calculateSingleAssetRiskMetrics } from './riskCalculations';
import { toast } from '@/components/ui/use-toast';
import { mockPortfolios } from './mockData';
import { computePortfolioMetrics } from "@/services/portfolioMetricService";
import { AssetMetricService } from "@/services/assetMetricService";

interface PortfolioContextType {
  portfolios: Portfolio[];
  assets: Asset[];
  isLoading: boolean;
  selectedPortfolio: Portfolio | null;
  selectedAsset: Asset | null;
  portfolioRiskMetrics: RiskMetrics | null;
  assetRiskMetrics: RiskMetrics | null;
  
  createPortfolio: (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePortfolio: (portfolio: Portfolio) => void;
  deletePortfolio: (id: string) => void;
  updateAssetQuantity: (portfolioId: string, assetId: string, quantity: number) => void;
  selectPortfolio: (id: string | null) => void;
  selectAsset: (portfolioId: string, assetId: string | null) => void;
  refreshData: () => void;
  calculatePortfolioMetrics: (portfolio: Portfolio, timeframe?: "daily" | "weekly" | "monthly") => RiskMetrics;
  calculateAssetMetrics: (asset: Asset, quantity: number, timeframe?: "daily" | "weekly" | "monthly") => RiskMetrics;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

interface AssetContextType {
  assets: Asset[];
  isLoading: boolean;
  selectedAsset: Asset | null;
  selectAsset: (symbol: string | null) => void;
  deleteAsset: (symbol: string) => void;
  refreshData: () => Promise<void>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [portfolioRiskMetrics, setPortfolioRiskMetrics] = useState<RiskMetrics | null>(null);
  const [assetRiskMetrics, setAssetRiskMetrics] = useState<RiskMetrics | null>(null);
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");

  // Initial data load
  useEffect(() => {
    // In a real app, we would fetch from API
    loadData();
  }, []);

  // Calculate risk metrics when selected portfolio or asset changes
  useEffect(() => {
    if (selectedPortfolio) {
      setPortfolioRiskMetrics({
        volatility: 0,
        annualReturn: 0,
        sharpe: 0,
        maxDrawdown: 0,
        beta: 0,
        totalValue: 0,
        valueAtRisk: 0,
        sharpeRatio: 0,
        diversificationScore: 0,
      });
    } else {
      setPortfolioRiskMetrics(null);
    }
  }, [selectedPortfolio, assets, timeframe]);

  // Calculate risk metrics for selected asset
  useEffect(() => {
    if (selectedPortfolio && selectedAsset) {
      setAssetRiskMetrics({
        volatility: 0,
        annualReturn: 0,
        sharpe: 0,
        maxDrawdown: 0,
        beta: 0,
        totalValue: 0,
        valueAtRisk: 0,
        sharpeRatio: 0,
        diversificationScore: 0,
      });
    } else {
      setAssetRiskMetrics(null);
    }
  }, [selectedPortfolio, selectedAsset, assets, timeframe]);

  const loadData = () => {
    setIsLoading(true);
    
    // In a real app, we would fetch from API
    setTimeout(() => {
      setAssets(mockAssets);
      setPortfolios(mockPortfolios);
      setIsLoading(false);
    }, 1000);
  };

  const refreshData = () => {
    loadData();
    toast({
      title: "Data refreshed",
      description: "Portfolio data has been updated",
    });
  };

  const createPortfolio = (portfolio: Omit<Portfolio, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPortfolio: Portfolio = {
      ...portfolio,
      id: `portfolio-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setPortfolios(prev => [...prev, newPortfolio]);
    toast({
      title: "Portfolio created",
      description: `${newPortfolio.name} has been created successfully`,
    });
  };

  const updatePortfolio = (portfolio: Portfolio) => {
    setPortfolios(prev =>
      prev.map(p => (p.id === portfolio.id ? { ...portfolio, updatedAt: new Date().toISOString() } : p))
    );
    
    // Update selected portfolio if it's the one being updated
    if (selectedPortfolio && selectedPortfolio.id === portfolio.id) {
      setSelectedPortfolio({ ...portfolio, updatedAt: new Date().toISOString() });
    }
    
    toast({
      title: "Portfolio updated",
      description: `${portfolio.name} has been updated successfully`,
    });
  };

  const deletePortfolio = (id: string) => {
    const portfolioToDelete = portfolios.find(p => p.id === id);
    
    setPortfolios(prev => prev.filter(p => p.id !== id));
    
    if (selectedPortfolio && selectedPortfolio.id === id) {
      setSelectedPortfolio(null);
    }
    
    toast({
      title: "Portfolio deleted",
      description: portfolioToDelete 
        ? `${portfolioToDelete.name} has been deleted` 
        : "Portfolio has been deleted",
    });
  };

  const updateAssetQuantity = (portfolioId: string, assetId: string, quantity: number) => {
    setPortfolios(prev =>
      prev.map(p => {
        if (p.id !== portfolioId) return p;
        
        // Find if asset already exists in portfolio
        const assetIndex = p.assets.findIndex(a => a.assetId === assetId);
        
        if (assetIndex >= 0) {
          // Update existing asset
          const updatedAssets = [...p.assets];
          updatedAssets[assetIndex] = { ...updatedAssets[assetIndex], quantity };
          return { ...p, assets: updatedAssets, updatedAt: new Date().toISOString() };
        } else {
          // Add new asset
          return {
            ...p,
            assets: [...p.assets, { assetId, quantity }],
            updatedAt: new Date().toISOString()
          };
        }
      })
    );
    
    // Update selected portfolio if it's the one being modified
    if (selectedPortfolio && selectedPortfolio.id === portfolioId) {
      setSelectedPortfolio(prev => {
        if (!prev) return null;
        
        const assetIndex = prev.assets.findIndex(a => a.assetId === assetId);
        
        if (assetIndex >= 0) {
          const updatedAssets = [...prev.assets];
          updatedAssets[assetIndex] = { ...updatedAssets[assetIndex], quantity };
          return { ...prev, assets: updatedAssets, updatedAt: new Date().toISOString() };
        } else {
          return {
            ...prev,
            assets: [...prev.assets, { assetId, quantity }],
            updatedAt: new Date().toISOString()
          };
        }
      });
    }
  };

  const selectPortfolio = (id: string | null) => {
    if (id === null) {
      setSelectedPortfolio(null);
      setSelectedAsset(null);
      return;
    }
    
    const portfolio = portfolios.find(p => p.id === id);
    setSelectedPortfolio(portfolio || null);
    setSelectedAsset(null);
  };

  const selectAsset = (portfolioId: string, assetId: string | null) => {
    if (assetId === null) {
      setSelectedAsset(null);
      return;
    }
    
    // First make sure the right portfolio is selected
    if (!selectedPortfolio || selectedPortfolio.id !== portfolioId) {
      selectPortfolio(portfolioId);
    }
    
    const asset = assets.find(a => a.id === assetId);
    setSelectedAsset(asset || null);
  };

  // Helper functions for calculating metrics with specific timeframes
  const calculatePortfolioMetrics = (portfolio: Portfolio, timeframe: "daily" | "weekly" | "monthly" = "daily") => {
    return {
      volatility: 0,
      annualReturn: 0,
      sharpe: 0,
      maxDrawdown: 0,
      beta: 0,
      totalValue: 0,
      valueAtRisk: 0,
      sharpeRatio: 0,
      diversificationScore: 0,
    };
  };

  const calculateAssetMetrics = (asset: Asset, quantity: number, timeframe: "daily" | "weekly" | "monthly" = "daily") => {
    return {
      volatility: 0,
      annualReturn: 0,
      sharpe: 0,
      maxDrawdown: 0,
      beta: 0,
      totalValue: 0,
      valueAtRisk: 0,
      sharpeRatio: 0,
      diversificationScore: 0,
    };
  };

  return (
    <PortfolioContext.Provider
      value={{
        portfolios,
        assets,
        isLoading,
        selectedPortfolio,
        selectedAsset,
        portfolioRiskMetrics,
        assetRiskMetrics,
        createPortfolio,
        updatePortfolio,
        deletePortfolio,
        updateAssetQuantity,
        selectPortfolio,
        selectAsset,
        refreshData,
        calculatePortfolioMetrics,
        calculateAssetMetrics
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

export function AssetProvider({ children }: { children: React.ReactNode }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Lade die Asset-Daten aus der JSON-Datei
      const response = await fetch('/data/market_data.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Konvertiere die Daten in das Asset-Format
      const assets: Asset[] = Object.entries(data).map(([symbol, assetData]: [string, any]) => ({
        id: symbol,
        name: symbol.charAt(0).toUpperCase() + symbol.slice(1),
        symbol: symbol,
        price: assetData.currentPrice,
        priceChange24h: ((assetData.currentPrice - assetData.oneDayAgoPrice) / assetData.oneDayAgoPrice) * 100,
        volatility: 0, // Wird später berechnet
        historicalData: [
          { date: new Date(assetData.lastUpdated - 90 * 24 * 60 * 60 * 1000).toISOString(), price: assetData.ninetyDayAgoPrice },
          { date: new Date(assetData.lastUpdated - 30 * 24 * 60 * 60 * 1000).toISOString(), price: assetData.thirtyDayAgoPrice },
          { date: new Date(assetData.lastUpdated - 7 * 24 * 60 * 60 * 1000).toISOString(), price: assetData.sevenDayAgoPrice },
          { date: new Date(assetData.lastUpdated - 24 * 60 * 60 * 1000).toISOString(), price: assetData.oneDayAgoPrice },
          { date: new Date(assetData.lastUpdated).toISOString(), price: assetData.currentPrice }
        ]
      }));

      setAssets(assets);
    } catch (error) {
      console.error("Fehler beim Laden der Daten:", error);
      toast({
        title: "Fehler",
        description: "Die Asset-Daten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const selectAsset = (symbol: string | null) => {
    if (!symbol) {
      setSelectedAsset(null);
      return;
    }
    console.log('Suche Asset mit Symbol:', symbol);
    console.log('Verfügbare Assets:', assets);
    const asset = assets.find(a => a.symbol === symbol);
    if (!asset) {
      console.error(`Asset mit Symbol ${symbol} nicht gefunden`);
    } else {
      console.log('Gefundenes Asset:', asset);
    }
    setSelectedAsset(asset || null);
  };

  const deleteAsset = (symbol: string) => {
    setAssets(prev => prev.filter(a => a.symbol !== symbol));
    if (selectedAsset?.symbol === symbol) {
      setSelectedAsset(null);
    }
  };

  return (
    <AssetContext.Provider
      value={{
        assets,
        isLoading,
        selectedAsset,
        selectAsset,
        deleteAsset,
        refreshData,
      }}
    >
      {children}
    </AssetContext.Provider>
  );
}

export function useAsset() {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error("useAsset must be used within an AssetProvider");
  }
  return context;
}