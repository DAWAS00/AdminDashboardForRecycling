# Stats Bar Drill-Down Implementation Plan

> **For agentic workers:** Execute task-by-task. Each task ends with `npm run build` (must pass with zero TypeScript errors) and a `git commit`. Never commit a broken build.

**Goal:** Make every tile in the bottom `StatsBar` open a detailed sheet that shows the live orders behind the number — not just historical aggregates.

**Architecture:** Thread the `RIDERS` array from `App.tsx` → `StatsBar` → `StatDetailSheet`. Add two pure helper functions to `helpers.ts` that compute live order rows and material composition from the riders data. Replace the `StatDetailSheet` content with three new sections: an insight sentence, a material composition bar (CO₂ and Earnings only), and a scrollable order-breakdown table.

**Tech Stack:** React 18, TypeScript, Tailwind CSS v4. No test framework — verification = `npm run build` + visual check in `npm run dev`. All colors via CSS variables (never raw hex). Design tokens: `var(--brand-600)`, `var(--amber-600)`, `var(--danger-600)`, `var(--border)`, `var(--muted)`, `var(--card)`, `var(--text-primary/secondary/tertiary)`. Fonts: `var(--font-sans)`, `var(--font-mono)`.

---

## File Map

| File | Change type | What changes |
|------|-------------|--------------|
| `src/app/helpers.ts` | **Modify** | Append 2 new exported functions at the end of the file |
| `src/app/App.tsx` | **Modify** | Pass `riders={RIDERS}` to `<StatsBar>` |
| `src/app/components/StatsBar.tsx` | **Modify** | Add `riders` prop; pass to `<StatDetailSheet>` |
| `src/app/components/StatDetailSheet.tsx` | **Full replace** | Enhanced version with insight card, composition bar, order table |

---

## Task 1 — Add two helper functions to `helpers.ts`

**Files:**
- Modify: `src/app/helpers.ts` (append at the end — do not touch any existing code)

### What these functions do

`buildMetricOrderRows` — takes the riders array + a metric key, returns a flat list of all non-pending orders that contribute to that metric, sorted by their metric value descending. For material tiles it filters to only that material.

`computeMaterialComposition` — takes riders + `"co2" | "earnings"`, returns how much each material contributed as a percentage of the total. Used to draw the stacked bar.

### Step 1 — Append the two functions

Open `src/app/helpers.ts`. Scroll to the very end. Append exactly this block **after** the last existing function (`hasFleetAlerts`):

```typescript
// ── Stats bar drill-down helpers ─────────────────────────────────────────────

/**
 * Returns all non-pending orders that contribute to a given metric,
 * sorted by the metric value descending (highest first).
 *
 * metric = "co2"      → all riders, all orders, sorted by co2Saved desc
 * metric = "earnings" → all riders, all orders, sorted by earnings desc
 * metric = material   → all riders, only orders matching that material, sorted by quantity desc
 */
export function buildMetricOrderRows(
  riders: Rider[],
  metric: import("./constants").HistoryMetricKey
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
      // For material tiles, skip orders of other materials
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
 * For CO₂ or Earnings tiles: returns how much each material contributed
 * as a percentage of today's total. Used for the stacked composition bar.
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

### Step 2 — Build check

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling"
npm run build
```

Expected: **zero TypeScript errors.** The new functions import `Rider` and `Order` which are already imported at the top of `helpers.ts`. `MATERIAL_CONFIG` is already imported too.

If you see `Cannot find name 'HistoryMetricKey'`: the inline `import("./constants").HistoryMetricKey` syntax handles this. If the linter still complains, add `HistoryMetricKey` to the existing import from `"./constants"` at the top of `helpers.ts`:

```typescript
// Find this line near the top of helpers.ts:
import {
  STATUS_CONFIG, MOTO_PATH, VAN_PATH, HUB_PATH, RIDERS, MATERIAL_CONFIG,
  CO2_EQUIVALENTS, MATERIAL_DELIVERY_ESTIMATE_MS, IDLE_WARNING_MS, IDLE_CRITICAL_MS
} from "./constants";

// Change it to:
import {
  STATUS_CONFIG, MOTO_PATH, VAN_PATH, HUB_PATH, RIDERS, MATERIAL_CONFIG,
  CO2_EQUIVALENTS, MATERIAL_DELIVERY_ESTIMATE_MS, IDLE_WARNING_MS, IDLE_CRITICAL_MS,
  HistoryMetricKey,
} from "./constants";
```

Then remove the inline import from the function signature and use `HistoryMetricKey` directly.

### Step 3 — Commit

```bash
git add src/app/helpers.ts
git commit -m "feat: add buildMetricOrderRows and computeMaterialComposition helpers"
git push origin main
```

---

## Task 2 — Thread `riders` prop from `App.tsx` → `StatsBar` → `StatDetailSheet`

**Files:**
- Modify: `src/app/App.tsx` (one line change at line ~354)
- Modify: `src/app/components/StatsBar.tsx` (add prop to interface + pass through)

### Step 1 — Update `App.tsx`

Open `src/app/App.tsx`. Find this line (around line 354):

```tsx
<StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} />
```

Replace with:

```tsx
<StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} riders={RIDERS} />
```

`RIDERS` is already imported at the top of `App.tsx` (line 5). No new imports needed.

### Step 2 — Update `StatsBar.tsx`

Open `src/app/components/StatsBar.tsx`. Make three small changes:

**Change A — Add `Rider` to the import from `"../types"`** (line 1 area — there is no types import currently, so add a new import line at the top):

```typescript
import { Rider } from "../types";
```

**Change B — Add `riders` to `StatsBarProps` interface:**

Find:
```typescript
interface StatsBarProps {
  co2: number;
  earnings: number;
  byMaterial: Record<string, number>;
}
```

Replace with:
```typescript
interface StatsBarProps {
  co2: number;
  earnings: number;
  byMaterial: Record<string, number>;
  riders: Rider[];
}
```

**Change C — Pass `riders` to `StatDetailSheet`:**

Find the function signature line:
```typescript
export function StatsBar({ co2, earnings, byMaterial }: StatsBarProps) {
```

Replace with:
```typescript
export function StatsBar({ co2, earnings, byMaterial, riders }: StatsBarProps) {
```

Then find the `StatDetailSheet` JSX at the bottom of the file:
```tsx
<StatDetailSheet metric={activeMetric} onClose={() => setActiveMetric(null)} />
```

Replace with:
```tsx
<StatDetailSheet metric={activeMetric} onClose={() => setActiveMetric(null)} riders={riders} />
```

### Step 3 — Build check

```bash
npm run build
```

Expected: TypeScript will complain that `StatDetailSheet` doesn't accept a `riders` prop yet. You'll see an error like:

```
Property 'riders' does not exist on type 'IntrinsicAttributes & StatDetailSheetProps'
```

**This is expected.** It means Task 2 is wired correctly. Task 3 will fix this error by updating `StatDetailSheet`. Do NOT commit until the build is clean — move immediately to Task 3.

---

## Task 3 — Replace `StatDetailSheet.tsx` with enhanced version

**Files:**
- Full replace: `src/app/components/StatDetailSheet.tsx`

This is the main task. Write the entire file — replace all existing content.

### Step 1 — Write the complete file

Write `src/app/components/StatDetailSheet.tsx` with exactly this content:

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

  // Keyboard dismiss
  useEffect(() => {
    if (!metric) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [metric, onClose]);

  // Auto-focus sheet when it opens
  useEffect(() => {
    if (!metric || !sheetRef.current) return;
    sheetRef.current.focus();
  }, [metric]);

  if (!metric) return null;

  // ── Display config ─────────────────────────────────────────────────────────
  const title = metric === "co2"      ? "CO₂ Saved"
    : metric === "earnings"           ? "Earnings"
    : metric;

  const accentColor = metric === "co2"      ? "var(--brand-600)"
    : metric === "earnings"                  ? "var(--amber-600)"
    : MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.color
      ?? "var(--text-secondary)";

  const unit = metric === "co2"      ? "kg"
    : metric === "earnings"          ? "JD"
    : MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.unit ?? "";

  // ── Historical data (period-aware) ────────────────────────────────────────
  const history        = METRIC_HISTORY[period][metric] || [];
  const visibleHistory = period === "daily" ? history.slice(-7) : history.slice(-6);
  const total = history.reduce((s, p) => s + p.value, 0);
  const avg   = history.length > 0 ? total / history.length : 0;

  // ── Live data from RIDERS (always "today", not period-aware) ─────────────
  const orderRows   = buildMetricOrderRows(riders, metric);
  const composition = (metric === "co2" || metric === "earnings")
    ? computeMaterialComposition(riders, metric as "co2" | "earnings")
    : null;

  // Insight sentence — one line, always about today
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

      {/* Sheet */}
      <div
        ref={sheetRef}
        tabIndex={-1}
        className="relative z-10 w-full animate-sheet-enter outline-none"
        style={{
          maxHeight: "min(540px, 72vh)",
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

        {/* ── INSIGHT CARD — always about today, always visible ────────────── */}
        {insightText && (
          <div
            className="mx-4 my-2 px-3 py-2 rounded-lg"
            style={{
              background:  `${accentColor}0F`,
              borderLeft:  `3px solid ${accentColor}`,
            }}
          >
            <span
              className="text-xs"
              style={{ fontFamily: "var(--font-sans)", color: "var(--text-primary)", lineHeight: 1.5 }}
            >
              {insightText}
            </span>
          </div>
        )}

        {/* Period tabs */}
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

        {/* ── Scrollable content ───────────────────────────────────────────── */}
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

          {/* ── MATERIAL COMPOSITION BAR — CO₂ and Earnings only ─────────── */}
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

          {/* ── ORDER BREAKDOWN TABLE — live orders from RIDERS ────────────── */}
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
              <div
                className="text-center py-4"
                style={{ color: "var(--text-tertiary)", fontSize: 12, fontFamily: "var(--font-sans)" }}
              >
                No orders today for this metric
              </div>
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
      {/* Stacked horizontal bar */}
      <div
        className="h-3 flex rounded-full overflow-hidden gap-px"
        style={{ background: "var(--border)" }}
      >
        {segments.map(seg => (
          <div
            key={seg.material}
            style={{
              width:     `${seg.pct}%`,
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
              style={{
                fontSize:   10,
                fontFamily: "var(--font-sans)",
                color:      "var(--text-secondary)",
              }}
            >
              {seg.material}{" "}
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>
                {seg.pct}%
              </span>
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
  const sc     = STATUS_CONFIG[row.riderStatus];
  const matCfg = MATERIAL_CONFIG[row.material as keyof typeof MATERIAL_CONFIG];

  const metricVal =
    metric === "co2"      ? `${row.co2Saved.toFixed(1)} kg`
    : metric === "earnings" ? `${row.earnings.toFixed(2)} JD`
    : `${row.quantity} ${row.unit}`;

  return (
    <div
      className="grid items-center px-3 py-2 hover:bg-[var(--muted)] transition-colors"
      style={{
        gridTemplateColumns: "1fr 80px 60px 64px",
        borderTop:           "1px solid var(--border)",
        // Accent left border for inTransit orders — draws attention to live deliveries
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
            fontSize:   10,
            fontFamily: "var(--font-mono)",
            color:      "var(--text-tertiary)",
            paddingLeft: 9,
          }}
        >
          {row.orderId}
        </span>
      </div>

      {/* Material name + icon */}
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
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize:   11,
            color:      "var(--text-secondary)",
          }}
        >
          {row.quantity} {row.unit}
        </span>
      </div>

      {/* Metric value — colored */}
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
  if (metric === "co2")      return <Wind size={18} color={color} aria-hidden="true" />;
  if (metric === "earnings") return <Banknote size={18} color={color} aria-hidden="true" />;
  const Icon = MATERIAL_CONFIG[metric as keyof typeof MATERIAL_CONFIG]?.Icon;
  if (Icon) return <Icon size={18} color={color} aria-hidden="true" />;
  return null;
}

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-[10px] font-bold uppercase tracking-wider mb-1"
        style={{
          fontFamily:    "var(--font-sans)",
          color:         "var(--text-tertiary)",
          letterSpacing: "0.06em",
        }}
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
  point,
  delta,
  unit,
  metric,
  color,
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
          {metric === "co2"      && point.topRider ? `Top rider: ${point.topRider}`    : null}
          {metric === "earnings" && point.topRider ? `Top earner: ${point.topRider}`   : null}
          {metric !== "co2" && metric !== "earnings" && point.topRider
            ? `Collected by: ${point.topRider}` : null}
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

// ── Pure helpers (private to this file) ──────────────────────────────────────

function formatValue(value: number, unit: string, metric: HistoryMetricKey): string {
  const decimals = metric === "earnings" ? 2 : 1;
  return unit ? `${value.toFixed(decimals)} ${unit}` : value.toFixed(decimals);
}

/** Builds the one-sentence insight shown above the period tabs. Always about today. */
function buildInsight(
  metric: HistoryMetricKey,
  orderRows: ReturnType<typeof buildMetricOrderRows>,
  composition: { material: string; value: number; pct: number; color: string }[] | null,
): string | null {
  if (orderRows.length === 0) return null;

  if (metric === "co2" && composition && composition[0]) {
    const top = composition[0];
    const n   = orderRows.filter(r => r.material === top.material).length;
    return `${top.material} drove ${top.pct}% of today's CO₂ savings — ${n} ${n === 1 ? "order" : "orders"} collected.`;
  }

  if (metric === "earnings" && composition) {
    const byRider: Record<string, number> = {};
    for (const row of orderRows) byRider[row.riderName] = (byRider[row.riderName] ?? 0) + row.earnings;
    const sorted = Object.entries(byRider).sort((a, b) => b[1] - a[1]);
    if (sorted[0]) {
      const [name, total] = sorted[0];
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
  const top = Object.entries(byRider).sort((a, b) => b[1].qty - a[1].qty)[0];
  if (top) {
    const [name, { count }] = top;
    return `${name} made ${count} of ${orderRows.length} ${metric} ${count === 1 ? "collection" : "collections"} today.`;
  }

  return null;
}
```

### Step 2 — Build check

```bash
npm run build
```

Expected: **zero TypeScript errors.** If you see errors:

**`Cannot find module '../helpers' or its corresponding type declarations`** — check the import path. `StatDetailSheet` is in `src/app/components/` so `../helpers` is correct.

**`Property 'riders' does not exist on type 'Rider'`** — make sure you imported `Rider` from `"../types"` not from constants.

**`STATUS_CONFIG` not imported** — it's imported from `"../constants"` in the import block at the top.

**`ReturnType<typeof buildMetricOrderRows>` error** — make sure `buildMetricOrderRows` is exported from helpers (it should be — Task 1 used `export function`).

### Step 3 — Visual verification

```bash
npm run dev
```

Open the dashboard. Check every item below:

**CO₂ tile:**
- [ ] Click it → sheet slides up
- [ ] Green insight card at top: *"[Material] drove X% of today's CO₂ savings — N orders collected."*
- [ ] Period tabs (Daily/Weekly/Monthly) work
- [ ] Summary cards show 7d total + average
- [ ] Bar chart renders with green bars
- [ ] Composition bar shows 4 colored segments + legend with % labels
- [ ] History rows show date + top rider + delta arrow + value
- [ ] Order table header: Rider / Order | Material | Qty | CO₂
- [ ] Order rows sorted highest CO₂ first
- [ ] inTransit orders have green left border accent
- [ ] Rider status dot (green/amber/gray) appears next to name
- [ ] Click backdrop → sheet closes
- [ ] Press Escape → sheet closes

**Earnings tile:**
- [ ] Insight: *"[Rider] led earnings today at X.XX JD — N orders."*
- [ ] Composition bar shows material breakdown by earnings
- [ ] Order table last column header says "Earned"
- [ ] Values show JD with 2 decimal places

**Cooking Oil tile:**
- [ ] No composition bar (material tiles don't need one)
- [ ] Insight: *"[Rider] made N of M Cooking Oil collections today."*
- [ ] Order table shows only Cooking Oil orders
- [ ] Last column says "Qty" (quantity in L)

**All tiles:**
- [ ] Sheet never taller than 72vh
- [ ] Scrolls correctly when content overflows
- [ ] Order count badge (e.g. "8 orders") in amber/green/colored pill top-right of table

### Step 4 — Commit

```bash
git add src/app/App.tsx src/app/components/StatsBar.tsx src/app/components/StatDetailSheet.tsx
git commit -m "feat: enhance StatDetailSheet with insight card, composition bar, and live order breakdown table"
git push origin main
```

---

## Self-Review

**Spec coverage:**
- ✅ Clickable tiles → sheet opens (already existed, preserved)
- ✅ "Why is the number this size?" → Insight card sentence
- ✅ Which material drove CO₂/Earnings → Composition bar
- ✅ Which orders built the number → Order breakdown table (rider, order ID, material, qty, CO₂/earnings)
- ✅ Material tiles show only their own orders
- ✅ InTransit orders highlighted with accent border
- ✅ Reports bridge — same data will feed Reports screen (no new data structures needed)

**Placeholder scan:** No TBDs, no "add appropriate error handling", all code complete.

**Type consistency:**
- `buildMetricOrderRows` returns an inlined type, and `OrderRow` uses `ReturnType<typeof buildMetricOrderRows>[number]` — consistent.
- `HistoryMetricKey` used in both helpers.ts and StatDetailSheet.tsx — consistent (same import from constants).
- `STATUS_CONFIG[row.riderStatus]` — `riderStatus` is `Rider["status"]` which is the key type of `STATUS_CONFIG` — consistent.

---

*Dawer Admin Dashboard — Stats Bar Drill-Down — June 2026*
*3 tasks · 4 files · build gate after each commit*
