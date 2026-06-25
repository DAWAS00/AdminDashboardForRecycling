# Rider Panel Admin Features — Implementation Plan

> **For agentic workers:** Execute tasks one at a time. After each task: `npm run build` → fix any errors → `git add` → `git commit` → `git push`. Never skip the build gate.

**Goal:** Add 8 research-validated admin control features to the rider panel — Delivery Timer Badge, Idle Warning, Overtime Alert, Fleet Alert Dot, Filter Tabs, Urgency Sort, One-Click Map Focus, One-Click Call — without touching the map, redesigning anything, or adding new screens.

**Architecture:** All features are additive changes to existing components. The timer and idle logic lives in new helper functions in `helpers.ts`. The filter/sort state lives in `RiderPanel.tsx`. Map focus is a single `useEffect` added to `LiveMapLayer.tsx`. No new component files needed except a small `FilterTabs` sub-component inside `RiderPanel.tsx`.

**Tech Stack:** React 18 + TypeScript, Tailwind v4, existing CSS variables (never raw hex), Lucide icons, no new dependencies.

---

## Severity Ladder (never deviate from this)

```
Level 0 — Idle, no active order          → no chip shown
Level 1 — Elapsed < 80% of estimate      → Green chip  (on track)
Level 2 — Elapsed 80–100% of estimate    → Amber chip  (getting close)
Level 3 — Elapsed 100–150% of estimate   → Red chip    (late)
Level 4 — Elapsed ≥ 150% of estimate     → Red PULSING border + Alert Dot fires
```

Only Level 4 fires the Alert Dot. Levels 1–3 are passive color changes.

---

## File Map

| File | Action | What changes |
|---|---|---|
| `src/app/types.ts` | Modify | Add `acceptedAt?: number` to `Order`; add `idleSince?: number` to `Rider` |
| `src/app/constants.ts` | Modify | Add `MATERIAL_DELIVERY_ESTIMATE_MS`, `IDLE_WARNING_MS`, `IDLE_CRITICAL_MS`; seed `acceptedAt` and `idleSince` in rider data |
| `src/app/helpers.ts` | Modify | Add 4 new helper functions: `deliveryElapsedMs`, `deliveryUrgencyLevel`, `idleElapsedMs`, `hasFleetAlerts` |
| `src/styles/globals.css` | Modify | Add `@keyframes pulse-danger` for the overtime alert border animation |
| `src/app/components/rider/RiderRow.tsx` | Modify | Add delivery timer chip, idle warning chip, overtime alert pulsing border, one-click call |
| `src/app/components/rider/FleetSummaryHeader.tsx` | Modify | Add red alert dot when fleet has critical issues |
| `src/app/components/RiderPanel.tsx` | Modify | Add filter state, filter tabs UI, urgency sort before rendering |
| `src/app/components/LiveMapLayer.tsx` | Modify | Add `useEffect` to call `map.flyTo()` when `selectedId` changes |

---

## Task 1 — Extend Types

**Files:**
- Modify: `src/app/types.ts`

- [ ] **Step 1: Add `acceptedAt` to Order and `idleSince` to Rider**

Open `src/app/types.ts`. Find the `Order` interface and add one optional field. Find the `Rider` interface and add one optional field.

```typescript
// src/app/types.ts — FULL FILE (replace entirely)

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
  createdAt: string;      // ISO date, e.g. "2026-06-24"
  completedAt?: string;   // ISO date when status === "completed"
  acceptedAt?: number;    // Date.now() when rider accepted the order — enables delivery timer
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
  idleSince?: number;     // Date.now() when rider last became idle — enables idle warning
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

/** Per-material CO₂ breakdown within a district */
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

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: build passes (the new optional fields don't break existing code — TypeScript treats `?` fields as always compatible with existing usages).

- [ ] **Step 3: Commit**

```bash
git add src/app/types.ts
git commit -m "feat: add acceptedAt to Order and idleSince to Rider types"
git push origin main
```

---

## Task 2 — Add Constants + Seed Realistic Timestamps

**Files:**
- Modify: `src/app/constants.ts` (top section and RIDERS section only)

The seeded timestamps make the timer badges visible on first load, including one rider (Rami, id:7) who is critically overdue so the Alert Dot fires immediately — proving the feature works.

- [ ] **Step 1: Add alert constants at the top of `constants.ts`**

Find the block at the very top of `constants.ts` after the imports. Add these three constants:

```typescript
// ── Delivery alert thresholds ─────────────────────────────────────────────────
// Used by deliveryUrgencyLevel() in helpers.ts
export const MATERIAL_DELIVERY_ESTIMATE_MS: Record<string, number> = {
  "Cooking Oil":       20 * 60 * 1000,  // 20 min
  "Plastic Bottles":   15 * 60 * 1000,  // 15 min
  "Paper & Cardboard": 15 * 60 * 1000,  // 15 min
  "Electronics":       25 * 60 * 1000,  // 25 min
};
export const IDLE_WARNING_MS  = 10 * 60 * 1000;  // 10 min → amber idle badge
export const IDLE_CRITICAL_MS = 20 * 60 * 1000;  // 20 min → red idle badge + Alert Dot
```

- [ ] **Step 2: Update `seedOrderDates` to also set `acceptedAt`**

Find the `seedOrderDates` function (currently near the bottom of constants.ts). Replace it with this version that also seeds `acceptedAt` based on the order's status:

```typescript
// Replace the existing seedOrderDates function:

function seedOrderDates(riders: Rider[], date: string): Rider[] {
  // Simulate orders accepted at different times in the past
  // so timer badges show meaningful elapsed times on first load.
  // inTransit orders are older (rider already en route).
  // accepted orders are more recent (just assigned).
  const acceptedOffsets: Record<string, number> = {
    "ORD-2841": 28 * 60 * 1000,  // Ahmad — Cooking Oil, 28 min ago  → over 20-min estimate → RED (level 3)
    "ORD-2842": 5  * 60 * 1000,  // Ahmad — Plastic, 5 min ago       → under 15-min estimate → GREEN
    "ORD-2835": 12 * 60 * 1000,  // Tariq — Paper, 12 min ago        → 80% of 15-min estimate → AMBER
    "ORD-2836": 3  * 60 * 1000,  // Tariq — Plastic accepted, 3 min  → GREEN
    "ORD-2830": 8  * 60 * 1000,  // Yousef — Electronics, 8 min ago  → GREEN (under 25 min)
    "ORD-2828": 37 * 60 * 1000,  // Rami — Plastic, 37 min ago       → 2.5× estimate → CRITICAL (level 4) ← Alert fires!
    "ORD-2820": 18 * 60 * 1000,  // Nidal — Paper, 18 min ago        → 1.2× estimate → RED (level 3)
    "ORD-2821": 7  * 60 * 1000,  // Nidal — Electronics accepted     → GREEN
  };

  return riders.map(r => ({
    ...r,
    orders: r.orders.map(o => ({
      ...o,
      createdAt: date,
      completedAt: o.status === "completed" ? date : undefined,
      acceptedAt:
        (o.status === "inTransit" || o.status === "accepted") && acceptedOffsets[o.id]
          ? Date.now() - acceptedOffsets[o.id]
          : undefined,
    })),
  }));
}
```

- [ ] **Step 3: Add `idleSince` to idle riders in `rawRiders`**

Find rider id:4 (Khalid Nasser, idle) and id:10 (Imad Saleh, idle) in `rawRiders`. Add `idleSince` to each:

```typescript
// Rider id:4 — was idle 23 minutes ago → CRITICAL idle (> 20 min) → Alert Dot fires
{
  id: 4, name: "Khalid Nasser", nameAr: "خالد ناصر",
  phone: "+962 79 456 7890", lat: 31.9780, lng: 35.8820,
  status: "idle", vehicle: "Van", orders: [],
  idleSince: Date.now() - (23 * 60 * 1000),
},

// Rider id:10 — was idle 8 minutes ago → amber idle badge only (< 20 min)
{
  id: 10, name: "Imad Saleh", nameAr: "عماد صالح",
  phone: "+962 79 012 3456", lat: 32.0080, lng: 35.8780,
  status: "idle", vehicle: "Van", orders: [],
  idleSince: Date.now() - (8 * 60 * 1000),
},
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: no errors. TypeScript knows `idleSince` is optional on `Rider` so all other riders without it are fine.

- [ ] **Step 5: Commit**

```bash
git add src/app/constants.ts
git commit -m "feat: add delivery estimate constants and seed acceptedAt/idleSince timestamps"
git push origin main
```

---

## Task 3 — Add Alert Helper Functions

**Files:**
- Modify: `src/app/helpers.ts`

Add 4 functions at the bottom of `helpers.ts`. These are pure functions — no side effects, no imports needed beyond what's already at the top.

- [ ] **Step 1: Add the 4 helpers at the bottom of `helpers.ts`**

Open `src/app/helpers.ts`. At the very end of the file, append:

```typescript
// ── Delivery timer + alert helpers ───────────────────────────────────────────
import { MATERIAL_DELIVERY_ESTIMATE_MS, IDLE_WARNING_MS, IDLE_CRITICAL_MS } from "./constants";

/**
 * Returns ms elapsed since the order's acceptedAt timestamp.
 * Returns 0 if acceptedAt is not set (order not yet accepted).
 */
export function deliveryElapsedMs(order: import("./types").Order): number {
  if (!order.acceptedAt) return 0;
  return Date.now() - order.acceptedAt;
}

/**
 * Returns urgency level 0–4 for a rider:
 *   0 = idle or no active order
 *   1 = green  (elapsed < 80% of estimate)
 *   2 = amber  (elapsed 80–100%)
 *   3 = red    (elapsed 100–150%)
 *   4 = critical (elapsed ≥ 150%) — this level fires the Alert Dot
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
 *   - Delivery urgency level 4 (≥ 1.5× estimate)
 *   - Idle for ≥ IDLE_CRITICAL_MS (20 min)
 * Used to show/hide the Alert Dot on the panel header.
 */
export function hasFleetAlerts(riders: Rider[]): boolean {
  return riders.some(r => {
    if (deliveryUrgencyLevel(r) >= 4) return true;
    if (idleElapsedMs(r) >= IDLE_CRITICAL_MS)   return true;
    return false;
  });
}
```

**Important:** The `import` statement for `Rider` is already at the top of `helpers.ts`. Do NOT add a duplicate import. The `MATERIAL_DELIVERY_ESTIMATE_MS`, `IDLE_WARNING_MS`, `IDLE_CRITICAL_MS` imports should be added to the EXISTING import line from `"./constants"` at the top of the file. Change:

```typescript
// BEFORE (existing import at top of helpers.ts):
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

to:

```typescript
// AFTER — add the three new constants to the existing import:
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

Then add the 4 functions at the bottom of the file (without the duplicate import line at the top of the function block):

```typescript
// ── Delivery timer + alert helpers ───────────────────────────────────────────

export function deliveryElapsedMs(order: Order): number {
  if (!order.acceptedAt) return 0;
  return Date.now() - order.acceptedAt;
}

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

export function idleElapsedMs(rider: Rider): number {
  if (rider.status !== "idle" || !rider.idleSince) return 0;
  return Date.now() - rider.idleSince;
}

export function hasFleetAlerts(riders: Rider[]): boolean {
  return riders.some(r => {
    if (deliveryUrgencyLevel(r) >= 4) return true;
    if (idleElapsedMs(r) >= IDLE_CRITICAL_MS)   return true;
    return false;
  });
}
```

Also add `Order` to the type imports at the top if not already there:

```typescript
import { District, Hub, Rider, Order, MaterialFilter } from "./types";
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/helpers.ts
git commit -m "feat: add deliveryElapsedMs, deliveryUrgencyLevel, idleElapsedMs, hasFleetAlerts helpers"
git push origin main
```

---

## Task 4 — Add `pulse-danger` CSS Animation

**Files:**
- Modify: `src/styles/globals.css`

The overtime alert uses a pulsing left border. The animation needs to be in the global stylesheet.

- [ ] **Step 1: Read `globals.css` to find where to append**

Open `src/styles/globals.css` and go to the end of the file.

- [ ] **Step 2: Append the keyframe**

```css
/* ── Overtime alert border pulse ─────────────────────────────────────────── */
@keyframes pulse-danger {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.25; }
}
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css
git commit -m "feat: add pulse-danger keyframe for overtime alert animation"
git push origin main
```

---

## Task 5 — Delivery Timer Badge + Idle Warning + Overtime Alert in RiderRow

**Files:**
- Modify: `src/app/components/rider/RiderRow.tsx`

This is the main visual upgrade. Three things added to each card:
1. **Delivery Timer Badge** — colored elapsed time chip below the status dot
2. **Idle Warning** — amber/red elapsed idle time for idle riders
3. **Overtime Alert** — pulsing red left border when urgency level = 4
4. **One-Click Call** — phone icon link next to the name

- [ ] **Step 1: Replace the entire `RiderRow.tsx` with this version**

```typescript
// src/app/components/rider/RiderRow.tsx
import { useEffect, useState } from "react";
import { ChevronRight, Phone } from "lucide-react";
import { Rider, ActiveRoute } from "../../types";
import { STATUS_CONFIG, MOTO_PATH, VAN_PATH, IDLE_WARNING_MS, IDLE_CRITICAL_MS } from "../../constants";
import { formatEta, etaColor, remainingSeconds } from "../../lib/eta";
import {
  deliveryElapsedMs,
  deliveryUrgencyLevel,
  idleElapsedMs,
} from "../../helpers";

interface RiderRowProps {
  rider: Rider;
  isSelected: boolean;
  maxEarnings: number;
  onSelect: (id: number) => void;
  activeRoute?: ActiveRoute | null;
}

// Formats elapsed ms as "18 min" or "1h 3 min"
function formatElapsed(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m} min` : `${h}h`;
}

export function RiderRow({ rider, isSelected, maxEarnings, onSelect, activeRoute }: RiderRowProps) {
  const sc = STATUS_CONFIG[rider.status];
  const totalEarnings = rider.orders.reduce((s, o) => s + o.earnings, 0);
  const barPct = maxEarnings > 0 ? Math.round((totalEarnings / maxEarnings) * 100) : 0;

  // Tick every second so timers stay live
  const [, tick] = useState(0);
  useEffect(() => {
    // Always tick when rider is active — not just when activeRoute is present
    if (rider.status === "idle") return;
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [rider.status]);

  // Also tick for idle riders so the idle warning updates
  useEffect(() => {
    if (rider.status !== "idle") return;
    const id = setInterval(() => tick(n => n + 1), 10000); // every 10s is fine for idle
    return () => clearInterval(id);
  }, [rider.status]);

  const barColor =
    barPct >= 70 ? "var(--color-brand-600)" :
    barPct >= 30 ? "var(--color-amber-600)" :
    "var(--color-text-disabled)";

  const isActive = rider.status !== "idle";

  // ── Delivery timer ─────────────────────────────────────────────────────────
  const urgencyLevel = deliveryUrgencyLevel(rider);
  const activeOrder  = rider.orders.find(o => o.status === "inTransit" || o.status === "accepted");
  const elapsedMs    = activeOrder ? deliveryElapsedMs(activeOrder) : 0;

  const timerColor =
    urgencyLevel === 4 ? "var(--color-danger-600)" :
    urgencyLevel === 3 ? "var(--color-danger-600)" :
    urgencyLevel === 2 ? "var(--color-amber-600)"  :
    urgencyLevel === 1 ? "var(--color-brand-600)"  :
    "transparent";

  // ── Idle warning ────────────────────────────────────────────────────────────
  const idleMs = idleElapsedMs(rider);
  const idleColor =
    idleMs >= IDLE_CRITICAL_MS ? "var(--color-danger-600)" :
    idleMs >= IDLE_WARNING_MS  ? "var(--color-amber-600)"  :
    null; // null = don't show badge at all

  // ── Overtime alert (level 4) ────────────────────────────────────────────────
  const isOvertime = urgencyLevel === 4;
  const isIdleCritical = idleMs >= IDLE_CRITICAL_MS;
  const showAlertBorder = isOvertime || isIdleCritical;

  return (
    <button
      onClick={() => onSelect(rider.id)}
      aria-label={`Select rider ${rider.name}`}
      aria-pressed={isSelected}
      className="w-full text-left px-4 py-3 border-b transition-colors"
      style={{
        borderColor: "var(--color-border)",
        background: isSelected ? "var(--color-surface-card)" : "transparent",
        opacity: isActive ? 1 : 0.7,
        cursor: "pointer",
        position: "relative",
        // Selected state: brand left border. Overtime: danger border overrides.
        boxShadow: showAlertBorder
          ? "none"  // pulsing div handles the border
          : isSelected
          ? "inset 3px 0 0 var(--color-brand-600)"
          : "none",
      }}
    >
      {/* Overtime / critical idle — pulsing left border */}
      {showAlertBorder && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
            background: "var(--color-danger-600)",
            animation: "pulse-danger 1.2s ease-in-out infinite",
          }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* Vehicle icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 36, height: 36,
            borderRadius: "50%",
            background: sc.bg,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={sc.dot}>
            <path d={rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH} />
          </svg>
        </div>

        {/* Name + status + timer */}
        <div className="flex-1 min-w-0">
          {/* Row 1: name + vehicle + phone link */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span
              className="truncate"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {rider.name}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* One-Click Call */}
              <a
                href={`tel:${rider.phone.replace(/\s/g, "")}`}
                aria-label={`Call ${rider.name}`}
                onClick={e => e.stopPropagation()} // don't select rider when tapping phone
                style={{
                  display: "flex", alignItems: "center",
                  color: "var(--color-text-tertiary)",
                  padding: "2px 4px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <Phone size={11} />
              </a>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--color-text-tertiary)",
                }}
              >
                {rider.vehicle}
              </span>
            </div>
          </div>

          {/* Row 2: status dot + label + timer chip OR idle warning */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <span
                style={{
                  display: "inline-block", width: 6, height: 6,
                  borderRadius: "50%", background: sc.dot, flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: sc.color }}>{sc.label}</span>
            </div>

            {/* Delivery Timer Chip — shown when rider is active and has an accepted/inTransit order */}
            {isActive && urgencyLevel > 0 && elapsedMs > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  color: timerColor,
                  background: timerColor + "18", // 10% opacity background
                  borderRadius: "var(--radius-full)",
                  padding: "1px 6px",
                }}
              >
                {formatElapsed(elapsedMs)}
              </span>
            )}

            {/* Idle Warning Chip — shown when idle and idleSince is set */}
            {!isActive && idleColor && idleMs > 0 && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  color: idleColor,
                  background: idleColor + "18",
                  borderRadius: "var(--radius-full)",
                  padding: "1px 6px",
                }}
              >
                Idle {formatElapsed(idleMs)}
              </span>
            )}
          </div>

          {/* Active rider: earnings bar + ETA */}
          {isActive && (
            <>
              <div className="flex items-center gap-2">
                <div
                  style={{
                    flex: 1, height: 5,
                    borderRadius: "var(--radius-full)",
                    background: "var(--color-border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barPct}%`,
                      borderRadius: "var(--radius-full)",
                      background: barColor,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: barColor,
                    fontWeight: 600,
                    flexShrink: 0,
                    minWidth: 42,
                    textAlign: "right",
                  }}
                >
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

          {!isActive && !idleColor && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-disabled)" }}>—</span>
          )}
        </div>

        <ChevronRight size={14} color="var(--color-text-disabled)" className="flex-shrink-0" />
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: no errors. If TypeScript complains about `IDLE_WARNING_MS` or `IDLE_CRITICAL_MS` not in constants imports, add them to the import line at the top of `RiderRow.tsx`.

- [ ] **Step 3: Visual check**

```bash
npm run dev
```

Open the dashboard → Live Operations Map. In the rider panel:
- [ ] Ahmad Khalil — shows amber or red timer chip (28 min, over 20-min estimate)
- [ ] Rami Diab — shows red PULSING left border + red timer chip (37 min, critical)
- [ ] Khalid Nasser (idle) — shows red "Idle 23 min" chip + pulsing border
- [ ] Imad Saleh (idle) — shows amber "Idle 8 min" chip, no pulsing border
- [ ] Phone icon appears next to each rider name
- [ ] Tapping the phone icon does NOT trigger rider selection

- [ ] **Step 4: Commit**

```bash
git add src/app/components/rider/RiderRow.tsx
git commit -m "feat: add delivery timer badge, idle warning, overtime alert border, one-click call to RiderRow"
git push origin main
```

---

## Task 6 — Alert Dot in FleetSummaryHeader

**Files:**
- Modify: `src/app/components/rider/FleetSummaryHeader.tsx`

Add a red alert dot to the "Fleet Status" label row when `hasFleetAlerts(riders)` returns true.

- [ ] **Step 1: Replace `FleetSummaryHeader.tsx` with this version**

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
    <div
      className="px-4 py-3 bg-white border-b flex-shrink-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* Row 1: label + alert dot + clock */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            style={{
              fontSize: 10, fontWeight: 700,
              color: "var(--color-text-tertiary)",
              letterSpacing: "0.1em", textTransform: "uppercase",
            }}
          >
            Fleet Status
          </span>
          {/* Alert Dot — only renders when a rider is critically late or idle */}
          {alertActive && (
            <span
              aria-label="Fleet has critical alerts"
              title="One or more riders need attention"
              style={{
                display: "inline-block",
                width: 8, height: 8,
                borderRadius: "50%",
                background: "var(--color-danger-600)",
                animation: "pulse-danger 1.2s ease-in-out infinite",
                flexShrink: 0,
              }}
            />
          )}
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {timeStr}
        </span>
      </div>

      {/* Row 2: status dots */}
      <div className="flex items-center gap-3 mb-2">
        {(["delivering", "picking_up", "idle"] as const).map(status => {
          const cfg   = STATUS_CONFIG[status];
          const count = counts[status];
          if (count === 0) return null;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className={status !== "idle" ? "animate-pulse-soft" : undefined}
                style={{
                  display: "inline-block",
                  width: 6, height: 6,
                  borderRadius: "50%",
                  background: cfg.dot,
                  flexShrink: 0,
                }}
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
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            CO₂ Today
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--color-brand-600)", lineHeight: 1.2 }}>
            {co2.toFixed(1)}
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", marginLeft: 3 }}>kg</span>
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Earnings Today
          </div>
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

- [ ] **Step 2: Build + visual check**

```bash
npm run build
npm run dev
```

Expected: A small red pulsing dot appears next to "Fleet Status" label in the header (because Rami is critically overdue and Khalid has been idle 23+ min).

- [ ] **Step 3: Commit**

```bash
git add src/app/components/rider/FleetSummaryHeader.tsx
git commit -m "feat: add alert dot to FleetSummaryHeader — fires on critical delivery or idle events"
git push origin main
```

---

## Task 7 — Filter Tabs + Urgency Sort in RiderPanel

**Files:**
- Modify: `src/app/components/RiderPanel.tsx`

Add: (1) a filter state with 4 tabs, (2) urgency sort so critical riders float to top, (3) the tab bar UI between header and list.

- [ ] **Step 1: Replace `RiderPanel.tsx` with this version**

```typescript
// src/app/components/RiderPanel.tsx
import { useState } from "react";
import { Rider, ActiveRoute, CompletedTrip } from "../types";
import { PANEL_WIDTH } from "../constants";
import { deliveryUrgencyLevel, idleElapsedMs, hasFleetAlerts } from "../helpers";
import { IDLE_CRITICAL_MS, IDLE_WARNING_MS } from "../constants";
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
  const alertCount = riders.filter(r =>
    deliveryUrgencyLevel(r) >= 4 || idleElapsedMs(r) >= IDLE_CRITICAL_MS
  ).length;

  const maxEarnings = Math.max(
    ...riders.map(r => r.orders.reduce((s, o) => s + o.earnings, 0)),
    0,
  );

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = riders.filter(r => {
    if (filter === "active")  return r.status !== "idle";
    if (filter === "idle")    return r.status === "idle";
    if (filter === "alerts")  return deliveryUrgencyLevel(r) >= 4 || idleElapsedMs(r) >= IDLE_CRITICAL_MS;
    return true; // "all"
  });

  // ── Urgency Sort — critical riders float to top ───────────────────────────
  const sorted = [...filtered].sort((a, b) => {
    const urgA = deliveryUrgencyLevel(a);
    const urgB = deliveryUrgencyLevel(b);
    const idleA = idleElapsedMs(a);
    const idleB = idleElapsedMs(b);

    // Compute sort priority (higher = appears first)
    function priority(r: Rider, urg: 0|1|2|3|4, idle: number): number {
      if (urg === 4) return 100;            // critically late delivery
      if (idle >= IDLE_CRITICAL_MS) return 90; // critically idle
      if (urg === 3) return 70;             // late delivery
      if (idle >= IDLE_WARNING_MS)  return 60; // idle warning
      if (urg >= 1) return 40;              // active, on track
      return 10;                             // idle, no warning
    }

    return priority(b, urgB, idleB) - priority(a, urgA, idleA);
  });

  // ── Tab styles ───────────────────────────────────────────────────────────────
  const tabStyle = (tab: FilterTab): React.CSSProperties => ({
    flex: 1,
    padding: "5px 4px",
    fontSize: 10,
    fontWeight: 600,
    fontFamily: "var(--font-sans)",
    letterSpacing: "0.04em",
    cursor: "pointer",
    border: "none",
    borderBottom: filter === tab
      ? `2px solid ${tab === "alerts" ? "var(--color-danger-600)" : "var(--color-brand-600)"}`
      : "2px solid transparent",
    background: "transparent",
    color: filter === tab
      ? (tab === "alerts" ? "var(--color-danger-600)" : "var(--color-brand-600)")
      : "var(--color-text-tertiary)",
    transition: "color 0.15s, border-color 0.15s",
  });

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{
        width: PANEL_WIDTH,
        flexShrink: 0,
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      {/* Zone 1 — Fleet Summary */}
      <FleetSummaryHeader riders={riders} time={time} />

      {/* Zone 1b — Filter Tabs */}
      <div
        className="flex border-b flex-shrink-0"
        style={{ background: "white", borderColor: "var(--color-border)" }}
      >
        <button style={tabStyle("all")}     onClick={() => setFilter("all")}>All</button>
        <button style={tabStyle("active")}  onClick={() => setFilter("active")}>Active</button>
        <button style={tabStyle("idle")}    onClick={() => setFilter("idle")}>Idle</button>
        <button
          style={tabStyle("alerts")}
          onClick={() => setFilter("alerts")}
          aria-label={`Alerts (${alertCount} rider${alertCount !== 1 ? "s" : ""})`}
        >
          Alerts{alertCount > 0 && (
            <span
              style={{
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
              }}
            >
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

- [ ] **Step 2: Build + visual check**

```bash
npm run build
npm run dev
```

Expected:
- [ ] Four tabs appear below the fleet header: All · Active · Idle · Alerts
- [ ] "Alerts" tab has a red badge showing "2" (Rami + Khalid are critical)
- [ ] Clicking "Active" shows only delivering/picking_up riders
- [ ] Clicking "Idle" shows only Khalid and Imad
- [ ] Clicking "Alerts" shows only Rami (critically late) and Khalid (critically idle)
- [ ] Rami and Khalid appear at the TOP of the "All" list (urgency sort)

- [ ] **Step 3: Commit**

```bash
git add src/app/components/RiderPanel.tsx
git commit -m "feat: add filter tabs (All/Active/Idle/Alerts) and urgency sort to RiderPanel"
git push origin main
```

---

## Task 8 — One-Click Map Focus in LiveMapLayer

**Files:**
- Modify: `src/app/components/LiveMapLayer.tsx`

When a rider is selected in the panel, the map smoothly flies to that rider's position at zoom 15. This uses the already-existing `selectedId` prop — no new prop needed.

- [ ] **Step 1: Add one `useEffect` to `LiveMapLayer.tsx`**

Open `src/app/components/LiveMapLayer.tsx`. Find the second `useEffect` (the one that updates marker icons when `selectedId` changes). Add a NEW `useEffect` directly after it:

```typescript
// Add AFTER the existing useEffect that updates marker icons:
// (After the closing }); of that effect, before the `const selectedRider = ...` line)

useEffect(() => {
  if (!mapInstance || selectedId === null) return;
  const rider = riders.find(r => r.id === selectedId);
  if (!rider) return;
  // Small delay prevents the flyTo from firing on initial mount
  const t = setTimeout(() => {
    mapInstance.flyTo([rider.lat, rider.lng], 15, { duration: 0.8 });
  }, 100);
  return () => clearTimeout(t);
}, [selectedId, mapInstance]); // intentionally omit `riders` — position doesn't change during session
```

- [ ] **Step 2: Build + visual check**

```bash
npm run build
npm run dev
```

Expected:
- [ ] Click any rider card in the panel → map smoothly pans and zooms to that rider
- [ ] Click the same rider again (deselects) → map stays where it is (no flyTo on null)
- [ ] Animation takes ~0.8 seconds — smooth, not jarring

- [ ] **Step 3: Commit**

```bash
git add src/app/components/LiveMapLayer.tsx
git commit -m "feat: one-click map focus — map.flyTo on rider selection"
git push origin main
```

---

## Final Verification Checklist

Run `npm run dev` and check every item:

### Delivery Timer Badge
- [ ] Riders with `inTransit` orders show an elapsed time chip (e.g. "18 min") on their card
- [ ] Chip color: green < 80% estimate, amber 80–100%, red > 100%
- [ ] Timer ticks live — number increases every second
- [ ] Riders with no `acceptedAt` set show no chip (pending orders only)

### Idle Warning
- [ ] Idle riders with `idleSince` set show "Idle X min" chip
- [ ] Khalid (23 min) shows RED chip
- [ ] Imad (8 min) shows AMBER chip
- [ ] Idle riders WITHOUT `idleSince` show the dash fallback (no chip)

### Overtime Alert (pulsing border)
- [ ] Rami Diab (37 min on 15-min estimate) shows a PULSING RED left border
- [ ] Khalid Nasser (critically idle) shows a PULSING RED left border
- [ ] Ahmad Khalil (28 min on 20-min estimate, ratio 1.4×, level 3) shows RED chip but NO pulsing border (level 4 only)

### Alert Dot
- [ ] Red pulsing dot appears next to "Fleet Status" text in the header
- [ ] Dot has tooltip "One or more riders need attention"

### Filter Tabs
- [ ] Four tabs visible below the header: All / Active / Idle / Alerts
- [ ] "Alerts" tab shows badge count "2"
- [ ] Clicking each tab correctly filters the list
- [ ] "No riders match this filter" message shows when filter returns empty

### Urgency Sort
- [ ] On the "All" tab, Rami (critical delivery) appears first
- [ ] Khalid (critical idle) appears second
- [ ] Active on-track riders appear before idle-with-no-warning riders

### One-Click Map Focus
- [ ] Clicking a rider card causes the map to fly to that rider's position
- [ ] Zoom level lands at ~15 (close enough to see individual streets)
- [ ] Animation is smooth (flyTo, not setView)

### One-Click Call
- [ ] Phone icon visible next to each rider's name
- [ ] Clicking phone icon does NOT trigger rider selection (stopPropagation works)
- [ ] On mobile, tapping opens the dialer

### Build Health
- [ ] `npm run build` passes with zero TypeScript errors
- [ ] No `console.error` in browser DevTools
- [ ] No "Cannot update unmounted component" warnings

---

*Dawer — Rider Panel Admin Features Implementation Plan*
*June 2026 | Based on JTBD analysis + 8 industry research sources*
