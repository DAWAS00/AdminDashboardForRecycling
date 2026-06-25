import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Map as LeafletMap } from 'leaflet';
import { Rider } from '../types';
import { buildArcFallback } from '../lib/osrm';

// ─── Constants ────────────────────────────────────────────────────────────────

const TICK_MS = 2000;                // animation tick — every 2 seconds
const SIMULATED_DELIVERY_MS = 4 * 60 * 1000; // each rider takes ~4 min to traverse the arc

// ─── Per-rider runtime state (NOT React state) ────────────────────────────────

interface RiderAnimState {
  waypoints: [number, number][];
  startedAt: number;         // Date.now() when animation started for this rider
  durationMs: number;        // how long the full arc takes to traverse
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PassiveRiderLayerProps {
  map: LeafletMap | null;
  riders: Rider[];
  /** IDs of riders currently being watched via the full RouteLayer — exclude them
   *  so we don't double-render a moving marker on top of the active tracker. */
  excludeRiderIds?: number[];
  /** Ref to the main Leaflet markers from LiveMapLayer */
  markers: React.MutableRefObject<Record<number, L.Marker>>;
}

export function PassiveRiderLayer({
  map,
  riders,
  excludeRiderIds = [],
  markers,
}: PassiveRiderLayerProps) {

  // Map of riderId → animation state. Lives outside React — never causes re-render.
  const riderStateRef = useRef<Map<number, RiderAnimState>>(new Map());
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Build or update per-rider state when `riders` or `map` changes ───────
  useEffect(() => {
    if (!map) return;

    const excluded = new Set(excludeRiderIds);
    const activeRiders = riders.filter(
      r => (r.status === 'delivering' || r.status === 'picking_up') && !excluded.has(r.id)
    );

    // Reset markers for riders that are no longer active in passive animation
    for (const [id] of riderStateRef.current) {
      const stillActive = activeRiders.some(r => r.id === id);
      if (!stillActive) {
        const originalRider = riders.find(r => r.id === id);
        const marker = markers.current[id];
        if (originalRider && marker) {
          marker.setLatLng([originalRider.lat, originalRider.lng]);
        }
        riderStateRef.current.delete(id);
      }
    }

    // Add or refresh markers for currently active riders
    for (const rider of activeRiders) {
      // If already tracked, leave existing marker in place (don't reset progress)
      if (riderStateRef.current.has(rider.id)) continue;

      // Determine destination — use deliveryLat/Lng from the first inTransit/accepted order
      const targetOrder = rider.orders.find(
        o => o.status === 'inTransit' || o.status === 'accepted'
      );
      const endLat = targetOrder?.deliveryLat  ?? rider.lat + 0.015;
      const endLng = targetOrder?.deliveryLng  ?? rider.lng + 0.015;

      // Build arc waypoints synchronously (no OSRM call)
      const routeObj = buildArcFallback(rider.lat, rider.lng, endLat, endLng);
      const waypoints = routeObj.coords;

      // Stagger start times so riders aren't all at the same point in their arc
      const staggerMs = (rider.id % 5) * (SIMULATED_DELIVERY_MS / 5);

      riderStateRef.current.set(rider.id, {
        waypoints,
        startedAt: Date.now() - staggerMs, // offset by stagger so they look spread out
        durationMs: SIMULATED_DELIVERY_MS,
      });
    }
  }, [map, riders, excludeRiderIds, markers]);

  // ── Shared animation interval ─────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    function tick() {
      if (!map) return;
      const bounds = map.getBounds();

      for (const [id, state] of riderStateRef.current) {
        const elapsed  = Date.now() - state.startedAt;
        // Loop the animation: when rider reaches destination, restart from origin
        const loopElapsed = elapsed % state.durationMs;
        const progress    = loopElapsed / state.durationMs;
        const index       = Math.min(
          Math.floor(progress * state.waypoints.length),
          state.waypoints.length - 1
        );
        const [lat, lng] = state.waypoints[index];

        const marker = markers.current[id];
        if (marker) {
          // Skip setLatLng if the rider is outside the current map viewport
          // — saves DOM updates for off-screen markers
          if (bounds.contains([lat, lng]) || bounds.contains(marker.getLatLng())) {
            marker.setLatLng([lat, lng]);
          }
        }
      }
    }

    function startInterval() {
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, TICK_MS);
    }

    function stopInterval() {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Pause when tab is hidden — saves CPU when admin is not watching
    function onVisibility() {
      if (document.hidden) stopInterval();
      else startInterval();
    }

    document.addEventListener('visibilitychange', onVisibility);
    startInterval();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stopInterval();
    };
  }, [map, markers]); // only restart interval when map or markers ref changes

  // ── Cleanup all markers on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      for (const [id] of riderStateRef.current) {
        const originalRider = riders.find(r => r.id === id);
        const marker = markers.current[id];
        if (originalRider && marker) {
          marker.setLatLng([originalRider.lat, originalRider.lng]);
        }
      }
      riderStateRef.current.clear();
    };
  }, [riders, markers]);

  // This component renders nothing into the React tree
  return null;
}
