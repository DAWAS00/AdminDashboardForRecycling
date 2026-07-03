import { useMemo } from "react";
import { Flame } from "lucide-react";
import { DISTRICTS } from "../constants";
import { useHubs } from "../../hooks/useHubs";
import { useHeatmapStore } from "../../stores/heatmapStore";
import { HeatMapLayer } from "../components/HeatMapLayer";
import { HeatMapPanel } from "../components/HeatMapPanel";
import { TimelineSlider } from "../components/heatmap/TimelineSlider";
import { useRiders } from "../../hooks/useRiders";

export function HeatmapView() {
  const { data: hubs = [] }   = useHubs();
  const { data: riders = [] } = useRiders();

  const selectedDistrict   = useHeatmapStore((s) => s.selectedDistrict);
  const toggleDistrict     = useHeatmapStore((s) => s.toggleDistrict);
  const heatMapViewMode    = useHeatmapStore((s) => s.viewMode);
  const setHeatMapViewMode = useHeatmapStore((s) => s.setViewMode);
  const materialFilter     = useHeatmapStore((s) => s.materialFilter);
  const setMaterialFilter  = useHeatmapStore((s) => s.setMaterialFilter);
  const timeOfDay          = useHeatmapStore((s) => s.timeOfDay);

  // Dynamic simulation data that changes based on Morning, Afternoon, and Evening collection flows
  const adjustedDistricts = useMemo(() => {
    return DISTRICTS.map((d) => {
      let multiplier = 1.0;
      if (timeOfDay === "morning") {
        // Morning peak hours focus on corporate & office districts (Shmeisani, Sweifieh, University)
        multiplier = ["shmeisani", "sweifieh", "tlaa_ali", "university"].includes(d.id) ? 1.25 : 0.7;
      } else if (timeOfDay === "evening") {
        // Evening peak hours focus on dining, restaurant & retail hubs (Downtown, Abdoun, 8th Circle)
        multiplier = ["downtown", "abdoun", "eighth_circle"].includes(d.id) ? 1.35 : 0.65;
      }
      
      const newAchieved = Math.min(d.co2Potential, Math.round(d.co2Achieved * multiplier));
      const newOrders = Math.max(1, Math.round(d.orderCount * multiplier));

      // Adjust material breakdowns accordingly
      const newBreakdown = { ...d.materialBreakdown };
      Object.keys(newBreakdown).forEach((key) => {
        const mat = newBreakdown[key];
        newBreakdown[key] = {
          ...mat,
          achieved: Math.min(mat.potential, Math.round(mat.achieved * multiplier)),
        };
      });

      return {
        ...d,
        co2Achieved: newAchieved,
        orderCount: newOrders,
        materialBreakdown: newBreakdown,
      };
    });
  }, [timeOfDay]);

  return (
    <>
      <div className="flex-1 relative min-w-0">
        <HeatMapLayer
          districts={adjustedDistricts}
          selectedId={selectedDistrict}
          onSelect={toggleDistrict}
          viewMode={heatMapViewMode}
          materialFilter={materialFilter}
          hubs={hubs}
          showAmmanBoundary={heatMapViewMode === "overview" || heatMapViewMode === "demand"}
          showRiderHotspots={heatMapViewMode === "demand"}
          showDensityHeat={heatMapViewMode === "demand"}
          showHubCoverage={heatMapViewMode === "hubs"}
        />
        <TimelineSlider />
        {/* CO₂ legend — compact card with gradient strip */}
        <div
          className="absolute top-3 left-3 z-[500] rounded-lg"
          style={{
            background: "white",
            boxShadow: "var(--shadow-sm)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-3)",
            width: 168,
          }}
        >
          <div className="flex items-center gap-1.5" style={{ marginBottom: "var(--space-2)" }}>
            <Flame size={11} style={{ color: "var(--color-danger-600)" }} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "var(--color-text-tertiary)",
                letterSpacing: "0.08em",
              }}
            >
              CO₂ SAVINGS GAP
            </span>
          </div>

          {/* Continuous gradient strip — red (high gap) → green (low gap) */}
          <div
            style={{
              height: 8,
              borderRadius: "var(--radius-full)",
              background:
                "linear-gradient(90deg, var(--color-red-500) 0%, var(--color-amber-500) 28%, var(--color-brand-300) 52%, var(--color-brand-500) 76%, var(--color-brand-700) 100%)",
              marginBottom: 4,
            }}
          />
          <div className="flex justify-between">
            <span style={{ fontSize: 10, color: "var(--color-neutral-500)" }}>≥70%</span>
            <span style={{ fontSize: 10, color: "var(--color-neutral-400)" }}>unrealized</span>
            <span style={{ fontSize: 10, color: "var(--color-neutral-500)" }}>&lt;10%</span>
          </div>
        </div>
      </div>
      <HeatMapPanel
        districts={adjustedDistricts}
        selectedId={selectedDistrict}
        onSelect={toggleDistrict}
        viewMode={heatMapViewMode}
        setViewMode={setHeatMapViewMode}
        materialFilter={materialFilter}
        setMaterialFilter={setMaterialFilter}
        idleRiders={riders.filter((r) => r.status === "idle")}
        showAmmanBoundary={heatMapViewMode !== "hubs"}
        setShowAmmanBoundary={() => {}}
        showRiderHotspots={heatMapViewMode === "demand"}
        setShowRiderHotspots={() => {}}
        showDensityHeat={heatMapViewMode === "demand"}
        setShowDensityHeat={() => {}}
      />
    </>
  );
}
