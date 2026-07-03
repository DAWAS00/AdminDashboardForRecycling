import { useCallback } from "react";
import { STATUS_CONFIG } from "../constants";
import { useRiders } from "../../hooks/useRiders";
import { useHubs } from "../../hooks/useHubs";
import { useFleetStore } from "../../stores/fleetStore";
import { useAnimationStore } from "../../stores/animationStore";
import { useClock, computeTotals } from "../helpers";
import { fetchOsrmRoute, buildArcFallback } from "../lib/osrm";
import { etaMultiplier } from "../lib/eta";
import { districtFromCoords } from "../lib/performance";
import { LiveMapLayer } from "../components/LiveMapLayer";
import { RiderPanel } from "../components/RiderPanel";
import { ActiveRidersChart } from "../components/charts/ActiveRidersChart";
import { MaterialCompositionChart } from "../components/charts/MaterialCompositionChart";

export function MapView() {
  const { data: riders = [] } = useRiders();
  const { data: hubs = [] }   = useHubs();

  const selectedRider    = useFleetStore((s) => s.selectedRiderId);
  const selectRider      = useFleetStore((s) => s.selectRider);
  const showFleetRadar   = useFleetStore((s) => s.showFleetRadar);

  const time = useClock();

  const activeRoute         = useAnimationStore((s) => s.activeRoute);
  const setActiveRoute      = useAnimationStore((s) => s.setActiveRoute);
  const updateRouteProgress = useAnimationStore((s) => s.updateRouteProgress);
  const completeTrip        = useAnimationStore((s) => s.completeTrip);
  const completedTrips      = useAnimationStore((s) => s.completedTrips);

  const handleOrderClick = async (riderId: string, orderId: string) => {
    const rider = riders.find((r) => r.id === riderId);
    const order = rider?.orders.find((o) => o.id === orderId);
    if (!rider || !order) return;
    const activeHubs = hubs.filter((h) => h.active);
    if (!activeHubs.length) return;
    const nearestHub = activeHubs.reduce((best, h) =>
      Math.hypot(h.lat - rider.lat, h.lng - rider.lng) <
      Math.hypot(best.lat - rider.lat, best.lng - rider.lng) ? h : best
    );
    const arc  = buildArcFallback(nearestHub.lat, nearestHub.lng, order.deliveryLat, order.deliveryLng);
    const mult = etaMultiplier();
    setActiveRoute({ orderId, riderId, route: { ...arc, adjustedDurationSeconds: arc.durationSeconds * mult }, currentCoordIndex: 0, startedAt: Date.now(), progressPct: 0 });
    try {
      const real = await fetchOsrmRoute(nearestHub.lat, nearestHub.lng, order.deliveryLat, order.deliveryLng);
      setActiveRoute({ orderId, riderId, route: { ...real, adjustedDurationSeconds: real.durationSeconds * mult }, currentCoordIndex: 0, startedAt: Date.now(), progressPct: 0 });
    } catch { /* keep arc */ }
  };

  const handleAnimationComplete = useCallback(() => {
    if (!activeRoute) return;
    const rider = riders.find((r) => r.id === activeRoute.riderId);
    const order = rider?.orders.find((o) => o.id === activeRoute.orderId);
    if (!rider || !order) return;
    const completedAt   = Date.now();
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

  const totals = computeTotals(riders);

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      {/* Main scrollable content area on the left */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Rounded Map Card */}
        <div 
          className="bg-white rounded-2xl border border-border overflow-hidden flex flex-col shadow-card hover:shadow-card-hover transition-shadow duration-300"
        >
          {/* Map Header with Filters */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white select-none">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider" style={{ fontFamily: "var(--font-sans)" }}>
              Active Riders Map
            </h3>
            
            {/* Status filters */}
            <div className="flex gap-2 flex-wrap items-center">
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                const count = riders.filter((r) => r.status === key).length;
                return (
                  <div 
                    key={key} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-50 border border-border select-none"
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
                    <span className="text-[10px] font-bold text-neutral-900" style={{ fontFamily: "var(--font-mono)" }}>{count}</span>
                    <span className="text-[10px] text-neutral-500 font-medium" style={{ fontFamily: "var(--font-sans)" }}>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Map Layer Container */}
          <div style={{ height: 480, width: "100%", position: "relative" }}>
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
          </div>
        </div>

        {/* Bottom charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          <ActiveRidersChart riders={riders} />
          <MaterialCompositionChart byMaterial={totals.byMaterial} />
        </div>
      </div>

      {/* Right Fixed panel */}
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
    </div>
  );
}
