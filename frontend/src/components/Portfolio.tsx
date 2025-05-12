import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import PortfolioAnalysis from './PortfolioAnalysis';

interface Portfolio {
  id: string;
  name: string;
  description: string;
  assets: {
    symbol: string;
    weight: number;
  }[];
}

export default function Portfolio({ portfolioId }: { portfolioId: string }) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portfolios/${portfolioId}`)
      .then(res => res.json())
      .then(data => {
        setPortfolio(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Fehler beim Laden des Portfolios:', error);
        setLoading(false);
      });
  }, [portfolioId]);

  if (loading) {
    return <div>Lade Portfolio...</div>;
  }

  if (!portfolio) {
    return <div>Portfolio nicht gefunden</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{portfolio.name}</h1>
        <p className="text-gray-500 mt-2">{portfolio.description}</p>
      </div>

      <PortfolioAnalysis portfolioId={portfolioId} />
    </div>
  );
} 