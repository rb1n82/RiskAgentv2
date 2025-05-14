import { useEffect, useState, useMemo } from "react";
import { usePortfolio } from "@/lib/PortfolioContext";
import type { Bar } from "@/utils/metrics";
import PortfolioRiskMetrics from "@/components/PortfolioRiskMetrics";
import PortfolioAllocationChart from "@/components/PortfolioAllocationChart";
import PortfolioAssetTable from "@/components/PortfolioAssetTable";
import TimeframeSelector from "@/components/TimeframeSelector";
import { Portfolio, Section } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Pencil,
  AlertTriangle,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from "date-fns";

interface PortfolioDetailProps {
  portfolioId?: string;
  onNavigate?: (section: Section, params?: any) => void;
}

function pickLastBarPerDay(bars: Bar[]): Bar[] {
  const lastPerDay = new Map<string, Bar>();

  // Sortieren, damit wir sicher wissen, welcher Bar wirklich der "letzte" ist
  bars
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach(bar => {
      const day = format(new Date(bar.date), "yyyy-MM-dd");
      lastPerDay.set(day, bar);
    });

  return Array.from(lastPerDay.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

/**
 * Aggregiert tägliche Bars zu wöchentlichen Bars (jeder 5. Tag)
 */
function aggregateWeeklyBars(bars: Bar[]): Bar[] {
  const weekly: Bar[] = [];
  for (let i = 0; i < bars.length; i += 5) {
    const slice = bars.slice(i, i + 5);
    weekly.push(slice[slice.length - 1]);
  }
  return weekly;
}

/**
 * Aggregiert tägliche Bars zu monatlichen Bars (jeder 20. Tag)
 */
function aggregateMonthlyBars(bars: Bar[]): Bar[] {
  const monthly: Bar[] = [];
  for (let i = 0; i < bars.length; i += 20) {
    const slice = bars.slice(i, i + 20);
    monthly.push(slice[slice.length - 1]);
  }
  return monthly;
}

/**
 * Normalisiert eine Serie ab einem gegebenen Datum auf 100%
 */
function normalizeSeriesFromDate(
  series: { date: string; adj: number }[],
  startDate: string
) {
  const baseBar = series.find(b => b.date === startDate);
  const base = baseBar ? baseBar.adj : 1;
  return series
    .filter(b => b.date >= startDate)
    .map(b => ({ date: b.date, value: (b.adj / base) * 100 }));
}

/**
 * Berechnet die Portfolio-Performance entlang der gegebenen Termine (z.B. SPY-Daten)
 * und füllt fehlende Kurse mit dem letzten bekannten Wert auf.
 */
function calculatePortfolioPerformance(
  portfolio: Portfolio,
  barsMap: Record<string, Bar[]>,
  dates: string[]
): { date: string; adj: number }[] {
  if (!portfolio || !barsMap) return [];

  const performance: { date: string; adj: number }[] = [];

  dates.forEach(date => {
    let totalValue = 0;
    portfolio.assets.forEach(asset => {
      const series = barsMap[asset.assetId] || [];
      // Suche exakten Kurs oder letzten früheren Kurs
      let bar = series.find(b => b.date === date);
      if (!bar) {
        for (let i = series.length - 1; i >= 0; i--) {
          if (series[i].date < date) {
            bar = series[i];
            break;
          }
        }
      }
      if (bar) {
        totalValue += bar.adj * asset.quantity;
      }
    });
    performance.push({ date, adj: totalValue });
  });

  return performance;
}

export default function PortfolioDetail({
  portfolioId,
  onNavigate,
}: PortfolioDetailProps) {
  const {
    assets,
    isLoading,
    selectPortfolio,
    selectedPortfolio,
    portfolioRiskMetrics,
    deletePortfolio,
  } = usePortfolio();

  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );

  // Portfolio wählen
  useEffect(() => {
  if (portfolioId) selectPortfolio(portfolioId);
  return () => selectPortfolio(null);
}, [portfolioId, selectPortfolio]);

// 2) BarsMap beim Ändern der Assets laden
const [barsMap, setBarsMap] = useState<Record<string, Bar[]>>({});

useEffect(() => {
  /** 1) Symbol‑Liste zusammenstellen  */
  const portfolioIds = selectedPortfolio?.assets.map(a => a.assetId) ?? [];
  const symbols      = [...new Set([...portfolioIds, "SPY"])];   // «SPY» anhängen + Duplikate filtern

  const API = import.meta.env.VITE_API_URL;
  if (!API) {
    console.error("VITE_API_URL ist nicht gesetzt");
    return;
  }

  /** 2) Kurs‑Dateien laden  */
  (async () => {
    const map: Record<string, Bar[]> = {};

    await Promise.all(
      symbols.map(async (id) => {
        try {
          const res = await fetch(`${API}/data/timeseries/${id}.json`, { cache: "no-cache" });
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
          map[id] = await res.json();
        } catch (err) {
          console.warn(`⚠️  Timeseries für ${id} konnte nicht geladen werden:`, err);
          map[id] = [];                                         // leerer Platzhalter
        }
      })
    );

    setBarsMap(map);
  })();
}, [selectedPortfolio?.assets]);

  // 2.5) Duplikate entfernen & letzte 3 Monate filtern
  const processedBarsMap = useMemo(() => {
    const processed: Record<string, Bar[]> = {};
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    Object.entries(barsMap).forEach(([id, bars]) => {
      // 1) Letzten Bar pro Tag behalten
      const noDups = pickLastBarPerDay(bars);
  
      // 2) Auf die letzten 3 Monate beschränken
      const recent = noDups.filter(bar => new Date(bar.date) >= threeMonthsAgo);
  
      // 3) Chronologisch sortieren (eigentlich schon passiert, aber zur Sicherheit)
      processed[id] = recent.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    });
  
    return processed;
  }, [barsMap]);

  // 3) Aggregation je nach Timeframe
  const aggregatedBarsMap = useMemo(() => {
    const map: Record<string, Bar[]> = {};
    Object.entries(processedBarsMap).forEach(([id, raw]) => {
      let arr = raw;
      if (timeframe === "weekly") arr = aggregateWeeklyBars(raw);
      else if (timeframe === "monthly") arr = aggregateMonthlyBars(raw);
      map[id] = arr;
    });
    return map;
  }, [processedBarsMap, timeframe]);

  // 4) SPY-Daten als Basis-Terminkalender
  const spySeries = aggregatedBarsMap["SPY"] || [];
  const dates = spySeries.map(b => b.date);

  // 5) Portfolio-Performance entlang dieser Termine
  const portSeries = calculatePortfolioPerformance(
    selectedPortfolio,
    aggregatedBarsMap,
    dates
  );

  // 6) Normalisierung von Anfangsdatum (erstes Datum)
  const startDate = dates[0];
  const normSpy = normalizeSeriesFromDate(spySeries, startDate);
  const normPort = normalizeSeriesFromDate(portSeries, startDate);

  // 7) Chart-Daten zusammenführen
  const chartData = normSpy.map(s => {
    const p = normPort.find(p => p.date === s.date);
    return { date: s.date, spy: s.value, portfolio: p?.value ?? 0 };
  });

  // Loading / Fehlerfälle
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        <p className="mt-4 text-lg">Loading portfolio data...</p>
      </div>
    );
  }
  if (!selectedPortfolio) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <AlertTriangle size={48} className="text-yellow-500 mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Portfolio Not Found</h1>
        <p className="text-muted-foreground mb-6">Das Portfolio existiert nicht oder wurde gelöscht.</p>
        <Button onClick={() => onNavigate?.("portfolios")} variant="outline">
          Zurück
        </Button>
      </div>
    );
  }

  // Sichtbares Portfolio (qty>0)
  const visiblePortfolio = {
    ...selectedPortfolio,
    assets: selectedPortfolio.assets.filter(a => a.quantity > 0),
  };

  // Delete-Handler
  const handleDelete = () => {
    deletePortfolio(selectedPortfolio.id);
    onNavigate?.("portfolios");
  };
  const handleAssetClick = (assetId: string) => onNavigate?.("asset-detail", { portfolioId, assetId });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onNavigate?.("portfolios")}> <ArrowLeft size={16}/> </Button>
          <h1 className="text-2xl font-semibold">Analytics</h1>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex items-center gap-1"> <Trash2 size={14}/> Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete Portfolio</AlertDialogTitle></AlertDialogHeader>
              <AlertDialogDescription>Willst du das Portfolio "{selectedPortfolio.name}" löschen? Diese Aktion ist unwiderruflich.</AlertDialogDescription>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Löschen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" size="sm" onClick={() => onNavigate?.("edit-portfolio", { portfolioId })}>
            <Pencil size={14}/> Edit
          </Button>
          <Button size="sm" onClick={() => onNavigate?.("edit-portfolio", { portfolioId, addAsset: true })}>
            <Plus size={14}/> Add Asset
          </Button>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-end">
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      {/* Risk Metrics */}
      <PortfolioRiskMetrics riskMetrics={portfolioRiskMetrics} timeframe={timeframe} barsMap={aggregatedBarsMap} portfolio={visiblePortfolio} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PortfolioAllocationChart portfolio={visiblePortfolio} assets={assets} />
        <div className="rounded-lg border bg-card p-5 h-[320px]">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight size={16} className="text-primary" />
            <h3 className="font-medium">Performance vs. SPY</h3>
          </div>
          <div className="h-[250px]">
            {chartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top:5, right:20, left:0, bottom:5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={date => new Date(date).toLocaleDateString('de-DE', { month:'short', day:'numeric'})} />
                  <YAxis domain={['dataMin','dataMax']} tickFormatter={v => `${v.toFixed(0)} %`} />
                  <Tooltip formatter={(val: number, name: string) => [`${val.toFixed(2)} %`, name]} labelFormatter={date => new Date(date).toLocaleDateString()} />
                  <Legend />
                  <Line name="Portfolio" type="monotone" dataKey="portfolio" dot={false} stroke="#3b82f6" strokeWidth={2} />
                  <Line name="SPY" type="monotone" dataKey="spy" dot={false} stroke="#f87171" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground">Keine Daten zum Anzeigen.</p>
            )}
          </div>
        </div>
      </div>

      {/* Assets Table */}
      <PortfolioAssetTable portfolio={visiblePortfolio} barsMap={aggregatedBarsMap} onAssetClick={handleAssetClick} />
    </div>
  );
}
