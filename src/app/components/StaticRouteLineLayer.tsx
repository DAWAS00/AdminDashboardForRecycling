import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Map as LeafletMap } from 'leaflet';
import { Rider } from '../types';
import { fetchOsrmRoute, buildArcFallback } from '../lib/osrm';

// ─── Component ────────────────────────────────────────────────────────────────

interface StaticRouteLineLayerProps {
  map: LeafletMap | null;
  /** The rider currently selected by the admin. Null = draw nothing. */
  selectedRider: Rider | null;
}

export function StaticRouteLineLayer({ map, selectedRider }: StaticRouteLineLayerProps) {
  const polylineRef      = useRef<L.Polyline | null>(null);
  const originMarkerRef  = useRef<L.CircleMarker | null>(null);
  const destMarkerRef    = useRef<L.CircleMarker | null>(null);
  const abortRef         = useRef<AbortController | null>(null);

  function clearAll() {
    polylineRef.current?.remove();     polylineRef.current     = null;
    originMarkerRef.current?.remove(); originMarkerRef.current = null;
    destMarkerRef.current?.remove();   destMarkerRef.current   = null;
    abortRef.current?.abort();         abortRef.current        = null;
  }

  useEffect(() => {
    if (!map) return;
    clearAll();                        // always clear before drawing new line
    if (!selectedRider) return;

    // Find the active order for this rider
    const order = selectedRider.orders.find(
      o => o.status === 'inTransit' || o.status === 'accepted'
    );

    const endLat = order?.deliveryLat  ?? selectedRider.lat + 0.015;
    const endLng = order?.deliveryLng  ?? selectedRider.lng + 0.015;

    // ── 1. Draw arc immediately (instant feedback, no server needed) ──────
    const arcRouteObj = buildArcFallback(
      selectedRider.lat, selectedRider.lng,
      endLat, endLng
    );
    const arcCoords = arcRouteObj.coords;

    polylineRef.current = L.polyline(arcCoords, {
      color:     'var(--color-brand-600)',
      weight:    2.5,
      opacity:   0.55,
      dashArray: '8, 6',       // dashed line — clearly "route path", not an active track
      lineCap:   'round',
    }).addTo(map);

    // Small dot at origin
    originMarkerRef.current = L.circleMarker(
      [selectedRider.lat, selectedRider.lng],
      { radius: 5, color: 'white', fillColor: 'var(--color-brand-600)', fillOpacity: 1, weight: 2 }
    ).addTo(map);

    // Small dot at destination
    destMarkerRef.current = L.circleMarker(
      [endLat, endLng],
      { radius: 5, color: 'white', fillColor: 'var(--color-amber-600)', fillOpacity: 1, weight: 2 }
    ).addTo(map);

    // ── 2. Upgrade to real OSRM route in background ────────────────────────
    // If OSRM responds, replace the arc with the actual road geometry.
    const abort = new AbortController();
    abortRef.current = abort;

    fetchOsrmRoute(
      selectedRider.lat, selectedRider.lng,
      endLat, endLng,
      abort.signal
    ).then(result => {
      if (abort.signal.aborted) return;  // rider was deselected while fetching
      if (!result || !polylineRef.current) return;

      // Replace arc coords with real road coords
      polylineRef.current.setLatLngs(result.coords);
    }).catch(() => {
      // OSRM failed — arc remains, no error shown to user
    });

    return () => { clearAll(); };
  }, [map, selectedRider?.id]); // re-run only when selected rider CHANGES (by id)

  return null;
}
