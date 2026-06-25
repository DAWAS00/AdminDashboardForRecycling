# Rider Route Tracking — Implementation Plan

**Goal:** When an admin clicks any active order, the map draws the real Amman road route, animates the rider moving along it with a live ETA countdown, captures trip performance data on completion, and feeds that data into the Reports screen and B2B CO₂ certificates.

**Architecture:** A pure-frontend simulation built on the OSRM public routing API (no API key needed). An `osrm.ts` library fetches road geometry and falls back to a Leaflet arc instantly on failure. A `setInterval` animates the rider marker along route coordinates. All timing uses `Date.now()` subtraction — never counters — to prevent drift. Completed trips accumulate in React state and flow to the Reports screen with zero backend dependency in Phase 1.

**Tech Stack:** React 18, TypeScript, Vite, Leaflet 1.9.4 / react-leaflet 5, Tailwind v4, Lucide React, DM Sans + DM Mono (CSS variables)

**No test framework is configured.** Every task ends with `npm run build` (TypeScript gate) and a visual check in `npm run dev`.

**Critical mistakes this plan prevents:**
- OSRM coordinate flip bug — OSRM wants `lng,lat`; Leaflet wants `[lat,lng]`
- Timer drift — never decrement a counter; always `Date.now() - startedAt`
- Leaflet double-layer in React StrictMode — `useRef` arrays + `.remove()` in every `useEffect` cleanup
- Stale closure in Leaflet event handler — `useRef` wrapper for all callbacks passed to `.on()`
- Animation orphan — `clearInterval` both on unmount AND on route change

---

## File Map — What Gets Created or Changed

### New files
| File | Responsibility |
|---|---|
| `src/app/lib/osrm.ts` | Fetch real road route from OSRM; instant Arc fallback on failure |
| `src/app/lib/eta.ts` | ETA math, time-of-day multiplier, `formatEta()`, `etaColor()` |
| `src/app/lib/performance.ts` | Aggregate `CompletedTrip[]` into rider stats and district stats for reports |
| `src/app/components/RouteLayer.tsx` | Leaflet polyline + animated rider marker for one active route |
| `src/app/components/FleetRadarLayer.tsx` | All active rider routes drawn simultaneously (Phase 2) |
| `src/app/components/rider/RouteProgressBar.tsx` | In-drawer progress bar for an order currently in transit |

### Modified files
| File | Change |
|---|---|
| `src/app/types.ts` | Add `Route`, `ActiveRoute`, `CompletedTrip`; extend `Order` with `deliveryLat/Lng` |
| `src/app/constants.ts` | Add `deliveryLat`, `deliveryLng` to every order in `RIDERS` |
| `src/app/App.tsx` | Add `activeRoute`, `completedTrips` state; mount `RouteLayer` |
| `src/app/components/rider/OrderCard.tsx` | Show `RouteProgressBar` + live ETA chip for `inTransit` orders |
| `src/app/components/rider/TodayStats.tsx` | Show efficiency score pulled from `completedTrips` |
| `src/app/components/HeatMapLayer.tsx` | (Phase 2) Mount `FleetRadarLayer` when radar toggle is on |

---

## Phase 1 — Foundation (Types, Constants, Libraries)

### Task 1: Extend Types

**Files:**
- Modify: `src/app/types.ts`

- [ ] **Step 1: Add delivery coordinates to `Order` and add three new interfaces at the bottom of `types.ts`**

Open `src/app/types.ts`. Make these changes:

```typescript
export interface Order {
  id: string;
  material: "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";
  quantity: number;
  unit: string;
  address: string;
  // ── NEW ──────────────────────────────
  deliveryLat: number;   // WGS-84 latitude of delivery address
  deliveryLng: number;   // WGS-84 longitude of delivery address
  // ─────────────────────────────────────
  status: "pending" | "accepted" | "inTransit" | "completed";
  co2Saved: number;
  earnings: number;
}

// ── ADD THESE AT THE BOTTOM OF THE FILE ─────────────────────────────────────

/**
 * A road route returned by OSRM (or synthesized as an arc fallback).
 * coords is [lat, lng][] — Leaflet order.
 * OSRM returns [lng, lat][] — always flip before storing here.
 */
export interface Route {
  coords: [number, number][];        // [lat, lng] Leaflet order
  distanceKm: number;
  durationSeconds: number;           // raw OSRM estimate (no time-of-day adjustment)
  adjustedDurationSeconds: number;   // after etaMultiplier() applied
  isFallback: boolean;               // true = arc, false = real OSRM road
}

/**
 * The route currently being animated on the map.
 * Lives in App state; null when no order is selected.
 */
export interface ActiveRoute {
  orderId: string;
  riderId: number;
  route: Route;
  currentCoordIndex: number;   // which point along route.coords the rider is at
  startedAt: number;           // Date.now() when status → inTransit
  progressPct: number;         // 0–100, derived from currentCoordIndex
}

/**
 * Recorded after an order is marked completed.
 * Accumulates in App state; feeds the Reports screen.
 */
export interface CompletedTrip {
  orderId: string;
  riderId: number;
  riderName: string;
  startedAt: number;
  completedAt: number;
  actualSeconds: number;
  osrmEstimateSeconds: number;
  distanceKm: number;
  /**
   * 100 = finished exactly on OSRM estimate.
   * > 100 = faster than estimated (good).
   * < 80 = significantly slower (flag for review).
   */
  efficiencyScore: number;
  district: string;            // district name for aggregation
  co2Saved: number;            // from the completed order
  earnings: number;
  material: Order["material"];
}
```

- [ ] **Step 2: Build**

```bash
cd "E:/Dawer DashBorad/AdminDashboardForRecycling"
npm run build
```

Expected: TypeScript errors on `RIDERS` in `constants.ts` — every `Order` now requires `deliveryLat` and `deliveryLng`. That is expected. Fix in Task 2.

- [ ] **Step 3: Commit**

```bash
git add src/app/types.ts
git commit -m "feat: add Route, ActiveRoute, CompletedTrip types; extend Order with deliveryLat/Lng"
```

---

### Task 2: Add Delivery Coordinates to Orders

**Files:**
- Modify: `src/app/constants.ts`

- [ ] **Step 1: Add `deliveryLat` and `deliveryLng` to every order in the `RIDERS` array**

These coordinates correspond to realistic Amman street addresses. Open `src/app/constants.ts` and update every `Order` object inside `RIDERS`. Add the two fields to each order using the address-to-coordinate mapping below.

**Reference — Amman delivery coordinate lookup:**
```
"Sweifieh, Amman"         → deliveryLat: 31.944, deliveryLng: 35.871
"Abdoun, Amman"           → deliveryLat: 31.940, deliveryLng: 35.884
"Downtown, Amman"         → deliveryLat: 31.953, deliveryLng: 35.934
"Shmeisani, Amman"        → deliveryLat: 31.978, deliveryLng: 35.882
"Jubaiha, Amman"          → deliveryLat: 32.001, deliveryLng: 35.869
"Tabarbour, Amman"        → deliveryLat: 32.014, deliveryLng: 35.921
"8th Circle, Amman"       → deliveryLat: 31.959, deliveryLng: 35.853
"University District"     → deliveryLat: 32.008, deliveryLng: 35.879
"Tlaa Al-Ali, Amman"      → deliveryLat: 31.950, deliveryLng: 35.857
"Airport Road, Amman"     → deliveryLat: 31.912, deliveryLng: 35.946
"Jabal Hussein, Amman"    → deliveryLat: 31.975, deliveryLng: 35.915
"Wadi Seer, Amman"        → deliveryLat: 31.943, deliveryLng: 35.839
"Khalda, Amman"           → deliveryLat: 31.960, deliveryLng: 35.849
"Marka, Amman"            → deliveryLat: 31.987, deliveryLng: 35.942
"Al-Rashid Mall area"     → deliveryLat: 31.950, deliveryLng: 35.879
```

For any address not in the list, use `deliveryLat: 31.963, deliveryLng: 35.905` (Amman center) as the default.

**Example of what one updated order looks like:**
```typescript
{
  id: "ORD-001",
  material: "Cooking Oil",
  quantity: 15,
  unit: "L",
  address: "Sweifieh, Amman",
  deliveryLat: 31.944,   // ← ADD
  deliveryLng: 35.871,   // ← ADD
  status: "inTransit",
  co2Saved: 4.2,
  earnings: 6.5,
},
```

Apply this pattern to every single order object in the RIDERS array.

- [ ] **Step 2: Build — must be clean**

```bash
npm run build
```

Expected: zero TypeScript errors. Every `Order` in the codebase now has `deliveryLat` and `deliveryLng`.

- [ ] **Step 3: Commit**

```bash
git add src/app/constants.ts
git commit -m "feat: add deliveryLat/deliveryLng to all hardcoded orders"
```

---

### Task 3: OSRM Library with Arc Fallback

**Files:**
- Create: `src/app/lib/osrm.ts`

This is the most important file in the plan. Every other file depends on it. Read carefully.

**OSRM coordinate trap:** OSRM endpoint uses `{longitude},{latitude}` (lng first). Leaflet uses `[latitude, longitude]` (lat first). We flip inside this module so all callers receive Leaflet-order coords.

**Fallback strategy:** Draw a bezier arc immediately (synchronously, from the caller) while the OSRM fetch is in flight. When OSRM responds, replace the arc with the real route. If OSRM fails or times out (5s), keep the arc — user never sees a blank map.

- [ ] **Step 1: Create `src/app/lib/osrm.ts`**

```typescript
import type { Route } from "../types";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetch a real road route from the OSRM public demo server.
 *
 * IMPORTANT: OSRM wants coordinates as {lng},{lat} — longitude FIRST.
 * We convert the response to [lat, lng][] (Leaflet order) before returning.
 *
 * @param startLat  Pickup point latitude  (hub)
 * @param startLng  Pickup point longitude (hub)
 * @param endLat    Delivery latitude
 * @param endLng    Delivery longitude
 */
export async function fetchOsrmRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  adjustedDurationSeconds: number = 0
): Promise<Route> {
  // OSRM format: lng,lat;lng,lat  (note: longitude FIRST)
  const url =
    `${OSRM_BASE}/${startLng},${startLat};${endLng},${endLat}` +
    `?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

    const json = await res.json();
    const leg = json.routes?.[0];
    if (!leg) throw new Error("OSRM returned no routes");

    // OSRM GeoJSON coordinates are [lng, lat] — flip each to [lat, lng] for Leaflet
    const coords: [number, number][] = (
      leg.geometry.coordinates as [number, number][]
    ).map(([lng, lat]) => [lat, lng]);

    const durationSeconds: number = Math.round(leg.duration);
    const distanceKm: number = +(leg.distance / 1000).toFixed(2);

    return {
      coords,
      distanceKm,
      durationSeconds,
      adjustedDurationSeconds: adjustedDurationSeconds || durationSeconds,
      isFallback: false,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    // Fall through to arc fallback below
    console.warn("[osrm] fetch failed, using arc fallback:", err);
    return buildArcFallback(startLat, startLng, endLat, endLng);
  }
}

/**
 * Build a smooth arc between two points as an instant fallback.
 * Uses a midpoint elevated toward the equator to create a curve.
 * No network call — always available.
 */
export function buildArcFallback(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Route {
  const STEPS = 32;
  const midLat = (startLat + endLat) / 2 + 0.008; // slight northward arc
  const midLng = (startLng + endLng) / 2;

  const coords: [number, number][] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    // Quadratic Bezier: B(t) = (1-t)²·P0 + 2(1-t)t·P1 + t²·P2
    const lat =
      (1 - t) ** 2 * startLat + 2 * (1 - t) * t * midLat + t ** 2 * endLat;
    const lng =
      (1 - t) ** 2 * startLng + 2 * (1 - t) * t * midLng + t ** 2 * endLng;
    coords.push([lat, lng]);
  }

  // Estimate distance as straight-line × 1.3 (road factor)
  const straightKm = haversineKm(startLat, startLng, endLat, endLng);
  const distanceKm = +(straightKm * 1.3).toFixed(2);
  const durationSeconds = Math.round((distanceKm / 30) * 3600); // 30 km/h city average

  return {
    coords,
    distanceKm,
    durationSeconds,
    adjustedDurationSeconds: durationSeconds,
    isFallback: true,
  };
}

/** Haversine great-circle distance in km */
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean build. The module is not yet imported anywhere.

- [ ] **Step 3: Verify the coordinate flip logic manually**

In the browser console (or a scratch file), run:
```javascript
// Amman center to Abdoun — should produce plausible lat/lng pairs
// Start: [31.963, 35.905] → OSRM gets "35.905,31.963"  ✓
// End:   [31.940, 35.884] → OSRM gets "35.884,31.940"  ✓
// Response coords [35.905, 31.963] → flip → [31.963, 35.905]  ✓
```

The rule: when building the URL, write `${lng},${lat}`. When reading the response, write `.map(([lng, lat]) => [lat, lng])`. If you ever see riders appearing in the ocean, this is what went wrong.

- [ ] **Step 4: Commit**

```bash
git add src/app/lib/osrm.ts
git commit -m "feat: add OSRM route fetcher with arc fallback (coordinate-safe)"
```

---

### Task 4: ETA Library

**Files:**
- Create: `src/app/lib/eta.ts`

- [ ] **Step 1: Create `src/app/lib/eta.ts`**

```typescript
/**
 * ETA calculations for the rider route tracking system.
 *
 * IMPORTANT: Never compute remaining time by decrementing a counter.
 * Always use:  remaining = adjustedDuration - (Date.now() - tripStartedAt) / 1000
 * This prevents drift when React re-renders or the tab is backgrounded.
 */

/**
 * Adjust OSRM base duration for Amman traffic patterns.
 * Multipliers are estimates — replace with real data in Phase 2.
 */
export function etaMultiplier(): number {
  const hour = new Date().getHours();
  if (hour >= 7 && hour <= 9)   return 1.4; // morning peak
  if (hour >= 16 && hour <= 19) return 1.3; // afternoon peak
  if (hour >= 12 && hour <= 14) return 1.1; // lunch rush
  return 1.0;
}

/**
 * Compute remaining seconds. Always call with live Date.now() values.
 *
 * @param adjustedDurationSeconds  Route duration × etaMultiplier()
 * @param tripStartedAt            Date.now() when order → inTransit
 * @returns Remaining seconds (negative = overdue)
 */
export function remainingSeconds(
  adjustedDurationSeconds: number,
  tripStartedAt: number
): number {
  const elapsed = (Date.now() - tripStartedAt) / 1000;
  return adjustedDurationSeconds - elapsed;
}

/**
 * Format remaining seconds as a human-readable string.
 * Examples: "14 min", "2 min", "Overdue 3 min"
 */
export function formatEta(remaining: number): string {
  if (remaining <= 0) {
    const overdue = Math.round(Math.abs(remaining) / 60);
    return overdue === 0 ? "Arriving now" : `Overdue ${overdue} min`;
  }
  const mins = Math.ceil(remaining / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${mins} min`;
}

/**
 * Format absolute arrival time as "HH:MM".
 */
export function formatArrivalTime(
  adjustedDurationSeconds: number,
  tripStartedAt: number
): string {
  const arrivalMs = tripStartedAt + adjustedDurationSeconds * 1000;
  return new Date(arrivalMs).toLocaleTimeString("en-JO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * CSS variable name for the ETA confidence color.
 *
 * Green  → more than 20% buffer remaining
 * Amber  → less than 20% buffer remaining
 * Red    → overdue (remaining < 0)
 */
export function etaColor(
  remaining: number,
  adjustedDurationSeconds: number
): string {
  if (remaining < 0) return "var(--color-danger-600)";
  const bufferPct = remaining / adjustedDurationSeconds;
  if (bufferPct > 0.2) return "var(--color-brand-600)";
  return "var(--color-amber-600)";
}

/**
 * Compute route progress percentage.
 * Use currentCoordIndex from ActiveRoute, not elapsed time.
 * Time and animation position can drift — coord index is the ground truth.
 */
export function routeProgressPct(
  currentCoordIndex: number,
  totalCoords: number
): number {
  if (totalCoords <= 1) return 100;
  return Math.min(100, Math.round((currentCoordIndex / (totalCoords - 1)) * 100));
}

/**
 * Estimate km remaining based on coord index position.
 */
export function kmRemaining(
  currentCoordIndex: number,
  totalCoords: number,
  totalDistanceKm: number
): number {
  const pct = 1 - currentCoordIndex / Math.max(totalCoords - 1, 1);
  return +(pct * totalDistanceKm).toFixed(1);
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/eta.ts
git commit -m "feat: add ETA calculation library (drift-safe, Date.now() based)"
```

---

### Task 5: Performance Aggregation Library

**Files:**
- Create: `src/app/lib/performance.ts`

- [ ] **Step 1: Create `src/app/lib/performance.ts`**

```typescript
import type { CompletedTrip } from "../types";

/** Per-rider aggregated stats for the Rider Performance Card report */
export interface RiderStats {
  riderId: number;
  riderName: string;
  tripsCompleted: number;
  avgActualSeconds: number;
  avgOsrmSeconds: number;
  avgEfficiencyScore: number;   // >100 = faster than estimated
  onTimeRate: number;           // % of trips within 110% of OSRM estimate
  totalDistanceKm: number;
  totalCo2Saved: number;
  totalEarnings: number;
  avgTripDistanceKm: number;
}

/** Per-district aggregated delivery times for the Slowest Districts report */
export interface DistrictStats {
  district: string;
  tripsCompleted: number;
  avgActualMinutes: number;
  avgOsrmMinutes: number;
  avgEfficiencyScore: number;
  totalCo2Saved: number;
}

/**
 * Aggregate completed trips into per-rider stats.
 * Pass the full completedTrips array from App state.
 */
export function computeRiderStats(trips: CompletedTrip[]): RiderStats[] {
  const byRider = new Map<number, CompletedTrip[]>();
  for (const trip of trips) {
    const existing = byRider.get(trip.riderId) ?? [];
    byRider.set(trip.riderId, [...existing, trip]);
  }

  return Array.from(byRider.entries()).map(([riderId, rTrips]) => {
    const n = rTrips.length;
    const avgActualSeconds = rTrips.reduce((s, t) => s + t.actualSeconds, 0) / n;
    const avgOsrmSeconds   = rTrips.reduce((s, t) => s + t.osrmEstimateSeconds, 0) / n;
    const avgEfficiency    = rTrips.reduce((s, t) => s + t.efficiencyScore, 0) / n;
    const onTime           = rTrips.filter(t => t.actualSeconds <= t.osrmEstimateSeconds * 1.1).length;
    const totalDistanceKm  = rTrips.reduce((s, t) => s + t.distanceKm, 0);

    return {
      riderId,
      riderName: rTrips[0].riderName,
      tripsCompleted: n,
      avgActualSeconds: Math.round(avgActualSeconds),
      avgOsrmSeconds:   Math.round(avgOsrmSeconds),
      avgEfficiencyScore: Math.round(avgEfficiency),
      onTimeRate: Math.round((onTime / n) * 100),
      totalDistanceKm: +totalDistanceKm.toFixed(1),
      totalCo2Saved:  +rTrips.reduce((s, t) => s + t.co2Saved, 0).toFixed(2),
      totalEarnings:  +rTrips.reduce((s, t) => s + t.earnings, 0).toFixed(2),
      avgTripDistanceKm: +(totalDistanceKm / n).toFixed(1),
    };
  });
}

/**
 * Aggregate completed trips into per-district delivery time stats.
 * Sorted by avgActualMinutes descending (slowest first) for the report.
 */
export function computeDistrictStats(trips: CompletedTrip[]): DistrictStats[] {
  const byDistrict = new Map<string, CompletedTrip[]>();
  for (const trip of trips) {
    const existing = byDistrict.get(trip.district) ?? [];
    byDistrict.set(trip.district, [...existing, trip]);
  }

  return Array.from(byDistrict.entries())
    .map(([district, dTrips]) => {
      const n = dTrips.length;
      return {
        district,
        tripsCompleted: n,
        avgActualMinutes:   +(dTrips.reduce((s, t) => s + t.actualSeconds, 0) / n / 60).toFixed(1),
        avgOsrmMinutes:     +(dTrips.reduce((s, t) => s + t.osrmEstimateSeconds, 0) / n / 60).toFixed(1),
        avgEfficiencyScore: Math.round(dTrips.reduce((s, t) => s + t.efficiencyScore, 0) / n),
        totalCo2Saved:      +dTrips.reduce((s, t) => s + t.co2Saved, 0).toFixed(2),
      };
    })
    .sort((a, b) => b.avgActualMinutes - a.avgActualMinutes); // slowest first
}

/**
 * Determine which Amman district a set of delivery coordinates falls in.
 * Uses a simple bounding-box lookup against known district centroids.
 * Phase 2: replace with point-in-polygon against district polygons.
 */
export function districtFromCoords(lat: number, lng: number): string {
  const DISTRICT_BOXES: { name: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
    { name: "Downtown (Al-Balad)", minLat: 31.943, maxLat: 31.960, minLng: 35.924, maxLng: 35.946 },
    { name: "Shmeisani",           minLat: 31.970, maxLat: 31.988, minLng: 35.870, maxLng: 35.895 },
    { name: "Sweifieh",            minLat: 31.935, maxLat: 31.952, minLng: 35.858, maxLng: 35.882 },
    { name: "Abdoun",              minLat: 31.930, maxLat: 31.947, minLng: 35.872, maxLng: 35.900 },
    { name: "Jubaiha",             minLat: 31.992, maxLat: 32.012, minLng: 35.858, maxLng: 35.882 },
    { name: "Tabarbour",           minLat: 32.005, maxLat: 32.025, minLng: 35.908, maxLng: 35.938 },
    { name: "8th Circle Area",     minLat: 31.950, maxLat: 31.968, minLng: 35.842, maxLng: 35.865 },
    { name: "University District", minLat: 31.998, maxLat: 32.018, minLng: 35.866, maxLng: 35.892 },
    { name: "Tlaa Al-Ali",         minLat: 31.940, maxLat: 31.958, minLng: 35.845, maxLng: 35.870 },
    { name: "Airport Road Corridor",minLat: 31.895, maxLat: 31.925, minLng: 35.930, maxLng: 35.965 },
  ];

  for (const box of DISTRICT_BOXES) {
    if (lat >= box.minLat && lat <= box.maxLat &&
        lng >= box.minLng && lng <= box.maxLng) {
      return box.name;
    }
  }
  return "Other Amman";
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/performance.ts
git commit -m "feat: add performance aggregation library for rider stats and district stats"
```

---

## Phase 2 — Route Visualization

### Task 6: RouteLayer Component

**Files:**
- Create: `src/app/components/RouteLayer.tsx`

This component manages all Leaflet layers for one active route. It follows the exact same `useRef` + `useEffect` + `.remove()` cleanup pattern already used in `HeatMapLayer.tsx` and `HubsMapLayer.tsx`.

**Stale closure guard:** The `onAnimationStep` callback is called inside a `setInterval`. Intervals capture values at creation time — they will always call a stale version of `onAnimationStep` unless we proxy through a ref. We use `callbackRef.current()` to always call the latest version.

- [ ] **Step 1: Create `src/app/components/RouteLayer.tsx`**

```tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { ActiveRoute, Route } from "../types";

interface RouteLayerProps {
  /** The Leaflet map instance. Passed from App via a ref. */
  map: L.Map | null;
  /** The route to draw, or null to clear all layers. */
  route: Route | null;
  /** Rider's current known position — used as initial marker position. */
  riderLat: number;
  riderLng: number;
  /** Called on every animation step with the updated coord index. */
  onAnimationStep: (coordIndex: number) => void;
  /** Called when animation reaches the last coordinate. */
  onAnimationComplete: () => void;
  /** Animation speed: how many coords to advance per interval tick. */
  coordsPerTick?: number;
  /** Interval between animation ticks in ms. */
  tickMs?: number;
}

// Animated dash pattern for the route polyline
const DASH_ARRAY = "10, 8";
const DASH_OFFSET_STEP = 1; // px per CSS animation frame

export function RouteLayer({
  map,
  route,
  riderLat,
  riderLng,
  onAnimationStep,
  onAnimationComplete,
  coordsPerTick = 1,
  tickMs = 250,
}: RouteLayerProps) {
  // Layer refs — MUST be cleaned up in every useEffect return
  const polylineRef        = useRef<L.Polyline | null>(null);
  const markerRef          = useRef<L.Marker | null>(null);
  const pickupMarkerRef    = useRef<L.Marker | null>(null);
  const deliveryMarkerRef  = useRef<L.Marker | null>(null);
  const intervalRef        = useRef<ReturnType<typeof setInterval> | null>(null);
  const coordIndexRef      = useRef(0);

  // Stale-closure guard: always call the latest callback
  const onStepRef    = useRef(onAnimationStep);
  const onCompleteRef = useRef(onAnimationComplete);
  useEffect(() => { onStepRef.current = onAnimationStep; }, [onAnimationStep]);
  useEffect(() => { onCompleteRef.current = onAnimationComplete; }, [onAnimationComplete]);

  // ── Clear all layers helper ───────────────────────────────────────────────
  function clearAllLayers() {
    polylineRef.current?.remove();       polylineRef.current = null;
    markerRef.current?.remove();         markerRef.current = null;
    pickupMarkerRef.current?.remove();   pickupMarkerRef.current = null;
    deliveryMarkerRef.current?.remove(); deliveryMarkerRef.current = null;
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    coordIndexRef.current = 0;
  }

  // ── Main effect: draw route and start animation ──────────────────────────
  useEffect(() => {
    if (!map || !route) {
      clearAllLayers();
      return;
    }

    clearAllLayers(); // clean up any previous route first

    const coords = route.coords; // [lat, lng][]

    // ── 1. Draw route polyline ──────────────────────────────────────────────
    polylineRef.current = L.polyline(coords, {
      color: route.isFallback ? "#94A3B8" : "#1E5C35", // grey arc vs green road
      weight: route.isFallback ? 2 : 3,
      opacity: 0.85,
      dashArray: DASH_ARRAY,
      lineCap: "round",
      lineJoin: "round",
    }).addTo(map);

    // ── 2. Pickup pin (hub icon) at route start ─────────────────────────────
    const pickupIcon = L.divIcon({
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      html: `<div style="
        width:28px;height:28px;border-radius:50%;
        background:#1E5C35;border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        font-size:13px;color:white;
      ">H</div>`,
    });
    pickupMarkerRef.current = L.marker(coords[0], { icon: pickupIcon })
      .bindTooltip("Pickup Hub", { direction: "top" })
      .addTo(map);

    // ── 3. Delivery pin at route end ───────────────────────────────────────
    const deliveryIcon = L.divIcon({
      className: "",
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      html: `<div style="
        width:28px;height:28px;border-radius:6px 6px 0 6px;
        background:#C8860A;border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);
        display:flex;align-items:center;justify-content:center;
        font-size:11px;color:white;font-weight:700;
      ">D</div>`,
    });
    const lastCoord = coords[coords.length - 1];
    deliveryMarkerRef.current = L.marker(lastCoord, { icon: deliveryIcon })
      .bindTooltip("Delivery address", { direction: "top" })
      .addTo(map);

    // ── 4. Rider marker starting at current position ───────────────────────
    const riderIcon = L.divIcon({
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      html: `<div style="
        width:16px;height:16px;border-radius:50%;
        background:#1E5C35;border:3px solid white;
        box-shadow:0 0 0 2px #1E5C35,0 2px 8px rgba(0,0,0,0.3);
        animation:pulse 1.5s infinite;
      "></div>`,
    });
    markerRef.current = L.marker([riderLat, riderLng], { icon: riderIcon })
      .addTo(map);

    // ── 5. Distance label at midpoint ──────────────────────────────────────
    const midIdx = Math.floor(coords.length / 2);
    const midCoord = coords[midIdx];
    L.marker(midCoord, {
      icon: L.divIcon({
        className: "",
        iconSize: [90, 20],
        iconAnchor: [45, 10],
        html: `<div style="
          background:white;border:1px solid #E2E8F0;
          border-radius:6px;padding:2px 8px;
          font-family:'DM Mono',monospace;font-size:10px;
          color:#4B5563;font-weight:500;
          box-shadow:0 1px 4px rgba(0,0,0,0.10);white-space:nowrap;
        ">${route.distanceKm} km · ${Math.round(route.adjustedDurationSeconds / 60)} min</div>`,
      }),
      interactive: false,
    }).addTo(map);

    // ── 6. Animation loop ──────────────────────────────────────────────────
    coordIndexRef.current = 0;
    intervalRef.current = setInterval(() => {
      const nextIndex = coordIndexRef.current + coordsPerTick;

      if (nextIndex >= coords.length) {
        // Reached destination
        markerRef.current?.setLatLng(coords[coords.length - 1]);
        coordIndexRef.current = coords.length - 1;
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onCompleteRef.current();
        return;
      }

      coordIndexRef.current = nextIndex;
      markerRef.current?.setLatLng(coords[nextIndex]);
      onStepRef.current(nextIndex);
    }, tickMs);

    // Fly map to fit the route
    map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });

    // ── Cleanup: remove ALL layers and cancel interval ─────────────────────
    return () => {
      clearAllLayers();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route]); // re-run when route changes; riderLat/riderLng are initial position only

  return null; // renders nothing — all output is Leaflet DOM
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Verify the cleanup behavior**

In `src/app/App.tsx`, temporarily mount `<RouteLayer map={null} route={null} ... />` and confirm the build passes. Do not wire state yet — that is Task 7.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/RouteLayer.tsx
git commit -m "feat: add RouteLayer with OSRM polyline, animated marker, pickup/delivery pins"
```

---

### Task 7: Wire RouteLayer into App

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add `activeRoute` and `completedTrips` state to `App.tsx`**

Find the existing state declarations in `App.tsx` and add:

```tsx
import type { ActiveRoute, CompletedTrip } from "./types";
import { fetchOsrmRoute, buildArcFallback } from "./lib/osrm";
import { etaMultiplier, districtFromCoords } from "./lib/eta";
import { districtFromCoords as districtForCoords } from "./lib/performance";

// ── Add inside App() ──────────────────────────────────────────────────────
const [activeRoute, setActiveRoute]     = useState<ActiveRoute | null>(null);
const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);
```

- [ ] **Step 2: Add `handleOrderClick` — triggered when admin clicks an order card**

Add this function inside `App()`, after the existing handlers:

```tsx
const handleOrderClick = async (
  riderId: number,
  orderId: string,
) => {
  const rider = RIDERS.find(r => r.id === riderId);
  const order = rider?.orders.find(o => o.id === orderId);
  if (!rider || !order) return;

  // Find the nearest active hub — that is the pickup point
  const nearestHub = INITIAL_HUBS
    .filter(h => h.active)
    .reduce((best, h) => {
      const d = Math.hypot(h.lat - rider.lat, h.lng - rider.lng);
      return d < Math.hypot(best.lat - rider.lat, best.lng - rider.lng) ? h : best;
    });

  // Draw arc immediately — never show a blank map while OSRM loads
  const arcRoute = buildArcFallback(
    nearestHub.lat, nearestHub.lng,
    order.deliveryLat, order.deliveryLng,
  );
  const adjusted = arcRoute.durationSeconds * etaMultiplier();
  const arcWithAdj: typeof arcRoute = { ...arcRoute, adjustedDurationSeconds: adjusted };

  setActiveRoute({
    orderId,
    riderId,
    route: arcWithAdj,
    currentCoordIndex: 0,
    startedAt: Date.now(),
    progressPct: 0,
  });

  // Then fetch real route in background and upgrade
  try {
    const realRoute = await fetchOsrmRoute(
      nearestHub.lat, nearestHub.lng,
      order.deliveryLat, order.deliveryLng,
    );
    const realAdj = realRoute.durationSeconds * etaMultiplier();
    const realWithAdj = { ...realRoute, adjustedDurationSeconds: realAdj };

    // Only update if the user hasn't clicked a different order since
    setActiveRoute(prev =>
      prev?.orderId === orderId
        ? { ...prev, route: realWithAdj, startedAt: Date.now() }
        : prev
    );
  } catch {
    // Arc fallback already set — silently keep it
  }
};
```

- [ ] **Step 3: Add `handleAnimationStep` and `handleAnimationComplete`**

```tsx
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
  if (!activeRoute) return;

  const rider  = RIDERS.find(r => r.id === activeRoute.riderId);
  const order  = rider?.orders.find(o => o.id === activeRoute.orderId);
  if (!rider || !order) return;

  const completedAt  = Date.now();
  const actualSeconds = (completedAt - activeRoute.startedAt) / 1000;
  const efficiencyScore = Math.round(
    (activeRoute.route.adjustedDurationSeconds / actualSeconds) * 100
  );

  const trip: CompletedTrip = {
    orderId:             activeRoute.orderId,
    riderId:             activeRoute.riderId,
    riderName:           rider.name,
    startedAt:           activeRoute.startedAt,
    completedAt,
    actualSeconds:       Math.round(actualSeconds),
    osrmEstimateSeconds: activeRoute.route.adjustedDurationSeconds,
    distanceKm:          activeRoute.route.distanceKm,
    efficiencyScore,
    district: districtForCoords(order.deliveryLat, order.deliveryLng),
    co2Saved:   order.co2Saved,
    earnings:   order.earnings,
    material:   order.material,
  };

  setCompletedTrips(prev => [...prev, trip]);
  setActiveRoute(null);
};
```

- [ ] **Step 4: Find where the map is rendered and mount `RouteLayer`**

In `App.tsx`, find the `MapContainer` (or wherever `MapRef.current` is set). Mount `RouteLayer` as a sibling to `HeatMapLayer` and `HubsMapLayer`:

```tsx
{/* Route tracking layer — only active on the Live Map view */}
{activeView === "map" && (
  <RouteLayer
    map={mapRef.current}
    route={activeRoute?.route ?? null}
    riderLat={
      RIDERS.find(r => r.id === activeRoute?.riderId)?.lat ?? 31.963
    }
    riderLng={
      RIDERS.find(r => r.id === activeRoute?.riderId)?.lng ?? 35.905
    }
    onAnimationStep={handleAnimationStep}
    onAnimationComplete={handleAnimationComplete}
    coordsPerTick={2}
    tickMs={250}
  />
)}
```

- [ ] **Step 5: Pass `onOrderClick`, `activeRoute`, `completedTrips` down to `RiderPanel`**

Update the `<RiderPanel>` usage:

```tsx
<RiderPanel
  riders={RIDERS}
  selectedId={selectedRider}
  onSelect={handleRiderSelect}
  onClose={handleRiderClose}
  time={time}
  onOrderClick={handleOrderClick}          // ← NEW
  activeRoute={activeRoute}                // ← NEW
  completedTrips={completedTrips}          // ← NEW
/>
```

Update `RiderPanelProps` in `RiderPanel.tsx` to include:

```tsx
onOrderClick: (riderId: number, orderId: string) => void;
activeRoute: ActiveRoute | null;
completedTrips: CompletedTrip[];
```

- [ ] **Step 6: Build**

```bash
npm run build
```

Expected: TypeScript errors on the updated `RiderPanel` props until Task 8 updates `OrderCard`. Fix those in Task 8.

- [ ] **Step 7: Commit**

```bash
git add src/app/App.tsx src/app/components/RiderPanel.tsx
git commit -m "feat: wire RouteLayer, activeRoute state, and trip completion handler in App"
```

---

## Phase 3 — ETA Countdown + Progress Bar

### Task 8: RouteProgressBar Component

**Files:**
- Create: `src/app/components/rider/RouteProgressBar.tsx`

- [ ] **Step 1: Create `src/app/components/rider/RouteProgressBar.tsx`**

```tsx
import { useEffect, useState } from "react";
import { formatEta, formatArrivalTime, etaColor, kmRemaining } from "../../lib/eta";
import type { ActiveRoute } from "../../types";

interface RouteProgressBarProps {
  activeRoute: ActiveRoute;
}

export function RouteProgressBar({ activeRoute }: RouteProgressBarProps) {
  const [, forceUpdate] = useState(0);

  // Re-render every second so the ETA countdown is live
  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { route, startedAt, progressPct, currentCoordIndex } = activeRoute;
  const { adjustedDurationSeconds, distanceKm, coords, isFallback } = route;

  const remaining  = adjustedDurationSeconds - (Date.now() - startedAt) / 1000;
  const color      = etaColor(remaining, adjustedDurationSeconds);
  const etaLabel   = formatEta(remaining);
  const arrivalStr = formatArrivalTime(adjustedDurationSeconds, startedAt);
  const kmLeft     = kmRemaining(currentCoordIndex, coords.length, distanceKm);

  return (
    <div style={{ marginTop: 8 }}>
      {/* Progress bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {/* Hub dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "50%",
          background: "var(--color-brand-600)", flexShrink: 0,
        }} />

        {/* Bar track */}
        <div style={{
          flex: 1, height: 6,
          borderRadius: "var(--radius-full)",
          background: "var(--color-border)",
          overflow: "hidden",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0,
            height: "100%",
            width: `${progressPct}%`,
            borderRadius: "var(--radius-full)",
            background: color,
            transition: "width 0.25s ease",
          }} />
          {/* Animated leading dot */}
          <div style={{
            position: "absolute", top: "50%",
            left: `${progressPct}%`,
            transform: "translate(-50%, -50%)",
            width: 10, height: 10,
            borderRadius: "50%",
            background: color,
            border: "2px solid white",
            boxShadow: `0 0 0 2px ${color}`,
            transition: "left 0.25s ease",
          }} className="animate-pulse-soft" />
        </div>

        {/* Delivery dot */}
        <div style={{
          width: 8, height: 8, borderRadius: "2px",
          background: "var(--color-amber-600)", flexShrink: 0,
        }} />
      </div>

      {/* Stats row */}
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{
          fontFamily: "var(--font-mono)", fontSize: 10,
          color: "var(--color-text-tertiary)",
        }}>
          {kmLeft > 0 ? `${kmLeft} km left` : "Arrived"}
          {isFallback && (
            <span style={{ marginLeft: 4, color: "var(--color-text-disabled)" }}>
              (est.)
            </span>
          )}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 11,
            color, fontWeight: 700,
          }}>
            {etaLabel}
          </span>
          <span style={{
            fontFamily: "var(--font-mono)", fontSize: 10,
            color: "var(--color-text-tertiary)",
          }}>
            · arrives {arrivalStr}
          </span>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `OrderCard.tsx` to show `RouteProgressBar` for in-transit orders**

Open `src/app/components/rider/OrderCard.tsx`. Add props and conditional rendering:

```tsx
import { RouteProgressBar } from "./RouteProgressBar";
import type { ActiveRoute } from "../../types";

interface OrderCardProps {
  order: Order;
  onOrderClick?: (orderId: string) => void;   // ← NEW
  activeRoute?: ActiveRoute | null;             // ← NEW — truthy when this order is being tracked
}

export function OrderCard({ order, onOrderClick, activeRoute }: OrderCardProps) {
  // ... existing code ...

  return (
    <div
      onClick={() => onOrderClick?.(order.id)}
      style={{
        // ... existing styles ...
        cursor: onOrderClick ? "pointer" : "default",
      }}
    >
      {/* ... existing header, material, address ... */}

      {/* Replace ProgressTrail with RouteProgressBar when actively tracking */}
      {activeRoute && order.status === "inTransit" ? (
        <RouteProgressBar activeRoute={activeRoute} />
      ) : (
        <ProgressTrail status={order.status} accentColor={mc.color} />
      )}

      {/* ... existing footer ... */}
    </div>
  );
}
```

- [ ] **Step 3: Update `RiderDetailDrawer.tsx` to pass `onOrderClick` and `activeRoute` to `OrderCard`**

In `RiderDetailDrawer.tsx`, update props and pass-through:

```tsx
interface RiderDetailDrawerProps {
  rider: Rider;
  onClose: () => void;
  onOrderClick?: (riderId: number, orderId: string) => void;  // ← NEW
  activeRoute?: ActiveRoute | null;                            // ← NEW
}

// Inside the Orders tab render, update each OrderCard:
rider.orders.map(order => (
  <OrderCard
    key={order.id}
    order={order}
    onOrderClick={orderId => onOrderClick?.(rider.id, orderId)}
    activeRoute={
      activeRoute?.orderId === order.id ? activeRoute : null
    }
  />
))
```

- [ ] **Step 4: Thread `onOrderClick` and `activeRoute` through `RiderPanel` → `RiderDetailDrawer`**

In `RiderPanel.tsx`, update props and pass-through to `RiderDetailDrawer`:

```tsx
// Add to RiderPanelProps (already added in Task 7):
// onOrderClick: (riderId: number, orderId: string) => void;
// activeRoute: ActiveRoute | null;

// In the RiderDetailDrawer usage:
<RiderDetailDrawer
  rider={selected}
  onClose={onClose}
  onOrderClick={onOrderClick}
  activeRoute={activeRoute}
/>
```

- [ ] **Step 5: Build and visually verify**

```bash
npm run build && npm run dev
```

Click on a rider → click on one of their active orders → verify:
1. The map draws a green polyline (real route) or grey arc (fallback) immediately
2. A moving dot slides along the route
3. The order card in the drawer shows the RouteProgressBar filling up
4. The ETA countdown ticks live (green → amber → red as it approaches)
5. When animation completes, the RouteProgressBar disappears and ProgressTrail shows "Completed"

- [ ] **Step 6: Commit**

```bash
git add src/app/components/rider/RouteProgressBar.tsx \
        src/app/components/rider/OrderCard.tsx \
        src/app/components/rider/RiderDetailDrawer.tsx \
        src/app/components/RiderPanel.tsx
git commit -m "feat: RouteProgressBar with live ETA countdown in order card"
```

---

### Task 9: ETA Chip in Rider List Row

**Files:**
- Modify: `src/app/components/rider/RiderRow.tsx`

- [ ] **Step 1: Add active-route ETA chip to `RiderRow`**

Open `src/app/components/rider/RiderRow.tsx`. Add props and chip:

```tsx
import { useEffect, useState } from "react";
import { formatEta, etaColor, remainingSeconds } from "../../lib/eta";
import type { ActiveRoute } from "../../types";

interface RiderRowProps {
  rider: Rider;
  isSelected: boolean;
  maxEarnings: number;
  onSelect: (id: number) => void;
  activeRoute?: ActiveRoute | null;  // ← NEW
}

export function RiderRow({ rider, isSelected, maxEarnings, onSelect, activeRoute }: RiderRowProps) {
  const [, forceUpdate] = useState(0);

  // Re-render every second when this rider has an active route
  useEffect(() => {
    if (!activeRoute) return;
    const id = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [activeRoute]);

  // ... existing code ...

  // Add ETA chip after the earnings bar:
  const hasActiveRoute = !!activeRoute;
  const remaining = hasActiveRoute
    ? remainingSeconds(activeRoute.route.adjustedDurationSeconds, activeRoute.startedAt)
    : null;

  // Inside the return, after the earnings bar:
  {hasActiveRoute && remaining !== null && (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
      <div style={{
        width: 5, height: 5, borderRadius: "50%",
        background: etaColor(remaining, activeRoute.route.adjustedDurationSeconds),
        flexShrink: 0,
      }} className="animate-pulse-soft" />
      <span style={{
        fontFamily: "var(--font-mono)", fontSize: 10,
        color: etaColor(remaining, activeRoute.route.adjustedDurationSeconds),
        fontWeight: 600,
      }}>
        {formatEta(remaining)}
      </span>
    </div>
  )}
```

- [ ] **Step 2: Pass `activeRoute` to `RiderRow` in `RiderPanel.tsx`**

```tsx
// In the riders.map():
<RiderRow
  key={rider.id}
  rider={rider}
  isSelected={rider.id === selectedId}
  maxEarnings={maxEarnings}
  onSelect={onSelect}
  activeRoute={activeRoute?.riderId === rider.id ? activeRoute : null}  // ← NEW
/>
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Click an order → the rider row in the list should show a pulsing colored dot + "8 min" that counts down live.

- [ ] **Step 4: Commit**

```bash
git add src/app/components/rider/RiderRow.tsx src/app/components/RiderPanel.tsx
git commit -m "feat: live ETA chip in rider list row during active route"
```

---

## Phase 4 — Fleet Radar Mode

### Task 10: FleetRadarLayer Component

**Files:**
- Create: `src/app/components/FleetRadarLayer.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Create `src/app/components/FleetRadarLayer.tsx`**

```tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Rider, Route } from "../types";
import { fetchOsrmRoute, buildArcFallback } from "../lib/osrm";
import { etaMultiplier } from "../lib/eta";
import { INITIAL_HUBS } from "../constants";

interface FleetRadarLayerProps {
  map: L.Map | null;
  riders: Rider[];
  activeRouteRiderId: number | null; // highlighted rider (full opacity)
}

// In Radar mode: on-time=green, near-late=amber, overdue=red
function radarLineColor(
  distanceKm: number,
  adjustedSeconds: number,
  startedAt: number
): string {
  if (!startedAt) return "#94A3B8"; // not started yet
  const elapsed = (Date.now() - startedAt) / 1000;
  const remaining = adjustedSeconds - elapsed;
  if (remaining < 0) return "#DC2626";
  if (remaining / adjustedSeconds < 0.2) return "#C8860A";
  return "#1E5C35";
}

export function FleetRadarLayer({
  map,
  riders,
  activeRouteRiderId,
}: FleetRadarLayerProps) {
  const layersRef = useRef<L.Layer[]>([]);

  function clearLayers() {
    layersRef.current.forEach(l => l.remove());
    layersRef.current = [];
  }

  useEffect(() => {
    if (!map) return;
    clearLayers();

    const activeRiders = riders.filter(r => r.status === "delivering");
    if (activeRiders.length === 0) return;

    let cancelled = false;

    const drawRider = async (rider: Rider) => {
      const order = rider.orders.find(o => o.status === "inTransit");
      if (!order) return;

      const nearestHub = INITIAL_HUBS
        .filter(h => h.active)
        .reduce((best, h) => {
          const d = Math.hypot(h.lat - rider.lat, h.lng - rider.lng);
          return d < Math.hypot(best.lat - rider.lat, best.lng - rider.lng) ? h : best;
        });

      let route: Route;
      try {
        route = await fetchOsrmRoute(
          nearestHub.lat, nearestHub.lng,
          order.deliveryLat, order.deliveryLng,
        );
        route = { ...route, adjustedDurationSeconds: route.durationSeconds * etaMultiplier() };
      } catch {
        route = buildArcFallback(
          nearestHub.lat, nearestHub.lng,
          order.deliveryLat, order.deliveryLng,
        );
      }

      if (cancelled) return;

      const isHighlighted = rider.id === activeRouteRiderId;
      const color = radarLineColor(route.distanceKm, route.adjustedDurationSeconds, 0);

      const polyline = L.polyline(route.coords, {
        color,
        weight: isHighlighted ? 4 : 2,
        opacity: isHighlighted ? 1.0 : 0.2,
        dashArray: "8, 6",
      });

      polyline.bindTooltip(
        `${rider.name} · ${rider.vehicle} · ${route.distanceKm} km`,
        { direction: "top" }
      );

      polyline.addTo(map);
      layersRef.current.push(polyline);
    };

    // Fetch all routes in parallel
    Promise.all(activeRiders.map(drawRider));

    return () => {
      cancelled = true;
      clearLayers();
    };
  }, [map, riders, activeRouteRiderId]);

  return null;
}
```

- [ ] **Step 2: Add Fleet Radar toggle to App state and wire `FleetRadarLayer`**

In `App.tsx`:

```tsx
const [fleetRadar, setFleetRadar] = useState(false);

// In the JSX, inside the map view section, after RouteLayer:
{activeView === "map" && fleetRadar && (
  <FleetRadarLayer
    map={mapRef.current}
    riders={RIDERS}
    activeRouteRiderId={activeRoute?.riderId ?? null}
  />
)}
```

- [ ] **Step 3: Add the Fleet Radar toggle button to the map header**

Find the map header/toolbar in `App.tsx` and add:

```tsx
<button
  aria-label={fleetRadar ? "Disable fleet radar" : "Enable fleet radar"}
  aria-pressed={fleetRadar}
  onClick={() => setFleetRadar(r => !r)}
  style={{
    padding: "4px 10px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--color-border)",
    fontSize: 11, fontWeight: 600, cursor: "pointer",
    background: fleetRadar ? "var(--color-brand-600)" : "var(--color-surface-card)",
    color: fleetRadar ? "white" : "var(--color-text-secondary)",
    transition: "background 0.15s, color 0.15s",
  }}
>
  Fleet Radar
</button>
```

- [ ] **Step 4: Build and verify**

```bash
npm run build && npm run dev
```

Enable Fleet Radar toggle → all delivering riders should show route lines on the map simultaneously. Their colors reflect on-time status.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/FleetRadarLayer.tsx src/app/App.tsx
git commit -m "feat: Fleet Radar Mode — all active routes visible simultaneously"
```

---

## Phase 5 — Reports Integration + B2B Data Story

### Task 11: Rider Performance Card Report Template

**Files:**
- Modify: `src/app/components/reports/` (create this folder if it doesn't exist)
- Create: `src/app/components/reports/RiderPerformanceReport.tsx`

- [ ] **Step 1: Create `src/app/components/reports/RiderPerformanceReport.tsx`**

```tsx
import { Wind, Banknote, Zap, Route, Clock } from "lucide-react";
import type { CompletedTrip } from "../../types";
import { computeRiderStats } from "../../lib/performance";

interface RiderPerformanceReportProps {
  completedTrips: CompletedTrip[];
  /** Shown at top — "This Week", "Today", etc. */
  periodLabel: string;
}

export function RiderPerformanceReport({
  completedTrips,
  periodLabel,
}: RiderPerformanceReportProps) {
  const stats = computeRiderStats(completedTrips);

  if (stats.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <Clock size={28} color="var(--color-text-disabled)" style={{ margin: "0 auto 8px" }} />
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
          No completed trips yet this session.
          <br />
          Click an order on the Live Map to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: "var(--space-4)" }}>
      {/* Header */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--color-text-tertiary)",
        marginBottom: 16,
      }}>
        Rider Performance — {periodLabel}
      </div>

      {/* B2B note */}
      <div style={{
        padding: "8px 12px", borderRadius: "var(--radius-md)",
        background: "var(--color-brand-50)", border: "1px solid var(--color-brand-100)",
        marginBottom: 16, fontSize: 11, color: "var(--color-brand-600)",
      }}>
        This data feeds client CO₂ certificates and the District Intelligence Report.
      </div>

      {/* Rider cards */}
      {stats
        .sort((a, b) => b.avgEfficiencyScore - a.avgEfficiencyScore)
        .map(rider => (
          <div
            key={rider.riderId}
            style={{
              marginBottom: 12, padding: "var(--space-3)",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-xs)",
            }}
          >
            {/* Rider header */}
            <div style={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 10,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
                  {rider.riderName}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                  {rider.tripsCompleted} trip{rider.tripsCompleted !== 1 ? "s" : ""} completed
                </div>
              </div>
              {/* Efficiency badge */}
              <div style={{
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: rider.avgEfficiencyScore >= 90
                  ? "var(--color-brand-100)" : "var(--color-amber-100)",
                color: rider.avgEfficiencyScore >= 90
                  ? "var(--color-brand-600)" : "var(--color-amber-600)",
                fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)",
              }}>
                {rider.avgEfficiencyScore}% efficiency
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { Icon: Wind,    label: "CO₂ Saved",     value: `${rider.totalCo2Saved.toFixed(1)} kg`, color: "var(--color-brand-600)" },
                { Icon: Banknote,label: "Earnings",       value: `${rider.totalEarnings.toFixed(2)} JD`, color: "var(--color-amber-600)" },
                { Icon: Zap,     label: "Avg trip time",  value: `${Math.round(rider.avgActualSeconds / 60)} min`,   color: "var(--color-text-secondary)" },
                { Icon: Route,   label: "Total km",       value: `${rider.totalDistanceKm} km`,           color: "var(--color-text-secondary)" },
              ].map(({ Icon, label, value, color }) => (
                <div key={label} style={{
                  padding: "6px 8px", borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface)",
                  display: "flex", flexDirection: "column", gap: 2,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon size={11} color={color} />
                    <span style={{ fontSize: 9, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {label}
                    </span>
                  </div>
                  <span style={{
                    fontFamily: "var(--font-mono)", fontSize: 13,
                    fontWeight: 700, color,
                  }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* On-time bar */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>On-time rate</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--color-brand-600)" }}>
                  {rider.onTimeRate}%
                </span>
              </div>
              <div style={{ height: 5, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${rider.onTimeRate}%`,
                  borderRadius: "var(--radius-full)",
                  background: rider.onTimeRate >= 80 ? "var(--color-brand-600)" : "var(--color-amber-600)",
                }} />
              </div>
            </div>
          </div>
        ))}

      {/* Simulated data disclaimer */}
      <p style={{ fontSize: 9, color: "var(--color-text-disabled)", marginTop: 8, textAlign: "center" }}>
        Simulated trip timing — replace with real GPS data in Phase 2
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/reports/RiderPerformanceReport.tsx
git commit -m "feat: RiderPerformanceReport component with efficiency scores"
```

---

### Task 12: Slowest Districts Report Template

**Files:**
- Create: `src/app/components/reports/SlowestDistrictsReport.tsx`

- [ ] **Step 1: Create `src/app/components/reports/SlowestDistrictsReport.tsx`**

```tsx
import { MapPin, Clock, TrendingDown } from "lucide-react";
import type { CompletedTrip } from "../../types";
import { computeDistrictStats } from "../../lib/performance";

interface SlowestDistrictsReportProps {
  completedTrips: CompletedTrip[];
  periodLabel: string;
}

export function SlowestDistrictsReport({
  completedTrips,
  periodLabel,
}: SlowestDistrictsReportProps) {
  const stats = computeDistrictStats(completedTrips);

  if (stats.length === 0) {
    return (
      <div style={{ padding: 32, textAlign: "center" }}>
        <MapPin size={28} color="var(--color-text-disabled)" style={{ margin: "0 auto 8px" }} />
        <p style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
          No trip data yet. Track orders on the Live Map to populate this report.
        </p>
      </div>
    );
  }

  const fastest = stats[stats.length - 1];
  const slowest = stats[0];

  return (
    <div style={{ padding: "var(--space-4)" }}>
      {/* Header */}
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
        textTransform: "uppercase", color: "var(--color-text-tertiary)",
        marginBottom: 8,
      }}>
        District Delivery Times — {periodLabel}
      </div>

      {/* B2B marketing note */}
      <div style={{
        padding: "8px 12px", borderRadius: "var(--radius-md)",
        background: "var(--color-amber-50)", border: "1px solid var(--color-amber-100)",
        marginBottom: 16, fontSize: 11, color: "var(--color-amber-600)",
      }}>
        Slowest districts are hub placement candidates. Share this with municipality contacts.
      </div>

      {/* Summary chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <div style={{
          flex: 1, padding: "8px 10px",
          borderRadius: "var(--radius-md)", background: "var(--color-brand-50)",
          border: "1px solid var(--color-brand-100)",
        }}>
          <div style={{ fontSize: 9, color: "var(--color-brand-600)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Fastest</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-brand-600)" }}>
            {fastest.avgActualMinutes} min
          </div>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{fastest.district}</div>
        </div>
        <div style={{
          flex: 1, padding: "8px 10px",
          borderRadius: "var(--radius-md)", background: "#FEF2F2",
          border: "1px solid #FEE2E2",
        }}>
          <div style={{ fontSize: 9, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.08em" }}>Slowest</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "#DC2626" }}>
            {slowest.avgActualMinutes} min
          </div>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{slowest.district}</div>
        </div>
      </div>

      {/* District list */}
      {stats.map((d, i) => {
        const overSlowness = d.avgActualMinutes - d.avgOsrmMinutes;
        const isSlow = overSlowness > 3;
        return (
          <div
            key={d.district}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 0",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            {/* Rank */}
            <span style={{
              fontFamily: "var(--font-mono)", fontSize: 10,
              color: "var(--color-text-disabled)", width: 16, flexShrink: 0,
            }}>
              #{i + 1}
            </span>

            {/* District name + trips */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 5 }}>
                {d.district}
                {isSlow && (
                  <TrendingDown size={11} color="#DC2626" />
                )}
              </div>
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
                {d.tripsCompleted} trip{d.tripsCompleted !== 1 ? "s" : ""} · {d.totalCo2Saved.toFixed(1)} kg CO₂
              </div>
            </div>

            {/* Time */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{
                fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700,
                color: isSlow ? "#DC2626" : "var(--color-brand-600)",
              }}>
                {d.avgActualMinutes} min
              </div>
              <div style={{ fontSize: 9, color: "var(--color-text-disabled)" }}>
                est. {d.avgOsrmMinutes} min
              </div>
            </div>
          </div>
        );
      })}

      {/* Hub placement call-to-action */}
      <div style={{
        marginTop: 16, padding: "10px 12px",
        borderRadius: "var(--radius-md)",
        background: "var(--color-surface)",
        border: "1px dashed var(--color-border)",
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>
          Hub Placement Insight
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          Districts averaging {">"} 20 min are under-served by existing hubs.
          Cross-reference with the Heat Map to find optimal locations.
        </div>
      </div>

      <p style={{ fontSize: 9, color: "var(--color-text-disabled)", marginTop: 8, textAlign: "center" }}>
        Simulated trip timing — replace with real GPS data in Phase 2
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/reports/SlowestDistrictsReport.tsx
git commit -m "feat: SlowestDistrictsReport with hub placement insight"
```

---

### Task 13: Wire Reports to Reports Screen

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/components/HeatMapPanel.tsx` (or wherever Reports view is rendered)

- [ ] **Step 1: Pass `completedTrips` down to the Reports view**

In `App.tsx`, find where `activeView === "reports"` renders content and update it:

```tsx
{activeView === "reports" && (
  <ReportsView completedTrips={completedTrips} />
)}
```

- [ ] **Step 2: Create `src/app/components/ReportsView.tsx`**

```tsx
import { useState } from "react";
import type { CompletedTrip } from "../types";
import { RiderPerformanceReport } from "./reports/RiderPerformanceReport";
import { SlowestDistrictsReport } from "./reports/SlowestDistrictsReport";
import { PANEL_WIDTH } from "../constants";

type ReportTab = "rider-performance" | "slowest-districts";

interface ReportsViewProps {
  completedTrips: CompletedTrip[];
}

export function ReportsView({ completedTrips }: ReportsViewProps) {
  const [activeReport, setActiveReport] = useState<ReportTab>("rider-performance");

  const REPORTS: { id: ReportTab; label: string; description: string }[] = [
    {
      id: "rider-performance",
      label: "Rider Performance",
      description: "Efficiency scores, on-time rates, CO₂ and earnings per rider",
    },
    {
      id: "slowest-districts",
      label: "District Delivery Times",
      description: "Which districts slow riders down — informs hub placement",
    },
  ];

  return (
    <div style={{ display: "flex", height: "100%", background: "var(--color-surface)" }}>
      {/* Left: report template gallery */}
      <div style={{
        width: PANEL_WIDTH, flexShrink: 0,
        borderRight: "1px solid var(--color-border)",
        background: "var(--color-surface-card)",
        overflowY: "auto",
      }}>
        <div style={{
          padding: "12px 16px 8px",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", color: "var(--color-text-tertiary)",
          borderBottom: "1px solid var(--color-border)",
        }}>
          Tracking Reports
        </div>

        {REPORTS.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveReport(r.id)}
            aria-pressed={activeReport === r.id}
            style={{
              width: "100%", textAlign: "left",
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border)",
              background: "transparent", border: "none", cursor: "pointer",
              boxShadow: activeReport === r.id
                ? "inset 3px 0 0 var(--color-brand-600)" : "none",
            }}
          >
            <div style={{
              fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)",
              marginBottom: 3,
            }}>
              {r.label}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              {r.description}
            </div>
          </button>
        ))}

        {/* Placeholder cards for future report types */}
        {[
          "Weekly Operations Summary",
          "CO₂ Impact Certificate",
          "Hub Efficiency Report",
        ].map(name => (
          <div
            key={name}
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--color-border)",
              opacity: 0.4,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>
              {name}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-disabled)" }}>
              Coming in Phase 2
            </div>
          </div>
        ))}
      </div>

      {/* Right: active report */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {activeReport === "rider-performance" && (
          <RiderPerformanceReport
            completedTrips={completedTrips}
            periodLabel="This Session"
          />
        )}
        {activeReport === "slowest-districts" && (
          <SlowestDistrictsReport
            completedTrips={completedTrips}
            periodLabel="This Session"
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Import and use `ReportsView` in `App.tsx`**

```tsx
import { ReportsView } from "./components/ReportsView";

// Find the reports view section:
{activeView === "reports" && (
  <ReportsView completedTrips={completedTrips} />
)}
```

- [ ] **Step 4: Build and full end-to-end verify**

```bash
npm run build && npm run dev
```

Full flow to test:
1. Go to Live Map → click a rider → click one of their "inTransit" orders
2. Confirm: green polyline on map, animated rider dot, progress bar in drawer, ETA countdown
3. Wait for animation to complete (or speed it up via `coordsPerTick={10}` temporarily)
4. Switch to Reports view → confirm Rider Performance Card shows the completed trip
5. Switch to Slowest Districts → confirm the district appears
6. Enable Fleet Radar → confirm multiple routes draw for all delivering riders

- [ ] **Step 5: Final commit**

```bash
git add src/app/components/ReportsView.tsx src/app/App.tsx
git commit -m "feat: wire Reports view with RiderPerformanceReport and SlowestDistrictsReport"
```

---

## Common Mistakes Reference (Avoid These)

### 1. OSRM Coordinate Order (Most Common Bug)
```typescript
// ✅ CORRECT — OSRM URL: longitude first
`/route/v1/driving/${startLng},${startLat};${endLng},${endLat}`

// ✅ CORRECT — flip response coords to Leaflet order
.map(([lng, lat]) => [lat, lng])

// ❌ WRONG — using lat first in URL
`/route/v1/driving/${startLat},${startLng}` // Rider appears in ocean
```

### 2. Timer Drift
```typescript
// ✅ CORRECT — always subtract from Date.now()
const remaining = adjustedDuration - (Date.now() - tripStartedAt) / 1000;

// ❌ WRONG — decrementing a counter
let remaining = adjustedDuration;
setInterval(() => { remaining -= 1; }, 1000); // drifts by seconds per minute
```

### 3. Leaflet Layer Cleanup
```typescript
// ✅ CORRECT — remove in useEffect return
useEffect(() => {
  const layer = L.polyline(coords).addTo(map);
  return () => { layer.remove(); }; // REQUIRED
}, [map, coords]);

// ❌ WRONG — no cleanup
useEffect(() => {
  L.polyline(coords).addTo(map); // duplicates on every re-render in StrictMode
}, [map, coords]);
```

### 4. Stale Closure in Leaflet Handler
```typescript
// ✅ CORRECT — proxy callback through ref
const callbackRef = useRef(onSelect);
useEffect(() => { callbackRef.current = onSelect; }, [onSelect]);

layer.on("click", () => callbackRef.current(id)); // always calls latest

// ❌ WRONG — captured at creation time
layer.on("click", () => onSelect(id)); // stale if onSelect changes
```

### 5. Animation Orphan on Route Change
```typescript
// ✅ CORRECT — clear interval BOTH ways
useEffect(() => {
  intervalRef.current = setInterval(() => { /* animate */ }, 250);
  return () => {
    clearInterval(intervalRef.current!); // on unmount AND on route change
    intervalRef.current = null;
  };
}, [route]); // route in deps — new route triggers cleanup of old interval

// ❌ WRONG — interval runs forever if user clicks different order
useEffect(() => {
  intervalRef.current = setInterval(() => { /* animate */ }, 250);
  // No return → old interval keeps running alongside new one
}, [route]);
```

---

## B2B Marketing Data Story

This feature generates three types of verified data that feed B2B sales:

### 1. Per-Client CO₂ Certificate enrichment
`CompletedTrip.co2Saved` × all trips for that client's orders = verified total CO₂ saved.
Every completed trip that hits the client's delivery address adds to their certificate.
**Sell:** "Your CO₂ certificate is backed by real trip records — X trips, Y km collected, Z kg CO₂ saved."

### 2. Rider Efficiency as a Service Quality Signal
`RiderStats.onTimeRate` and `avgEfficiencyScore` → "Our fleet delivers within estimated time 94% of the time."
**Sell:** "When you schedule a pickup, it happens. Our data proves it."

### 3. Slowest Districts → Municipality Pitch
`DistrictStats` sorted by `avgActualMinutes` → districts where riders take longest are under-served.
**Sell to municipality:** "Downtown and Tabarbour deliveries average 22 min vs 11 min in Abdoun. A hub in Tabarbour would cut collection time by 40%. Here's the data."

### Data flow into B2B Prompt (Section 6 of `dawer-b2b-prompt.md`)
Add this to Market Mode examples in the B2B prompt:
```
"Market Mode: Write a one-paragraph service quality statement using this rider data:
  - Fleet on-time rate: 94%
  - Avg pickup-to-delivery: 16 min
  - Total trips tracked: 847
  - Districts covered: 8 of 10
Use it in a corporate ESG partnership proposal for a hotel chain."
```

---

## Phase Dependency Chain

```
Task 1 (types)
  └─▶ Task 2 (constants — must satisfy new Order fields)
       └─▶ Task 3 (osrm.ts — uses Route type)
            ├─▶ Task 4 (eta.ts — uses Route type)
            └─▶ Task 5 (performance.ts — uses CompletedTrip type)
                 └─▶ Task 6 (RouteLayer — uses Route, osrm, eta)
                      └─▶ Task 7 (App wiring — uses RouteLayer, all libs)
                           ├─▶ Task 8 (RouteProgressBar — reads ActiveRoute from App)
                           ├─▶ Task 9 (ETA chip in RiderRow — reads ActiveRoute)
                           ├─▶ Task 10 (FleetRadarLayer — reads riders from App)
                           └─▶ Tasks 11–13 (Reports — read completedTrips from App)
```

Never start a task before all upstream tasks are committed. Each `npm run build` between tasks is a hard gate.

---

*Last updated: 2026-06-25 · Dawer Operations Dashboard · Rider Route Tracking Implementation Plan*
