import { useState, useEffect } from "react";
import { Search, Bell, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePortfolio } from "@/lib/PortfolioContext";
import { Section } from "@/lib/types";

interface HeaderProps {
  activeSection: Section;
  sectionParams?: {
    portfolioId?: string;
    assetId?: string;
  };
  onRefresh?: () => void;
  onNavigate?: (section: Section, params?: any) => void;
}

export default function Header({ 
  activeSection, 
  sectionParams = {}, 
  onRefresh = () => {},
  onNavigate
}: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const isMobile = useIsMobile();
  const { portfolios, assets, refreshData } = usePortfolio();

  // Get title based on active section
  const getTitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return 'Dashboard';
      case 'portfolios':
        return 'Portfolio List';
      case 'portfolio-detail': {
        const portfolioDetail = portfolios.find(p => p.id === sectionParams.portfolioId);
        return portfolioDetail ? portfolioDetail.name : 'Portfolio Details';
      }
      case 'asset-detail': {
        const assetDetail = assets.find(a => a.id === sectionParams.assetId);
        return assetDetail ? `${assetDetail.name} (${assetDetail.symbol})` : 'Asset Details';
      }
      case 'new-portfolio':
        return 'Create New Portfolio';
      default:
        return 'Dashboard';
    }
  };

  // Get subtitle based on active section
  const getSubtitle = () => {
    switch (activeSection) {
      case 'dashboard':
        return `Your crypto insights for ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
      case 'portfolios':
        return 'Manage your cryptocurrency portfolios';
      case 'portfolio-detail': {
        const portfolioDetail = portfolios.find(p => p.id === sectionParams.portfolioId);
        return portfolioDetail ? portfolioDetail.description : 'Portfolio detailed information';
      }
      case 'asset-detail': {
        const assetDetail = assets.find(a => a.id === sectionParams.assetId);
        const portfolioDetail = portfolios.find(p => p.id === sectionParams.portfolioId);
        return assetDetail && portfolioDetail ? `${assetDetail.symbol} in ${portfolioDetail.name} portfolio` : 'Asset detailed information';
      }
      case 'new-portfolio':
        return 'Create and configure a new portfolio';
      default:
        return 'Your crypto insights dashboard';
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    refreshData();
    
    // Simulate refresh delay
    setTimeout(() => {
      setIsLoading(false);
      if (onRefresh) onRefresh();
    }, 1000);
  };

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // If search has content and user presses enter, navigate to portfolios
    if (value.trim() !== '') {
      // Auto-navigate to portfolios section when searching
      if (activeSection !== 'portfolios' && onNavigate) {
        onNavigate('portfolios', { search: value });
      }
    }
  };

  // Hide navbar for portfolio and asset detail pages
  const shouldShowNavItems = activeSection !== 'portfolio-detail' && 
                             activeSection !== 'asset-detail';

  return (
    <header className="bg-background py-3 px-4 md:px-8 border-b border-border flex items-center justify-between animate-fade-in">
      <div className="flex-1">
        <h1 className="text-xl font-medium">{getTitle()}</h1>
        <p className="text-sm text-muted-foreground">
          {getSubtitle()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleRefresh}
          className={cn(
            "h-9 w-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors bg-secondary hover:bg-secondary/80",
            isLoading && "animate-pulse"
          )}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
        
        
      </div>
    </header>
  );
}
