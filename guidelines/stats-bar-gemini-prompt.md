# Dawer Stats Bar Drill-Down — Gemini Execution Prompt
> Paste this entire file into Gemini 2.5 Flash (High Thinking mode).
> Then say: **"Execute Task 1"** — work through Task 3 one at a time.
> Each task ends with `npm run build` → `git commit` → `git push`.

---

## WHO YOU ARE

You are a **senior React + TypeScript engineer** working inside an existing production codebase. You write precise, minimal, complete code. You never invent APIs. You never skip the build gate. You follow these five rules with zero exceptions.

### Five Rules — Never Break These

**Rule 1 — No raw hex values. Ever.**
```tsx
// ✅ correct
color: "var(--brand-600)"
background: "var(--muted)"

// ❌ wrong — even if you think you know the hex
color: "#1E5C35"
```

**Rule 2 — Never leave a `useEffect` that adds a Leaflet layer without cleanup.**
(Not relevant for this feature — but never forget it in other files.)

**Rule 3 — Never use `stopPropagation` on an outer container.**
Only on inner interactive children (phone links, etc.).

**Rule 4 — TypeScript must pass with zero errors before any commit.**
Run `npm run build` and fix every error before touching `git`.

**Rule 5 — Complete code only. No placeholders, no "// implement this", no TODOs.**
Every code block you write must be runnable exactly as written.

---

## PROJECT CONTEXT

### Stack
- React 18 + TypeScript + Vite
- Tailwind CSS v4 (`@tailwindcss/vite` plugin — no `tailwind.config.js`)
- No test framework — verification = `npm run build` + visual in `npm run dev`

### Project Root
`E:\Dawer DashBorad\AdminDashboardForRecycling\`

### Design Tokens (CSS variables — use these, never raw hex)
```
--brand-600           primary green
--amber-600           earnings / cooking oil accent
--danger-600          alerts / errors / negative delta
--text-primary        #111827 equivalent
--text-secondary      #4B5563 equivalent
--text-tertiary       #94A3B8 equivalent
--text-disabled       #CBD5E1 equivalent
--border              #E2E8F0 equivalent
--muted               #F4F6F5 equivalent
--card                #FFFFFF equivalent
--radius-xl           top sheet corners
--radius-md           table corners
--radius-full         pill shapes
--font-sans           'DM Sans'
--font-mono           'DM Mono'
```

### Existing Types (`src/app/types.ts` — relevant parts)
```typescript
export type Order = {
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
  acceptedAt?: number;
};

export type Rider = {
  id: number;
  name: string;
  nameAr: string;
  phone: string;
  lat: number;
  lng: number;
  status: "delivering" | "picking_up" | "idle";
  vehicle: "Motorcycle" | "Van";
  orders: Order[];
  idleSince?: number;
};
```

### Existing Constants (`src/app/constants.ts` — relevant exports)
```typescript
export type HistoryMetricKey =
  "co2" | "earnings" | "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";

export interface MetricHistoryPoint {
  date:        string;
  label:       string;
  value:       number;
  delta:       number;
  topRider?:   string;
  topMaterial?: string;
}

export const METRIC_HISTORY: Record<
  "daily" | "weekly" | "monthly",
  Record<HistoryMetricKey, MetricHistoryPoint[]>
>;

export const MATERIAL_CONFIG: Record<
  string,
  { color: string; unit: string; Icon: React.ComponentType<{ size?: number; color?: string; aria-hidden?: string }> }
>;

export const STATUS_CONFIG: Record<
  "delivering" | "picking_up" | "idle",
  { label: string; color: string; bg: string; dot: string }
>;

export const RIDERS: Rider[];   // 10 riders, pre-seeded orders
```

### Existing Helpers (`src/app/helpers.ts` — existing exports at end of file)
```typescript
// These functions ALREADY EXIST — do NOT re-add them:
export function deliveryElapsedMs(order: Order): number
export function deliveryUrgencyLevel(rider: Rider): 0 | 1 | 2 | 3 | 4
export function idleElapsedMs(rider: Rider): number
export function hasFleetAlerts(riders: Rider[]): boolean

// These are the imports at the TOP of helpers.ts (already there):
import { District, Hub, Rider, Order, MaterialFilter } from "./types";
import {
  STATUS_CONFIG, MOTO_PATH, VAN_PATH, HUB_PATH, RIDERS, MATERIAL_CONFIG,
  CO2_EQUIVALENTS, MATERIAL_DELIVERY_ESTIMATE_MS, IDLE_WARNING_MS, IDLE_CRITICAL_MS
} from "./constants";
```

### Existing `StatsBar.tsx` (current state — read this carefully)
```tsx
// src/app/components/StatsBar.tsx
import { useState, useCallback } from "react";
import { Wind, Banknote, Activity } from "lucide-react";
import { MATERIAL_CONFIG, METRIC_HISTORY, HistoryMetricKey } from "../constants";
import { AnimatedNumber } from "./AnimatedNumber";
import { MetricSparkline } from "./MetricSparkline";
import { StatDetailSheet } from "./StatDetailSheet";

interface StatsBarProps {
  co2: number;
  earnings: number;
  byMaterial: Record<string, number>;
  // riders: Rider[] does NOT exist yet — Task 2 adds it
}

export function StatsBar({ co2, earnings, byMaterial }: StatsBarProps) {
  const [activeMetric, setActiveMetric] = useState<HistoryMetricKey | null>(null);
  const toggle = useCallback((key: HistoryMetricKey) => {
    setActiveMetric(prev => (prev === key ? null : key));
  }, []);

  // ... tiles array, MetricTile rendering ...

  return (
    <>
      <div role="region" aria-label="Live map statistics" /* ... */>
        {/* ... tiles ... */}
      </div>
      {/* StatDetailSheet currently does NOT receive riders — Task 2 adds it */}
      <StatDetailSheet metric={activeMetric} onClose={() => setActiveMetric(null)} />
    </>
  );
}
```

### Existing `StatDetailSheet.tsx` (current state)
```tsx
// src/app/components/StatDetailSheet.tsx
interface StatDetailSheetProps {
  metric:  HistoryMetricKey | null;
  onClose: () => void;
  // riders: Rider[] does NOT exist yet — Task 3 adds it
}

// Current sheet shows:
// ✅ Period tabs: Daily / Weekly / Monthly
// ✅ Summary cards: Total + Average
// ✅ Bar chart trend
// ✅ History rows: date + topRider + delta arrow + value
// ❌ No insight sentence
// ❌ No material composition bar
// ❌ No live order breakdown table
```

### `App.tsx` — relevant lines
```tsx
// Line 6 (imports already there):
import { computeTotals, useClock } from "./helpers";
import { RIDERS } from "./constants";  // already imported

// Line 137:
const totals = computeTotals(RIDERS);

// Line 354 (current — Task 2 changes this):
<StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} />
```

---

## WHAT YOU ARE BUILDING

The stats bar at the bottom of the dashboard has 6 clickable tiles (CO₂, Earnings, Cooking Oil, Plastic Bottles, Paper & Cardboard, Electronics). Clicking one opens a bottom sheet.

**Currently** the sheet shows historical aggregates (daily/weekly/monthly totals + bar chart + history rows with top rider name). It's disconnected from the live RIDERS orders array — it cannot show which orders made the number.

**After your work**, clicking a tile will show:
1. **Insight card** (new, at top): One sentence. "Cooking Oil drove 38% of today's CO₂ savings — 4 orders collected."
2. Period tabs + summary cards + bar chart + history rows (all existing — keep them)
3. **Material composition bar** (new, CO₂ and Earnings only): Colored stacked bar showing each material's % contribution to today's total. Legend below.
4. **Order breakdown table** (new, all tiles): Every live order contributing to this metric — Rider name, Order ID, Material, Qty, CO₂/Earnings value. Sorted by metric value desc. InTransit orders get an accent-colored left border.

---

## TASK LIST

| Task | What changes | Files |
|------|-------------|-------|
| 1 | Add 2 helper functions | `src/app/helpers.ts` |
| 2 | Thread `riders` prop down the chain | `src/app/App.tsx` + `src/app/components/StatsBar.tsx` |
| 3 | Full replacement of `StatDetailSheet.tsx` | `src/app/components/StatDetailSheet.tsx` |

**Dependency:** Tasks must be done in order 1 → 2 → 3. Task 2 will produce a TypeScript error intentionally — that error is fixed by Task 3.

---

## HOW TO USE

Say **"Execute Task N"** to get the complete code + build gate + git commands for that task.

---

## TASK SPECIFICATIONS

---

### TASK 1 — Add helper functions to `helpers.ts`

**File:** `src/app/helpers.ts`
**Change:** Append two new exported functions at the very end of the file. Do NOT touch any existing code.

**The existing import block at the top of `helpers.ts` already has everything needed:**
- `Rider` and `Order` from `"./types"` ✅
- `MATERIAL_CONFIG` from `"./constants"` ✅

You only need to also import `HistoryMetricKey` from `"./constants"`. Add it to the existing constants import line:

```typescript
// Find this import (line 4-15 area) and add HistoryMetricKey:
import {
  STATUS_CONFIG, MOTO_PATH, VAN_PATH, HUB_PATH, RIDERS, MATERIAL_CONFIG,
  CO2_EQUIVALENTS, MATERIAL_DELIVERY_ESTIMATE_MS, IDLE_WARNING_MS, IDLE_CRITICAL_MS,
  HistoryMetricKey,   // ← ADD THIS
} from "./constants";
```

**Then append these two functions at the end of the file:**

```typescript
// ── Stats bar drill-down helpers ─────────────────────────────────────────────

/**
 * Returns all non-pending orders contributing to a metric, sorted desc by value.
 *
 * metric = "co2"      → all riders × all orders, sorted by co2Saved desc
 * metric = "earnings" → all riders × all orders, sorted by earnings desc
 * metric = material   → all riders × orders of that material, sorted by quantity desc
 */
export function buildMetricOrderRows(
  riders: Rider[],
  metric: HistoryMetricKey
) {
  type Row = {
    riderId:     number;
    riderName:   string;
    riderStatus: Rider["status"];
    orderId:     string;
    material:    string;
    quantity:    number;
    unit:        string;
    co2Saved:    number;
    earnings:    number;
    orderStatus: Order["status"];
  };

  const rows: Row[] = [];

  for (const rider of riders) {
    for (const order of rider.orders) {
      if (order.status === "pending") continue;
      if (
        metric !== "co2" &&
        metric !== "earnings" &&
        order.material !== metric
      ) continue;

      rows.push({
        riderId:     rider.id,
        riderName:   rider.name,
        riderStatus: rider.status,
        orderId:     order.id,
        material:    order.material,
        quantity:    order.quantity,
        unit:        order.unit,
        co2Saved:    order.co2Saved,
        earnings:    order.earnings,
        orderStatus: order.status,
      });
    }
  }

  if (metric === "co2")           rows.sort((a, b) => b.co2Saved  - a.co2Saved);
  else if (metric === "earnings") rows.sort((a, b) => b.earnings  - a.earnings);
  else                            rows.sort((a, b) => b.quantity  - a.quantity);

  return rows;
}

/**
 * For CO₂ or Earnings tiles: computes each material's % contribution today.
 * Used to render the stacked composition bar.
 */
export function computeMaterialComposition(
  riders: Rider[],
  mode: "co2" | "earnings"
): { material: string; value: number; pct: number; color: string }[] {
  const totals: Record<string, number> = {};

  for (const rider of riders) {
    for (const order of rider.orders) {
      if (order.status === "pending") continue;
      const v = mode === "co2" ? order.co2Saved : order.earnings;
      totals[order.material] = (totals[order.material] ?? 0) + v;
    }
  }

  const grand = Object.values(totals).reduce((s, v) => s + v, 0) || 1;

  return Object.entries(totals)
    .map(([material, value]) => ({
      material,
      value,
      pct:   Math.round((value / grand) * 100),
      color: MATERIAL_CONFIG[material as keyof typeof MATERIAL_CONFIG]?.color
             ?? "var(--text-tertiary)",
    }))
    .sort((a, b) => b.value - a.value);
}
```

**After writing:**
```bash
npm run build
git add src/app/helpers.ts
git commit -m "feat: add buildMetricOrderRows and computeMaterialComposition helpers"
git push origin main
```

---

### TASK 2 — Thread `riders` prop: `App.tsx` → `StatsBar`

**Files:** `src/app/App.tsx` (one line) + `src/app/components/StatsBar.tsx` (four small changes)

#### App.tsx change — ONE line only

Find (line ~354):
```tsx
<StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} />
```

Replace with:
```tsx
<StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} riders={RIDERS} />
```

`RIDERS` is already imported in `App.tsx` — no new imports needed.

#### StatsBar.tsx changes — four small edits

**Edit A:** Add import at the top of the file (new line after the existing imports):
```typescript
import { Rider } from "../types";
```

**Edit B:** Add `riders` to the props interface:
```typescript
// Find:
interface StatsBarProps {
  co2: number;
  earnings: number;
  byMaterial: Record<string, number>;
}

// Replace with:
interface StatsBarProps {
  co2: number;
  earnings: number;
  byMaterial: Record<string, number>;
  riders: Rider[];
}
```

**Edit C:** Destructure `riders` in the function signature:
```typescript
// Find:
export function StatsBar({ co2, earnings, byMaterial }: StatsBarProps) {

// Replace with:
export function StatsBar({ co2, earnings, byMaterial, riders }: StatsBarProps) {
```

**Edit D:** Pass `riders` to `StatDetailSheet`:
```tsx
// Find:
<StatDetailSheet metric={activeMetric} onClose={() => setActiveMetric(null)} />

// Replace with:
<StatDetailSheet metric={activeMetric} onClose={() => setActiveMetric(null)} riders={riders} />
```

**After writing — build will FAIL intentionally:**
```bash
npm run build
```

Expected TypeScript error:
```
Property 'riders' does not exist on type 'IntrinsicAttributes & StatDetailSheetProps'
```
**This is correct.** It proves the prop is wired. Task 3 fixes this by adding `riders` to `StatDetailSheet`. Do NOT commit. Move to Task 3 immediately.

---

### TASK 3 — Full replacement of `StatDetailSheet.tsx`

**File:** `src/app/components/StatDetailSheet.tsx`
**Change:** Replace the entire file content with the code below.

```typescript
import { useEffect, useRef, useState } from "react";
import { X, TrendingUp, TrendingDown, Minus, Wind, Banknote } from "lucide-react";
import { Rider } from "../types";
import {
  MATERIAL_CONFIG,
  METRIC_HISTORY,
  STATUS_CONFIG,
  HistoryMetricKey,
  MetricHistoryPoint,
} from "../constants";
import { buildMetricOrderRows, computeMaterialComposition } from "../helpers";

interface StatDetailSheetProps {
  metric:  HistoryMetricKey | null;
  onClose: () => void;
  riders:  Rider[];
}

const PERIODS = ["daily", "weekly", "monthly"] as const;
type Period = (typeof PERIODS)[number];

export function StatDetailSheet({ metric, onClose, riders }: StatDetailSheetProps) {
  const [period, setPeriod] = useState<Period>("daily");
  const sheetRef = useRef<HTMLDivElement>(null);

  // Keyboard dismiss on Escape
  useEffect(() => {
    if (!metric) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [metric, onClose]);

  // Auto-focus the sheet when it opens (accessibility)
  useEffect(() => {
    if (!metric || !sheetRef.current) return;
    sheetRef.current.focus();
  }, [metric]);

  if (!metric) return null;

  // ── Display config ─────────────────────────────────────────────────────────
  const title =
    metric === "co2"      ? "CO₂ Saved" :
    metric === "earnings" ? "Earnings"  :
    metric;

  const accentColor =
    metric === "co2"      ? "var(--brand-600)" :
    metric === "earnings" ? "var(--amber-600)" :
    MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.color ?? "var(--text-secondary)";

  const unit =
    metric === "co2"      ? "kg" :
    metric === "earnings" ? "JD" :
    MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.unit ?? "";

  // ── Historical data (driven by period tab) ────────────────────────────────
  const history        = METRIC_HISTORY[period][metric] || [];
  const visibleHistory = period === "daily" ? history.slice(-7) : history.slice(-6);
  const total = history.reduce((s, p) => s + p.value, 0);
  const avg   = history.length > 0 ? total / history.length : 0;

  // ── Live data from RIDERS array (always "today", not period-aware) ────────
  const orderRows   = buildMetricOrderRows(riders, metric);
  const composition = (metric === "co2" || metric === "earnings")
    ? computeMaterialComposition(riders, metric as "co2" | "earnings")
    : null;

  const insightText = buildInsight(metric, orderRows, composition);

  return (
    <div
      className="fixed inset-0 z-[1100] flex flex-col justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} details`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 sheet-backdrop" />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="relative z-10 w-full animate-sheet-enter outline-none"
        style={{
          maxHeight:           "min(540px, 72vh)",
          background:          "var(--card)",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius:"var(--radius-xl)",
          boxShadow:           "0 -8px 32px rgba(0,0,0,0.12)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-2 pb-1">
          <div className="drag-handle" />
        </div>

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-2">
            <MetricIcon metric={metric} color={accentColor} />
            <span
              className="text-base font-bold"
              style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}
            >
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--muted)] transition-colors focus-ring"
          >
            <X size={16} color="var(--text-tertiary)" aria-hidden="true" />
          </button>
        </div>

        {/* ── INSIGHT CARD — always about today, always visible ─────────────── */}
        {insightText && (
          <div
            className="mx-4 my-2 px-3 py-2 rounded-lg"
            style={{
              background: `${accentColor}0F`,
              borderLeft: `3px solid ${accentColor}`,
            }}
          >
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--font-sans)",
                color:      "var(--text-primary)",
                lineHeight: 1.5,
              }}
            >
              {insightText}
            </span>
          </div>
        )}

        {/* ── Period tabs ────────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1 px-4 py-2 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className="px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors focus-ring"
              style={{
                fontFamily: "var(--font-sans)",
                background: period === p ? accentColor : "transparent",
                color:      period === p ? "white" : "var(--text-secondary)",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* ── Scrollable content ─────────────────────────────────────────────── */}
        <div
          className="flex flex-col gap-4 p-4 overflow-y-auto"
          style={{ maxHeight: "calc(min(540px, 72vh) - 185px)" }}
        >
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label={`Total (${period === "daily" ? "7d" : period === "weekly" ? "12wk" : "12mo"})`}
              value={formatValue(total, unit, metric)}
              color={accentColor}
            />
            <SummaryCard
              label="Average"
              value={formatValue(avg, unit, metric)}
              color={accentColor}
            />
          </div>

          {/* Trend bar chart */}
          <div>
            <SectionLabel>Trend</SectionLabel>
            <BarChart data={visibleHistory} color={accentColor} />
          </div>

          {/* ── MATERIAL COMPOSITION BAR — CO₂ and Earnings tiles only ────── */}
          {composition && composition.length > 0 && (
            <div>
              <SectionLabel>Material Breakdown — Today</SectionLabel>
              <CompositionBar segments={composition} unit={unit} />
            </div>
          )}

          {/* History list */}
          <div>
            <SectionLabel>History</SectionLabel>
            <div className="space-y-1">
              {[...visibleHistory].reverse().map((point, idx, arr) => {
                const prev  = arr[idx + 1]?.value;
                const delta = prev !== undefined ? point.value - prev : point.delta;
                return (
                  <HistoryRow
                    key={point.date}
                    point={point}
                    delta={delta}
                    unit={unit}
                    metric={metric}
                    color={accentColor}
                  />
                );
              })}
            </div>
          </div>

          {/* ── ORDER BREAKDOWN TABLE ──────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Today's Orders</SectionLabel>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${accentColor}18`,
                  color:      accentColor,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {orderRows.length} orders
              </span>
            </div>

            {orderRows.length === 0 ? (
              <p
                className="text-center py-4"
                style={{
                  color:      "var(--text-tertiary)",
                  fontSize:   12,
                  fontFamily: "var(--font-sans)",
                }}
              >
                No orders today for this metric
              </p>
            ) : (
              <div
                style={{
                  borderRadius: "var(--radius-md)",
                  border:       "1px solid var(--border)",
                  overflow:     "hidden",
                }}
              >
                {/* Column headers */}
                <div
                  className="grid text-[9px] font-bold uppercase tracking-wider px-3 py-2"
                  style={{
                    gridTemplateColumns: "1fr 80px 60px 64px",
                    background:          "var(--muted)",
                    color:               "var(--text-tertiary)",
                    letterSpacing:       "0.07em",
                    fontFamily:          "var(--font-sans)",
                  }}
                >
                  <span>Rider / Order</span>
                  <span>Material</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">
                    {metric === "co2" ? "CO₂" : metric === "earnings" ? "Earned" : "Qty"}
                  </span>
                </div>

                {/* Data rows */}
                {orderRows.map(row => (
                  <OrderRow
                    key={row.orderId}
                    row={row}
                    metric={metric}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-bold uppercase tracking-widest mb-2"
      style={{
        fontFamily:    "var(--font-sans)",
        color:         "var(--text-tertiary)",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </div>
  );
}

function CompositionBar({
  segments,
  unit,
}: {
  segments: { material: string; value: number; pct: number; color: string }[];
  unit: string;
}) {
  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div
        className="h-3 flex rounded-full overflow-hidden gap-px"
        style={{ background: "var(--border)" }}
      >
        {segments.map(seg => (
          <div
            key={seg.material}
            style={{
              width:      `${seg.pct}%`,
              background: seg.color,
              minWidth:   seg.pct > 0 ? 2 : 0,
            }}
            title={`${seg.material}: ${seg.value.toFixed(1)} ${unit} (${seg.pct}%)`}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map(seg => (
          <div key={seg.material} className="flex items-center gap-1.5">
            <span
              style={{
                width:        8,
                height:       8,
                borderRadius: "50%",
                background:   seg.color,
                display:      "inline-block",
                flexShrink:   0,
              }}
            />
            <span
              style={{ fontSize: 10, fontFamily: "var(--font-sans)", color: "var(--text-secondary)" }}
            >
              {seg.material}{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{seg.pct}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderRow({
  row,
  metric,
  accentColor,
}: {
  row:         ReturnType<typeof buildMetricOrderRows>[number];
  metric:      HistoryMetricKey;
  accentColor: string;
}) {
  const sc     = STATUS_CONFIG[row.riderStatus];
  const matCfg = MATERIAL_CONFIG[row.material as keyof typeof MATERIAL_CONFIG];

  const metricVal =
    metric === "co2"      ? `${row.co2Saved.toFixed(1)} kg` :
    metric === "earnings" ? `${row.earnings.toFixed(2)} JD` :
    `${row.quantity} ${row.unit}`;

  return (
    <div
      className="grid items-center px-3 py-2 hover:bg-[var(--muted)] transition-colors"
      style={{
        gridTemplateColumns: "1fr 80px 60px 64px",
        borderTop:           "1px solid var(--border)",
        // Accent left border for inTransit orders — draws the eye to active deliveries
        borderLeft: row.orderStatus === "inTransit"
          ? `3px solid ${accentColor}`
          : "3px solid transparent",
      }}
    >
      {/* Rider name + Order ID */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            style={{
              width:        6,
              height:       6,
              borderRadius: "50%",
              background:   sc.dot,
              display:      "inline-block",
              flexShrink:   0,
            }}
          />
          <span
            className="text-xs font-semibold truncate"
            style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}
          >
            {row.riderName}
          </span>
        </div>
        <span
          style={{
            fontSize:    10,
            fontFamily:  "var(--font-mono)",
            color:       "var(--text-tertiary)",
            paddingLeft: 9,
          }}
        >
          {row.orderId}
        </span>
      </div>

      {/* Material icon + first word of name */}
      <div className="flex items-center gap-1 min-w-0">
        {matCfg && <matCfg.Icon size={10} color={matCfg.color} aria-hidden="true" />}
        <span
          className="text-[10px] truncate"
          style={{ fontFamily: "var(--font-sans)", color: "var(--text-secondary)" }}
        >
          {row.material.split(" ")[0]}
        </span>
      </div>

      {/* Quantity */}
      <div className="text-right">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
          {row.quantity} {row.unit}
        </span>
      </div>

      {/* Metric value — highlighted in accent color */}
      <div className="text-right">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize:   11,
            fontWeight: 700,
            color:      accentColor,
          }}
        >
          {metricVal}
        </span>
      </div>
    </div>
  );
}

function MetricIcon({ metric, color }: { metric: HistoryMetricKey; color: string }) {
  if (metric === "co2")      return <Wind    size={18} color={color} aria-hidden="true" />;
  if (metric === "earnings") return <Banknote size={18} color={color} aria-hidden="true" />;
  const Icon = MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.Icon;
  if (Icon) return <Icon size={18} color={color} aria-hidden="true" />;
  return null;
}

function SummaryCard({
  label, value, color,
}: {
  label: string; value: string; color: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-1"
        style={{ fontFamily: "var(--font-sans)", color: "var(--text-tertiary)", letterSpacing: "0.06em" }}
      >
        {label}
      </div>
      <div
        className="text-lg font-bold"
        style={{ fontFamily: "var(--font-mono)", color, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </div>
    </div>
  );
}

function BarChart({ data, color }: { data: MetricHistoryPoint[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 0.01);
  return (
    <div className="flex items-end gap-1 h-24 px-1">
      {data.map((point, i) => {
        const height = Math.max((point.value / max) * 100, 4);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{ height: `${height}%`, background: color, opacity: 0.85 }}
              title={`${point.label}: ${point.value}`}
            />
            <span
              className="text-[9px] text-center leading-none"
              style={{ fontFamily: "var(--font-sans)", color: "var(--text-tertiary)" }}
            >
              {point.label.split(" ").slice(0, 2).join(" ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HistoryRow({
  point, delta, unit, metric, color,
}: {
  point:  MetricHistoryPoint;
  delta:  number;
  unit:   string;
  metric: HistoryMetricKey;
  color:  string;
}) {
  const TrendIcon  = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? color
    : delta < 0 ? "var(--danger-600)"
    : "var(--text-tertiary)";

  return (
    <div
      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex flex-col min-w-0">
        <span
          className="text-xs font-semibold"
          style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}
        >
          {point.label}
        </span>
        <span
          className="text-[10px]"
          style={{ fontFamily: "var(--font-sans)", color: "var(--text-tertiary)" }}
        >
          {metric === "co2"                              && point.topRider ? `Top rider: ${point.topRider}`    : null}
          {metric === "earnings"                         && point.topRider ? `Top earner: ${point.topRider}`   : null}
          {metric !== "co2" && metric !== "earnings"     && point.topRider ? `Collected by: ${point.topRider}` : null}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          <TrendIcon size={12} color={trendColor} aria-hidden="true" />
          <span
            className="text-[10px] font-semibold"
            style={{ fontFamily: "var(--font-mono)", color: trendColor }}
          >
            {delta > 0 ? "+" : ""}{formatValue(Math.abs(delta), unit, metric)}
          </span>
        </div>
        <span
          className="text-sm font-bold w-20 text-right"
          style={{ fontFamily: "var(--font-mono)", color, fontVariantNumeric: "tabular-nums" }}
        >
          {formatValue(point.value, unit, metric)}
        </span>
      </div>
    </div>
  );
}

// ── Pure helpers (file-private) ───────────────────────────────────────────────

function formatValue(value: number, unit: string, metric: HistoryMetricKey): string {
  const decimals = metric === "earnings" ? 2 : 1;
  return unit ? `${value.toFixed(decimals)} ${unit}` : value.toFixed(decimals);
}

function buildInsight(
  metric:      HistoryMetricKey,
  orderRows:   ReturnType<typeof buildMetricOrderRows>,
  composition: { material: string; value: number; pct: number; color: string }[] | null,
): string | null {
  if (orderRows.length === 0) return null;

  if (metric === "co2" && composition?.[0]) {
    const top = composition[0];
    const n   = orderRows.filter(r => r.material === top.material).length;
    return `${top.material} drove ${top.pct}% of today's CO₂ savings — ${n} ${n === 1 ? "order" : "orders"} collected.`;
  }

  if (metric === "earnings") {
    const byRider: Record<string, number> = {};
    for (const row of orderRows) byRider[row.riderName] = (byRider[row.riderName] ?? 0) + row.earnings;
    const [[name, total] = []] = Object.entries(byRider).sort((a, b) => b[1] - a[1]);
    if (name && total !== undefined) {
      const count = orderRows.filter(r => r.riderName === name).length;
      return `${name} led earnings today at ${total.toFixed(2)} JD — ${count} ${count === 1 ? "order" : "orders"}.`;
    }
  }

  // Material tile
  const byRider: Record<string, { count: number; qty: number }> = {};
  for (const row of orderRows) {
    byRider[row.riderName] ??= { count: 0, qty: 0 };
    byRider[row.riderName].count++;
    byRider[row.riderName].qty += row.quantity;
  }
  const [[topName, topData] = []] = Object.entries(byRider).sort((a, b) => b[1].qty - a[1].qty);
  if (topName && topData) {
    return `${topName} made ${topData.count} of ${orderRows.length} ${metric} ${topData.count === 1 ? "collection" : "collections"} today.`;
  }

  return null;
}
```

**After writing:**
```bash
npm run build
npm run dev
```

**Visual verification checklist — check every item before committing:**

CO₂ tile:
- [ ] Click CO₂ tile → sheet slides up from bottom
- [ ] Insight card visible: "Cooking Oil drove X% of today's CO₂ savings — N orders collected."
- [ ] Card has green left border + light green background tint
- [ ] Daily/Weekly/Monthly tabs switch the trend chart and history
- [ ] Summary cards show 7d total + average with green mono values
- [ ] Bar chart renders with green bars, 7 columns
- [ ] Composition bar appears: colored stacked segments + legend with %
- [ ] History rows: date + "Top rider: Name" + delta arrow + value
- [ ] Order table: header row (gray bg) + data rows sorted by CO₂ desc
- [ ] inTransit order rows have green left border
- [ ] Status dot (green/amber/gray) appears next to rider name in each row
- [ ] "X orders" count badge is green pill top-right
- [ ] Sheet scrolls when content overflows
- [ ] Click backdrop → sheet closes
- [ ] Press Escape → sheet closes

Earnings tile:
- [ ] Insight: "[Rider] led earnings today at X.XX JD — N orders."
- [ ] Composition bar shows material breakdown by earnings %
- [ ] Table last column header says "Earned"
- [ ] Values show 2 decimal places (JD)

Cooking Oil tile:
- [ ] Insight: "[Rider] made N of M Cooking Oil collections today."
- [ ] NO composition bar
- [ ] Table shows ONLY Cooking Oil orders
- [ ] Table last column header says "Qty"

**Commit:**
```bash
git add src/app/App.tsx src/app/components/StatsBar.tsx src/app/components/StatDetailSheet.tsx
git commit -m "feat: enhance StatDetailSheet with insight card, composition bar, and live order breakdown table"
git push origin main
```

---

## VERIFICATION AFTER ALL 3 TASKS

```bash
npm run build
```
Must show: `✓ built in X.XXs` with **zero TypeScript errors**.

Open `npm run dev`. The bottom bar must still show all 6 tiles. Clicking each must open the enhanced sheet. The sheet must close on backdrop click AND Escape key.

---

*Dawer Admin Dashboard — Stats Bar Drill-Down — Gemini 2.5 Flash Execution Prompt*
*June 2026 · 3 tasks · 4 files · build gate after each commit*
