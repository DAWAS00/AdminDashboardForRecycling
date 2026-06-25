import { useState, useCallback } from "react";
import { Wind, Banknote, Activity } from "lucide-react";
import { Rider } from "../types";
import { MATERIAL_CONFIG, METRIC_HISTORY, HistoryMetricKey } from "../constants";
import { AnimatedNumber } from "./AnimatedNumber";
import { MetricSparkline } from "./MetricSparkline";
import { StatDetailSheet } from "./StatDetailSheet";
interface StatsBarProps {
  co2: number;
  earnings: number;
  byMaterial: Record<string, number>;
  riders: Rider[];
}

interface TileSpec {
  id: HistoryMetricKey;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  value: number;
  unit: string;
  sparkline: number[];
}

export function StatsBar({ co2, earnings, byMaterial, riders }: StatsBarProps) {
  const [activeMetric, setActiveMetric] = useState<HistoryMetricKey | null>(null);

  const toggle = useCallback((key: HistoryMetricKey) => {
    setActiveMetric(prev => (prev === key ? null : key));
  }, []);

  const tiles: TileSpec[] = [
    {
      id: "co2",
      label: "CO₂ Saved",
      sublabel: "Live",
      icon: <Wind size={14} color="var(--brand-600)" aria-hidden="true" />,
      color: "var(--brand-600)",
      value: co2,
      unit: "kg",
      sparkline: METRIC_HISTORY.daily.co2.slice(-7).map(p => p.value),
    },
    {
      id: "earnings",
      label: "Earnings",
      sublabel: "Live",
      icon: <Banknote size={14} color="var(--amber-600)" aria-hidden="true" />,
      color: "var(--amber-600)",
      value: earnings,
      unit: "JD",
      sparkline: METRIC_HISTORY.daily.earnings.slice(-7).map(p => p.value),
    },
    ...Object.entries(MATERIAL_CONFIG).map(([name, cfg]) => ({
      id: name as HistoryMetricKey,
      label: name,
      sublabel: "Live",
      icon: <cfg.Icon size={13} color={cfg.color} aria-hidden="true" />,
      color: cfg.color,
      value: byMaterial[name] ?? 0,
      unit: cfg.unit,
      sparkline: METRIC_HISTORY.daily[name as HistoryMetricKey]?.slice(-7).map(p => p.value) || [],
    })),
  ];

  return (
    <>
      <div
        role="region"
        aria-label="Live map statistics"
        className="flex-shrink-0 w-full"
        style={{
          height: "var(--statsbar-height)",
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "6px 8px",
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* Live map indicator */}
        <div
          className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md"
          style={{ background: "var(--muted)" }}
        >
          <Activity size={12} color="var(--danger-600)" aria-hidden="true" />
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--text-secondary)", letterSpacing: "0.06em" }}
          >
            Live Map
          </span>
        </div>

        <div className="w-px h-8 flex-shrink-0" style={{ background: "var(--border)" }} />

        {tiles.map(tile => (
          <MetricTile
            key={tile.id}
            tile={tile}
            isActive={activeMetric === tile.id}
            onClick={() => toggle(tile.id)}
          />
        ))}
      </div>

      <StatDetailSheet metric={activeMetric} onClose={() => setActiveMetric(null)} riders={riders} />
    </>
  );
}

interface MetricTileProps {
  tile: TileSpec;
  isActive: boolean;
  onClick: () => void;
}

function MetricTile({ tile, isActive, onClick }: MetricTileProps) {
  const isEmpty = tile.value === 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View ${tile.label} details by day, week and month`}
      aria-expanded={isActive}
      className="flex-1 min-w-0 h-full rounded-lg px-2 py-1 flex items-center gap-2 transition-colors focus-ring"
      style={{
        background: isActive ? "var(--brand-50)" : "transparent",
        borderTop: isActive ? `2px solid ${tile.color}` : "2px solid transparent",
        outline: "none",
      }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "var(--muted)"; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
    >
      <div
        className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: `${tile.color}18` }}
      >
        {tile.icon}
      </div>

      <div className="min-w-0 flex-1 text-left">
        <div
          className="text-[9px] font-bold uppercase tracking-wider truncate"
          style={{ color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
        >
          {tile.label}
        </div>
        <div className="flex items-baseline gap-1">
          <span
            className="text-sm font-bold"
            style={{ fontFamily: "var(--font-mono)", color: isEmpty ? "var(--text-disabled)" : tile.color, fontVariantNumeric: "tabular-nums" }}
          >
            {isEmpty ? "—" : <AnimatedNumber value={tile.value} decimals={tile.id === "earnings" ? 2 : 1} />}
          </span>
          {!isEmpty && (
            <span
              className="text-[10px]"
              style={{ fontFamily: "var(--font-sans)", color: "var(--text-tertiary)" }}
            >
              {tile.unit}
            </span>
          )}
        </div>
      </div>

      <MetricSparkline data={tile.sparkline} color={tile.color} width={40} height={16} />
    </button>
  );
}
