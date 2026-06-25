import { useEffect, useRef } from "react";
import L from "leaflet";
import { Route, Rider } from "../types";
import { makeRiderIcon } from "../helpers";

interface RouteLayerProps {
  map: L.Map | null;
  route: Route | null;
  rider?: Rider | null;
  riderLat: number;
  riderLng: number;
  onAnimationStep: (coordIndex: number) => void;
  onAnimationComplete: () => void;
  coordsPerTick?: number;
  tickMs?: number;
}

export function RouteLayer({
  map, route, rider, riderLat, riderLng,
  onAnimationStep, onAnimationComplete,
  coordsPerTick = 1, tickMs = 250,
}: RouteLayerProps) {
  const polylineRef       = useRef<L.Polyline | null>(null);
  const markerRef         = useRef<L.Marker | null>(null);
  const pickupRef         = useRef<L.Marker | null>(null);
  const deliveryRef       = useRef<L.Marker | null>(null);
  const midpointRef       = useRef<L.Marker | null>(null);
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordIndexRef     = useRef(0);
  const onStepRef         = useRef(onAnimationStep);
  const onCompleteRef     = useRef(onAnimationComplete);

  // Keep callback refs current (stale closure guard)
  useEffect(() => { onStepRef.current = onAnimationStep; },    [onAnimationStep]);
  useEffect(() => { onCompleteRef.current = onAnimationComplete; }, [onAnimationComplete]);

  function clearAllLayers() {
    polylineRef.current?.remove();  polylineRef.current = null;
    markerRef.current?.remove();    markerRef.current   = null;
    pickupRef.current?.remove();    pickupRef.current   = null;
    deliveryRef.current?.remove();  deliveryRef.current = null;
    midpointRef.current?.remove();  midpointRef.current = null;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    coordIndexRef.current = 0;
  }

  useEffect(() => {
    if (!map || !route || !rider) { clearAllLayers(); return; }

    clearAllLayers(); // remove previous route before drawing new one

    const { coords, distanceKm, adjustedDurationSeconds, isFallback } = route;

    // 1 — Route polyline
    polylineRef.current = L.polyline(coords, {
      color:     isFallback ? "#94A3B8" : "#1E5C35",
      weight:    isFallback ? 2 : 3,
      opacity:   0.85,
      dashArray: "10, 8",
      lineCap:   "round",
    }).addTo(map);

    // 2 — Hub (pickup) pin at start
    pickupRef.current = L.marker(coords[0], {
      icon: L.divIcon({
        className: "",
        iconSize: [28, 28], iconAnchor: [14, 14],
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#1E5C35;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:700;">H</div>`,
      }),
    }).bindTooltip("Pickup Hub", { direction: "top" }).addTo(map);

    // 3 — Delivery pin at end
    const last = coords[coords.length - 1];
    deliveryRef.current = L.marker(last, {
      icon: L.divIcon({
        className: "",
        iconSize: [28, 28], iconAnchor: [14, 28],
        html: `<div style="width:28px;height:28px;border-radius:6px 6px 0 6px;background:#C8860A;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;font-size:11px;color:white;font-weight:700;">D</div>`,
      }),
    }).bindTooltip("Delivery address", { direction: "top" }).addTo(map);

    // 4 — Distance label at midpoint
    const mid = coords[Math.floor(coords.length / 2)];
    midpointRef.current = L.marker(mid, {
      interactive: false,
      icon: L.divIcon({
        className: "",
        iconSize: [100, 22], iconAnchor: [50, 11],
        html: `<div style="background:white;border:1px solid #E2E8F0;border-radius:6px;padding:2px 8px;font-family:'DM Sans',monospace;font-size:10px;color:#4B5563;box-shadow:0 1px 4px rgba(0,0,0,.10);white-space:nowrap;">${distanceKm} km · ${Math.round(adjustedDurationSeconds / 60)} min</div>`,
      }),
    }).addTo(map);

    // 5 — Fit map to route
    map.fitBounds(polylineRef.current!.getBounds(), { padding: [40, 40] });

    // 6 — Animation loop
    coordIndexRef.current = 0;
    intervalRef.current = setInterval(() => {
      const next = coordIndexRef.current + coordsPerTick;
      if (next >= coords.length) {
        coordIndexRef.current = coords.length - 1;
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        onCompleteRef.current();
        return;
      }
      coordIndexRef.current = next;
      onStepRef.current(next);
    }, tickMs);

    return () => { clearAllLayers(); }; // cleanup on unmount OR when route changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route]);

  return null;
}
