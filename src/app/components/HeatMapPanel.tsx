import { PANEL_WIDTH } from "../constants";
import { ViewModeSelector }   from "./heatmap/ViewModeSelector";
import { MaterialFilterBar }  from "./heatmap/MaterialFilterBar";
import { DistrictReportCard } from "./heatmap/DistrictReportCard";
import type { HeatMapViewMode, MaterialFilter, District, Rider } from "../types";
import { districtPriorityScore } from "../helpers";

interface HeatMapPanelProps {
  districts: District[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  viewMode: HeatMapViewMode;
  setViewMode: (m: HeatMapViewMode) => void;
  materialFilter: MaterialFilter;
  setMaterialFilter: (f: MaterialFilter) => void;
  idleRiders: Rider[];
  showAmmanBoundary: boolean;
  setShowAmmanBoundary: (v: boolean) => void;
  showRiderHotspots: boolean;
  setShowRiderHotspots: (v: boolean) => void;
  showDensityHeat: boolean;
  setShowDensityHeat: (v: boolean) => void;
}

export function HeatMapPanel({
  districts,
  selectedId,
  onSelect,
  viewMode,
  setViewMode,
  materialFilter,
  setMaterialFilter,
  idleRiders,
}: HeatMapPanelProps) {
  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ width: PANEL_WIDTH, flexShrink: 0, borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* View mode selector (replaces 3 toggles) */}
      <ViewModeSelector value={viewMode} onChange={setViewMode} />

      {/* Material filter bar */}
      <MaterialFilterBar value={materialFilter} onChange={setMaterialFilter} />

      {/* District report card OR district list */}
      {selectedId ? (
        (() => {
          const district = districts.find(d => d.id === selectedId);
          return district
            ? <DistrictReportCard district={district} onBack={() => onSelect(selectedId)} idleRiders={idleRiders} />
            : null;
        })()
      ) : (
        <>
          {/* Priority-sorted district list */}
          <div style={{ padding: "8px 16px 4px", background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Districts — Priority
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {[...districts]
              .sort((a, b) => districtPriorityScore(b) - districtPriorityScore(a))
              .map((d, i) => {
                const gap = d.co2Potential - d.co2Achieved;
                const gapPct = Math.round((gap / d.co2Potential) * 100);
                const achievedPct = 100 - gapPct;
                const isHighPriority = gapPct >= 70;
                return (
                  <button
                    key={d.id}
                    onClick={() => onSelect(d.id)}
                    className="w-full text-left px-4 py-3 border-b transition-colors focus-ring"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-disabled)", width: 14 }}>#{i + 1}</span>
                      {isHighPriority && (
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-danger-600)", flexShrink: 0, display: "inline-block" }} className="animate-pulse-soft" />
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", flex: 1 }}>{d.name}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: gapPct >= 70 ? "var(--color-danger-600)" : "var(--color-text-secondary)" }}>
                        {gapPct}% gap
                      </span>
                    </div>
                    <div style={{ marginLeft: 22, height: 5, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden", marginBottom: 4 }}>
                      <div style={{ height: "100%", width: `${achievedPct}%`, borderRadius: "var(--radius-full)", background: "var(--color-brand-600)" }} />
                    </div>
                    <div style={{ marginLeft: 22, display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{d.orderCount} orders</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-brand-600)", fontWeight: 600 }}>
                        {d.co2Potential.toLocaleString()} kg potential
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
