import { useEffect, useState } from "react";
import { useAsset } from "@/lib/AssetContext";
import { Section } from "@/lib/types";
import {
  Button,
  
} from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import TimeframeSelector from "@/components/TimeframeSelector";
import AssetRiskMetrics from "@/components/AssetRiskMetrics";
import { AssetMetricService } from "@/services/assetMetricService";
import { RiskMetrics } from "@/lib/types";
import { Bar } from "@/utils/metrics";
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  LineChart,
  Line,
} from "recharts";
import { format, isSameMonth, subMonths } from "date-fns";
import { Card } from "@/components/ui/card"; // Card-Wrapper


interface AssetDetailProps {
  assetId: string;
  onNavigate?: (section: Section, params?: any) => void;
}

function pickLastBarPerDay(bars: Bar[]): Bar[] {
  // Map von "YYYY-MM-DD" auf den jeweils zuletzt gesehenen Bar
  const lastPerDay = new Map<string, Bar>();

  bars
    // 1) optional: sortiere nach Datum ascending, damit “letzter” wirklich chronologisch ist
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    // 2) überschreibe in der Map immer mit dem aktuelleren Bar
    .forEach(bar => {
      const day = format(new Date(bar.date), "yyyy-MM-dd");
      lastPerDay.set(day, bar);
    });

  // 3) Map.values() enthält jetzt pro Tag genau den letzten Eintrag
  //    und wir sortieren sie nochmal, damit das Array chronologisch bleibt
  return Array.from(lastPerDay.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export default function AssetDetail({ assetId, onNavigate }: AssetDetailProps) {
  const { assets, isLoading, selectAsset, selectedAsset, deleteAsset } = useAsset();
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [barsMap, setBarsMap] = useState<Record<string, Bar[]>>({});

  // 1) Asset laden
  useEffect(() => {
    if (!assetId) return;
    // erst auswählen, wenn die Context-Assets geladen sind
    if (assets.length > 0) {
      selectAsset(assetId);
    }
    // cleanup: beim Unmount Selection zurücksetzen
    return () => selectAsset(null);
  }, [assetId, assets, selectAsset]);

  // 2) Zeitreihe laden
  useEffect(() => {
    async function load() {
      try {
        const API = import.meta.env.VITE_API_URL;
        if (!API) throw new Error('VITE_API_URL ist nicht gesetzt');
        const res = await fetch(`${API}/data/timeseries/${assetId}.json`, { cache: "no-cache" });

        if (!res.ok) throw new Error(res.statusText);
        const raw: Bar[] = await res.json();
        const cleaned = pickLastBarPerDay(raw);
        setBarsMap({ [assetId]: cleaned });
      } catch (e) {
        console.error(e);
      }
    }
    if (assetId) load();
  }, [assetId]);

  // 3) Risikokennzahlen berechnen
  useEffect(() => {
    if (!selectedAsset || !barsMap[assetId]?.length) return;
    let prices = barsMap[assetId]!.map(b => b.adj);
    if (timeframe === "weekly")    prices = aggregateWeekly(prices);
    else if (timeframe === "monthly") prices = aggregateMonthly(prices);
    const metrics = AssetMetricService.calculateAssetMetrics(
      selectedAsset,
      prices,
      undefined,
      selectedAsset.quantity ?? 1,
      timeframe
    );
    setRiskMetrics(metrics);
  }, [selectedAsset, barsMap, timeframe]);

  // 4) Loading / Error
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-lg">Lade Asset-Daten...</p>
        </div>
      </div>
    );
  }
  if (!selectedAsset) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold mb-4">Asset nicht gefunden</h1>
        <div className="flex gap-4">
          <Button onClick={() => onNavigate?.("dashboard")}>Dashboard</Button>
          <Button variant="outline" onClick={() => onNavigate?.("assets")}>
            Alle Assets
          </Button>
        </div>
      </div>
    );
  }

  // Delete-Handler
  const handleDelete = () => {
    deleteAsset(selectedAsset.symbol);
    onNavigate?.("assets");
  };

  // Chart aufbereiten (letzte 12 Monate)
  const raw = barsMap[assetId]?.map(b => ({ date: b.date, price: b.adj })) || [];
  const cutoff = subMonths(new Date(raw.at(-1)?.date || Date.now()), 12);
  const filtered = raw.filter(d => new Date(d.date) >= cutoff);
  const daily = aggregateDaily(filtered);
  const ticks = daily.filter((d,i,a) => i===0 || !isSameMonth(new Date(a[i-1].date), new Date(d.date))).map(d=>d.date);
  const prices = daily.map(d=>d.price);
  const min = Math.min(...prices), max = Math.max(...prices), pad=(max-min)*0.1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => onNavigate?.("assets")}>
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-2xl font-semibold">{selectedAsset.name}</h1>
        </div>
        
      </div>

      {/* Timeframe Selector */}
      <div className="flex justify-end">
        <TimeframeSelector value={timeframe} onChange={setTimeframe} />
      </div>

      {/* Risk Metrics */}
      {riskMetrics && (
        
          <AssetRiskMetrics riskMetrics={riskMetrics} timeframe={timeframe} />
        
      )}

      {/* Price Chart */}
      <Card className="gradient-border">
        <div className="p-5">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={daily} margin={{ top:10, right:40, left:80, bottom:0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
              <XAxis
                dataKey="date"
                ticks={ticks}
                tickFormatter={d => format(new Date(d), "MMM yyyy")}
                tick={{ fill: "#888" }}
                axisLine={{ stroke: "#444" }}
                tickLine={{ stroke: "#444" }}
                minTickGap={40}
              />
              <YAxis
                domain={[min - pad, max + pad]}
                tickFormatter={v => v.toLocaleString("de-DE", { style:"currency", currency:"EUR" })}
                tick={{ fill:"#888" }}
                axisLine={{ stroke:"#444" }}
                tickLine={{ stroke:"#444" }}
                width={80}
              />
              <Tooltip
                contentStyle={{ background:"rgba(22,26,33,0.9)", borderColor:"#444", borderRadius:8 }}
                formatter={(val:number) => [`${val.toLocaleString("de-DE",{style:"currency",currency:"EUR"})}`, "Preis"]}
                labelFormatter={d => format(new Date(d), "MMMM yyyy")}
              />
              <ReferenceLine
                y={selectedAsset.price}
                stroke="#666"
                strokeDasharray="3 3"
                label={{ value:"Aktuell", position:"right", fill:"#888" }}
              />
              <Line type="monotone" dataKey="price" stroke="#4A9DFF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

// Hilfsfunktionen
function aggregateDaily(data: { date:string; price:number }[]) {
  const out: { date:string; price:number }[] = [];
  let last: string|null = null;
  data.forEach(d => {
    const day = format(new Date(d.date), "yyyy-MM-dd");
    if (day !== last) {
      out.push(d);
      last = day;
    }
  });
  return out;
}
function aggregateWeekly(prices: number[]) {
  const w: number[] = [];
  for (let i = 0; i < prices.length; i += 5) {
    w.push(prices[Math.min(i+4, prices.length-1)]);
  }
  return w;
}
function aggregateMonthly(prices: number[]) {
  const m: number[] = [];
  for (let i = 0; i < prices.length; i += 20) {
    m.push(prices[Math.min(i+19, prices.length-1)]);
  }
  return m;
}
