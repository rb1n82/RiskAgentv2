import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PortfolioProvider } from "./lib/PortfolioContext";
import { AssetProvider } from "./lib/AssetContext";
import Dashboard from "./pages/Dashboard";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { useState } from "react";
import PortfolioDetail from "./pages/PortfolioDetail";
import AssetDetail from "./pages/AssetDetail";
import NewPortfolio from "./pages/NewPortfolio";
import PortfolioList from "./components/PortfolioList";
import EditPortfolio from "./pages/EditPortfolio";
import AssetOverview from "./pages/AssetOverview";
import { useParams } from 'react-router-dom';
import { Section } from "@/lib/types";

const queryClient = new QueryClient();

const App = () => {
  const [currentSection, setCurrentSection] = useState<Section>("dashboard");
  const [sectionParams, setSectionParams] = useState<any>({});

  const handleNavigate = (section: Section, params?: any) => {
    setCurrentSection(section);
    setSectionParams(params || {});
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'portfolios':
        return <PortfolioList onNavigate={handleNavigate} searchQuery={sectionParams.search} />;
      case 'portfolio-detail':
        return <PortfolioDetail portfolioId={sectionParams.portfolioId} onNavigate={handleNavigate} />;
      case 'asset-detail':
        return <AssetDetail 
                  assetId={sectionParams.assetId} 
                  onNavigate={handleNavigate}
               />;
      case 'new-portfolio':
        return <NewPortfolio onNavigate={handleNavigate} />;
      case 'edit-portfolio':
        return <EditPortfolio 
                  portfolioId={sectionParams.portfolioId}
                  onNavigate={handleNavigate}
               />;
      case 'assets':
        return (
          <AssetOverview
            type={undefined}
            onNavigate={handleNavigate}
          />
        );
      case 'crypto-assets':
        return (
          <AssetOverview
            type="crypto"
            onNavigate={handleNavigate}
          />
        );
      case 'stock-assets':
        return (
          <AssetOverview
            type="stock"
            onNavigate={handleNavigate}
          />
        );
      case 'etf-assets':
        return (
          <AssetOverview
            type="etf"
            onNavigate={handleNavigate}
          />
        );
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AssetProvider>
      <PortfolioProvider>
        
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router>
              <div className="min-h-screen bg-background flex">
                <Sidebar activeSection={currentSection} onNavigate={handleNavigate} />
                <div className="flex-1 flex flex-col h-screen overflow-hidden">
                  <Header 
                    activeSection={currentSection} 
                    sectionParams={sectionParams} 
                    onRefresh={() => {}}
                    onNavigate={handleNavigate}
                  />
                  <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-screen-2xl mx-auto space-y-6">
                      <Routes>
                        <Route path="/" element={renderContent()} />
                        <Route path="/portfolios" element={<PortfolioList onNavigate={handleNavigate} searchQuery={sectionParams.search} />} />
                        <Route path="/portfolio/:id" element={<PortfolioWrapper />} />
                        <Route path="/asset/:id" element={<AssetWrapper />} />
                      </Routes>
                    </div>
                  </main>
                </div>
              </div>
            </Router>
          </TooltipProvider>
        
      </PortfolioProvider>
      </AssetProvider>
    </QueryClientProvider>
  );
};

function PortfolioWrapper() {
  const { id } = useParams();
  return <PortfolioDetail portfolioId={id!} />;
}

function AssetWrapper() {
  const { id } = useParams();
  return <AssetDetail assetId={id!} />;
}

export default App;