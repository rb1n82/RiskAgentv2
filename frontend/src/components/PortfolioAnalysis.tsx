import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface PortfolioAnalysis {
  portfolioId: string;
  assets: {
    symbol: string;
    weight: number;
    currentPrice: number;
    type: 'stock' | 'etf' | 'crypto';
  }[];
  metrics: {
    volatility: number;
    annualReturn: number;
    sharpe: number;
    maxDrawdown: number;
    beta: number;
  };
  performance: {
    dates: string[];
    portfolioValues: number[];
    benchmarkValues: number[];
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function PortfolioAnalysis({ portfolioId }: { portfolioId: string }) {
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portfolio/${portfolioId}`)
      .then(res => res.json())
      .then(data => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Fehler beim Laden der Portfolio-Analyse:', error);
        setLoading(false);
      });
  }, [portfolioId]);

  if (loading) {
    return <div>Lade Portfolio-Analyse...</div>;
  }

  if (!analysis) {
    return <div>Keine Daten verfügbar</div>;
  }

  // Pie Chart: KEINE Berechnung, sondern Platzhalter
  const pieData = analysis.assets.map(asset => ({
    name: asset.symbol,
    value: `P${(asset.weight * 100).toFixed(1)}` // Platzhalter
  }));

  // Performance Chart: KEINE Berechnung, sondern Platzhalter
  const performanceData = analysis.performance.dates.map((date, i) => ({
    date,
    portfolio: `P${analysis.performance.portfolioValues[i]}`,
    benchmark: `P${analysis.performance.benchmarkValues[i]}`
  }));

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Portfolio Allokation */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Portfolio Allokation</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Performance vs Benchmark */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Performance vs Benchmark</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="portfolio" stroke="#8884d8" name="Portfolio" />
                <Line type="monotone" dataKey="benchmark" stroke="#82ca9d" name="Benchmark (SPY)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Risikometriken */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Risikometriken</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-500">Volatilität</p>
            <p className="text-lg font-semibold">P{analysis.metrics.volatility}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Jahresrendite</p>
            <p className="text-lg font-semibold">P{analysis.metrics.annualReturn}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Sharpe Ratio</p>
            <p className="text-lg font-semibold">P{analysis.metrics.sharpe}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Max Drawdown</p>
            <p className="text-lg font-semibold">P{analysis.metrics.maxDrawdown}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Beta</p>
            <p className="text-lg font-semibold">P{analysis.metrics.beta}</p>
          </div>
        </div>
      </Card>

      {/* Asset Details */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Asset Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analysis.assets.map(asset => (
            <Card key={asset.symbol} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{asset.symbol.toUpperCase()}</h3>
                  <p className="text-sm text-gray-500">{asset.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">P{asset.currentPrice}</p>
                  <p className="text-sm text-gray-500">P{asset.weight}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
} 