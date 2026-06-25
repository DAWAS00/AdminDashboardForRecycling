# Dawer Rider Panel — Gemini Execution Prompt
> Paste this entire file into Gemini 2.5 Flash (High Thinking mode).
> Then say: **"Execute Task 1"** — work through Task 8 one at a time.
> Each task ends with `npm run build` → `git commit` → `git push`.

---

## WHO YOU ARE

You are a **senior React + TypeScript engineer** implementing features inside an existing production codebase. You write clean, minimal, precise code. You never invent APIs that don't exist. You never skip the build gate. You follow the five rules below with zero exceptions.

### Five Rules — Never Break These

**Rule 1 — No raw hex values.**
Every color must use a CSS variable from the design system.
```tsx
// ✅ correct
color: "var(--color-danger-600)"
background: "var(--color-brand-600)"

// ❌ wrong
color: "#ef4444"
background: "#1E5C35"
```

**Rule 2 — Never animate by decrement.**
All elapsed-time computations use `Date.now() - startedAt`, never a counter.
```typescript
// ✅ correct
const elapsedMs = Date.now() - order.acceptedAt;

// ❌ wrong
setCounter(c => c - 1);
```

**Rule 3 — Every Leaflet layer added in a `useEffect` must be removed in the cleanup.**
```typescript
// ✅ correct
useEffect(() => {
  const marker = L.marker([lat, lng]).addTo(map);
  return () => { marker.remove(); };
}, [map]);

// ❌ wrong — no cleanup = duplicate markers in React StrictMode
useEffect(() => {
  L.marker([lat, lng]).addTo(map);
}, [map]);
```

**Rule 4 — Never use `stopPropagation` on the outer card click.**
Use it only on child interactive elements (e.g. the phone link) so they don't trigger the parent `onClick`.

**Rule 5 — Build must pass before committing.**
Run `npm run build` after every task. Fix all TypeScript errors before the git commit. Never commit a broken build.

---

## SEVERITY LADDER — Always Follow This Exactly

```
Level 0 — Idle, no active order             → no timer chip shown
Level 1 — Elapsed < 80% of estimate         → Green chip (on track)
Level 2 — Elapsed 80–100% of estimate       → Amber chip (getting close)
Level 3 — Elapsed 100–150% of estimate      → Red chip (late)
Level 4 — Elapsed ≥ 150% of estimate        → Red PULSING border + Alert Dot fires
```

Only Level 4 triggers the Alert Dot and the pulsing border. Levels 1–3 are silent color changes.

---

## PROJECT CONTEXT

### Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4 (`@tailwindcss/vite` plugin — no `tailwind.config.js`)
- Leaflet 1.9.4 + react-leaflet 5
- No test framework — verification = `npm run build` + visual check in `npm run dev`

### Project Root
`E:\Dawer DashBorad\AdminDashboardForRecycling\`

### Design Tokens (CSS variables — use these, never raw hex)
```css
--color-brand-600: #1E5C35       /* primary green */
--color-amber-600: #C8860A       /* earnings / cooking oil */
--color-danger-600: #ef4444      /* alerts / errors */
--color-text-primary: #111827
--color-text-secondary: #4B5563
--color-text-tertiary: #94A3B8
--color-text-disabled: #CBD5E1
--color-border: #E2E8F0
--color-surface: #F4F6F5
--color-surface-card: #FFFFFF
--font-sans: 'DM Sans', system-ui, sans-serif
--font-mono: 'DM Mono', monospace
--font-ar: 'Cairo', sans-serif
--space-1: 4px  --space-2: 8px  --space-3: 12px  --space-4: 16px
--radius-sm: 6px  --radius-md: 8px  --radius-full: 9999px
```

### Current Types (`src/app/types.ts`)
```typescript
export interface Order {
  id: string;
  material: "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";
  quantity: number;
  unit: string;
  address: string;
  deliveryLat: number;
  deliveryLng: number;
  status: "pending" | "accepted" | "inTransit" | "completed";
  co2Saved: number;
  earnings: number;
  createdAt: string;
  completedAt?: string;
  // acceptedAt does NOT exist yet — Task 1 adds it
}

export interface Rider {
  id: number;
  name: string;
  nameAr: string;
  phone: string;
  lat: number;
  lng: number;
  status: "delivering" | "picking_up" | "idle";
  vehicle: "Motorcycle" | "Van";
  orders: Order[];
  // idleSince does NOT exist yet — Task 1 adds it
}
// ... Hub, District, ActiveRoute, CompletedTrip (unchanged)
```

### Existing Constants (`src/app/constants.ts` — relevant parts)
```typescript
export const STATUS_CONFIG = {
  delivering: { label: "In Transit", color: "#1E5C35", bg: "#D1FAE5", dot: "#1E5C35" },
  picking_up: { label: "Picking Up", color: "#C8860A", bg: "#FEF3C7", dot: "#C8860A" },
  idle:       { label: "Idle",       color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
};
export const MOTO_PATH = "..."; // SVG path for motorcycle
export const VAN_PATH  = "..."; // SVG path for van
export const PANEL_WIDTH = 288; // px

// RIDERS is an array of Rider objects, exported from this file
// seedOrderDates() function adds createdAt/completedAt to all orders
// RIDERS = seedOrderDates(rawRiders, "2026-06-24")
```

### Existing Helpers (`src/app/helpers.ts` — relevant parts)
```typescript
export function computeTotals(riders: Rider[]) { /* ... */ }
export function useClock() { /* ... */ }
export function makeRiderIcon(rider, isSelected) { /* Leaflet DivIcon */ }
// deliveryElapsedMs, deliveryUrgencyLevel, idleElapsedMs, hasFleetAlerts
// do NOT exist yet — Task 3 adds them
```

### Existing ETA Library (`src/app/lib/eta.ts`)
```typescript
export function remainingSeconds(adjustedDurationSeconds: number, tripStartedAt: number): number
export function formatEta(remaining: number): string
export function etaColor(remaining: number, adjustedDurationSeconds: number): string
```

### Component Tree (what's already built)
```
App.tsx
├── LeftSidebar.tsx
├── LiveMapLayer.tsx       ← map + markers + RouteLayer
│   ├── RouteLayer.tsx     ← animated delivery route
│   ├── FleetRadarLayer.tsx
│   └── StaticRouteLineLayer.tsx
└── RiderPanel.tsx         ← RIGHT SIDE PANEL (our target)
    ├── FleetSummaryHeader.tsx   ← shows CO₂, earnings, status counts
    ├── RiderRow.tsx             ← one row per rider
    └── RiderDetailDrawer.tsx    ← expanded drawer on rider select
```

### Current `RiderPanel.tsx` (simplified)
```tsx
export function RiderPanel({ riders, selectedId, onSelect, onClose, time, onOrderClick, activeRoute, completedTrips }) {
  const selected = riders.find(r => r.id === selectedId) ?? null;
  const maxEarnings = Math.max(...riders.map(r => r.orders.reduce((s, o) => s + o.earnings, 0)), 0);

  return (
    <div style={{ width: PANEL_WIDTH, /* ... */ }}>
      <FleetSummaryHeader riders={riders} time={time} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {riders.map(rider => (
          <RiderRow key={rider.id} rider={rider} isSelected={rider.id === selectedId}
            maxEarnings={maxEarnings} onSelect={onSelect}
            activeRoute={activeRoute?.riderId === rider.id ? activeRoute : null} />
        ))}
      </div>
      {selected && <RiderDetailDrawer rider={selected} onClose={onClose}
        onOrderClick={onOrderClick} activeRoute={activeRoute} />}
    </div>
  );
}
```

### Current `RiderRow.tsx` (simplified)
```tsx
export function RiderRow({ rider, isSelected, maxEarnings, onSelect, activeRoute }) {
  const sc = STATUS_CONFIG[rider.status];
  const totalEarnings = rider.orders.reduce((s, o) => s + o.earnings, 0);
  const barPct = maxEarnings > 0 ? Math.round((totalEarnings / maxEarnings) * 100) : 0;

  const [, tick] = useState(0);
  useEffect(() => {
    if (!activeRoute) return;
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [activeRoute]);

  return (
    <button onClick={() => onSelect(rider.id)} /* ... */>
      {/* vehicle icon circle */}
      {/* name + status dot + label + order count */}
      {/* earnings bar */}
      {/* ETA chip when activeRoute present */}
    </button>
  );
}
```

### Current `FleetSummaryHeader.tsx` (simplified)
```tsx
export function FleetSummaryHeader({ riders, time }) {
  const { co2, earnings } = computeTotals(riders);
  const counts = { delivering: ..., picking_up: ..., idle: ... };
  return (
    <div className="px-4 py-3 bg-white border-b">
      {/* Row 1: "Fleet Status" label + clock */}
      {/* Row 2: colored dots with counts */}
      {/* Row 3: CO₂ + Earnings numbers */}
    </div>
  );
}
```

### Current `LiveMapLayer.tsx` (simplified)
```tsx
export function LiveMapLayer({ riders, selectedId, onSelect, activeRoute, onAnimationStep, onAnimationComplete, fleetRadar }) {
  const mapRef      = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  const markersRef  = useRef<Record<number, L.Marker>>({});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Effect 1: mount map once
  useEffect(() => { /* creates L.map, adds tile layer, creates markers */ }, []);

  // Effect 2: update marker icons when selectedId changes
  useEffect(() => {
    riders.forEach(rider => {
      const m = markersRef.current[rider.id];
      m.setIcon(makeRiderIcon(rider, selectedId === rider.id));
    });
  }, [selectedId, riders, mapInstance]);

  // Effect 3 (DOES NOT EXIST YET — Task 8 adds it): flyTo on selectedId change

  return <div ref={containerRef} style={{ width:"100%", height:"100%" }}>...</div>;
}
```

---

## TASK LIST

| Task | Feature | Files changed | Effort |
|------|---------|---------------|--------|
| 1 | Extend types | `types.ts` | XS |
| 2 | Add constants + seed timestamps | `constants.ts` | S |
| 3 | Add alert helpers | `helpers.ts` | S |
| 4 | Add pulse-danger CSS keyframe | `globals.css` | XS |
| 5 | Delivery timer + idle warning + overtime border + call | `RiderRow.tsx` | M |
| 6 | Alert dot | `FleetSummaryHeader.tsx` | XS |
| 7 | Filter tabs + urgency sort | `RiderPanel.tsx` | S |
| 8 | One-click map focus | `LiveMapLayer.tsx` | XS |

**Dependency chain:** Tasks 1 → 2 → 3 must be done in order (types before constants before helpers). Tasks 4–8 can be done in any order after Task 3.

---

## HOW TO USE

Say **"Execute Task N"** to execute one task at a time.
You will receive: complete code → build gate → git commands.
Only move to the next task after the build passes.

---

## TASK SPECIFICATIONS

---

### TASK 1 — Extend Types
**File:** `src/app/types.ts`
**Change:** Add two optional fields — `acceptedAt?: number` on `Order`, `idleSince?: number` on `Rider`.

Complete file to write (replace entire file):

```typescript
// src/app/types.ts

export interface Order {
  id: string;
  material: "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";
  quantity: number;
  unit: string;
  address: string;
  deliveryLat: number;
  deliveryLng: number;
  status: "pending" | "accepted" | "inTransit" | "completed";
  co2Saved: number;
  earnings: number;
  createdAt: string;
  completedAt?: string;
  /** Date.now() when rider accepted this order. Enables the delivery timer badge. */
  acceptedAt?: number;
}

export interface Rider {
  id: number;
  name: string;
  nameAr: string;
  phone: string;
  lat: number;
  lng: number;
  status: "delivering" | "picking_up" | "idle";
  vehicle: "Motorcycle" | "Van";
  orders: Order[];
  /** Date.now() when rider last became idle. Enables the idle warning badge. */
  idleSince?: number;
}

export interface HubMaterials {
  cookingOil: number;
  plastic: number;
  paper: number;
  electronics: number;
}

export interface Hub {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  active: boolean;
  capacityKg: number;
  currentLoad: HubMaterials;
  schedule: "weekly" | "monthly";
  nextShipmentDate: string;
  lastShipmentDate: string;
  status: "collecting" | "ready" | "shipped";
}

export interface MaterialBreakdown {
  cookingOil:  { potential: number; achieved: number };
  plastic:     { potential: number; achieved: number };
  paper:       { potential: number; achieved: number };
  electronics: { potential: number; achieved: number };
}

export interface District {
  id: string;
  name: string;
  polygon: [number, number][];
  centroid: [number, number];
  co2Potential: number;
  co2Achieved: number;
  topMaterial: string;
  orderCount: number;
  materialBreakdown: MaterialBreakdown;
}

export type ViewId = "map" | "heatmap" | "hubs" | "co2" | "reports";
export type HeatMapViewMode = "overview" | "demand" | "hubs";
export type MaterialFilter = "all" | "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";
export type ClientType = "restaurant" | "hotel" | "office" | "retail" | "hospital" | "other";
export type ContractTier = "free" | "basic" | "pro" | "enterprise";

export interface Client {
  id: string;
  name: string;
  nameAr?: string;
  type: ClientType;
  address: string;
  phone: string;
  email: string;
  contractTier: ContractTier;
  joinedDate: string;
  orders: Order[];
  totalCo2Saved: number;
  totalEarnings: number;
}

export type ReportType =
  | "weekly-operations"
  | "hub-efficiency"
  | "district-intelligence"
  | "material-pulse"
  | "expansion-opportunity"
  | "co2-certificate";

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
npm run build
git add src/app/types.ts
git commit -m "feat: add acceptedAt to Order and idleSince to Rider types"
git push origin main
```

---

### TASK 2 — Add Constants + Seed Timestamps
**File:** `src/app/constants.ts`
**Changes:**
1. Add 3 new exported constants near the top (after existing constants, before DISTRICTS)
2. Replace the `seedOrderDates` function with one that also seeds `acceptedAt`
3. Add `idleSince` to rider id:4 and id:10 in `rawRiders`

**Step A — Add these 3 constants** (insert after `ORDER_STATUS_ORDER` and before `DISTRICTS`):

```typescript
// ── Delivery alert thresholds ─────────────────────────────────────────────────
export const MATERIAL_DELIVERY_ESTIMATE_MS: Record<string, number> = {
  "Cooking Oil":       20 * 60 * 1000,  // 20 min
  "Plastic Bottles":   15 * 60 * 1000,  // 15 min
  "Paper & Cardboard": 15 * 60 * 1000,  // 15 min
  "Electronics":       25 * 60 * 1000,  // 25 min
};
export const IDLE_WARNING_MS  = 10 * 60 * 1000;  // 10 min → amber idle badge
export const IDLE_CRITICAL_MS = 20 * 60 * 1000;  // 20 min → red idle badge + Alert Dot
```

**Step B — Replace `seedOrderDates`** (find the existing function and replace it entirely):

```typescript
function seedOrderDates(riders: Rider[], date: string): Rider[] {
  // Simulate orders accepted at specific times in the past.
  // This makes timer badges meaningful on first load.
  // Rami (ORD-2828) is seeded as critically overdue so the Alert Dot fires immediately.
  const acceptedOffsets: Record<string, number> = {
    "ORD-2841": 28 * 60 * 1000,  // Ahmad — Cooking Oil (20-min est.) → 1.4× → RED level 3
    "ORD-2842":  5 * 60 * 1000,  // Ahmad — Plastic accepted → GREEN
    "ORD-2835": 12 * 60 * 1000,  // Tariq — Paper (15-min est.) → 0.8× → AMBER level 2
    "ORD-2836":  3 * 60 * 1000,  // Tariq — Plastic accepted → GREEN
    "ORD-2830":  8 * 60 * 1000,  // Yousef — Electronics (25-min est.) → 0.32× → GREEN
    "ORD-2828": 37 * 60 * 1000,  // Rami — Plastic (15-min est.) → 2.5× → CRITICAL level 4 ⚠️
    "ORD-2820": 18 * 60 * 1000,  // Nidal — Paper (15-min est.) → 1.2× → RED level 3
    "ORD-2821":  7 * 60 * 1000,  // Nidal — Electronics accepted → GREEN
  };

  return riders.map(r => ({
    ...r,
    orders: r.orders.map(o => ({
      ...o,
      createdAt:   date,
      completedAt: o.status === "completed" ? date : undefined,
      acceptedAt:
        (o.status === "inTransit" || o.status === "accepted") && acceptedOffsets[o.id]
          ? Date.now() - acceptedOffsets[o.id]
          : undefined,
    })),
  }));
}
```

**Step C — Add `idleSince` to rider id:4 and id:10** in `rawRiders` array:

```typescript
// Rider id:4 — idle 23 min (> 20-min IDLE_CRITICAL_MS) → Alert Dot fires
{
  id: 4, name: "Khalid Nasser", nameAr: "خالد ناصر",
  phone: "+962 79 456 7890", lat: 31.9780, lng: 35.8820,
  status: "idle", vehicle: "Van", orders: [],
  idleSince: Date.now() - (23 * 60 * 1000),
},

// Rider id:10 — idle 8 min (< 10-min IDLE_WARNING_MS) → amber badge only
{
  id: 10, name: "Imad Saleh", nameAr: "عماد صالح",
  phone: "+962 79 012 3456", lat: 32.0080, lng: 35.8780,
  status: "idle", vehicle: "Van", orders: [],
  idleSince: Date.now() - (8 * 60 * 1000),
},
```

**After writing:**
```bash
npm run build
git add src/app/constants.ts
git commit -m "feat: add delivery estimate constants and seed acceptedAt/idleSince timestamps"
git push origin main
```

---

### TASK 3 — Add Alert Helper Functions
**File:** `src/app/helpers.ts`

**Step A — Update the existing import from `./constants`** at the top of `helpers.ts`.
Find this line:
```typescript
import {
  STATUS_CONFIG,
  MOTO_PATH,
  VAN_PATH,
  HUB_PATH,
  RIDERS,
  MATERIAL_CONFIG,
  CO2_EQUIVALENTS
} from "./constants";
```
Replace with (add the 3 new constants):
```typescript
import {
  STATUS_CONFIG,
  MOTO_PATH,
  VAN_PATH,
  HUB_PATH,
  RIDERS,
  MATERIAL_CONFIG,
  CO2_EQUIVALENTS,
  MATERIAL_DELIVERY_ESTIMATE_MS,
  IDLE_WARNING_MS,
  IDLE_CRITICAL_MS,
} from "./constants";
```

**Step B — Update the types import** at the top of `helpers.ts` to include `Order`:
```typescript
import { District, Hub, Rider, Order, MaterialFilter } from "./types";
```

**Step C — Append these 4 functions at the very END of `helpers.ts`**:

```typescript
// ── Delivery timer + alert helpers ───────────────────────────────────────────

/**
 * Returns ms elapsed since the order's acceptedAt timestamp.
 * Returns 0 if acceptedAt is not set (order hasn't been accepted yet).
 */
export function deliveryElapsedMs(order: Order): number {
  if (!order.acceptedAt) return 0;
  return Date.now() - order.acceptedAt;
}

/**
 * Returns urgency level 0–4 for a rider based on delivery elapsed vs estimate.
 *   0 = idle or no active order with a timestamp
 *   1 = green  (elapsed < 80% of estimate)
 *   2 = amber  (elapsed 80–100% of estimate)
 *   3 = red    (elapsed 100–150% of estimate)
 *   4 = critical (elapsed ≥ 150%) — fires the Alert Dot and pulsing border
 */
export function deliveryUrgencyLevel(rider: Rider): 0 | 1 | 2 | 3 | 4 {
  if (rider.status === "idle") return 0;
  const activeOrder = rider.orders.find(
    o => o.status === "inTransit" || o.status === "accepted"
  );
  if (!activeOrder?.acceptedAt) return 0;
  const elapsed  = Date.now() - activeOrder.acceptedAt;
  const estimate = MATERIAL_DELIVERY_ESTIMATE_MS[activeOrder.material] ?? 20 * 60 * 1000;
  const ratio    = elapsed / estimate;
  if (ratio >= 1.5) return 4;
  if (ratio >= 1.0) return 3;
  if (ratio >= 0.8) return 2;
  return 1;
}

/**
 * Returns ms elapsed since the rider became idle.
 * Returns 0 if rider is not idle or idleSince is not set.
 */
export function idleElapsedMs(rider: Rider): number {
  if (rider.status !== "idle" || !rider.idleSince) return 0;
  return Date.now() - rider.idleSince;
}

/**
 * Returns true if ANY rider in the fleet has a critical issue:
 *   - Delivery urgency level 4 (≥ 150% of estimate)
 *   - Idle for ≥ IDLE_CRITICAL_MS (20 min)
 * Used to show/hide the red Alert Dot on the panel header.
 */
export function hasFleetAlerts(riders: Rider[]): boolean {
  return riders.some(r => {
    if (deliveryUrgencyLevel(r) >= 4)      return true;
    if (idleElapsedMs(r) >= IDLE_CRITICAL_MS) return true;
    return false;
  });
}
```

**After writing:**
```bash
npm run build
git add src/app/helpers.ts
git commit -m "feat: add deliveryElapsedMs, deliveryUrgencyLevel, idleElapsedMs, hasFleetAlerts helpers"
git push origin main
```

---

### TASK 4 — Add `pulse-danger` CSS Keyframe
**File:** `src/styles/globals.css`

Append at the very end of the file:

```css
/* ── Overtime alert border pulse ─────────────────────────────────────────── */
@keyframes pulse-danger {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.25; }
}
```

**After writing:**
```bash
npm run build
git add src/styles/globals.css
git commit -m "feat: add pulse-danger keyframe for overtime alert animation"
git push origin main
```

---

### TASK 5 — Delivery Timer + Idle Warning + Overtime Border + One-Click Call
**File:** `src/app/components/rider/RiderRow.tsx`

Write the complete file (replaces everything currently in the file):

```typescript
// src/app/components/rider/RiderRow.tsx
import { useEffect, useState } from "react";
import { ChevronRight, Phone } from "lucide-react";
import { Rider, ActiveRoute } from "../../types";
import {
  STATUS_CONFIG,
  MOTO_PATH,
  VAN_PATH,
  IDLE_WARNING_MS,
  IDLE_CRITICAL_MS,
} from "../../constants";
import { formatEta, etaColor, remainingSeconds } from "../../lib/eta";
import { deliveryElapsedMs, deliveryUrgencyLevel, idleElapsedMs } from "../../helpers";

interface RiderRowProps {
  rider: Rider;
  isSelected: boolean;
  maxEarnings: number;
  onSelect: (id: number) => void;
  activeRoute?: ActiveRoute | null;
}

/** Formats elapsed ms as "18 min" or "1h 3 min" */
function formatElapsed(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m} min` : `${h}h`;
}

export function RiderRow({ rider, isSelected, maxEarnings, onSelect, activeRoute }: RiderRowProps) {
  const sc            = STATUS_CONFIG[rider.status];
  const totalEarnings = rider.orders.reduce((s, o) => s + o.earnings, 0);
  const barPct        = maxEarnings > 0 ? Math.round((totalEarnings / maxEarnings) * 100) : 0;
  const isActive      = rider.status !== "idle";

  // Ticker for delivery timer — runs every second when rider is active
  const [, tick] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  // Slower ticker for idle warning — every 10 seconds is enough
  useEffect(() => {
    if (isActive) return;
    const id = setInterval(() => tick(n => n + 1), 10_000);
    return () => clearInterval(id);
  }, [isActive]);

  // ── Delivery timer ─────────────────────────────────────────────────────────
  const urgencyLevel = deliveryUrgencyLevel(rider);
  const activeOrder  = rider.orders.find(o => o.status === "inTransit" || o.status === "accepted");
  const elapsedMs    = activeOrder ? deliveryElapsedMs(activeOrder) : 0;

  const timerColor: string =
    urgencyLevel >= 3 ? "var(--color-danger-600)" :
    urgencyLevel === 2 ? "var(--color-amber-600)"  :
    urgencyLevel === 1 ? "var(--color-brand-600)"  :
    "transparent";

  // ── Idle warning ────────────────────────────────────────────────────────────
  const idleMs: number    = idleElapsedMs(rider);
  const idleColor: string | null =
    idleMs >= IDLE_CRITICAL_MS ? "var(--color-danger-600)" :
    idleMs >= IDLE_WARNING_MS  ? "var(--color-amber-600)"  :
    null; // null = don't show badge

  // ── Overtime / idle critical → pulsing red left border ────────────────────
  const showAlertBorder = urgencyLevel >= 4 || idleMs >= IDLE_CRITICAL_MS;

  // ── Earnings bar color ─────────────────────────────────────────────────────
  const barColor =
    barPct >= 70 ? "var(--color-brand-600)" :
    barPct >= 30 ? "var(--color-amber-600)" :
    "var(--color-text-disabled)";

  return (
    <button
      onClick={() => onSelect(rider.id)}
      aria-label={`Select rider ${rider.name}`}
      aria-pressed={isSelected}
      className="w-full text-left px-4 py-3 border-b transition-colors"
      style={{
        borderColor:  "var(--color-border)",
        background:   isSelected ? "var(--color-surface-card)" : "transparent",
        opacity:      isActive ? 1 : 0.7,
        cursor:       "pointer",
        position:     "relative",
        // Selected brand border — overridden by alert border div below when alert is active
        boxShadow: !showAlertBorder && isSelected
          ? "inset 3px 0 0 var(--color-brand-600)"
          : "none",
      }}
    >
      {/* Pulsing danger left border — only renders at level 4 or critical idle */}
      {showAlertBorder && (
        <div
          aria-hidden="true"
          style={{
            position:   "absolute",
            left: 0, top: 0, bottom: 0,
            width:      3,
            background: "var(--color-danger-600)",
            animation:  "pulse-danger 1.2s ease-in-out infinite",
          }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* Vehicle icon circle */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: "50%", background: sc.bg }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={sc.dot}>
            <path d={rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH} />
          </svg>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">

          {/* Row 1: name + phone icon + vehicle label */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {rider.name}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* One-Click Call — stopPropagation so it doesn't trigger onSelect */}
              <a
                href={`tel:${rider.phone.replace(/\s/g, "")}`}
                aria-label={`Call ${rider.name} at ${rider.phone}`}
                onClick={e => e.stopPropagation()}
                style={{
                  display: "flex", alignItems: "center",
                  color: "var(--color-text-tertiary)",
                  padding: "2px 4px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <Phone size={11} />
              </a>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-tertiary)" }}>
                {rider.vehicle}
              </span>
            </div>
          </div>

          {/* Row 2: status dot + label + timer chip OR idle warning */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <span style={{
                display: "inline-block", width: 6, height: 6,
                borderRadius: "50%", background: sc.dot, flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: sc.color }}>{sc.label}</span>
            </div>

            {/* Delivery Timer Chip */}
            {isActive && urgencyLevel > 0 && elapsedMs > 0 && (
              <span style={{
                fontFamily:     "var(--font-mono)",
                fontSize:       10,
                fontWeight:     600,
                color:          timerColor,
                background:     timerColor + "1A", // 10% opacity
                borderRadius:   "var(--radius-full)",
                padding:        "1px 6px",
              }}>
                {formatElapsed(elapsedMs)}
              </span>
            )}

            {/* Idle Warning Chip */}
            {!isActive && idleColor !== null && idleMs > 0 && (
              <span style={{
                fontFamily:   "var(--font-mono)",
                fontSize:     10,
                fontWeight:   600,
                color:        idleColor,
                background:   idleColor + "1A",
                borderRadius: "var(--radius-full)",
                padding:      "1px 6px",
              }}>
                Idle {formatElapsed(idleMs)}
              </span>
            )}
          </div>

          {/* Active riders: earnings bar + optional ETA from active route */}
          {isActive && (
            <>
              <div className="flex items-center gap-2">
                <div style={{ flex: 1, height: 5, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, borderRadius: "var(--radius-full)", background: barColor, transition: "width 0.3s ease" }} />
                </div>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, color: barColor,
                  fontWeight: 600, flexShrink: 0, minWidth: 42, textAlign: "right",
                }}>
                  {totalEarnings.toFixed(2)} JD
                </span>
              </div>

              {activeRoute && (() => {
                const rem = remainingSeconds(activeRoute.route.adjustedDurationSeconds, activeRoute.startedAt);
                const col = etaColor(rem, activeRoute.route.adjustedDurationSeconds);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: col, flexShrink: 0 }} className="animate-pulse-soft" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: col, fontWeight: 600 }}>
                      {formatEta(rem)}
                    </span>
                  </div>
                );
              })()}
            </>
          )}

          {/* Idle riders with no warning: dash fallback */}
          {!isActive && idleColor === null && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-disabled)" }}>—</span>
          )}

        </div>

        <ChevronRight size={14} color="var(--color-text-disabled)" className="flex-shrink-0" />
      </div>
    </button>
  );
}
```

**After writing:**
```bash
npm run build
npm run dev
# Visually verify:
# - Ahmad shows a RED timer chip (~28 min, over 20-min estimate)
# - Rami shows pulsing red border + RED timer chip (~37 min)
# - Khalid (idle) shows pulsing red border + "Idle 23 min" red chip
# - Imad (idle) shows "Idle 8 min" amber chip, no pulsing border
# - Phone icon appears next to every rider name
# - Tapping phone icon does NOT select the rider
git add src/app/components/rider/RiderRow.tsx
git commit -m "feat: add delivery timer, idle warning, overtime alert border, one-click call to RiderRow"
git push origin main
```

---

### TASK 6 — Alert Dot in FleetSummaryHeader
**File:** `src/app/components/rider/FleetSummaryHeader.tsx`

Write the complete file:

```typescript
// src/app/components/rider/FleetSummaryHeader.tsx
import { Rider } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { computeTotals, hasFleetAlerts } from "../../helpers";

interface FleetSummaryHeaderProps {
  riders: Rider[];
  time: Date;
}

export function FleetSummaryHeader({ riders, time }: FleetSummaryHeaderProps) {
  const { co2, earnings } = computeTotals(riders);
  const alertActive = hasFleetAlerts(riders);

  const counts = {
    delivering: riders.filter(r => r.status === "delivering").length,
    picking_up: riders.filter(r => r.status === "picking_up").length,
    idle:       riders.filter(r => r.status === "idle").length,
  };

  const timeStr = time.toLocaleTimeString("en-JO", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  return (
    <div className="px-4 py-3 bg-white border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>

      {/* Row 1: "Fleet Status" label + alert dot + clock */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: "var(--color-text-tertiary)",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Fleet Status
          </span>
          {/* Alert Dot — only renders when any rider has a critical issue */}
          {alertActive && (
            <span
              aria-label="Fleet has critical alerts — check Alerts tab"
              title="One or more riders need immediate attention"
              style={{
                display:     "inline-block",
                width:       8,
                height:      8,
                borderRadius: "50%",
                background:  "var(--color-danger-600)",
                animation:   "pulse-danger 1.2s ease-in-out infinite",
                flexShrink:  0,
              }}
            />
          )}
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {timeStr}
        </span>
      </div>

      {/* Row 2: status dots with counts */}
      <div className="flex items-center gap-3 mb-2">
        {(["delivering", "picking_up", "idle"] as const).map(status => {
          const cfg   = STATUS_CONFIG[status];
          const count = counts[status];
          if (count === 0) return null;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className={status !== "idle" ? "animate-pulse-soft" : undefined}
                style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }}
              />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-primary)", fontWeight: 600 }}>
                {count}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Row 3: CO₂ + Earnings */}
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>CO₂ Today</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--color-brand-600)", lineHeight: 1.2 }}>
            {co2.toFixed(1)}
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", marginLeft: 3 }}>kg</span>
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Earnings Today</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--color-amber-600)", lineHeight: 1.2 }}>
            {earnings.toFixed(2)}
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", marginLeft: 3 }}>JD</span>
          </div>
        </div>
      </div>

    </div>
  );
}
```

**After writing:**
```bash
npm run build
npm run dev
# Verify: small red pulsing dot appears next to "Fleet Status" label
git add src/app/components/rider/FleetSummaryHeader.tsx
git commit -m "feat: add alert dot to FleetSummaryHeader when fleet has critical issues"
git push origin main
```

---

### TASK 7 — Filter Tabs + Urgency Sort in RiderPanel
**File:** `src/app/components/RiderPanel.tsx`

Write the complete file:

```typescript
// src/app/components/RiderPanel.tsx
import { useState } from "react";
import { Rider, ActiveRoute, CompletedTrip } from "../types";
import { PANEL_WIDTH, IDLE_WARNING_MS, IDLE_CRITICAL_MS } from "../constants";
import { deliveryUrgencyLevel, idleElapsedMs } from "../helpers";
import { FleetSummaryHeader } from "./rider/FleetSummaryHeader";
import { RiderRow }           from "./rider/RiderRow";
import { RiderDetailDrawer }  from "./rider/RiderDetailDrawer";

type FilterTab = "all" | "active" | "idle" | "alerts";

interface RiderPanelProps {
  riders: Rider[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  time: Date;
  onOrderClick: (riderId: number, orderId: string) => void;
  activeRoute: ActiveRoute | null;
  completedTrips: CompletedTrip[];
}

export function RiderPanel({
  riders, selectedId, onSelect, onClose, time,
  onOrderClick, activeRoute, completedTrips,
}: RiderPanelProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const selected = riders.find(r => r.id === selectedId) ?? null;

  const maxEarnings = Math.max(
    ...riders.map(r => r.orders.reduce((s, o) => s + o.earnings, 0)),
    0,
  );

  // Count critical alerts for the Alerts tab badge
  const alertCount = riders.filter(r =>
    deliveryUrgencyLevel(r) >= 4 || idleElapsedMs(r) >= IDLE_CRITICAL_MS
  ).length;

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = riders.filter(r => {
    if (filter === "active")  return r.status !== "idle";
    if (filter === "idle")    return r.status === "idle";
    if (filter === "alerts")  return deliveryUrgencyLevel(r) >= 4 || idleElapsedMs(r) >= IDLE_CRITICAL_MS;
    return true; // "all"
  });

  // ── Urgency Sort — highest urgency floats to top ───────────────────────────
  function priority(r: Rider): number {
    const urg  = deliveryUrgencyLevel(r);
    const idle = idleElapsedMs(r);
    if (urg >= 4)                  return 100; // critically overdue delivery
    if (idle >= IDLE_CRITICAL_MS)  return  90; // critically idle
    if (urg === 3)                 return  70; // late delivery
    if (idle >= IDLE_WARNING_MS)   return  60; // idle warning
    if (urg >= 1)                  return  40; // active, on track
    return 10;                                  // idle, no warning
  }

  const sorted = [...filtered].sort((a, b) => priority(b) - priority(a));

  // ── Tab style helper ─────────────────────────────────────────────────────────
  function tabStyle(tab: FilterTab): React.CSSProperties {
    const isAlert   = tab === "alerts";
    const isActive  = filter === tab;
    const activeClr = isAlert ? "var(--color-danger-600)" : "var(--color-brand-600)";
    return {
      flex: 1,
      padding: "5px 4px",
      fontSize: 10,
      fontWeight: 600,
      fontFamily: "var(--font-sans)",
      letterSpacing: "0.04em",
      cursor: "pointer",
      border: "none",
      borderBottom: isActive ? `2px solid ${activeClr}` : "2px solid transparent",
      background: "transparent",
      color: isActive ? activeClr : "var(--color-text-tertiary)",
      transition: "color 0.15s, border-color 0.15s",
    };
  }

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ width: PANEL_WIDTH, flexShrink: 0, borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* Zone 1 — Fleet Summary */}
      <FleetSummaryHeader riders={riders} time={time} />

      {/* Zone 1b — Filter Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ background: "white", borderColor: "var(--color-border)" }}>
        <button style={tabStyle("all")}    onClick={() => setFilter("all")}>All</button>
        <button style={tabStyle("active")} onClick={() => setFilter("active")}>Active</button>
        <button style={tabStyle("idle")}   onClick={() => setFilter("idle")}>Idle</button>
        <button
          style={tabStyle("alerts")}
          onClick={() => setFilter("alerts")}
          aria-label={`Alerts — ${alertCount} rider${alertCount !== 1 ? "s" : ""} need attention`}
        >
          Alerts
          {alertCount > 0 && (
            <span style={{
              marginLeft: 4,
              background: "var(--color-danger-600)",
              color: "white",
              borderRadius: "var(--radius-full)",
              padding: "0 4px",
              fontSize: 9,
              fontWeight: 700,
              lineHeight: "14px",
              display: "inline-block",
              verticalAlign: "middle",
            }}>
              {alertCount}
            </span>
          )}
        </button>
      </div>

      {/* Zone 2 — Rider List (sorted, filtered) */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {sorted.length === 0 && (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 12 }}>
            No riders match this filter
          </div>
        )}
        {sorted.map(rider => (
          <RiderRow
            key={rider.id}
            rider={rider}
            isSelected={rider.id === selectedId}
            maxEarnings={maxEarnings}
            onSelect={onSelect}
            activeRoute={activeRoute?.riderId === rider.id ? activeRoute : null}
          />
        ))}
      </div>

      {/* Zone 3 — Detail Drawer */}
      {selected && (
        <RiderDetailDrawer
          rider={selected}
          onClose={onClose}
          onOrderClick={onOrderClick}
          activeRoute={activeRoute}
        />
      )}
    </div>
  );
}
```

**After writing:**
```bash
npm run build
npm run dev
# Verify:
# - Four tabs: All / Active / Idle / Alerts
# - "Alerts" tab has red badge "2" (Rami + Khalid)
# - "Active" tab shows 8 riders (delivering + picking_up)
# - "Idle" tab shows Khalid and Imad only
# - "Alerts" tab shows only Rami and Khalid
# - On "All" tab, Rami appears FIRST (highest priority), Khalid second
git add src/app/components/RiderPanel.tsx
git commit -m "feat: add filter tabs (All/Active/Idle/Alerts) and urgency sort to RiderPanel"
git push origin main
```

---

### TASK 8 — One-Click Map Focus
**File:** `src/app/components/LiveMapLayer.tsx`

**Add ONE `useEffect`** inside `LiveMapLayer`. Find the existing second `useEffect` (the one that calls `m.setIcon()` when `selectedId` changes). Insert this new effect AFTER that existing effect, BEFORE the `const selectedRider = ...` line:

```typescript
// NEW — add this useEffect after the existing marker-icon useEffect
// When admin selects a rider, the map smoothly flies to that rider's position
useEffect(() => {
  if (!mapInstance || selectedId === null) return;
  const rider = riders.find(r => r.id === selectedId);
  if (!rider) return;
  // 100ms delay prevents firing on initial mount
  const t = setTimeout(() => {
    mapInstance.flyTo([rider.lat, rider.lng], 15, { duration: 0.8 });
  }, 100);
  return () => clearTimeout(t);
  // Intentionally omit `riders` from deps — positions don't change during session
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedId, mapInstance]);
```

Do NOT touch any other part of `LiveMapLayer.tsx`. Only insert this one block.

**After writing:**
```bash
npm run build
npm run dev
# Verify:
# - Click any rider in the panel → map smoothly flies to that rider
# - Zoom level reaches approximately 15 (individual streets visible)
# - Animation takes ~0.8 seconds (smooth flyTo, not instant jump)
# - Clicking same rider again (deselects) → map stays where it is
git add src/app/components/LiveMapLayer.tsx
git commit -m "feat: one-click map focus — map.flyTo on rider panel selection"
git push origin main
```

---

## VERIFICATION CHECKLIST

After all 8 tasks, run `npm run dev` and check every item:

### Delivery Timer Badge
- [ ] Riders with inTransit/accepted orders show colored elapsed time chip
- [ ] Green chip = under 80% of estimate (Yousef: 8 min on 25-min Electronics)
- [ ] Amber chip = 80–100% (Tariq: 12 min on 15-min Paper)
- [ ] Red chip = over 100% (Ahmad: 28 min on 20-min Cooking Oil)
- [ ] Timer ticks live every second (watch for 5 seconds)

### Idle Warning
- [ ] Khalid (23 min idle) shows RED "Idle 23 min" chip
- [ ] Imad (8 min idle) shows AMBER "Idle 8 min" chip
- [ ] Idle riders without `idleSince` show no chip (dash fallback)

### Overtime Alert
- [ ] Rami (37 min on 15-min estimate = 2.5× = level 4) has PULSING RED left border
- [ ] Khalid (23 min idle = critical) has PULSING RED left border
- [ ] Ahmad (1.4× = level 3) has RED chip but NO pulsing border (level 4 only)

### Alert Dot
- [ ] Red pulsing dot appears next to "Fleet Status" in header
- [ ] Dot has title tooltip "One or more riders need immediate attention"

### Filter Tabs
- [ ] Four tabs: All / Active / Idle / Alerts
- [ ] "Alerts" badge shows "2" 
- [ ] Each tab correctly filters the list
- [ ] Empty state message shows when Alerts filter finds no results
- [ ] Selected tab has underline in matching color (brand for most, danger for alerts)

### Urgency Sort
- [ ] Rami appears first in "All" list
- [ ] Khalid appears second
- [ ] Active on-track riders before unwarned idle riders

### One-Click Map Focus
- [ ] Clicking rider card → map flies to rider position
- [ ] Zoom ~15 (streets visible)
- [ ] Animation smooth, ~0.8 seconds

### One-Click Call
- [ ] Phone icon (11px) visible next to every rider name
- [ ] Clicking phone opens dialer (on mobile) or browser tel: handler
- [ ] Phone click does NOT select the rider

### Build Health
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No `console.error` in DevTools

---

*Dawer Rider Panel — Gemini 2.5 Flash Execution Prompt*
*June 2026 — 8 tasks, full codebase context, production-ready*
