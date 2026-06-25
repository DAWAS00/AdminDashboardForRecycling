# Passive Rider Animation + Static Route Line — Implementation Plan

> **For agentic workers:** Execute tasks one at a time. After each task: `npm run build` → fix errors → `git commit` → `git push`. Do NOT skip the build gate.

**Goal:** Riders who are "delivering" or "picking_up" automatically drift toward their destination on the map with no admin interaction. When the admin selects a rider or order, show the route as a thin static line. Both features stay lightweight — no OSRM calls for passive movement, no per-rider intervals, no React state updates during animation.

**Architecture:**
- `PassiveRiderLayer.tsx` — one shared `setInterval` at 2000 ms manages ALL moving riders. Computes arc waypoints once at mount, advances position from elapsed time (drift-free). Calls `marker.setLatLng()` directly on the Leaflet instance — never touches React state during animation.
- `StaticRouteLineLayer.tsx` — when `selectedRiderId` changes, fetches OSRM once (or falls back to arc), draws a thin dashed polyline, and never animates it. It is just a line showing the path.
- Visibility API (`document.visibilitychange`) pauses the interval when the browser tab is hidden — zero CPU when user is not watching.

**Tech Stack:** React 18 + TypeScript, Leaflet 1.9.4, react-leaflet 5, existing `buildArcFallback()` from `osrm.ts`, existing `fetchOsrmRoute()` from `osrm.ts`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/app/lib/osrm.ts` | Modify | Export `buildArcFallback` and `ARC_STEPS` const (already exists as internal — make it exported) |
| `src/app/components/PassiveRiderLayer.tsx` | Create | Always-on lightweight rider drift animation |
| `src/app/components/StaticRouteLineLayer.tsx` | Create | Thin dashed route line when a rider is selected |
| `src/app/App.tsx` | Modify | Wire `selectedRiderId` state, render both new layers |

---

## Critical Rules (never break these)

**Rule 1 — Never update React state inside the animation interval.**
Calling `setState` 10× per second per rider causes full re-renders and defeats the entire performance goal. The interval calls `marker.setLatLng([lat, lng])` directly on the Leaflet `L.Marker` object. React doesn't know or care.

**Rule 2 — One interval for all riders, not one per rider.**
```typescript
// ✅ correct — one shared interval, one tick function loops over all riders
const id = setInterval(() => {
  for (const [riderId, state] of riderStateRef.current) {
    advanceRider(riderId, state);
  }
}, TICK_MS);

// ❌ wrong — O(N) intervals, CPU explodes at 10+ riders
riders.forEach(r => {
  setInterval(() => advanceRider(r.id), TICK_MS);
});
```

**Rule 3 — Compute position from elapsed time, never by decrement.**
```typescript
// ✅ correct — always consistent, no drift
const elapsed = Date.now() - state.startedAt;
const progress = Math.min(elapsed / state.durationMs, 1);
const index = Math.floor(progress * (state.waypoints.length - 1));

// ❌ wrong — drifts, breaks on remount, breaks StrictMode double-render
state.currentIndex++;
```

**Rule 4 — Every Leaflet layer added in a useEffect must be removed in the cleanup.**
```typescript
useEffect(() => {
  const marker = L.marker([lat, lng]).addTo(map);
  return () => { marker.remove(); };         // ← required, never skip
}, [map]);
```

**Rule 5 — Pause animation when tab is hidden.**
```typescript
useEffect(() => {
  const onVisibility = () => {
    if (document.hidden) clearInterval(intervalRef.current!);
    else startInterval();
  };
  document.addEventListener('visibilitychange', onVisibility);
  return () => document.removeEventListener('visibilitychange', onVisibility);
}, []);
```

---

## Performance Budget

| Metric | Target |
|---|---|
| Tick frequency | 2000 ms (not 250 ms, not RAF) |
| Max simultaneous riders animated | 10 |
| React re-renders caused by animation | 0 |
| OSRM calls for passive animation | 0 |
| OSRM calls for static route line | 1 per selection (cached) |
| CPU when tab is hidden | 0 |

---

## Task 1 — Export `buildArcFallback` from `osrm.ts`

**Files:**
- Modify: `src/app/lib/osrm.ts`

The arc fallback function already exists inside `osrm.ts` but may be internal. `PassiveRiderLayer` needs it to compute waypoints without calling the OSRM server.

- [ ] **Step 1: Read the current `osrm.ts`**

Open `src/app/lib/osrm.ts` and check whether `buildArcFallback` is exported or internal.

- [ ] **Step 2: Export the function and the step count constant**

Find the `buildArcFallback` function (or add it if missing) and make it exported with 64 steps:

```typescript
// Add/update at the top of src/app/lib/osrm.ts
export const ARC_STEPS = 64; // more waypoints = smoother passive animation

/**
 * Builds a 64-point quadratic Bezier arc between two coordinates.
 * Used for passive animation (no OSRM call) and as the instant fallback
 * while a real OSRM route is loading.
 * Returns coords as [lat, lng] pairs (Leaflet order).
 */
export function buildArcFallback(
  startLat: number, startLng: number,
  endLat: number,   endLng: number
): [number, number][] {
  const midLat = (startLat + endLat) / 2 + 0.008; // slight northward curve
  const midLng = (startLng + endLng) / 2;
  const points: [number, number][] = [];

  for (let i = 0; i <= ARC_STEPS; i++) {
    const t = i / ARC_STEPS;
    const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * midLat + t * t * endLat;
    const lng = (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * midLng + t * t * endLng;
    points.push([lat, lng]);
  }

  return points;
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: no errors. If `buildArcFallback` was already exported under a different name, rename the existing one to `buildArcFallback` to match what the plan expects.

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/osrm.ts
git commit -m "feat: export buildArcFallback and ARC_STEPS from osrm.ts"
git push origin main
```

---

## Task 2 — Create `PassiveRiderLayer.tsx`

**Files:**
- Create: `src/app/components/PassiveRiderLayer.tsx`

This component manages always-on passive animation for all riders who are currently `"delivering"` or `"picking_up"`. It:
1. Computes a 64-waypoint arc for each active rider once at mount
2. Runs a single `setInterval` at 2000 ms for all riders
3. On each tick, computes position from elapsed time (never by decrement)
4. Calls `marker.setLatLng()` directly — zero React state updates during animation
5. Pauses when the browser tab is hidden

- [ ] **Step 1: Create the file**

```typescript
// src/app/components/PassiveRiderLayer.tsx
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Map as LeafletMap } from 'leaflet';
import { Rider } from '../types';
import { buildArcFallback, ARC_STEPS } from '../lib/osrm';

// ─── Constants ────────────────────────────────────────────────────────────────

const TICK_MS = 2000;                // animation tick — every 2 seconds
const SIMULATED_DELIVERY_MS = 4 * 60 * 1000; // each rider takes ~4 min to traverse the arc
                                              // Label this "simulated" — not real GPS

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
      // (added in rider-tracking-plan Task 1). Fall back to a small nudge if not yet present.
      const targetOrder = rider.orders.find(
        o => o.status === 'inTransit' || o.status === 'accepted'
      );
      const endLat = (targetOrder as any)?.deliveryLat  ?? rider.lat + 0.015;
      const endLng = (targetOrder as any)?.deliveryLng  ?? rider.lng + 0.015;

      // Build arc waypoints synchronously (no OSRM call)
      const waypoints = buildArcFallback(rider.lat, rider.lng, endLat, endLng);

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
      for (const [, state] of riderStateRef.current) {
        const elapsed  = Date.now() - state.startedAt;
        // Loop the animation: when rider reaches destination, restart from origin
        const loopElapsed = elapsed % state.durationMs;
        const progress    = loopElapsed / state.durationMs;
        const index       = Math.min(
          Math.floor(progress * state.waypoints.length),
          state.waypoints.length - 1
        );
        // Direct Leaflet call — NO React setState here
        state.marker.setLatLng(state.waypoints[index]);
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
        <div style="
          position: absolute;
          width: ${size + 8}px;
          height: ${size + 8}px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.2;
          animation: passive-pulse 2s ease-in-out infinite;
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
      <style>
        @keyframes passive-pulse {
          0%, 100% { transform: scale(1);   opacity: 0.2; }
          50%       { transform: scale(1.6); opacity: 0.08; }
        }
      </style>
    `,
  });
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: no errors. If `deliveryLat`/`deliveryLng` don't exist on `Order` yet (they're added in rider-tracking-plan Task 1), the `as any` cast on line 62 prevents TypeScript errors — that's intentional until the types are updated.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/PassiveRiderLayer.tsx
git commit -m "feat: add PassiveRiderLayer — always-on lightweight rider drift animation"
git push origin main
```

---

## Task 3 — Create `StaticRouteLineLayer.tsx`

**Files:**
- Create: `src/app/components/StaticRouteLineLayer.tsx`

This component draws a **static dashed polyline** showing the route from a rider's current position to their delivery address. It activates when the admin selects a rider. It does NOT animate anything — the line is just the path. It attempts one OSRM fetch; falls back to the arc instantly if OSRM is slow or offline.

- [ ] **Step 1: Create the file**

```typescript
// src/app/components/StaticRouteLineLayer.tsx
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

    const endLat = (order as any)?.deliveryLat  ?? selectedRider.lat + 0.015;
    const endLng = (order as any)?.deliveryLng  ?? selectedRider.lng + 0.015;

    // ── 1. Draw arc immediately (instant feedback, no server needed) ──────
    const arcCoords = buildArcFallback(
      selectedRider.lat, selectedRider.lng,
      endLat, endLng
    );

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
      endLat, endLng
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
```

**Note on `fetchOsrmRoute`:** this function must already exist in `src/app/lib/osrm.ts` from rider-tracking-plan Task 3. If it doesn't yet (you're running this plan standalone), add this minimal version to `osrm.ts`:

```typescript
// Add to src/app/lib/osrm.ts if not already present
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

export interface OsrmResult {
  coords: [number, number][];
  distanceKm: number;
  durationSeconds: number;
}

export async function fetchOsrmRoute(
  startLat: number, startLng: number,
  endLat: number,   endLng: number
): Promise<OsrmResult | null> {
  try {
    // CRITICAL: OSRM wants longitude FIRST — {lng},{lat}
    const url = `${OSRM_BASE}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = await res.json();
    const leg  = json.routes?.[0];
    if (!leg) return null;

    // CRITICAL: OSRM returns [lng, lat] — flip to [lat, lng] for Leaflet
    const coords: [number, number][] = leg.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    return {
      coords,
      distanceKm:      leg.distance / 1000,
      durationSeconds: leg.duration,
    };
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/StaticRouteLineLayer.tsx src/app/lib/osrm.ts
git commit -m "feat: add StaticRouteLineLayer — dashed route line on rider selection"
git push origin main
```

---

## Task 4 — Wire into `App.tsx`

**Files:**
- Modify: `src/app/App.tsx`

Add `selectedRiderId` state, wire both new layers into the map, and connect rider click handlers.

- [ ] **Step 1: Add imports**

At the top of `App.tsx`, add:

```typescript
import { PassiveRiderLayer }    from './components/PassiveRiderLayer';
import { StaticRouteLineLayer } from './components/StaticRouteLineLayer';
```

- [ ] **Step 2: Add `selectedRiderId` state**

Inside the `App` component, add (if not already present):

```typescript
const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
```

Derived value (compute, don't store):

```typescript
const selectedRider = selectedRiderId !== null
  ? RIDERS.find(r => r.id === selectedRiderId) ?? null
  : null;
```

- [ ] **Step 3: Add rider click handler**

```typescript
function handleRiderClick(riderId: number) {
  setSelectedRiderId(prev => prev === riderId ? null : riderId); // toggle
}
```

- [ ] **Step 4: Render both layers inside the map**

Find where the map is rendered (the `<MapContainer>` or wherever existing `RiderLayer` / `HeatMapLayer` are placed) and add the two new layers:

```tsx
{/* Always-on passive drift animation — no interaction needed */}
<PassiveRiderLayer
  map={mapRef.current}
  riders={RIDERS}
  excludeRiderIds={selectedRiderId !== null ? [selectedRiderId] : []}
/>

{/* Static dashed route line — only shown when a rider is selected */}
<StaticRouteLineLayer
  map={mapRef.current}
  selectedRider={selectedRider}
/>
```

The `excludeRiderIds` prop prevents `PassiveRiderLayer` from drawing a passive marker on top of the selected rider (who already has a static route line drawn). This avoids two overlapping markers.

- [ ] **Step 5: Wire rider panel clicks**

In the Rider Panel component (or wherever rider list items are rendered), connect clicks:

```tsx
// In RiderPanel or wherever riders are listed:
<div
  onClick={() => onRiderClick(rider.id)}
  style={{ cursor: 'pointer' }}
  // ...existing styles
>
```

Pass `onRiderClick={handleRiderClick}` down from `App.tsx` as a prop.

- [ ] **Step 6: Build and verify visually**

```bash
npm run build
npm run dev
```

**Visual checklist:**
- [ ] Open the dashboard. Riders with status `delivering` or `picking_up` show small pulsing dots drifting slowly across the map with no clicking.
- [ ] Click a rider in the panel. A thin dashed green line appears from their location toward the delivery address.
- [ ] The dashed line briefly shows an arc, then (if OSRM responds) snaps to real road geometry.
- [ ] Click the same rider again — the line disappears (toggle off).
- [ ] Switch to a different browser tab and come back — animation is still running (Visibility API re-starts it).
- [ ] The passive dot for a selected rider is hidden (excluded from `PassiveRiderLayer`).

- [ ] **Step 7: Commit**

```bash
git add src/app/App.tsx
git commit -m "feat: wire PassiveRiderLayer and StaticRouteLineLayer into App — passive movement + route line on click"
git push origin main
```

---

## Task 5 — Polish: Add CSS for Pulse + Performance Guard

**Files:**
- Modify: `src/app/index.css` (or wherever global styles live)

The `@keyframes passive-pulse` animation is injected inline per-marker which technically works but is redundant. Move it to the global stylesheet once:

- [ ] **Step 1: Add keyframe to global CSS**

```css
/* src/app/index.css — add at the bottom */

@keyframes passive-pulse {
  0%, 100% { transform: scale(1);   opacity: 0.2; }
  50%       { transform: scale(1.6); opacity: 0.08; }
}
```

- [ ] **Step 2: Remove inline `<style>` tag from `makePassiveIcon`**

In `PassiveRiderLayer.tsx`, remove the `<style>` block from the `html` string inside `makePassiveIcon`. The keyframe is now global.

```typescript
// Remove this from the html string in makePassiveIcon():
// <style>
//   @keyframes passive-pulse { ... }
// </style>
```

- [ ] **Step 3: Add a performance guard — limit passive animation to riders in viewport**

In `PassiveRiderLayer.tsx`, inside the `tick` function, add a viewport check:

```typescript
function tick() {
  if (!map) return;
  const bounds = map.getBounds();

  for (const [, state] of riderStateRef.current) {
    const elapsed     = Date.now() - state.startedAt;
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
```

- [ ] **Step 4: Build**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/index.css src/app/components/PassiveRiderLayer.tsx
git commit -m "perf: move pulse keyframe to global CSS, add viewport guard for passive animation"
git push origin main
```

---

## Verification Checklist

Run `npm run dev` and go through each check:

### Passive Animation
- [ ] At least one rider with status `"delivering"` or `"picking_up"` shows a small pulsing dot on the map **without any clicks**
- [ ] The dot visibly moves position every ~2 seconds (drift toward destination)
- [ ] Vans are slightly larger dots than motorcycles
- [ ] Dots pulse with the ring animation (CSS `passive-pulse`)
- [ ] Hiding the browser tab (`Cmd+H` / switch to another tab) and returning doesn't break animation
- [ ] No `console.error` in the browser DevTools during animation

### Static Route Line
- [ ] Clicking a rider in the panel draws a dashed line on the map from their position toward their order destination
- [ ] The line appears **immediately** (arc fallback), then may update to road geometry if OSRM responds
- [ ] Clicking the same rider again removes the line
- [ ] Clicking a different rider replaces the line (old line disappears, new one appears)
- [ ] When a rider is selected, their passive dot disappears (excluded by `excludeRiderIds`)
- [ ] A small green dot marks the start point, amber dot marks the destination

### Performance
- [ ] Open DevTools → Performance tab → Record 10 seconds. No "Long Tasks" (>50 ms) during passive animation ticks
- [ ] `npm run build` produces zero TypeScript errors
- [ ] No React "setState on unmounted component" warnings in console

---

## How This Connects to the Existing Plans

| This Plan | Rider Tracking Plan (Tasks 1–13) |
|---|---|
| `PassiveRiderLayer` — always-on, no interaction | `RouteLayer` — full animated tracking when admin watches |
| `StaticRouteLineLayer` — one dashed line, click to show | `RouteLayer` + `ETA countdown` — live animated rider + timer |
| No OSRM calls for passive movement | OSRM called for active order click |
| Passive markers excluded when `RouteLayer` is active | `RouteLayer` takes over when order is clicked |

These two plans **complement**, never conflict. The passive layer is the "background hum" — the system always feels live. The full RouteLayer (from rider-tracking-plan.md) is the "zoom in" — activated only when the admin clicks a specific order to watch it.

---

*Dawer — Passive Animation + Static Route Line Plan*
*June 2026*
