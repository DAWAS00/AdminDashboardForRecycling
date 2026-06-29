import { useCallback } from "react";
import { Plus } from "lucide-react";

import type { Hub } from "./types";
import { HUB_STATUS_CONFIG, DISTRICTS, STATUS_CONFIG } from "./constants";
import { useRiders } from "../hooks/useRiders";
import { useHubs } from "../hooks/useHubs";
import { computeTotals, useClock } from "./helpers";
import { fetchOsrmRoute, buildArcFallback } from "./lib/osrm";
import { etaMultiplier } from "./lib/eta";
import { districtFromCoords } from "./lib/performance";

import { useFleetStore } from "../stores/fleetStore";
import { useHubStore } from "../stores/hubStore";
import { useHeatmapStore } from "../stores/heatmapStore";
import { useAnimationStore } from "../stores/animationStore";

import { LeftSidebar } from "./components/LeftSidebar";
import { LiveMapLayer } from "./components/LiveMapLayer";
import { RiderPanel } from "./components/RiderPanel";
import { HeatMapLayer } from "./components/HeatMapLayer";
import { HeatMapPanel } from "./components/HeatMapPanel";
import { HubsMapLayer } from "./components/HubsMapLayer";
import { HubsPanel } from "./components/HubsPanel";
import { AddHubModal } from "./components/AddHubModal";
import { StatsBar } from "./components/StatsBar";
import { PartnersView } from "./components/partners/PartnersView";
import { RouteLayer } from "./components/RouteLayer";
import { ReportsScreen } from "./components/reports/ReportsScreen";
import { CommandPalette } from "./components/CommandPalette";

import { useState } from "react";
import type { ViewId } from "./types";

export default function App() {
  const { data: riders = [], isLoading: ridersLoading } = useRiders();
  const { data: hubs = [], isLoading: hubsLoading, addHub, toggleHubActive, updateHubStatus } = useHubs();

  // Navigation — will migrate to react-router in next step
  const [activeView, setActiveView] = useState<ViewId>("map");

  // Fleet store
  const selectedRider = useFleetStore((s) => s.selectedRiderId);
  const selectRider   = useFleetStore((s) => s.selectRider);
  const showFleetRadar = useFleetStore((s) => s.showFleetRadar);
  const toggleFleetRadar = useFleetStore((s) => s.toggleFleetRadar);

  // Hub store
  const selectedHub  = useHubStore((s) => s.selectedHubId);
  const selectHub    = useHubStore((s) => s.selectHub);
  const placingHub   = useHubStore((s) => s.placingHub);
  const pendingCoords = useHubStore((s) => s.pendingCoords);
  const startPlacing = useHubStore((s) => s.startPlacing);
  const cancelPlacing = useHubStore((s) => s.cancelPlacing);
  const confirmCoords = useHubStore((s) => s.confirmCoords);

  // Heatmap store
  const selectedDistrict  = useHeatmapStore((s) => s.selectedDistrict);
  const toggleDistrict    = useHeatmapStore((s) => s.toggleDistrict);
  const heatMapViewMode   = useHeatmapStore((s) => s.viewMode);
  const setHeatMapViewMode = useHeatmapStore((s) => s.setViewMode);
  const materialFilter    = useHeatmapStore((s) => s.materialFilter);
  const setMaterialFilter = useHeatmapStore((s) => s.setMaterialFilter);

  // Animation store
  const activeRoute           = useAnimationStore((s) => s.activeRoute);
  const setActiveRoute        = useAnimationStore((s) => s.setActiveRoute);
  const updateRouteProgress   = useAnimationStore((s) => s.updateRouteProgress);
  const completeTrip          = useAnimationStore((s) => s.completeTrip);
  const completedTrips        = useAnimationStore((s) => s.completedTrips);

  const time = useClock();

  const handleOrderClick = async (riderId: string, orderId: string) => {
    const rider = riders.find((r) => r.id === riderId);
    const order = rider?.orders.find((o) => o.id === orderId);
    if (!rider || !order) return;

    const activeHubs = hubs.filter((h) => h.active);
    if (activeHubs.length === 0) return;

    const nearestHub = activeHubs.reduce((best, h) =>
      Math.hypot(h.lat - rider.lat, h.lng - rider.lng) <
      Math.hypot(best.lat - rider.lat, best.lng - rider.lng)
        ? h
        : best
    );

    const arc = buildArcFallback(nearestHub.lat, nearestHub.lng, order.deliveryLat, order.deliveryLng);
    const mult = etaMultiplier();
    setActiveRoute({
      orderId, riderId,
      route: { ...arc, adjustedDurationSeconds: arc.durationSeconds * mult },
      currentCoordIndex: 0,
      startedAt: Date.now(),
      progressPct: 0,
    });

    try {
      const real = await fetchOsrmRoute(nearestHub.lat, nearestHub.lng, order.deliveryLat, order.deliveryLng);
      const realAdj = { ...real, adjustedDurationSeconds: real.durationSeconds * mult };
      setActiveRoute(
        activeRoute?.orderId === orderId
          ? { ...activeRoute, route: realAdj, startedAt: Date.now() }
          : null
      );
    } catch { /* keep arc */ }
  };

  const handleAnimationComplete = useCallback(() => {
    if (!activeRoute) return;
    const rider = riders.find((r) => r.id === activeRoute.riderId);
    const order = rider?.orders.find((o) => o.id === activeRoute.orderId);
    if (!rider || !order) return;

    const completedAt  = Date.now();
    const actualSeconds = (completedAt - activeRoute.startedAt) / 1000;
    completeTrip({
      orderId:             activeRoute.orderId,
      riderId:             activeRoute.riderId,
      riderName:           rider.name,
      startedAt:           activeRoute.startedAt,
      completedAt,
      actualSeconds:       Math.round(actualSeconds),
      osrmEstimateSeconds: activeRoute.route.adjustedDurationSeconds,
      distanceKm:          activeRoute.route.distanceKm,
      efficiencyScore:     Math.round((activeRoute.route.adjustedDurationSeconds / actualSeconds) * 100),
      district:            districtFromCoords(order.deliveryLat, order.deliveryLng),
      co2Saved:            order.co2Saved,
      earnings:            order.earnings,
      material:            order.material,
    });
  }, [activeRoute, riders, completeTrip]);

  const handleAddHub = useCallback(
    async (data: Omit<Hub, "id">) => {
      await addHub.mutateAsync(data);
      cancelPlacing();
    },
    [addHub, cancelPlacing]
  );

  const totals = computeTotals(riders);

  if (ridersLoading || hubsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--color-neutral-950)", color: "var(--color-neutral-400)", fontFamily: "var(--font-sans)", fontSize: 15, gap: 12 }}>
        <div style={{ width: 20, height: 20, border: "2px solid var(--color-brand-600)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Connecting to Supabase…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const viewTitle: Record<ViewId, string> = {
    map:      "Live Operations Map",
    heatmap:  "CO₂ Savings Heat Map",
    hubs:     "Collection Hub Management",
    partners: "Partners & Rewards",
    reports:  "Reports",
  };

  const viewSubtitle: Record<ViewId, string> = {
    map:      `Amman, Jordan — tracking ${riders.filter((r) => r.status !== "idle").length} active riders`,
    heatmap:  "District-level CO₂ savings potential across Amman",
    hubs:     `${hubs.filter((h) => h.active).length} active hubs · ${hubs.filter((h) => h.status === "ready").length} ready to ship`,
    partners: "Manage partner tiers, contracts, and rewards",
    reports:  "",
  };

  return (
    <div className="size-full flex" style={{ fontFamily: "var(--font-sans)", background: "var(--color-neutral-50)" }}>
      <LeftSidebar
        activeNav={activeView}
        onNav={(v) => {
          setActiveView(v);
          useFleetStore.getState().reset();
          useHubStore.getState().reset();
          useHeatmapStore.getState().selectDistrict(null);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, color: "var(--color-neutral-900)" }}>{viewTitle[activeView]}</h1>
            {viewSubtitle[activeView] && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-brand-600)", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-neutral-400)" }}>{viewSubtitle[activeView]}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeView === "map" && (
              <button
                aria-label={showFleetRadar ? "Disable fleet radar" : "Enable fleet radar"}
                aria-pressed={showFleetRadar}
                onClick={toggleFleetRadar}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border"
                style={{
                  background:   showFleetRadar ? "var(--color-brand-600)" : "white",
                  color:        showFleetRadar ? "white" : "var(--color-neutral-500)",
                  borderColor:  "var(--color-border)",
                  cursor:       "pointer",
                }}
              >
                Fleet Radar
              </button>
            )}
            {activeView === "hubs" && (
              <button
                onClick={() => (placingHub ? cancelPlacing() : startPlacing())}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: placingHub ? "var(--color-amber-50)" : "var(--color-brand-600)",
                  color:      placingHub ? "var(--color-amber-700)" : "white",
                }}
              >
                <Plus size={14} />
                {placingHub ? "Click map to place…" : "Add Hub"}
              </button>
            )}
            <div className="text-right">
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-neutral-400)", letterSpacing: "0.08em" }}>LOCAL TIME</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500, color: "var(--color-neutral-900)" }}>
                {time.toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "var(--color-brand-50)" }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--color-brand-600)", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--color-brand-600)" }}>LIVE</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 relative min-w-0">
            {activeView === "map" && (
              <>
                <LiveMapLayer
                  riders={riders}
                  hubs={hubs}
                  selectedId={selectedRider}
                  onSelect={selectRider}
                  activeRoute={activeRoute}
                  onAnimationStep={updateRouteProgress}
                  onAnimationComplete={handleAnimationComplete}
                  fleetRadar={showFleetRadar}
                />
                <div className="absolute top-3 left-3 z-[500] flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = riders.filter((r) => r.status === key).length;
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--color-neutral-900)" }}>{count}</span>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-neutral-400)" }}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {activeView === "heatmap" && (
              <>
                <HeatMapLayer
                  districts={DISTRICTS}
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
                <div className="absolute top-3 left-3 z-[500] px-3 py-2 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700, color: "var(--color-neutral-400)", letterSpacing: "0.08em", marginBottom: 6 }}>CO₂ SAVINGS GAP</div>
                  {[
                    ["var(--color-red-500)",    "≥70% unrealized"],
                    ["var(--color-amber-500)",  "50–70%"],
                    ["var(--color-brand-300)",  "30–50%"],
                    ["var(--color-brand-500)",  "10–30%"],
                    ["var(--color-brand-700)",  "< 10%"],
                  ].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c }} />
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 10, color: "var(--color-neutral-400)" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeView === "hubs" && (
              <>
                <HubsMapLayer hubs={hubs} selectedId={selectedHub} onSelect={selectHub} placing={placingHub} onPlace={confirmCoords} />
                {placingHub && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-lg" style={{ background: "var(--color-amber-50)", border: "1.5px solid var(--color-amber-400)", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600, color: "var(--color-amber-700)" }}>Click anywhere on the map to place the hub</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 z-[500] flex gap-2" style={{ display: placingHub ? "none" : "flex" }}>
                  {Object.entries(HUB_STATUS_CONFIG).map(([key, cfg]) => {
                    const count = hubs.filter((h) => h.status === key && h.active).length;
                    if (count === 0) return null;
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, color: "var(--color-neutral-900)" }}>{count}</span>
                        <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-neutral-400)" }}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
                {pendingCoords && (
                  <AddHubModal
                    lat={pendingCoords.lat}
                    lng={pendingCoords.lng}
                    onConfirm={handleAddHub}
                    onCancel={cancelPlacing}
                  />
                )}
              </>
            )}

            {activeView === "partners" && <PartnersView />}
            {activeView === "reports" && <ReportsScreen />}
          </div>

          {activeView === "map" && (
            <RiderPanel
              riders={riders}
              selectedId={selectedRider}
              onSelect={selectRider}
              onClose={() => selectRider(null)}
              time={time}
              onOrderClick={handleOrderClick}
              activeRoute={activeRoute}
              completedTrips={completedTrips}
            />
          )}
          {activeView === "heatmap" && (
            <HeatMapPanel
              districts={DISTRICTS}
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
          )}
          {activeView === "hubs" && (
            <HubsPanel
              hubs={hubs}
              selectedId={selectedHub}
              onSelect={selectHub}
              onToggleActive={(id, active) => toggleHubActive.mutate({ hubId: id, active })}
              onUpdateStatus={(id, status) => updateHubStatus.mutate({ hubId: id, status })}
            />
          )}
        </div>

        <StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} riders={riders} />
      </div>

      <CommandPalette onNav={(v) => {
        setActiveView(v);
        useFleetStore.getState().reset();
        useHubStore.getState().reset();
      }} />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .rider-tip { background:white; border:1px solid var(--color-border); border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.12); padding:5px 10px; font-family:var(--font-sans); font-size:12px; color:var(--color-neutral-900); white-space:nowrap; }
        .rider-tip::before { display:none; }
        .leaflet-attribution-flag { display:none !important; }
      `}</style>
    </div>
  );
}
