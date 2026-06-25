# Stats Bar Drill-Down Enhancement Plan
> Dawer Admin Dashboard — June 2026

---

## What Already Exists (Don't Break It)

The `StatsBar` + `StatDetailSheet` combo is already working:

- **6 clickable tiles** — CO₂, Earnings, Cooking Oil, Plastic Bottles, Paper & Cardboard, Electronics
- **Bottom sheet** slides up on tile click, closes on backdrop or Escape
- **Period tabs** — Daily (7 days) / Weekly (12 weeks) / Monthly (12 months)
- **Summary cards** — Total and Average for the selected period
- **Bar chart** — Trend visualization with colored bars per period
- **History rows** — Date label + top rider name + delta + value

**What's missing** is the live order-level intelligence layer — the sheet currently shows aggregate history from generated seed data but has NO connection to the actual `RIDERS` orders array. It can't answer "which orders built this number?" or "why is CO₂ at 73 kg today?".

---

## Research Findings

### UX Pattern Validated: Drill-Through (not Drill-Down)

From RIB Software and Pencil & Paper research:
> "A drill-through shows you additional data in a popup/panel instead of the same chart — click a total revenue KPI and see the breakdown of where it's coming from."

This is exactly the pattern to use. The bottom sheet is the right UI. The gap is: **what's inside the sheet is not connected to real order data.**

### Progressive Disclosure Hierarchy (Mixpanel/Linear Model)

Setproduct and UXPilot confirm the correct sequence:
1. **Glanceable** — number + sparkline on the tile (already done ✅)
2. **Overview** — totals + trend chart in the sheet (already done ✅)
3. **Explanation** — why is the number this size? Which material/rider drove it? (MISSING ❌)
4. **Order detail** — the individual orders that built the number (MISSING ❌)

### Alert Fatigue / Cognitive Load (NASA-TLX referenced in rider analysis)
Keep the insight section to ONE sentence. Not a wall of text. "Cooking Oil drove 68% of today's CO₂ savings" is enough — the admin can then look at the order table for specifics.

### Report Bridge Design
Fleet management platforms (Powerfleet, Geotab 2025 report) consistently expose:
- Per-trip CO₂ attribution (which vehicle, which route, which material)
- Rider leaderboards with efficiency scores
- Material yield per collection

These are all things the admin needs when generating Reports. The sheet becomes a **preview** of what the Reports screen will show in full.

---

## What to Build (4 additions to `StatDetailSheet`)

### Addition 1 — Pass `riders` into the sheet

Current: `StatDetailSheet` receives `metric` and `onClose` only. It has no access to live order data.

Fix: Thread `riders: Rider[]` from `App.tsx` → `StatsBar` → `StatDetailSheet`.

### Addition 2 — Insight Card (the "Why" section)

A single sentence card at the TOP of the sheet content, above the period tabs.
Always visible, always about TODAY, not affected by the period selector.

Logic per metric:
- **CO₂**: Find the material with the highest total CO₂ across all orders. Format: `"[Material] drove [X]% of today's CO₂ — [N] orders collected."`
- **Earnings**: Find the top earning rider. Format: `"[Rider] led earnings today at [JD] — [N] orders completed."`
- **Cooking Oil / Plastic / Paper / Electronics**: Find the top delivering rider for this material. Format: `"[Rider] made [N] of [total] [material] collections today."`

Display: white card, colored left accent border, 12px sans-serif, single line.

### Addition 3 — Material Composition Bar (CO₂ and Earnings tiles only)

A horizontal stacked bar below the insight card.
Shows how each of the 4 materials contributed as a % to today's total.

- **For CO₂**: each material's `co2Saved` sum / total CO₂
- **For Earnings**: each material's `earnings` sum / total earnings
- Each segment colored by `MATERIAL_CONFIG[name].color`
- Tooltip on hover: `"Cooking Oil: 28.4 kg (38%)"`
- Legend: 4 colored dots with material name + % below the bar

Not shown for material tiles (they're already filtered to one material).

### Addition 4 — Order Breakdown Table

The most important new section. Replaces nothing — appended after "History".

**For CO₂ tile:** All completed/inTransit orders across all riders, sorted by co2Saved desc.
**For Earnings tile:** All orders, sorted by earnings desc.
**For material tiles (e.g. Cooking Oil):** Only orders where `order.material === metric`, sorted by quantity desc.

Table columns:
| Rider | Order ID | Material | Qty | CO₂ / Earnings | Status |
|-------|----------|----------|-----|----------------|--------|
| Ahmad | ORD-2841 | Cooking Oil | 45 L | 12.4 kg | 🟢 inTransit |
| Rami  | ORD-2828 | Plastic Bottles | 30 kg | 6.2 kg | 🔴 Critical |

Status dot uses `STATUS_CONFIG` colors. Critical overtime rows get a red left border (reuses the `pulse-danger` approach but without pulsing in a table — just a static red left border on the row).

Table header:
- "Today's Orders" (always about today, not period-aware)
- Order count badge: `"8 orders"`

Empty state: "No orders today for this metric"

---

## File Changes

### 1. `src/app/App.tsx`
Pass `riders` to `StatsBar`:
```tsx
// Before
<StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} />

// After
<StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} riders={riders} />
```

### 2. `src/app/components/StatsBar.tsx`
Add `riders: Rider[]` to `StatsBarProps`:
```tsx
interface StatsBarProps {
  co2: number;
  earnings: number;
  byMaterial: Record<string, number>;
  riders: Rider[];         // ← ADD
}
```
Pass `riders` through to `StatDetailSheet`:
```tsx
<StatDetailSheet metric={activeMetric} onClose={() => setActiveMetric(null)} riders={riders} />
```

### 3. `src/app/helpers.ts`
Add one new helper (the two needed ones already exist):
```typescript
/** Returns all orders contributing to a metric, sorted by value desc.
 *  metric = "co2" → sorted by co2Saved
 *  metric = "earnings" → sorted by earnings
 *  metric = material name → filtered to that material, sorted by quantity
 */
export function buildMetricOrderRows(
  riders: Rider[],
  metric: HistoryMetricKey
): Array<{
  riderId:   number;
  riderName: string;
  riderStatus: Rider["status"];
  orderId:   string;
  material:  string;
  quantity:  number;
  unit:      string;
  co2Saved:  number;
  earnings:  number;
  orderStatus: Order["status"];
}> {
  const rows: ReturnType<typeof buildMetricOrderRows> = [];
  for (const rider of riders) {
    for (const order of rider.orders) {
      if (order.status === "pending") continue; // pending hasn't been accepted yet
      if (metric !== "co2" && metric !== "earnings" && order.material !== metric) continue;
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
  if (metric === "co2")      rows.sort((a, b) => b.co2Saved  - a.co2Saved);
  else if (metric === "earnings") rows.sort((a, b) => b.earnings - a.earnings);
  else                            rows.sort((a, b) => b.quantity - a.quantity);
  return rows;
}

/** Computes how much each material contributed (%) to a total.
 *  Returns array of { material, value, pct, color } sorted by value desc.
 */
export function computeMaterialComposition(
  riders: Rider[],
  mode: "co2" | "earnings"
): Array<{ material: string; value: number; pct: number; color: string }> {
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
      color: MATERIAL_CONFIG[material as keyof typeof MATERIAL_CONFIG]?.color ?? "var(--text-tertiary)",
    }))
    .sort((a, b) => b.value - a.value);
}
```

### 4. `src/app/components/StatDetailSheet.tsx`
Full enhancement. Changes:
- Add `riders: Rider[]` prop
- Import `buildMetricOrderRows`, `computeMaterialComposition` from helpers
- Import `MATERIAL_CONFIG`, `STATUS_CONFIG` from constants
- Add `InsightCard` component
- Add `CompositionBar` component (shown for co2 + earnings only)
- Add `OrderBreakdownTable` component
- Insert all 3 new sections inside the scrollable content div

---

## Complete Code

### `src/app/helpers.ts` — append these two functions

```typescript
// ── Stats bar drill-down helpers ─────────────────────────────────────────────

export function buildMetricOrderRows(riders: Rider[], metric: HistoryMetricKey) {
  type Row = {
    riderId: number; riderName: string; riderStatus: Rider["status"];
    orderId: string; material: string; quantity: number; unit: string;
    co2Saved: number; earnings: number; orderStatus: Order["status"];
  };
  const rows: Row[] = [];
  for (const rider of riders) {
    for (const order of rider.orders) {
      if (order.status === "pending") continue;
      if (metric !== "co2" && metric !== "earnings" && order.material !== metric) continue;
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
      color: MATERIAL_CONFIG[material as keyof typeof MATERIAL_CONFIG]?.color ?? "var(--text-tertiary)",
    }))
    .sort((a, b) => b.value - a.value);
}
```

### `src/app/components/StatDetailSheet.tsx` — complete replacement

```typescript
import { useEffect, useRef, useState } from "react";
import { X, TrendingUp, TrendingDown, Minus, Wind, Banknote } from "lucide-react";
import { Rider } from "../types";
import {
  MATERIAL_CONFIG, METRIC_HISTORY, STATUS_CONFIG,
  HistoryMetricKey, MetricHistoryPoint,
} from "../constants";
import {
  buildMetricOrderRows,
  computeMaterialComposition,
} from "../helpers";

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

  useEffect(() => {
    if (!metric) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [metric, onClose]);

  useEffect(() => {
    if (!metric || !sheetRef.current) return;
    sheetRef.current.focus();
  }, [metric]);

  if (!metric) return null;

  const title = metric === "co2" ? "CO₂ Saved"
    : metric === "earnings" ? "Earnings"
    : metric;

  const accentColor = metric === "co2"      ? "var(--brand-600)"
    : metric === "earnings"                  ? "var(--amber-600)"
    : MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.color ?? "var(--text-secondary)";

  const unit = metric === "co2"      ? "kg"
    : metric === "earnings"          ? "JD"
    : MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.unit ?? "";

  const history     = METRIC_HISTORY[period][metric] || [];
  const visibleHistory = period === "daily" ? history.slice(-7) : history.slice(-6);
  const total = history.reduce((s, p) => s + p.value, 0);
  const avg   = history.length > 0 ? total / history.length : 0;

  // Live order data — always "today", not period-aware
  const orderRows = buildMetricOrderRows(riders, metric);
  const composition = (metric === "co2" || metric === "earnings")
    ? computeMaterialComposition(riders, metric)
    : null;

  // Insight sentence
  const insightText = buildInsight(metric, riders, orderRows, composition);

  return (
    <div
      className="fixed inset-0 z-[1100] flex flex-col justify-end"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} details`}
    >
      <div className="absolute inset-0 sheet-backdrop" />

      <div
        ref={sheetRef}
        tabIndex={-1}
        className="relative z-10 w-full animate-sheet-enter outline-none"
        style={{
          maxHeight: "min(520px, 70vh)",
          background: "var(--card)",
          borderTopLeftRadius: "var(--radius-xl)",
          borderTopRightRadius: "var(--radius-xl)",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.12)",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-2 pb-1">
          <div className="drag-handle" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <MetricIcon metric={metric} color={accentColor} />
            <span className="text-base font-bold" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
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

        {/* ── INSIGHT CARD — always about today, above period tabs ── */}
        {insightText && (
          <div
            className="mx-4 my-2 px-3 py-2 rounded-lg"
            style={{
              background: `${accentColor}0F`,
              borderLeft: `3px solid ${accentColor}`,
            }}
          >
            <span className="text-xs" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)", lineHeight: 1.5 }}>
              {insightText}
            </span>
          </div>
        )}

        {/* Period tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b" style={{ borderColor: "var(--border)" }}>
          {PERIODS.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className="px-3 py-1 rounded-md text-xs font-semibold capitalize transition-colors focus-ring"
              style={{
                fontFamily: "var(--font-sans)",
                background: period === p ? accentColor : "transparent",
                color: period === p ? "white" : "var(--text-secondary)",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div
          className="flex flex-col gap-4 p-4 overflow-y-auto"
          style={{ maxHeight: "calc(min(520px, 70vh) - 180px)" }}
        >
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard
              label={`Total (${period === "daily" ? "7d" : period === "weekly" ? "12wk" : "12mo"})`}
              value={formatValue(total, unit, metric)}
              color={accentColor}
            />
            <SummaryCard label="Average" value={formatValue(avg, unit, metric)} color={accentColor} />
          </div>

          {/* Trend chart */}
          <div>
            <SectionLabel>Trend</SectionLabel>
            <BarChart data={visibleHistory} color={accentColor} />
          </div>

          {/* ── MATERIAL COMPOSITION BAR — CO₂ and Earnings tiles only ── */}
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
                    point={point} delta={delta} unit={unit}
                    metric={metric} color={accentColor}
                  />
                );
              })}
            </div>
          </div>

          {/* ── ORDER BREAKDOWN TABLE — live orders from RIDERS ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <SectionLabel>Today's Orders</SectionLabel>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: `${accentColor}18`, color: accentColor, fontFamily: "var(--font-mono)" }}
              >
                {orderRows.length} orders
              </span>
            </div>

            {orderRows.length === 0 ? (
              <div className="text-center py-4" style={{ color: "var(--text-tertiary)", fontSize: 12 }}>
                No orders today for this metric
              </div>
            ) : (
              <div style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
                {/* Table header */}
                <div
                  className="grid text-[9px] font-bold uppercase tracking-wider px-3 py-2"
                  style={{
                    gridTemplateColumns: "1fr 80px 80px 56px",
                    background: "var(--muted)",
                    color: "var(--text-tertiary)",
                    letterSpacing: "0.07em",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  <span>Rider / Order</span>
                  <span>Material</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">
                    {metric === "co2" ? "CO₂" : metric === "earnings" ? "Earned" : "Qty"}
                  </span>
                </div>

                {/* Table rows */}
                {orderRows.map(row => (
                  <OrderRow key={row.orderId} row={row} metric={metric} accentColor={accentColor} />
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
      style={{ fontFamily: "var(--font-sans)", color: "var(--text-tertiary)", letterSpacing: "0.08em" }}
    >
      {children}
    </div>
  );
}

function CompositionBar({
  segments, unit,
}: {
  segments: { material: string; value: number; pct: number; color: string }[];
  unit: string;
}) {
  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="h-3 flex rounded-full overflow-hidden gap-px" style={{ background: "var(--border)" }}>
        {segments.map(seg => (
          <div
            key={seg.material}
            style={{ width: `${seg.pct}%`, background: seg.color, minWidth: seg.pct > 0 ? 2 : 0 }}
            title={`${seg.material}: ${seg.value.toFixed(1)} ${unit} (${seg.pct}%)`}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments.map(seg => (
          <div key={seg.material} className="flex items-center gap-1.5">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, display: "inline-block", flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontFamily: "var(--font-sans)", color: "var(--text-secondary)" }}>
              {seg.material} <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{seg.pct}%</span>
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
  row: ReturnType<typeof buildMetricOrderRows>[number];
  metric: HistoryMetricKey;
  accentColor: string;
}) {
  const sc         = STATUS_CONFIG[row.riderStatus];
  const matCfg     = MATERIAL_CONFIG[row.material as keyof typeof MATERIAL_CONFIG];
  const metricVal  = metric === "co2"      ? `${row.co2Saved.toFixed(1)} kg`
    : metric === "earnings"                ? `${row.earnings.toFixed(2)} JD`
    : `${row.quantity} ${row.unit}`;
  const isOvertime = row.orderStatus === "inTransit"; // simplistic — could use urgency level

  return (
    <div
      className="grid items-center px-3 py-2 hover:bg-[var(--muted)] transition-colors"
      style={{
        gridTemplateColumns: "1fr 80px 80px 56px",
        borderTop: "1px solid var(--border)",
        borderLeft: isOvertime ? `3px solid ${accentColor}` : "3px solid transparent",
      }}
    >
      {/* Rider + Order ID */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block", flexShrink: 0 }}
          />
          <span className="text-xs font-semibold truncate" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
            {row.riderName}
          </span>
        </div>
        <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", paddingLeft: 9 }}>
          {row.orderId}
        </span>
      </div>

      {/* Material */}
      <div className="flex items-center gap-1 min-w-0">
        {matCfg && <matCfg.Icon size={10} color={matCfg.color} aria-hidden="true" />}
        <span className="text-[10px] truncate" style={{ fontFamily: "var(--font-sans)", color: "var(--text-secondary)" }}>
          {row.material.split(" ")[0]}
        </span>
      </div>

      {/* Quantity */}
      <div className="text-right">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-secondary)" }}>
          {row.quantity} {row.unit}
        </span>
      </div>

      {/* Metric value */}
      <div className="text-right">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: accentColor }}>
          {metricVal}
        </span>
      </div>
    </div>
  );
}

function MetricIcon({ metric, color }: { metric: HistoryMetricKey; color: string }) {
  if (metric === "co2")      return <Wind size={18} color={color} aria-hidden="true" />;
  if (metric === "earnings") return <Banknote size={18} color={color} aria-hidden="true" />;
  const Icon = MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.Icon;
  if (Icon) return <Icon size={18} color={color} aria-hidden="true" />;
  return null;
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
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

function HistoryRow({ point, delta, unit, metric, color }: { point: MetricHistoryPoint; delta: number; unit: string; metric: HistoryMetricKey; color: string }) {
  const TrendIcon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
  const trendColor = delta > 0 ? color : delta < 0 ? "var(--danger-600)" : "var(--text-tertiary)";

  return (
    <div
      className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)" }}>
          {point.label}
        </span>
        <span className="text-[10px]" style={{ fontFamily: "var(--font-sans)", color: "var(--text-tertiary)" }}>
          {metric === "co2"      && point.topRider ? `Top rider: ${point.topRider}` : null}
          {metric === "earnings" && point.topRider ? `Top earner: ${point.topRider}` : null}
          {metric !== "co2" && metric !== "earnings" && point.topRider ? `Collected by: ${point.topRider}` : null}
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          <TrendIcon size={12} color={trendColor} aria-hidden="true" />
          <span className="text-[10px] font-semibold" style={{ fontFamily: "var(--font-mono)", color: trendColor }}>
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

// ── Pure helpers ──────────────────────────────────────────────────────────────

function formatValue(value: number, unit: string, metric: HistoryMetricKey): string {
  const decimals = metric === "earnings" ? 2 : 1;
  return unit ? `${value.toFixed(decimals)} ${unit}` : value.toFixed(decimals);
}

function buildInsight(
  metric: HistoryMetricKey,
  riders: Rider[],
  orderRows: ReturnType<typeof buildMetricOrderRows>,
  composition: { material: string; value: number; pct: number; color: string }[] | null,
): string | null {
  if (orderRows.length === 0) return null;

  if (metric === "co2" && composition && composition[0]) {
    const top = composition[0];
    const n   = orderRows.filter(r => r.material === top.material).length;
    return `${top.material} drove ${top.pct}% of today's CO₂ savings — ${n} ${n === 1 ? "order" : "orders"} collected.`;
  }

  if (metric === "earnings" && composition && composition[0]) {
    // Find top earning rider
    const byRider: Record<string, number> = {};
    for (const row of orderRows) byRider[row.riderName] = (byRider[row.riderName] ?? 0) + row.earnings;
    const [topRider, topVal] = Object.entries(byRider).sort((a, b) => b[1] - a[1])[0] ?? [];
    if (topRider) return `${topRider} led earnings today at ${topVal.toFixed(2)} JD — ${byRider[topRider] !== undefined ? orderRows.filter(r => r.riderName === topRider).length : 0} orders.`;
  }

  // Material tile — top rider
  const byRider: Record<string, { count: number; qty: number }> = {};
  for (const row of orderRows) {
    byRider[row.riderName] = byRider[row.riderName] ?? { count: 0, qty: 0 };
    byRider[row.riderName].count++;
    byRider[row.riderName].qty += row.quantity;
  }
  const [topRider] = Object.entries(byRider).sort((a, b) => b[1].qty - a[1].qty)[0] ?? [];
  if (topRider) {
    const { count } = byRider[topRider];
    return `${topRider} made ${count} of ${orderRows.length} ${metric} ${count === 1 ? "collection" : "collections"} today.`;
  }

  return null;
}
```

---

## Build Order

1. **`helpers.ts`** — append the 2 new functions (no existing code changes needed)
2. **`App.tsx`** — add `riders={riders}` to `<StatsBar>`
3. **`StatsBar.tsx`** — add `riders` to props, pass to `StatDetailSheet`
4. **`StatDetailSheet.tsx`** — full replacement with enhanced version above

Each step: `npm run build` → fix any TypeScript errors → `git commit`.

---

## What the Admin Will See

**Before (now):** Click CO₂ → sheet shows totals + bar chart + history rows with top rider name.

**After:** Click CO₂ →
- 🟢 *Insight Card*: "Cooking Oil drove 38% of today's CO₂ savings — 4 orders collected."
- Period tabs (Daily / Weekly / Monthly)
- 7-day totals + average
- Bar chart trend
- 🟦 *Composition Bar*: colored stacked bar showing Cooking Oil 38% / Plastic 29% / Paper 22% / Electronics 11%
- History rows (unchanged)
- 📋 *Order Table*: 8 rows — Rider name + Order ID + Material + Qty + CO₂ value, sorted by CO₂ desc
  - Rami's ORD-2828 (12.4 kg) at the top with accent left border (inTransit)

**Click Cooking Oil tile →**
- 🟡 *Insight Card*: "Ahmad Khalid made 2 of 4 Cooking Oil collections today."
- Composition Bar: hidden (it's already a material filter)
- Order Table: only Cooking Oil orders, sorted by quantity

---

## Bridge to Reports Screen

Every value in this sheet is the same data that the Reports screen will show in full. The order table rows are the atomic unit of any report:
- Weekly Operations Report = these rows grouped by day
- Hub Efficiency Report = these rows grouped by material + hub proximity
- CO₂ Certificate = sum of co2Saved across all rows for a date range
- Rider Leaderboard = these rows grouped by rider, sorted by earnings or co2Saved

No new data structures needed for Reports. This sheet IS a mini-report.

---

*June 2026 — Dawer Admin Dashboard — Stats Bar Enhancement*
