import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Rider } from "../../types";

interface ActiveRidersChartProps {
  riders: Rider[];
}

export function ActiveRidersChart({ riders }: ActiveRidersChartProps) {
  const activeCount = riders.filter(r => r.status !== "idle").length;

  const data = useMemo(() => {
    // Generate 6 intervals representing the last 30 minutes
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const timeOffset = (5 - i) * 5; // 25m, 20m, 15m, 10m, 5m, 0m ago
      const date = new Date(now.getTime() - timeOffset * 60 * 1000);
      const label = date.toLocaleTimeString("en-JO", { 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: false 
      });
      
      // Seed variation based on active count and interval index
      const variation = Math.sin(i + 1) * 2;
      const count = Math.max(0, activeCount + Math.round(variation));

      return {
        name: label,
        Riders: count
      };
    });
  }, [activeCount]);

  return (
    <div 
      className="bg-white rounded-2xl border border-border p-5 flex flex-col shadow-card hover:shadow-card-hover transition-shadow duration-300"
      style={{ fontFamily: "var(--font-sans)", height: 320 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Riders Active Per Minute
          </h3>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className="text-2xl font-bold text-neutral-900 tracking-tight">
              {activeCount}
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              riders currently in transit
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-sky-50 px-2 py-0.5 rounded text-[10px] font-semibold text-sky-600">
          Last 30 Min
        </div>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <XAxis 
              dataKey="name" 
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              tick={{ fill: "var(--color-text-tertiary)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{ 
                background: "white", 
                border: "1px solid var(--color-border)", 
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-sm)",
                fontSize: 11
              }}
              cursor={{ fill: "var(--color-surface-hover)" }}
            />
            <Bar 
              dataKey="Riders" 
              fill="#38bdf8" 
              radius={[4, 4, 0, 0]}
              animationDuration={800}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
