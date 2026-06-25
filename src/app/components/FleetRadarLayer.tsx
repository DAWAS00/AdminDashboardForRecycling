import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Rider } from "../types";
import { fetchOsrmRoute, buildArcFallback } from "../lib/osrm";
import { INITIAL_HUBS } from "../constants";

interface FleetRadarLayerProps {
  map: L.Map | null;
  riders: Rider[];
  activeRouteRiderId: number | null;
}

export function FleetRadarLayer({ map, riders, activeRouteRiderId }: FleetRadarLayerProps) {
  const layersRef = useRef<L.Layer[]>([]);

  function clearLayers() {
    layersRef.current.forEach(l => l.remove());
    layersRef.current = [];
  }

  useEffect(() => {
    if (!map) return;
    clearLayers();

    const delivering = riders.filter(r => r.status === "delivering");
    if (delivering.length === 0) return;

    let cancelled = false;

    delivering.forEach(async (rider) => {
      const order = rider.orders.find(o => o.status === "inTransit");
      if (!order) return;

      const hub = INITIAL_HUBS.filter(h => h.active).reduce((best, h) =>
        Math.hypot(h.lat - rider.lat, h.lng - rider.lng) <
        Math.hypot(best.lat - rider.lat, best.lng - rider.lng) ? h : best
      );

      let route;
      try {
        route = await fetchOsrmRoute(hub.lat, hub.lng, order.deliveryLat, order.deliveryLng);
      } catch {
        route = buildArcFallback(hub.lat, hub.lng, order.deliveryLat, order.deliveryLng);
      }

      if (cancelled) return;

      const isHighlighted = rider.id === activeRouteRiderId;
      const polyline = L.polyline(route.coords, {
        color:   "#1E5C35",
        weight:  isHighlighted ? 4 : 2,
        opacity: isHighlighted ? 1.0 : 0.2,
        dashArray: "8, 6",
      }).bindTooltip(`${rider.name} · ${route.distanceKm} km`, { direction: "top" });

      polyline.addTo(map);
      layersRef.current.push(polyline);
    });

    return () => { cancelled = true; clearLayers(); };
  }, [map, riders, activeRouteRiderId]);

  return null;
}
