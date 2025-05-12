import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  ReferenceDot,
  Label
} from "recharts";

interface SPYChartProps {
  timeframe: "daily" | "weekly" | "monthly";
  animationDelay?: string;
}

// Data-Point-Type für SPY.json
interface SPYDataPoint {
  date: string;  // z.B. "2025-05-01"
  adj: number;   // angepasster Schlusskurs
}

// Loader-Funktion für SPY-Zeitreihe
async function loadSPYTimeSeries(): Promise<SPYDataPoint[]> {
  const res = await fetch(`/data/timeseries/SPY.json`, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`Fehler beim Laden der SPY-Daten: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export default function SPYChart({ timeframe, animationDelay }: SPYChartProps) {
  // 1) Komplettes Roh-Array
  const [rawData, setRawData] = useState<SPYDataPoint[]>([]);
  // 2) Für den Chart zurechtgeschnitten (date/value)
  const [data, setData] = useState<{ date: string; value: number }[]>([]);

  // Erst beim Mount die ganze Zeitreihe holen
  useEffect(() => {
    loadSPYTimeSeries()
      .then(setRawData)
      .catch(err => {
        console.error(err);
        setRawData([]);
      });
  }, []);

  // Jedes Mal, wenn rawData oder timeframe ändert, slice für Chart
  useEffect(() => {
    if (!rawData.length) {
      setData([]);
      return;
    }

    // Länge je nach Auswahl
    const len = timeframe === "daily" ? 7 : timeframe === "weekly" ? 30 : 90;

    // Map auf { date, value } und slice die letzten len Einträge
    const arr = rawData.map(pt => ({ date: pt.date, value: pt.adj }));
    setData(arr.slice(-len));
  }, [rawData, timeframe]);

  if (!data.length) return null; // oder ein Loading-Spinner

  // Chart-Berechnungen
  const start = data[0];
  const end = data[data.length - 1];
  const prices = data.map(d => d.value);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return (
    <div className="p-4 rounded-lg border bg-card" style={{ animationDelay }}>
      <h3 className="text-sm font-medium mb-2">
        S&P 500 Trend ({timeframe === "daily" ? "1W" : timeframe === "weekly" ? "1M" : "3M"})
      </h3>
      <div className="w-full h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              ticks={[start.date, end.date]}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              ticks={[minPrice, maxPrice]}
              tickFormatter={v => v.toFixed(0)}
              domain={[minPrice, maxPrice]}
            />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />

            <ReferenceDot x={start.date} y={start.value} r={0}>
              <Label value={start.value.toFixed(0)} position="insideBottomLeft" fill="#888" />
            </ReferenceDot>
            <ReferenceDot x={end.date} y={end.value} r={0}>
              <Label value={end.value.toFixed(0)} position="insideTopRight" fill="#888" />
            </ReferenceDot>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
