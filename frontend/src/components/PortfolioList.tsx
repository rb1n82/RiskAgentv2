import { useNavigate } from "react-router-dom";
import { usePortfolio } from "@/lib/PortfolioContext";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Section } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { computePortfolioMetrics } from "@/services/portfolioMetricService";
import { Bar } from "@/utils/metrics"; // Importiere Bar
import path from 'path';
import { useAsset } from "@/lib/AssetContext"; // AssetContext importieren

interface PortfolioListProps {
  onNavigate?: (section: Section, params?: any) => void;
  searchQuery?: string;
}

export default function PortfolioList({ onNavigate, searchQuery = '' }: PortfolioListProps) {
  const { portfolios } = usePortfolio(); // Holen Sie sich Portfolios aus dem Kontext
  const { assets } = useAsset(); // Holen Sie sich Assets aus dem AssetProvider
  const [searchTerm, setSearchTerm] = useState(searchQuery);

  // Update search term when searchQuery prop changes
  useEffect(() => {
    setSearchTerm(searchQuery);
  }, [searchQuery]);

  // Filter portfolios based on search term
  const filteredPortfolios = useMemo(() => {
    if (!searchTerm) return portfolios;
    
    const term = searchTerm.toLowerCase().trim();
    return portfolios.filter(portfolio => 
      portfolio.name.toLowerCase().includes(term) || 
      portfolio.description.toLowerCase().includes(term)
    );
  }, [portfolios, searchTerm]);


  // Portfolio-Wert berechnen (dies ist der `totalValue`, der in `computePortfolioMetrics` berechnet wird)
  const getPortfolioValue = (portfolioId: string) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
  
    if (!portfolio) {
      console.error(`Portfolio mit ID ${portfolioId} existiert nicht!`);
      return { totalValue: 0, changeSinceYesterday: 0 };
    }
  
    let totalValue = 0;
    let totalYesterdayValue = 0;
  
    // Gehe durch jedes Asset im Portfolio und hole dir die Preisdaten
    portfolio.assets.forEach(asset => {
      const marketAsset = assets.find(a => a.id === asset.assetId);
  
      if (!marketAsset) {
        
        return;
      }
  
      // Berechne den Gesamtwert des Assets
      const currentPrice = marketAsset.price;
      const yesterdayPrice = currentPrice * (1 - marketAsset.priceChange24h / 100); // Preis von gestern
  
      if (!yesterdayPrice) {
        console.error(`Preis von gestern für Asset ${asset.assetId} nicht gefunden!`);
        return;
      }
  
      // Berechnung des Gesamtwerts
      totalValue += currentPrice * asset.quantity; // Gesamtwert des Assets
      totalYesterdayValue += yesterdayPrice * asset.quantity;
    });
  
    const changePercent = totalYesterdayValue > 0 ? ((totalValue - totalYesterdayValue) / totalYesterdayValue) * 100 : 0;
    return { totalValue, changePercent };
  };


  // Formatierungsfunktionen
  const fmtCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    } else {
      return `$${amount.toFixed(2)}`;
    }
  };


  // Format asset list for display
  const formatAssetList = (portfolioId: string) => {
    const portfolio = portfolios.find(p => p.id === portfolioId);
    if (!portfolio || portfolio.assets.length === 0) return "No assets";
    
    const assetSymbols = portfolio.assets
      .map(a => {
        const asset = assets.find(asset => asset.id === a.assetId);
        return asset ? asset.symbol : null;
      })
      .filter(symbol => symbol !== null);
    
    if (assetSymbols.length <= 3) {
      return assetSymbols.join(', ');
    } else {
      return `${assetSymbols.slice(0, 2).join(', ')} +${assetSymbols.length - 2} more`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with portfolio count and create button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h1 className="text-2xl font-semibold">
          <span className="text-primary mr-1">{filteredPortfolios.length}</span> 
          {filteredPortfolios.length === 1 ? 'Portfolio' : 'Portfolios'}
          {searchTerm && (
            <span className="text-base text-muted-foreground ml-1">
              matching "{searchTerm}"
            </span>
          )}
        </h1>
        <Button 
          onClick={() => onNavigate && onNavigate('new-portfolio')}
          className="flex items-center gap-1"
        >
          <Plus size={18} />
          <span>New Portfolio</span>
        </Button>
      </div>
      
      {/* Portfolio grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPortfolios.length === 0 ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Briefcase size={24} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-medium mb-2">No portfolios found</h2>
            <p className="text-muted-foreground mb-5">
              {searchTerm 
                ? "No portfolios match your search criteria" 
                : "Create your first portfolio to get started"}
            </p>
            <Button 
              onClick={() => onNavigate && onNavigate('new-portfolio')}
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              <span>Create New Portfolio</span>
            </Button>
          </div>
        ) : (
          filteredPortfolios.map((portfolio) => {
            const { totalValue, changePercent } = getPortfolioValue(portfolio.id);
            
            
            return (
              <div
                key={portfolio.id}
                onClick={() => onNavigate && onNavigate('portfolio-detail', { portfolioId: portfolio.id })}
                className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-lg">{portfolio.name}</h3>
                  <div className={`flex items-center gap-1 ${changePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
  {changePercent >= 0
    ? <ArrowUpRight size={16}/>
    : <ArrowDownRight size={16}/>}
  <span>{changePercent.toFixed(2)}%</span>
</div>
                </div>
                
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {portfolio.description}
                </p>
                
                <div className="mt-4">
                  <div className="text-xl font-medium">
                    {fmtCurrency(totalValue)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {portfolio.assets.length} {portfolio.assets.length === 1 ? 'asset' : 'assets'}
                    {/* Hier die Assets anzeigen */}
                    <div className="mt-2 text-sm text-muted-foreground">
                      {portfolio.assets.map(asset => {
                        const marketAsset = assets.find(a => a.symbol === asset.assetId);
                        return marketAsset ? marketAsset.symbol : 'Unknown Asset';
                      }).join(', ')}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(portfolio.createdAt).toLocaleDateString()}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate && onNavigate('edit-portfolio', { portfolioId: portfolio.id });
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}