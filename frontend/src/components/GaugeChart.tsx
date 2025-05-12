import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ArrowDownRight, ArrowUpRight, LockIcon } from "lucide-react";
import { Timeframe } from "@/lib/timeframe";

interface GaugeChartProps {
  value: number;
  dailyChange: number;
  weeklyChange: number;
  monthlyChange: number;
  timeframe: Timeframe;
}

export default function GaugeChart({ 
  value, 
  dailyChange, 
  weeklyChange,
  monthlyChange,
  timeframe 
}: GaugeChartProps) {
  const change = {
    daily: dailyChange,
    weekly: weeklyChange,
    monthly: monthlyChange
  }[timeframe];

  const timeframeText = {
    daily: "24H",
    weekly: "7D",
    monthly: "30D"
  }[timeframe];

  const isPositive = change >= 0;

  // Data for the gauge chart
  const data = [
    { name: "Value", value: value },
    { name: "Empty", value: 100 - value }
  ];

  return (
    <div className="rounded-lg border border-border bg-card p-5 gradient-border h-[320px] animate-scale-in" style={{ animationDelay: "200ms" }}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <LockIcon size={16} className="text-primary" />
          <h3 className="font-medium">Total Value Locked (Placeholder)</h3>
        </div>
        <div className={`flex items-center text-sm font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{Math.abs(change)}%</span>
          <span className="text-muted-foreground ml-1">{timeframeText}</span>
        </div>
      </div>

      <div className="relative h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="70%"
              outerRadius="90%"
              startAngle={180}
              endAngle={0}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill="#3b82f6" />
              <Cell fill="#1f2937" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold">{value}%</div>
          <div className="text-muted-foreground mt-2">of Target</div>
        </div>
      </div>
    </div>
  );
}