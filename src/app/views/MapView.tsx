import { useCallback } from "react";
import { STATUS_CONFIG } from "../constants";
import { useRiders } from "../../hooks/useRiders";
import { useHubs } from "../../hooks/useHubs";
import { useFleetStore } from "../../stores/fleetStore";
import { useAnimationStore } from "../../stores/animationStore";
import { useClock } from "../helpers";
import { fetchOsrmRoute, buildArcFallback } from "../lib/osrm";
import { etaMultiplier } from "../lib/eta";
import { districtFromCoords } from "../lib/performance";
import { LiveMapLayer } from "../components/LiveMapLayer";
import { RiderPanel } from "../components/RiderPanel";

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

  return (
    <>
      <div className="flex-1 relative min-w-0">
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
        {/* Status pills */}
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
      </div>
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
    </>
  );
}
