# Dawer — Rider Route Tracking Execution Prompt
> Paste this entire file into Claude (Anthropic) or any capable AI assistant.
> Then tell it which task number to execute. It will write the code, run the build, commit, and push.

---

## WHO YOU ARE

You are a senior React + TypeScript engineer embedded in the Dawer team. You have deep expertise in:
- React 18 hooks, TypeScript strict mode, Vite
- Leaflet 1.9.4 / react-leaflet 5 (including the exact cleanup patterns required)
- REST API integration (OSRM public routing server)
- Git workflow with atomic commits and pushes after every task

You follow these rules without exception:
1. **Never raw hex** — always `var(--color-brand-600)` etc.
2. **Never decrement a timer counter** — always `Date.now() - startedAt`
3. **Always clean up Leaflet layers** — every `useEffect` that adds a layer must `.remove()` it in the return function
4. **Always use `useRef` for Leaflet callbacks** — prevents stale closures
5. **Always clear `setInterval` in two places** — on unmount AND when the dependency (route) changes
6. **OSRM coordinate order** — URL takes `{lng},{lat}` (longitude first); flip response with `.map(([lng, lat]) => [lat, lng])`
7. After every task: `npm run build` must pass, then `git add` + `git commit` + `git push`

---

## PROJECT CONTEXT

**Dawer** is a recycling and waste collection admin dashboard for Amman, Jordan.

**Stack:**
```
React 18 + TypeScript + Vite
Tailwind CSS v4 (@tailwindcss/vite — no config file)
Leaflet 1.9.4 / react-leaflet 5.0.0
Recharts 2.15.2 · Lucide React 0.487.0
DM Sans (UI) · DM Mono (numbers) · Cairo (Arabic names)
No test framework — verification = npm run build + visual check in npm run dev
No backend — all data hardcoded in constants.ts
```

**Project root:** `E:/Dawer DashBorad/AdminDashboardForRecycling`

**Design tokens (use these, never raw values):**
```css
--color-brand-600: #1E5C35    /* primary green */
--color-amber-600: #C8860A    /* earnings / cooking oil */
--color-danger-600: #DC2626   /* overdue / alerts */
--color-text-primary: #111827
--color-text-secondary: #4B5563
--color-text-tertiary: #94A3B8
--color-text-disabled: #CBD5E1
--color-border: #E2E8F0
--color-surface: #F4F6F5
--color-surface-card: #FFFFFF
--color-brand-50: #ECFDF5
--color-brand-100: #D1FAE5
--color-amber-50: #FFFBEB
--color-amber-100: #FEF3C7
--panel-width: 288px
--font-sans: 'DM Sans', system-ui, sans-serif
--font-mono: 'DM Mono', monospace
--font-ar: 'Cairo', sans-serif
--space-1:4px  --space-2:8px  --space-3:12px  --space-4:16px  --space-6:24px
--radius-sm:6px  --radius-md:8px  --radius-lg:12px  --radius-full:9999px
--shadow-xs: 0 1px 2px rgba(0,0,0,0.06)
--shadow-sm: 0 1px 6px rgba(0,0,0,0.10)
```

**Current types in `src/app/types.ts`:**
```typescript
interface Order {
  id: string;
  material: "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";
  quantity: number; unit: string; address: string;
  status: "pending" | "accepted" | "inTransit" | "completed";
  co2Saved: number; earnings: number;
}
interface Rider {
  id: number; name: string; nameAr: string; phone: string;
  lat: number; lng: number;
  status: "delivering" | "picking_up" | "idle";
  vehicle: "Motorcycle" | "Van";
  orders: Order[];
}
interface Hub {
  id: number; name: string; address: string; lat: number; lng: number;
  active: boolean; capacityKg: number;
  currentLoad: { cookingOil: number; plastic: number; paper: number; electronics: number };
  schedule: "weekly" | "monthly"; nextShipmentDate: string;
  status: "collecting" | "ready" | "shipped";
}
interface District {
  id: string; name: string; polygon: [number,number][]; centroid: [number,number];
  co2Potential: number; co2Achieved: number; topMaterial: string; orderCount: number;
  materialBreakdown: {
    cookingOil: { potential: number; achieved: number };
    plastic:    { potential: number; achieved: number };
    paper:      { potential: number; achieved: number };
    electronics:{ potential: number; achieved: number };
  };
}
type ViewId = "map" | "heatmap" | "hubs" | "co2" | "reports";
```

**Existing helper functions in `src/app/helpers.ts`:**
```typescript
computeTotals(riders)         // → { co2, earnings, byMaterial }
co2Equivalents(kg)            // → { trees, carKm, flights, phones }
districtPriorityScore(d)      // → number
isDistrictCovered(d, hubs)    // → boolean
hubCapacityPct(hub)           // → 0-100
makeRiderIcon(rider, selected) // → L.DivIcon
```

**Existing Leaflet pattern (follow this exactly — all Leaflet files use it):**
```typescript
// Every component that touches the Leaflet map:
const layersRef = useRef<L.Layer[]>([]);

useEffect(() => {
  const map = mapRef.current;
  if (!map || !initialized) return;

  // 1. Clean up previous layers FIRST
  layersRef.current.forEach(l => l.remove());
  layersRef.current = [];

  // 2. Create new layers
  const layer = L.polyline(coords, options).addTo(map);
  layersRef.current.push(layer);

  // 3. Return cleanup (runs on unmount AND when deps change)
  return () => {
    layersRef.current.forEach(l => l.remove());
    layersRef.current = [];
  };
}, [map, initialized, /* other deps */]);
```

**Git remote is already configured. Push with:**
```bash
cd "E:/Dawer DashBorad/AdminDashboardForRecycling"
git push origin main
```

---

## FIVE BUGS TO NEVER MAKE

Read these before writing any code. They will destroy your afternoon if you miss them.

### BUG 1 — OSRM Coordinate Flip
```typescript
// ✅ CORRECT
const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
const coords: [number,number][] = response.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

// ❌ WRONG — riders appear in the ocean
const url = `.../${startLat},${startLng}...`;
```

### BUG 2 — Timer Drift
```typescript
// ✅ CORRECT — always subtract from Date.now()
const remaining = adjustedDuration - (Date.now() - tripStartedAt) / 1000;

// ❌ WRONG — drifts by ~2 seconds per minute
let r = adjustedDuration;
setInterval(() => { r--; setEta(r); }, 1000);
```

### BUG 3 — Leaflet Layer Leak (React StrictMode double-render)
```typescript
// ✅ CORRECT
useEffect(() => {
  const p = L.polyline(coords).addTo(map);
  return () => { p.remove(); }; // ← REQUIRED
}, [map, route]);

// ❌ WRONG — duplicate layers appear in dev mode
useEffect(() => {
  L.polyline(coords).addTo(map);
}, [map, route]);
```

### BUG 4 — Stale Closure in Leaflet Event Handler
```typescript
// ✅ CORRECT
const onStepRef = useRef(onStep);
useEffect(() => { onStepRef.current = onStep; }, [onStep]);
layer.on("click", () => onStepRef.current());

// ❌ WRONG — always calls the version of onStep from first render
layer.on("click", () => onStep());
```

### BUG 5 — Animation Orphan on Route Change
```typescript
// ✅ CORRECT — useEffect deps include route; cleanup runs before new effect
useEffect(() => {
  const id = setInterval(() => { /* advance */ }, 250);
  return () => { clearInterval(id); }; // fires on unmount AND when route changes
}, [route]);

// ❌ WRONG — old interval keeps running when user clicks a new order
useEffect(() => {
  setInterval(() => { /* advance */ }, 250);
}, [route]);
```

---

## TASK LIST (13 Tasks · 5 Phases)

Execute one task at a time. After each task: build → commit → push.

```
Task 1  → types.ts                    Phase 1 Foundation
Task 2  → constants.ts                Phase 1 Foundation
Task 3  → src/app/lib/osrm.ts         Phase 1 Foundation
Task 4  → src/app/lib/eta.ts          Phase 1 Foundation
Task 5  → src/app/lib/performance.ts  Phase 1 Foundation
Task 6  → RouteLayer.tsx              Phase 2 Route Visualization
Task 7  → App.tsx wiring              Phase 2 Route Visualization
Task 8  → RouteProgressBar.tsx        Phase 3 ETA + Progress
Task 9  → RiderRow ETA chip           Phase 3 ETA + Progress
Task 10 → FleetRadarLayer.tsx         Phase 4 Fleet Radar
Task 11 → RiderPerformanceReport.tsx  Phase 5 Reports
Task 12 → SlowestDistrictsReport.tsx  Phase 5 Reports
Task 13 → ReportsView.tsx + wiring    Phase 5 Reports
```

**Dependency chain — never skip ahead:**
```
1 → 2 → 3 → 4 → 5 → 6 → 7 → 8, 9, 10, 11, 12, 13
```

---

## HOW TO USE THIS PROMPT

After pasting this document, say:

> **"Execute Task N"**

The AI will:
1. Write all code for that task exactly as specified below
2. Run `npm run build` — if it fails, fix TypeScript errors before continuing
3. Run `git add` for the changed files
4. Run `git commit -m "feat: [description]"`
5. Run `git push origin main`
6. Report: ✅ Task N complete — ready for Task N+1

---

## TASK SPECIFICATIONS (Complete Code for Every Task)

---

### TASK 1 — Extend Types
**Files:** Modify `src/app/types.ts`
**Commit message:** `feat: add Route, ActiveRoute, CompletedTrip types; extend Order with deliveryLat/Lng`

Add `deliveryLat: number` and `deliveryLng: number` to the `Order` interface. Then add these three interfaces at the bottom of the file:

```typescript
export interface Route {
  coords: [number, number][];
  distanceKm: number;
  durationSeconds: number;
  adjustedDurationSeconds: number;
  isFallback: boolean;
}

export interface ActiveRoute {
  orderId: string;
  riderId: number;
  route: Route;
  currentCoordIndex: number;
  startedAt: number;
  progressPct: number;
}

export interface CompletedTrip {
  orderId: string;
  riderId: number;
  riderName: string;
  startedAt: number;
  completedAt: number;
  actualSeconds: number;
  osrmEstimateSeconds: number;
  distanceKm: number;
  efficiencyScore: number;
  district: string;
  co2Saved: number;
  earnings: number;
  material: Order["material"];
}
```

**After writing:**
```bash
cd "E:/Dawer DashBorad/AdminDashboardForRecycling"
npm run build
# Expected: TypeScript errors on RIDERS (missing deliveryLat/Lng) — this is correct, fix in Task 2
git add src/app/types.ts
git commit -m "feat: add Route, ActiveRoute, CompletedTrip types; extend Order with deliveryLat/Lng"
git push origin main
```

---

### TASK 2 — Add Delivery Coordinates to All Orders
**Files:** Modify `src/app/constants.ts`
**Commit message:** `feat: add deliveryLat/deliveryLng to all hardcoded orders`

Add `deliveryLat` and `deliveryLng` to every Order object in the `RIDERS` array using this coordinate lookup:

```
"Sweifieh, Amman"      → 31.944, 35.871
"Abdoun, Amman"        → 31.940, 35.884
"Downtown, Amman"      → 31.953, 35.934
"Shmeisani, Amman"     → 31.978, 35.882
"Jubaiha, Amman"       → 32.001, 35.869
"Tabarbour, Amman"     → 32.014, 35.921
"8th Circle, Amman"    → 31.959, 35.853
"University District"  → 32.008, 35.879
"Tlaa Al-Ali, Amman"   → 31.950, 35.857
"Airport Road, Amman"  → 31.912, 35.946
"Jabal Hussein, Amman" → 31.975, 35.915
"Wadi Seer, Amman"     → 31.943, 35.839
"Khalda, Amman"        → 31.960, 35.849
"Marka, Amman"         → 31.987, 35.942
Any other address      → 31.963, 35.905  (Amman center default)
```

Example:
```typescript
{
  id: "ORD-001",
  material: "Cooking Oil",
  quantity: 15, unit: "L",
  address: "Sweifieh, Amman",
  deliveryLat: 31.944,   // ← ADD
  deliveryLng: 35.871,   // ← ADD
  status: "inTransit",
  co2Saved: 4.2, earnings: 6.5,
},
```

**After writing:**
```bash
npm run build
# Expected: clean build, zero TypeScript errors
git add src/app/constants.ts
git commit -m "feat: add deliveryLat/deliveryLng to all hardcoded orders"
git push origin main
```

---

### TASK 3 — OSRM Library with Arc Fallback
**Files:** Create `src/app/lib/osrm.ts`
**Commit message:** `feat: add OSRM route fetcher with instant arc fallback`

```typescript
import type { Route } from "../types";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const TIMEOUT_MS = 5000;

export async function fetchOsrmRoute(
  startLat: number, startLng: number,
  endLat: number,   endLng: number,
): Promise<Route> {
  // OSRM wants longitude first: {lng},{lat};{lng},{lat}
  const url = `${OSRM_BASE}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timerId);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);

    const json = await res.json();
    const leg = json.routes?.[0];
    if (!leg) throw new Error("no routes");

    // OSRM returns [lng, lat] — flip to Leaflet order [lat, lng]
    const coords: [number, number][] = (leg.geometry.coordinates as [number, number][])
      .map(([lng, lat]) => [lat, lng]);

    const durationSeconds = Math.round(leg.duration);
    const distanceKm = +(leg.distance / 1000).toFixed(2);

    return {
      coords,
      distanceKm,
      durationSeconds,
      adjustedDurationSeconds: durationSeconds,
      isFallback: false,
    };
  } catch (err) {
    clearTimeout(timerId);
    console.warn("[osrm] using arc fallback:", (err as Error).message);
    return buildArcFallback(startLat, startLng, endLat, endLng);
  }
}

export function buildArcFallback(
  startLat: number, startLng: number,
  endLat: number,   endLng: number,
): Route {
  const STEPS = 32;
  const midLat = (startLat + endLat) / 2 + 0.008;
  const midLng = (startLng + endLng) / 2;

  const coords: [number, number][] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const lat = (1-t)**2 * startLat + 2*(1-t)*t * midLat + t**2 * endLat;
    const lng = (1-t)**2 * startLng + 2*(1-t)*t * midLng + t**2 * endLng;
    coords.push([lat, lng]);
  }

  const straightKm = haversineKm(startLat, startLng, endLat, endLng);
  const distanceKm = +(straightKm * 1.3).toFixed(2);
  const durationSeconds = Math.round((distanceKm / 30) * 3600);

  return { coords, distanceKm, durationSeconds, adjustedDurationSeconds: durationSeconds, isFallback: true };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2
    + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

**After writing:**
```bash
npm run build
git add src/app/lib/osrm.ts
git commit -m "feat: add OSRM route fetcher with instant arc fallback"
git push origin main
```

---

### TASK 4 — ETA Library
**Files:** Create `src/app/lib/eta.ts`
**Commit message:** `feat: add ETA calculation library (drift-safe)`

```typescript
export function etaMultiplier(): number {
  const h = new Date().getHours();
  if (h >= 7  && h <= 9)  return 1.4;
  if (h >= 16 && h <= 19) return 1.3;
  if (h >= 12 && h <= 14) return 1.1;
  return 1.0;
}

// NEVER decrement a counter — always subtract from Date.now()
export function remainingSeconds(adjustedDurationSeconds: number, tripStartedAt: number): number {
  return adjustedDurationSeconds - (Date.now() - tripStartedAt) / 1000;
}

export function formatEta(remaining: number): string {
  if (remaining <= 0) {
    const over = Math.round(Math.abs(remaining) / 60);
    return over === 0 ? "Arriving now" : `Overdue ${over} min`;
  }
  const mins = Math.ceil(remaining / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${mins} min`;
}

export function formatArrivalTime(adjustedDurationSeconds: number, tripStartedAt: number): string {
  return new Date(tripStartedAt + adjustedDurationSeconds * 1000)
    .toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function etaColor(remaining: number, adjustedDurationSeconds: number): string {
  if (remaining < 0) return "var(--color-danger-600)";
  if (remaining / adjustedDurationSeconds > 0.2) return "var(--color-brand-600)";
  return "var(--color-amber-600)";
}

export function routeProgressPct(currentCoordIndex: number, totalCoords: number): number {
  if (totalCoords <= 1) return 100;
  return Math.min(100, Math.round((currentCoordIndex / (totalCoords - 1)) * 100));
}

export function kmRemaining(currentCoordIndex: number, totalCoords: number, totalDistanceKm: number): number {
  const pct = 1 - currentCoordIndex / Math.max(totalCoords - 1, 1);
  return +(pct * totalDistanceKm).toFixed(1);
}
```

**After writing:**
```bash
npm run build
git add src/app/lib/eta.ts
git commit -m "feat: add ETA calculation library (drift-safe)"
git push origin main
```

---

### TASK 5 — Performance Aggregation Library
**Files:** Create `src/app/lib/performance.ts`
**Commit message:** `feat: add performance aggregation for rider stats and district stats`

```typescript
import type { CompletedTrip } from "../types";

export interface RiderStats {
  riderId: number; riderName: string; tripsCompleted: number;
  avgActualSeconds: number; avgOsrmSeconds: number;
  avgEfficiencyScore: number; onTimeRate: number;
  totalDistanceKm: number; totalCo2Saved: number; totalEarnings: number;
}

export interface DistrictStats {
  district: string; tripsCompleted: number;
  avgActualMinutes: number; avgOsrmMinutes: number;
  avgEfficiencyScore: number; totalCo2Saved: number;
}

export function computeRiderStats(trips: CompletedTrip[]): RiderStats[] {
  const byRider = new Map<number, CompletedTrip[]>();
  for (const trip of trips) {
    byRider.set(trip.riderId, [...(byRider.get(trip.riderId) ?? []), trip]);
  }
  return Array.from(byRider.entries()).map(([riderId, t]) => {
    const n = t.length;
    const onTime = t.filter(x => x.actualSeconds <= x.osrmEstimateSeconds * 1.1).length;
    return {
      riderId, riderName: t[0].riderName, tripsCompleted: n,
      avgActualSeconds:   Math.round(t.reduce((s,x) => s + x.actualSeconds, 0) / n),
      avgOsrmSeconds:     Math.round(t.reduce((s,x) => s + x.osrmEstimateSeconds, 0) / n),
      avgEfficiencyScore: Math.round(t.reduce((s,x) => s + x.efficiencyScore, 0) / n),
      onTimeRate:         Math.round((onTime / n) * 100),
      totalDistanceKm:    +t.reduce((s,x) => s + x.distanceKm, 0).toFixed(1),
      totalCo2Saved:      +t.reduce((s,x) => s + x.co2Saved, 0).toFixed(2),
      totalEarnings:      +t.reduce((s,x) => s + x.earnings, 0).toFixed(2),
    };
  });
}

export function computeDistrictStats(trips: CompletedTrip[]): DistrictStats[] {
  const byDistrict = new Map<string, CompletedTrip[]>();
  for (const trip of trips) {
    byDistrict.set(trip.district, [...(byDistrict.get(trip.district) ?? []), trip]);
  }
  return Array.from(byDistrict.entries())
    .map(([district, t]) => {
      const n = t.length;
      return {
        district, tripsCompleted: n,
        avgActualMinutes:   +(t.reduce((s,x) => s + x.actualSeconds, 0) / n / 60).toFixed(1),
        avgOsrmMinutes:     +(t.reduce((s,x) => s + x.osrmEstimateSeconds, 0) / n / 60).toFixed(1),
        avgEfficiencyScore: Math.round(t.reduce((s,x) => s + x.efficiencyScore, 0) / n),
        totalCo2Saved:      +t.reduce((s,x) => s + x.co2Saved, 0).toFixed(2),
      };
    })
    .sort((a, b) => b.avgActualMinutes - a.avgActualMinutes);
}

export function districtFromCoords(lat: number, lng: number): string {
  const BOXES = [
    { name: "Downtown (Al-Balad)",  minLat:31.943, maxLat:31.960, minLng:35.924, maxLng:35.946 },
    { name: "Shmeisani",            minLat:31.970, maxLat:31.988, minLng:35.870, maxLng:35.895 },
    { name: "Sweifieh",             minLat:31.935, maxLat:31.952, minLng:35.858, maxLng:35.882 },
    { name: "Abdoun",               minLat:31.930, maxLat:31.947, minLng:35.872, maxLng:35.900 },
    { name: "Jubaiha",              minLat:31.992, maxLat:32.012, minLng:35.858, maxLng:35.882 },
    { name: "Tabarbour",            minLat:32.005, maxLat:32.025, minLng:35.908, maxLng:35.938 },
    { name: "8th Circle Area",      minLat:31.950, maxLat:31.968, minLng:35.842, maxLng:35.865 },
    { name: "University District",  minLat:31.998, maxLat:32.018, minLng:35.866, maxLng:35.892 },
    { name: "Tlaa Al-Ali",          minLat:31.940, maxLat:31.958, minLng:35.845, maxLng:35.870 },
    { name: "Airport Road Corridor",minLat:31.895, maxLat:31.925, minLng:35.930, maxLng:35.965 },
  ];
  for (const b of BOXES) {
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) return b.name;
  }
  return "Other Amman";
}
```

**After writing:**
```bash
npm run build
git add src/app/lib/performance.ts
git commit -m "feat: add performance aggregation for rider stats and district stats"
git push origin main
```

---

### TASK 6 — RouteLayer Component
**Files:** Create `src/app/components/RouteLayer.tsx`
**Commit message:** `feat: add RouteLayer with OSRM polyline, animated marker, pickup/delivery pins`

Write this component exactly. Pay special attention to:
- `clearAllLayers()` called at the TOP of the useEffect before creating new layers
- `return () => { clearAllLayers(); }` at the bottom of useEffect
- `onStepRef` / `onCompleteRef` pattern for stale closure prevention
- `coordsPerTick` and `tickMs` props for animation speed control

```tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Route } from "../types";

interface RouteLayerProps {
  map: L.Map | null;
  route: Route | null;
  riderLat: number;
  riderLng: number;
  onAnimationStep: (coordIndex: number) => void;
  onAnimationComplete: () => void;
  coordsPerTick?: number;
  tickMs?: number;
}

export function RouteLayer({
  map, route, riderLat, riderLng,
  onAnimationStep, onAnimationComplete,
  coordsPerTick = 1, tickMs = 250,
}: RouteLayerProps) {
  const polylineRef       = useRef<L.Polyline | null>(null);
  const markerRef         = useRef<L.Marker | null>(null);
  const pickupRef         = useRef<L.Marker | null>(null);
  const deliveryRef       = useRef<L.Marker | null>(null);
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
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    coordIndexRef.current = 0;
  }

  useEffect(() => {
    if (!map || !route) { clearAllLayers(); return; }

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
    L.marker(mid, {
      interactive: false,
      icon: L.divIcon({
        className: "",
        iconSize: [100, 22], iconAnchor: [50, 11],
        html: `<div style="background:white;border:1px solid #E2E8F0;border-radius:6px;padding:2px 8px;font-family:'DM Mono',monospace;font-size:10px;color:#4B5563;box-shadow:0 1px 4px rgba(0,0,0,.10);white-space:nowrap;">${distanceKm} km · ${Math.round(adjustedDurationSeconds / 60)} min</div>`,
      }),
    }).addTo(map);

    // 5 — Animated rider marker
    markerRef.current = L.marker([riderLat, riderLng], {
      icon: L.divIcon({
        className: "",
        iconSize: [16, 16], iconAnchor: [8, 8],
        html: `<div style="width:16px;height:16px;border-radius:50%;background:#1E5C35;border:3px solid white;box-shadow:0 0 0 2px #1E5C35,0 2px 8px rgba(0,0,0,.3);"></div>`,
      }),
    }).addTo(map);

    // 6 — Fit map to route
    map.fitBounds(polylineRef.current!.getBounds(), { padding: [40, 40] });

    // 7 — Animation loop
    coordIndexRef.current = 0;
    intervalRef.current = setInterval(() => {
      const next = coordIndexRef.current + coordsPerTick;
      if (next >= coords.length) {
        markerRef.current?.setLatLng(coords[coords.length - 1]);
        coordIndexRef.current = coords.length - 1;
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        onCompleteRef.current();
        return;
      }
      coordIndexRef.current = next;
      markerRef.current?.setLatLng(coords[next]);
      onStepRef.current(next);
    }, tickMs);

    return () => { clearAllLayers(); }; // cleanup on unmount OR when route changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, route]);

  return null;
}
```

**After writing:**
```bash
npm run build
git add src/app/components/RouteLayer.tsx
git commit -m "feat: add RouteLayer with OSRM polyline, animated marker, pickup/delivery pins"
git push origin main
```

---

### TASK 7 — Wire RouteLayer into App.tsx
**Files:** Modify `src/app/App.tsx`
**Commit message:** `feat: wire RouteLayer, activeRoute state, and trip completion in App`

Add to imports at top of App.tsx:
```typescript
import type { ActiveRoute, CompletedTrip } from "./types";
import { fetchOsrmRoute, buildArcFallback } from "./lib/osrm";
import { etaMultiplier } from "./lib/eta";
import { districtFromCoords } from "./lib/performance";
import { RouteLayer } from "./components/RouteLayer";
```

Add state inside `App()`:
```typescript
const [activeRoute, setActiveRoute]       = useState<ActiveRoute | null>(null);
const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);
```

Add handlers inside `App()`:
```typescript
const handleOrderClick = async (riderId: number, orderId: string) => {
  const rider = RIDERS.find(r => r.id === riderId);
  const order = rider?.orders.find(o => o.id === orderId);
  if (!rider || !order) return;

  const nearestHub = INITIAL_HUBS
    .filter(h => h.active)
    .reduce((best, h) =>
      Math.hypot(h.lat - rider.lat, h.lng - rider.lng) <
      Math.hypot(best.lat - rider.lat, best.lng - rider.lng) ? h : best
    );

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
```

Mount `RouteLayer` inside the map view JSX (after HeatMapLayer and HubsMapLayer):
```tsx
{activeView === "map" && (
  <RouteLayer
    map={mapRef.current}
    route={activeRoute?.route ?? null}
    riderLat={RIDERS.find(r => r.id === activeRoute?.riderId)?.lat ?? 31.963}
    riderLng={RIDERS.find(r => r.id === activeRoute?.riderId)?.lng ?? 35.905}
    onAnimationStep={handleAnimationStep}
    onAnimationComplete={handleAnimationComplete}
    coordsPerTick={2}
    tickMs={250}
  />
)}
```

Pass new props to `RiderPanel`:
```tsx
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
```

Update `RiderPanelProps` in `RiderPanel.tsx`:
```typescript
onOrderClick: (riderId: number, orderId: string) => void;
activeRoute: ActiveRoute | null;
completedTrips: CompletedTrip[];
```

**After writing:**
```bash
npm run build
# Fix any remaining TypeScript errors (likely in RiderDetailDrawer prop threading)
git add src/app/App.tsx src/app/components/RiderPanel.tsx
git commit -m "feat: wire RouteLayer, activeRoute state, and trip completion in App"
git push origin main
```

---

### TASK 8 — RouteProgressBar + OrderCard Update
**Files:** Create `src/app/components/rider/RouteProgressBar.tsx`, Modify `src/app/components/rider/OrderCard.tsx`, Modify `src/app/components/rider/RiderDetailDrawer.tsx`
**Commit message:** `feat: RouteProgressBar with live ETA countdown in order card`

Create `src/app/components/rider/RouteProgressBar.tsx`:
```tsx
import { useEffect, useState } from "react";
import { formatEta, formatArrivalTime, etaColor, kmRemaining } from "../../lib/eta";
import type { ActiveRoute } from "../../types";

export function RouteProgressBar({ activeRoute }: { activeRoute: ActiveRoute }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { route, startedAt, progressPct, currentCoordIndex } = activeRoute;
  const { adjustedDurationSeconds, distanceKm, coords, isFallback } = route;
  const remaining = adjustedDurationSeconds - (Date.now() - startedAt) / 1000;
  const color     = etaColor(remaining, adjustedDurationSeconds);
  const kmLeft    = kmRemaining(currentCoordIndex, coords.length, distanceKm);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--color-brand-600)", flexShrink:0 }} />
        <div style={{ flex:1, height:6, borderRadius:"var(--radius-full)", background:"var(--color-border)", overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", top:0, left:0, height:"100%", width:`${progressPct}%`, borderRadius:"var(--radius-full)", background:color, transition:"width 0.25s ease" }} />
          <div style={{ position:"absolute", top:"50%", left:`${progressPct}%`, transform:"translate(-50%,-50%)", width:10, height:10, borderRadius:"50%", background:color, border:"2px solid white", boxShadow:`0 0 0 2px ${color}`, transition:"left 0.25s ease" }} className="animate-pulse-soft" />
        </div>
        <div style={{ width:8, height:8, borderRadius:2, background:"var(--color-amber-600)", flexShrink:0 }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-text-tertiary)" }}>
          {kmLeft > 0 ? `${kmLeft} km left` : "Arrived"}
          {isFallback && <span style={{ marginLeft:4, color:"var(--color-text-disabled)" }}>(est.)</span>}
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color, fontWeight:700 }}>{formatEta(remaining)}</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-text-tertiary)" }}>
            · arrives {formatArrivalTime(adjustedDurationSeconds, startedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
```

In `OrderCard.tsx`, add `onOrderClick` and `activeRoute` props, and replace `<ProgressTrail>` for inTransit orders:
```tsx
// Add to OrderCardProps:
onOrderClick?: (orderId: string) => void;
activeRoute?: ActiveRoute | null;

// Add import:
import { RouteProgressBar } from "./RouteProgressBar";
import type { ActiveRoute } from "../../types";

// In return, replace ProgressTrail section:
{activeRoute && order.status === "inTransit" ? (
  <RouteProgressBar activeRoute={activeRoute} />
) : (
  <ProgressTrail status={order.status} accentColor={mc.color} />
)}

// On outer div add click handler:
onClick={() => onOrderClick?.(order.id)}
style={{ ..., cursor: onOrderClick ? "pointer" : "default" }}
```

In `RiderDetailDrawer.tsx`, add and thread `onOrderClick` and `activeRoute`:
```tsx
// Add to RiderDetailDrawerProps:
onOrderClick?: (riderId: number, orderId: string) => void;
activeRoute?: ActiveRoute | null;

// Update OrderCard usage:
<OrderCard
  key={order.id}
  order={order}
  onOrderClick={(ordId) => onOrderClick?.(rider.id, ordId)}
  activeRoute={activeRoute?.orderId === order.id ? activeRoute : null}
/>
```

In `RiderPanel.tsx`, thread props to `RiderDetailDrawer`:
```tsx
<RiderDetailDrawer
  rider={selected}
  onClose={onClose}
  onOrderClick={onOrderClick}
  activeRoute={activeRoute}
/>
```

**After writing:**
```bash
npm run build
npm run dev
# Visual check: click rider → click inTransit order → progress bar appears with countdown
git add src/app/components/rider/RouteProgressBar.tsx \
        src/app/components/rider/OrderCard.tsx \
        src/app/components/rider/RiderDetailDrawer.tsx \
        src/app/components/RiderPanel.tsx
git commit -m "feat: RouteProgressBar with live ETA countdown in order card"
git push origin main
```

---

### TASK 9 — ETA Chip in Rider List Row
**Files:** Modify `src/app/components/rider/RiderRow.tsx`
**Commit message:** `feat: live ETA chip in rider list row during active route`

Add to `RiderRowProps`:
```typescript
activeRoute?: ActiveRoute | null;
```

Add import and state:
```tsx
import { useEffect, useState } from "react";
import { formatEta, etaColor, remainingSeconds } from "../../lib/eta";
import type { ActiveRoute } from "../../types";

// Inside RiderRow:
const [, tick] = useState(0);
useEffect(() => {
  if (!activeRoute) return;
  const id = setInterval(() => tick(n => n + 1), 1000);
  return () => clearInterval(id);
}, [activeRoute]);
```

Add after the earnings bar in the JSX:
```tsx
{activeRoute && (() => {
  const rem = remainingSeconds(activeRoute.route.adjustedDurationSeconds, activeRoute.startedAt);
  const col = etaColor(rem, activeRoute.route.adjustedDurationSeconds);
  return (
    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
      <div style={{ width:5, height:5, borderRadius:"50%", background:col, flexShrink:0 }} className="animate-pulse-soft" />
      <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:col, fontWeight:600 }}>
        {formatEta(rem)}
      </span>
    </div>
  );
})()}
```

In `RiderPanel.tsx`, pass `activeRoute` to each `RiderRow`:
```tsx
<RiderRow
  key={rider.id}
  rider={rider}
  isSelected={rider.id === selectedId}
  maxEarnings={maxEarnings}
  onSelect={onSelect}
  activeRoute={activeRoute?.riderId === rider.id ? activeRoute : null}
/>
```

**After writing:**
```bash
npm run build && npm run dev
# Visual check: click an order — ETA chip appears in rider list, counts down live
git add src/app/components/rider/RiderRow.tsx src/app/components/RiderPanel.tsx
git commit -m "feat: live ETA chip in rider list row during active route"
git push origin main
```

---

### TASK 10 — Fleet Radar Mode
**Files:** Create `src/app/components/FleetRadarLayer.tsx`, Modify `src/app/App.tsx`
**Commit message:** `feat: Fleet Radar Mode shows all active routes simultaneously`

Create `src/app/components/FleetRadarLayer.tsx`:
```tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Rider } from "../types";
import { fetchOsrmRoute, buildArcFallback } from "../lib/osrm";
import { etaMultiplier } from "../lib/eta";
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
```

In `App.tsx`, add fleet radar state and mount the layer:
```tsx
import { FleetRadarLayer } from "./components/FleetRadarLayer";

const [fleetRadar, setFleetRadar] = useState(false);

// In map view JSX:
{activeView === "map" && fleetRadar && (
  <FleetRadarLayer
    map={mapRef.current}
    riders={RIDERS}
    activeRouteRiderId={activeRoute?.riderId ?? null}
  />
)}

// In map header toolbar:
<button
  aria-label={fleetRadar ? "Disable fleet radar" : "Enable fleet radar"}
  aria-pressed={fleetRadar}
  onClick={() => setFleetRadar(r => !r)}
  style={{
    padding:"4px 10px", borderRadius:"var(--radius-sm)",
    border:"1px solid var(--color-border)", fontSize:11, fontWeight:600, cursor:"pointer",
    background: fleetRadar ? "var(--color-brand-600)" : "var(--color-surface-card)",
    color:      fleetRadar ? "white" : "var(--color-text-secondary)",
  }}
>
  Fleet Radar
</button>
```

**After writing:**
```bash
npm run build && npm run dev
# Visual check: toggle Fleet Radar — all delivering riders show routes
git add src/app/components/FleetRadarLayer.tsx src/app/App.tsx
git commit -m "feat: Fleet Radar Mode shows all active routes simultaneously"
git push origin main
```

---

### TASK 11 — Rider Performance Report Component
**Files:** Create `src/app/components/reports/RiderPerformanceReport.tsx`
**Commit message:** `feat: RiderPerformanceReport with efficiency scores and on-time rate`

```tsx
import { Wind, Banknote, Zap, Clock } from "lucide-react";
import type { CompletedTrip } from "../../types";
import { computeRiderStats } from "../../lib/performance";

export function RiderPerformanceReport({ completedTrips, periodLabel }: { completedTrips: CompletedTrip[]; periodLabel: string }) {
  const stats = computeRiderStats(completedTrips);

  if (stats.length === 0) return (
    <div style={{ padding:32, textAlign:"center" }}>
      <Clock size={28} color="var(--color-text-disabled)" style={{ margin:"0 auto 8px" }} />
      <p style={{ fontSize:13, color:"var(--color-text-tertiary)" }}>
        No completed trips yet.<br />Click an order on the Live Map to start tracking.
      </p>
    </div>
  );

  return (
    <div style={{ padding:"var(--space-4)" }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--color-text-tertiary)", marginBottom:16 }}>
        Rider Performance — {periodLabel}
      </div>
      <div style={{ padding:"8px 12px", borderRadius:"var(--radius-md)", background:"var(--color-brand-50)", border:"1px solid var(--color-brand-100)", marginBottom:16, fontSize:11, color:"var(--color-brand-600)" }}>
        This data feeds client CO₂ certificates and B2B intelligence reports.
      </div>
      {stats.sort((a,b) => b.avgEfficiencyScore - a.avgEfficiencyScore).map(r => (
        <div key={r.riderId} style={{ marginBottom:12, padding:"var(--space-3)", borderRadius:"var(--radius-lg)", background:"var(--color-surface-card)", border:"1px solid var(--color-border)", boxShadow:"var(--shadow-xs)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--color-text-primary)" }}>{r.riderName}</div>
              <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{r.tripsCompleted} trip{r.tripsCompleted !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ padding:"4px 10px", borderRadius:"var(--radius-full)", background: r.avgEfficiencyScore >= 90 ? "var(--color-brand-100)" : "var(--color-amber-100)", color: r.avgEfficiencyScore >= 90 ? "var(--color-brand-600)" : "var(--color-amber-600)", fontSize:11, fontWeight:700, fontFamily:"var(--font-mono)" }}>
              {r.avgEfficiencyScore}% efficiency
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
            {[
              { Icon:Wind,    label:"CO₂ Saved",    value:`${r.totalCo2Saved.toFixed(1)} kg`,   color:"var(--color-brand-600)" },
              { Icon:Banknote,label:"Earnings",      value:`${r.totalEarnings.toFixed(2)} JD`,   color:"var(--color-amber-600)" },
              { Icon:Zap,     label:"Avg trip",      value:`${Math.round(r.avgActualSeconds/60)} min`, color:"var(--color-text-secondary)" },
              { Icon:Clock,   label:"On-time rate",  value:`${r.onTimeRate}%`,                   color:"var(--color-text-secondary)" },
            ].map(({ Icon, label, value, color }) => (
              <div key={label} style={{ padding:"6px 8px", borderRadius:"var(--radius-sm)", background:"var(--color-surface)", display:"flex", flexDirection:"column", gap:2 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <Icon size={11} color={color} />
                  <span style={{ fontSize:9, color:"var(--color-text-tertiary)", textTransform:"uppercase", letterSpacing:"0.08em" }}>{label}</span>
                </div>
                <span style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:700, color }}>{value}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
              <span style={{ fontSize:10, color:"var(--color-text-tertiary)" }}>On-time rate</span>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:10, fontWeight:600, color:"var(--color-brand-600)" }}>{r.onTimeRate}%</span>
            </div>
            <div style={{ height:5, borderRadius:"var(--radius-full)", background:"var(--color-border)", overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${r.onTimeRate}%`, borderRadius:"var(--radius-full)", background: r.onTimeRate >= 80 ? "var(--color-brand-600)" : "var(--color-amber-600)" }} />
            </div>
          </div>
        </div>
      ))}
      <p style={{ fontSize:9, color:"var(--color-text-disabled)", marginTop:8, textAlign:"center" }}>Simulated trip timing — replace with real GPS in Phase 2</p>
    </div>
  );
}
```

**After writing:**
```bash
npm run build
git add src/app/components/reports/RiderPerformanceReport.tsx
git commit -m "feat: RiderPerformanceReport with efficiency scores and on-time rate"
git push origin main
```

---

### TASK 12 — Slowest Districts Report Component
**Files:** Create `src/app/components/reports/SlowestDistrictsReport.tsx`
**Commit message:** `feat: SlowestDistrictsReport with hub placement insight`

```tsx
import { MapPin, TrendingDown } from "lucide-react";
import type { CompletedTrip } from "../../types";
import { computeDistrictStats } from "../../lib/performance";

export function SlowestDistrictsReport({ completedTrips, periodLabel }: { completedTrips: CompletedTrip[]; periodLabel: string }) {
  const stats = computeDistrictStats(completedTrips);

  if (stats.length === 0) return (
    <div style={{ padding:32, textAlign:"center" }}>
      <MapPin size={28} color="var(--color-text-disabled)" style={{ margin:"0 auto 8px" }} />
      <p style={{ fontSize:13, color:"var(--color-text-tertiary)" }}>No trip data yet.</p>
    </div>
  );

  return (
    <div style={{ padding:"var(--space-4)" }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--color-text-tertiary)", marginBottom:8 }}>
        District Delivery Times — {periodLabel}
      </div>
      <div style={{ padding:"8px 12px", borderRadius:"var(--radius-md)", background:"var(--color-amber-50)", border:"1px solid var(--color-amber-100)", marginBottom:16, fontSize:11, color:"var(--color-amber-600)" }}>
        Slowest districts = hub placement candidates. Share with municipality contacts.
      </div>
      {stats.map((d, i) => {
        const isSlow = d.avgActualMinutes - d.avgOsrmMinutes > 3;
        return (
          <div key={d.district} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 0", borderBottom:"1px solid var(--color-border)" }}>
            <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-text-disabled)", width:16 }}>#{i+1}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"var(--color-text-primary)", display:"flex", alignItems:"center", gap:5 }}>
                {d.district}
                {isSlow && <TrendingDown size={11} color="#DC2626" />}
              </div>
              <div style={{ fontSize:10, color:"var(--color-text-tertiary)" }}>{d.tripsCompleted} trip{d.tripsCompleted !== 1 ? "s" : ""} · {d.totalCo2Saved.toFixed(1)} kg CO₂</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:700, color: isSlow ? "#DC2626" : "var(--color-brand-600)" }}>{d.avgActualMinutes} min</div>
              <div style={{ fontSize:9, color:"var(--color-text-disabled)" }}>est. {d.avgOsrmMinutes} min</div>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop:16, padding:"10px 12px", borderRadius:"var(--radius-md)", background:"var(--color-surface)", border:"1px dashed var(--color-border)" }}>
        <div style={{ fontSize:11, fontWeight:600, color:"var(--color-text-secondary)", marginBottom:4 }}>Hub Placement Insight</div>
        <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>Districts averaging &gt;20 min are under-served. Cross-reference with the Heat Map.</div>
      </div>
      <p style={{ fontSize:9, color:"var(--color-text-disabled)", marginTop:8, textAlign:"center" }}>Simulated — replace with real GPS in Phase 2</p>
    </div>
  );
}
```

**After writing:**
```bash
npm run build
git add src/app/components/reports/SlowestDistrictsReport.tsx
git commit -m "feat: SlowestDistrictsReport with hub placement insight"
git push origin main
```

---

### TASK 13 — Wire Reports View
**Files:** Create `src/app/components/ReportsView.tsx`, Modify `src/app/App.tsx`
**Commit message:** `feat: wire Reports view with rider tracking data`

Create `src/app/components/ReportsView.tsx`:
```tsx
import { useState } from "react";
import type { CompletedTrip } from "../types";
import { RiderPerformanceReport } from "./reports/RiderPerformanceReport";
import { SlowestDistrictsReport } from "./reports/SlowestDistrictsReport";
import { PANEL_WIDTH } from "../constants";

type Tab = "rider-performance" | "slowest-districts";

export function ReportsView({ completedTrips }: { completedTrips: CompletedTrip[] }) {
  const [tab, setTab] = useState<Tab>("rider-performance");

  const TABS: { id: Tab; label: string; desc: string }[] = [
    { id: "rider-performance",  label: "Rider Performance",      desc: "Efficiency, on-time rate, CO₂, earnings" },
    { id: "slowest-districts",  label: "District Delivery Times", desc: "Where riders take longest → hub placement" },
  ];

  return (
    <div style={{ display:"flex", height:"100%", background:"var(--color-surface)" }}>
      <div style={{ width:PANEL_WIDTH, flexShrink:0, borderRight:"1px solid var(--color-border)", background:"var(--color-surface-card)", overflowY:"auto" }}>
        <div style={{ padding:"12px 16px 8px", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--color-text-tertiary)", borderBottom:"1px solid var(--color-border)" }}>
          Tracking Reports
        </div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
            style={{ width:"100%", textAlign:"left", padding:"12px 16px", borderBottom:"1px solid var(--color-border)", background:"transparent", border:"none", cursor:"pointer", boxShadow: tab === t.id ? "inset 3px 0 0 var(--color-brand-600)" : "none" }}>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--color-text-primary)", marginBottom:3 }}>{t.label}</div>
            <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{t.desc}</div>
          </button>
        ))}
        {["Weekly Operations Summary","CO₂ Impact Certificate","Hub Efficiency Report"].map(name => (
          <div key={name} style={{ padding:"12px 16px", borderBottom:"1px solid var(--color-border)", opacity:0.4 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--color-text-primary)", marginBottom:3 }}>{name}</div>
            <div style={{ fontSize:10, color:"var(--color-text-disabled)" }}>Phase 2</div>
          </div>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {tab === "rider-performance" && <RiderPerformanceReport completedTrips={completedTrips} periodLabel="This Session" />}
        {tab === "slowest-districts" && <SlowestDistrictsReport completedTrips={completedTrips} periodLabel="This Session" />}
      </div>
    </div>
  );
}
```

In `App.tsx`, import and wire:
```tsx
import { ReportsView } from "./components/ReportsView";

// Replace the reports placeholder:
{activeView === "reports" && (
  <ReportsView completedTrips={completedTrips} />
)}
```

**After writing:**
```bash
npm run build && npm run dev
# Full end-to-end test:
# 1. Live Map → click rider → click inTransit order → see route + ETA countdown
# 2. Wait for animation to finish (or set coordsPerTick=20 temporarily)
# 3. Switch to Reports → Rider Performance shows completed trip
# 4. Switch to District Delivery Times → district appears
# 5. Enable Fleet Radar → all delivering riders show routes
git add src/app/components/ReportsView.tsx src/app/App.tsx
git commit -m "feat: wire Reports view with rider tracking data"
git push origin main
echo "✅ All 13 tasks complete. Rider route tracking system fully implemented."
```

---

## VERIFICATION CHECKLIST (Run After Task 13)

```
Live Map view:
[ ] Click a rider → click inTransit order → green polyline appears on Amman roads
[ ] If OSRM fails → grey arc appears instantly (no blank state)
[ ] Rider dot moves along route
[ ] Route progress bar fills in order card drawer
[ ] ETA countdown shows in order card (green → amber → red)
[ ] ETA chip shows in rider list row
[ ] Animation completes → RouteProgressBar disappears → ProgressTrail shows Completed

Fleet Radar:
[ ] Toggle "Fleet Radar" → all delivering rider routes appear simultaneously
[ ] Click a rider while radar is on → their route highlights, others fade
[ ] Toggle off → all radar routes disappear cleanly

Reports view:
[ ] Complete at least one trip via animation
[ ] Rider Performance card shows efficiency score, on-time rate, CO₂, earnings
[ ] District Delivery Times shows the district the delivery was in
[ ] Hub Placement Insight note visible at bottom of district report
```

---

*Dawer — Rider Route Tracking Execution Prompt v1.0 — 2026-06-25*
*Paste into Claude (Anthropic) or any capable AI. Say "Execute Task N" to begin.*
