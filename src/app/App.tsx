import { useState, useCallback } from "react";
import { Plus, BarChart2, FileText } from "lucide-react";

import { ViewId, Hub, HeatMapViewMode, MaterialFilter, ActiveRoute, CompletedTrip } from "./types";
import { RIDERS, ONLINE_COUNT, INITIAL_HUBS, HUB_STATUS_CONFIG, DISTRICTS, STATUS_CONFIG } from "./constants";
import { computeTotals, useClock } from "./helpers";
import { fetchOsrmRoute, buildArcFallback } from "./lib/osrm";
import { etaMultiplier } from "./lib/eta";
import { districtFromCoords } from "./lib/performance";

import { LeftSidebar } from "./components/LeftSidebar";
import { LiveMapLayer } from "./components/LiveMapLayer";
import { RiderPanel } from "./components/RiderPanel";
import { HeatMapLayer } from "./components/HeatMapLayer";
import { HeatMapPanel } from "./components/HeatMapPanel";
import { HubsMapLayer } from "./components/HubsMapLayer";
import { HubsPanel } from "./components/HubsPanel";
import { AddHubModal } from "./components/AddHubModal";
import { StatsBar } from "./components/StatsBar";
import { PlaceholderView } from "./components/PlaceholderView";
import { RouteLayer } from "./components/RouteLayer";
import { ReportsView } from "./components/ReportsView";

export default function App() {
  const [activeView, setActiveView]     = useState<ViewId>("map");
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedHub, setSelectedHub]   = useState<number | null>(null);
  const [hubs, setHubs]                 = useState<Hub[]>(INITIAL_HUBS);
  const [placingHub, setPlacingHub]     = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showAmmanBoundary, setShowAmmanBoundary] = useState(true);
  const [showRiderHotspots, setShowRiderHotspots] = useState(true);
  const [showDensityHeat, setShowDensityHeat] = useState(true);
  const [heatMapViewMode, setHeatMapViewMode] = useState<HeatMapViewMode>("overview");
  const [materialFilter, setMaterialFilter]   = useState<MaterialFilter>("all");
  const time = useClock();

  const [activeRoute, setActiveRoute]       = useState<ActiveRoute | null>(null);
  const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);
  const [fleetRadar, setFleetRadar]         = useState(false);

  const handleRiderSelect  = useCallback((id: number) => setSelectedRider(p => p === id ? null : id), []);
  const handleRiderClose   = useCallback(() => setSelectedRider(null), []);
  const handleDistrictSelect = useCallback((id: string) => setSelectedDistrict(p => p === id ? null : id), []);
  const handleHubSelect    = useCallback((id: number) => setSelectedHub(p => p === id ? null : id), []);

  const handleOrderClick = async (riderId: number, orderId: string) => {
    const rider = RIDERS.find(r => r.id === riderId);
    const order = rider?.orders.find(o => o.id === orderId);
    if (!rider || !order) return;

    const nearestHub = hubs
      .filter(h => h.active)
      .reduce((best, h) =>
        Math.hypot(h.lat - rider.lat, h.lng - rider.lng) <
        Math.hypot(best.lat - rider.lat, best.lng - rider.lng) ? h : best,
        hubs.filter(h => h.active)[0]
      );

    if (!nearestHub) return;

    // Show arc immediately — never blank while OSRM loads
    const arc = buildArcFallback(nearestHub.lat, nearestHub.lng, order.deliveryLat, order.deliveryLng);
    const mult = etaMultiplier();
    setActiveRoute({
      orderId, riderId,
      route: { ...arc, adjustedDurationSeconds: arc.durationSeconds * mult },
      currentCoordIndex: 0, startedAt: Date.now(), progressPct: 0,
    });

    // Upgrade to real route when OSRM responds
    try {
      const real = await fetchOsrmRoute(nearestHub.lat, nearestHub.lng, order.deliveryLat, order.deliveryLng);
      const realAdj = { ...real, adjustedDurationSeconds: real.durationSeconds * mult };
      setActiveRoute(prev =>
        prev?.orderId === orderId
          ? { ...prev, route: realAdj, startedAt: Date.now() }
          : prev
      );
    } catch { /* keep arc — already set */ }
  };

  const handleAnimationStep = (coordIndex: number) => {
    setActiveRoute(prev => {
      if (!prev) return null;
      const progressPct = Math.round(
        (coordIndex / Math.max(prev.route.coords.length - 1, 1)) * 100
      );
      return { ...prev, currentCoordIndex: coordIndex, progressPct };
    });
  };

  const handleAnimationComplete = () => {
    setActiveRoute(prev => {
      if (!prev) return null;
      const rider = RIDERS.find(r => r.id === prev.riderId);
      const order = rider?.orders.find(o => o.id === prev.orderId);
      if (!rider || !order) return null;

      const completedAt   = Date.now();
      const actualSeconds = (completedAt - prev.startedAt) / 1000;
      const efficiencyScore = Math.round(
        (prev.route.adjustedDurationSeconds / actualSeconds) * 100
      );

      setCompletedTrips(trips => [...trips, {
        orderId:             prev.orderId,
        riderId:             prev.riderId,
        riderName:           rider.name,
        startedAt:           prev.startedAt,
        completedAt,
        actualSeconds:       Math.round(actualSeconds),
        osrmEstimateSeconds: prev.route.adjustedDurationSeconds,
        distanceKm:          prev.route.distanceKm,
        efficiencyScore,
        district: districtFromCoords(order.deliveryLat, order.deliveryLng),
        co2Saved:   order.co2Saved,
        earnings:   order.earnings,
        material:   order.material,
      }]);

      return null; // clear active route
    });
  };

  const handlePlace = useCallback((lat: number, lng: number) => {
    setPendingCoords({ lat, lng });
    setPlacingHub(false);
  }, []);

  const handleAddHub = useCallback((data: Omit<Hub, "id">) => {
    setHubs(prev => [...prev, { ...data, id: Date.now() }]);
    setPendingCoords(null);
  }, []);

  const totals = computeTotals(RIDERS);

  const viewTitle: Record<ViewId, string> = {
    map: "Live Operations Map",
    heatmap: "CO₂ Savings Heat Map",
    hubs: "Collection Hub Management",
    co2: "CO₂ Statistics",
    reports: "Reports",
  };

  const viewSubtitle: Record<ViewId, string> = {
    map: `Amman, Jordan — tracking ${ONLINE_COUNT} active riders`,
    heatmap: "District-level CO₂ savings potential across Amman",
    hubs: `${hubs.filter(h => h.active).length} active hubs · ${hubs.filter(h => h.status === "ready").length} ready to ship`,
    co2: "",
    reports: "",
  };

  return (
    <div className="size-full flex" style={{ fontFamily: "'DM Sans',sans-serif", background: "#F4F6F5" }}>
      <LeftSidebar
        activeNav={activeView}
        onNav={v => {
          setActiveView(v);
          setSelectedRider(null);
          setSelectedDistrict(null);
          setSelectedHub(null);
          setPlacingHub(false);
          setPendingCoords(null);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div>
            <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>{viewTitle[activeView]}</h1>
            {viewSubtitle[activeView] && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#1E5C35", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>{viewSubtitle[activeView]}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {/* Fleet Radar button */}
            {activeView === "map" && (
              <button
                aria-label={fleetRadar ? "Disable fleet radar" : "Enable fleet radar"}
                aria-pressed={fleetRadar}
                onClick={() => setFleetRadar(r => !r)}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border"
                style={{
                  background: fleetRadar ? "var(--color-brand-600)" : "white",
                  color: fleetRadar ? "white" : "var(--color-text-secondary)",
                  borderColor: "var(--color-border)",
                  cursor: "pointer",
                }}
              >
                Fleet Radar
              </button>
            )}
            {/* Add Hub button */}
            {activeView === "hubs" && (
              <button
                onClick={() => { setPlacingHub(p => !p); setPendingCoords(null); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: placingHub ? "#FEF3C7" : "#1E5C35", color: placingHub ? "#C8860A" : "white" }}
              >
                <Plus size={14} />
                {placingHub ? "Click map to place…" : "Add Hub"}
              </button>
            )}
            <div className="text-right">
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#94A3B8", letterSpacing: "0.08em" }}>LOCAL TIME</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 14, fontWeight: 500, color: "#1a1a1a" }}>
                {time.toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "#D1FAE5" }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#1E5C35", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#1E5C35" }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* Main area */}
        <div className="flex flex-1 min-h-0">
          {/* Map / content */}
          <div className="flex-1 relative min-w-0">

            {activeView === "map" && (
              <>
                <LiveMapLayer
                  riders={RIDERS}
                  selectedId={selectedRider}
                  onSelect={handleRiderSelect}
                  activeRoute={activeRoute}
                  onAnimationStep={handleAnimationStep}
                  onAnimationComplete={handleAnimationComplete}
                  fleetRadar={fleetRadar}
                />
                {/* Status pills */}
                <div className="absolute top-3 left-3 z-[500] flex gap-2 flex-wrap">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = RIDERS.filter(r => r.status === key).length;
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{count}</span>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>{cfg.label}</span>
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
                  onSelect={handleDistrictSelect}
                  viewMode={heatMapViewMode}
                  materialFilter={materialFilter}
                  hubs={hubs}
                  showAmmanBoundary={heatMapViewMode === "overview" || heatMapViewMode === "demand"}
                  showRiderHotspots={heatMapViewMode === "demand"}
                  showDensityHeat={heatMapViewMode === "demand"}
                  showHubCoverage={heatMapViewMode === "hubs"}
                />
                {/* Legend overlay */}
                <div className="absolute top-3 left-3 z-[500] px-3 py-2 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em", marginBottom: 6 }}>CO₂ SAVINGS GAP</div>
                  {[["#ef4444","≥70% unrealized"],["#f59e0b","50–70%"],["#84cc16","30–50%"],["#22c55e","10–30%"],["#1E5C35","< 10%"]].map(([c, l]) => (
                    <div key={l} className="flex items-center gap-2 mb-1">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c }} />
                      <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#64748B" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeView === "hubs" && (
              <>
                <HubsMapLayer hubs={hubs} selectedId={selectedHub} onSelect={handleHubSelect} placing={placingHub} onPlace={handlePlace} />
                {placingHub && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-lg" style={{ background: "#FEF3C7", border: "1.5px solid #C8860A", boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600, color: "#C8860A" }}>Click anywhere on the map to place the hub</span>
                  </div>
                )}
                {/* Hub status pills */}
                <div className="absolute top-3 left-3 z-[500] flex gap-2" style={{ display: placingHub ? "none" : "flex" }}>
                  {Object.entries(HUB_STATUS_CONFIG).map(([key, cfg]) => {
                    const count = hubs.filter(h => h.status === key && h.active).length;
                    if (count === 0) return null;
                    return (
                      <div key={key} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "white", boxShadow: "0 1px 6px rgba(0,0,0,0.1)" }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, fontWeight: 700, color: "#1a1a1a" }}>{count}</span>
                        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#64748B" }}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
                {/* Add hub modal */}
                {pendingCoords && (
                  <AddHubModal lat={pendingCoords.lat} lng={pendingCoords.lng}
                    onConfirm={handleAddHub} onCancel={() => setPendingCoords(null)} />
                )}
              </>
            )}

            {activeView === "co2" && <PlaceholderView icon={BarChart2} title="CO₂ Statistics" desc="Charts and analytics coming soon" />}
            {activeView === "reports" && (
              <ReportsView completedTrips={completedTrips} />
            )}
          </div>

          {/* Right panel */}
          {activeView === "map" && (
            <RiderPanel
              riders={RIDERS}
              selectedId={selectedRider}
              onSelect={handleRiderSelect}
              onClose={handleRiderClose}
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
              onSelect={handleDistrictSelect}
              viewMode={heatMapViewMode}
              setViewMode={setHeatMapViewMode}
              materialFilter={materialFilter}
              setMaterialFilter={setMaterialFilter}
              idleRiders={RIDERS.filter(r => r.status === "idle")}
              showAmmanBoundary={heatMapViewMode !== "hubs"}
              setShowAmmanBoundary={() => {}}
              showRiderHotspots={heatMapViewMode === "demand"}
              setShowRiderHotspots={() => {}}
              showDensityHeat={heatMapViewMode === "demand"}
              setShowDensityHeat={() => {}}
            />
          )}
          {activeView === "hubs" && (
            <HubsPanel hubs={hubs} setHubs={setHubs} selectedId={selectedHub} onSelect={handleHubSelect} />
          )}
        </div>

        <StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} riders={RIDERS} />
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .rider-tip { background:white; border:1px solid #E2E8F0; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.12); padding:5px 10px; font-family:'DM Sans',sans-serif; font-size:12px; color:#1a1a1a; white-space:nowrap; }
        .rider-tip::before { display:none; }
        .leaflet-attribution-flag { display:none !important; }
      `}</style>
    </div>
  );
}
