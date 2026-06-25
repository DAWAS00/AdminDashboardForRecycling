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
  marker: L.Marker;
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
}

export function PassiveRiderLayer({
  map,
  riders,
  excludeRiderIds = [],
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

    // Remove markers for riders that are no longer active
    for (const [id, state] of riderStateRef.current) {
      const stillActive = activeRiders.some(r => r.id === id);
      if (!stillActive) {
        state.marker.remove();
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

      // Create a subtle passive marker — slightly smaller than the main rider marker
      const icon = makePassiveIcon(rider);
      const marker = L.marker(waypoints[0], { icon, interactive: false })
        .addTo(map);

      // Stagger start times so riders aren't all at the same point in their arc
      const staggerMs = (rider.id % 5) * (SIMULATED_DELIVERY_MS / 5);

      riderStateRef.current.set(rider.id, {
        marker,
        waypoints,
        startedAt: Date.now() - staggerMs, // offset by stagger so they look spread out
        durationMs: SIMULATED_DELIVERY_MS,
      });
    }
  }, [map, riders, excludeRiderIds]);

  // ── Shared animation interval ─────────────────────────────────────────────
  useEffect(() => {
    if (!map) return;

    function tick() {
      if (!map) return;
      const bounds = map.getBounds();

      for (const [, state] of riderStateRef.current) {
        const elapsed  = Date.now() - state.startedAt;
        // Loop the animation: when rider reaches destination, restart from origin
        const loopElapsed = elapsed % state.durationMs;
        const progress    = loopElapsed / state.durationMs;
        const index       = Math.min(
          Math.floor(progress * state.waypoints.length),
          state.waypoints.length - 1
        );
        const [lat, lng] = state.waypoints[index];

        // Skip setLatLng if the rider is outside the current map viewport
        // — saves DOM updates for off-screen markers
        if (bounds.contains([lat, lng]) || bounds.contains(state.marker.getLatLng())) {
          state.marker.setLatLng([lat, lng]);
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
  }, [map]); // only restart interval when map instance changes

  // ── Cleanup all markers on unmount ───────────────────────────────────────
  useEffect(() => {
    return () => {
      for (const [, state] of riderStateRef.current) {
        state.marker.remove();
      }
      riderStateRef.current.clear();
    };
  }, []);

  // This component renders nothing into the React tree
  return null;
}

// ─── Passive marker icon ──────────────────────────────────────────────────────
// Smaller and slightly transparent compared to the selected rider marker.
// Uses a simple CSS pulsing dot — no image files needed.

function makePassiveIcon(rider: Rider): L.DivIcon {
  const isVan = rider.vehicle === 'Van';
  const color  = isVan ? 'var(--color-brand-600)' : 'var(--color-amber-600)';
  const size   = isVan ? 14 : 11; // px — vans slightly larger

  return L.divIcon({
    className: '',
    iconSize:  [size + 8, size + 8],
    iconAnchor:[(size + 8) / 2, (size + 8) / 2],
    html: `
      <div style="
        position: relative;
        width: ${size + 8}px;
        height: ${size + 8}px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- pulse ring -->
        <div class="passive-pulse" style="
          position: absolute;
          width: ${size + 8}px;
          height: ${size + 8}px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.2;
        "></div>
        <!-- solid dot -->
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.75;
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        "></div>
      </div>
    `,
  });
}
