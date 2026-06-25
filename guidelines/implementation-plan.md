# Dawer Dashboard — Implementation Plan

> **Goal:** Upgrade the dashboard from a passive visualization into an operational intelligence tool — redesigned Rider panel, intelligent Heat Map with material filtering and hub coverage, and a shared design token system that eliminates all hardcoded values.

**Architecture:** Phase 1 lays the CSS/type foundation that every other phase depends on. Phase 2 rebuilds the Rider panel as decomposed components. Phase 3 adds Heat Map intelligence layers. Phase 4 connects the two views. Each phase is independently shippable — complete Phase 1 and the app still works; complete Phase 2 and the rider panel is dramatically better even before the heat map changes land.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind v4, Leaflet/react-leaflet, Lucide React, DM Sans + DM Mono + Cairo (Google Fonts)

**No test framework is configured** — verification for each task is: `npm run build` passes (TypeScript + Vite) + visual check in `npm run dev`.

---

## File map — what gets created or changed

### Phase 1 — Foundation
| Action | File | Responsibility |
|---|---|---|
| Modify | `src/styles/globals.css` | Add `:root` CSS design tokens |
| Modify | `src/app/types.ts` | Add `MaterialBreakdown` to `District`, add `ViewMode` type |
| Modify | `src/app/constants.ts` | Add `CO2_EQUIVALENTS`, `PANEL_WIDTH`, `MATERIAL_BREAKDOWN` data per district |
| Modify | `src/app/helpers.ts` | Add `co2Equivalents()`, `districtPriorityScore()`, `hubCoverageKm()` |

### Phase 2 — Rider Panel
| Action | File | Responsibility |
|---|---|---|
| Create | `src/app/components/rider/FleetSummaryHeader.tsx` | Zone 1 — fleet-wide stats bar |
| Create | `src/app/components/rider/RiderRow.tsx` | Single rider row with earnings bar |
| Create | `src/app/components/rider/ProgressTrail.tsx` | 4-step order status visual trail |
| Create | `src/app/components/rider/OrderCard.tsx` | Full order card using ProgressTrail |
| Create | `src/app/components/rider/TodayStats.tsx` | Zone 3 "Today" tab content |
| Create | `src/app/components/rider/RiderDetailDrawer.tsx` | Zone 3 drawer — tabs + content |
| Modify | `src/app/components/RiderPanel.tsx` | Assemble zones; remove old inline logic |

### Phase 3 — Heat Map Intelligence
| Action | File | Responsibility |
|---|---|---|
| Modify | `src/app/App.tsx` | Add `heatMapViewMode`, `materialFilter` state |
| Create | `src/app/components/heatmap/ViewModeSelector.tsx` | Chip row: Overview / Demand / Hubs |
| Create | `src/app/components/heatmap/MaterialFilterBar.tsx` | Material chip filter |
| Create | `src/app/components/heatmap/DistrictReportCard.tsx` | Deep-dive panel for selected district |
| Modify | `src/app/components/HeatMapLayer.tsx` | Add hub coverage circles, material filter pass-through |
| Modify | `src/app/components/HeatMapPanel.tsx` | Use new sub-components; add priority queue |

### Phase 4 — Integration
| Action | File | Responsibility |
|---|---|---|
| Modify | `src/app/App.tsx` | Lift idle rider state; share with heat map |
| Modify | `src/app/components/heatmap/DistrictReportCard.tsx` | Add zone assignment UI |

---

## Phase 1 — Foundation

### Task 1: CSS Design Tokens

**Files:**
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add `:root` token block at the top of `globals.css` — before any existing rules**

```css
/* ─── Design Tokens — Single source of truth ─── */
:root {
  /* Brand greens */
  --color-brand-900: #032B17;
  --color-brand-800: #06402B;
  --color-brand-700: #0A5E3E;
  --color-brand-600: #1E5C35;
  --color-brand-500: #166534;
  --color-brand-100: #D1FAE5;
  --color-brand-50:  #ECFDF5;

  /* Amber */
  --color-amber-600: #C8860A;
  --color-amber-100: #FEF3C7;
  --color-amber-50:  #FFFBEB;

  /* Material type colors */
  --color-oil:          #C8860A;
  --color-oil-bg:       #FEF3C7;
  --color-plastic:      #1E40AF;
  --color-plastic-bg:   #DBEAFE;
  --color-paper:        #166534;
  --color-paper-bg:     #DCFCE7;
  --color-ewaste:       #6D28D9;
  --color-ewaste-bg:    #EDE9FE;

  /* Neutrals */
  --color-text-primary:   #111827;
  --color-text-secondary: #4B5563;
  --color-text-tertiary:  #94A3B8;
  --color-text-disabled:  #CBD5E1;
  --color-border:         #E2E8F0;
  --color-border-strong:  #CBD5E1;
  --color-surface:        #F4F6F5;
  --color-surface-card:   #FFFFFF;
  --color-surface-hover:  #F8FAFB;

  /* Danger */
  --color-danger-600: #DC2626;
  --color-danger-100: #FEE2E2;

  /* Typography */
  --font-sans: 'DM Sans', system-ui, sans-serif;
  --font-mono: 'DM Mono', 'Courier New', monospace;
  --font-ar:   'Cairo', sans-serif;

  /* Spacing (4pt grid) */
  --space-1:  4px;
  --space-2:  8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Radii */
  --radius-sm:   6px;
  --radius-md:   8px;
  --radius-lg:  12px;
  --radius-xl:  16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.06);
  --shadow-sm: 0 1px 6px rgba(0,0,0,0.10);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.12);

  /* Layout */
  --panel-width:    288px;
  --sidebar-width:  200px;
  --header-height:   52px;
  --statsbar-height: 60px;

  /* Z-index */
  --z-map:     10;
  --z-overlay: 20;
  --z-panel:   30;
  --z-header:  40;
  --z-modal:  100;
  --z-toast:  200;
}
```

- [ ] **Step 2: Add body-level font and color defaults** — find the existing `body` rule in globals.css or index.css and set font once:

In `src/styles/index.css`, add (or update existing body rule):
```css
body {
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-surface);
  line-height: 1.5;
}
```

- [ ] **Step 3: Verify — run build**

```bash
cd "E:/Dawer DashBorad/AdminDashboardForRecycling"
npm run build
```

Expected: no TypeScript or Vite errors. The app still renders identically (no visual changes yet).

- [ ] **Step 4: Commit**

```bash
git add src/styles/globals.css src/styles/index.css
git commit -m "feat: add CSS design token system to :root"
```

---

### Task 2: Extend Types

**Files:**
- Modify: `src/app/types.ts`

- [ ] **Step 1: Add `MaterialBreakdown` and `ViewMode` — replace the existing `types.ts`**

```typescript
export interface Order {
  id: string;
  material: "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";
  quantity: number;
  unit: string;
  address: string;
  status: "pending" | "accepted" | "inTransit" | "completed";
  co2Saved: number;
  earnings: number;
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
  /** Per-material breakdown — enables material filter layer */
  materialBreakdown: MaterialBreakdown;
}

export type ViewId = "map" | "heatmap" | "hubs" | "co2" | "reports";

/** Heat Map view modes — replaces the three individual toggle booleans */
export type HeatMapViewMode = "overview" | "demand" | "hubs";

/** Material filter for heat map */
export type MaterialFilter = "all" | "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";
```

- [ ] **Step 2: Run build to catch any type errors**

```bash
npm run build
```

Expected: TypeScript will error on the missing `materialBreakdown` field in `DISTRICTS` constant. That is expected — fix in next task.

- [ ] **Step 3: Commit types**

```bash
git add src/app/types.ts
git commit -m "feat: extend District type with MaterialBreakdown, add HeatMapViewMode"
```

---

### Task 3: Extend Constants

**Files:**
- Modify: `src/app/constants.ts`

- [ ] **Step 1: Add `CO2_EQUIVALENTS` and `PANEL_WIDTH` constant after the existing imports block**

Add after the existing `export const NAV_ITEMS` definition:

```typescript
/** Layout constant — ALL panels use this width */
export const PANEL_WIDTH = 288;

/** CO₂ conversion factors for equivalents display */
export const CO2_EQUIVALENTS = {
  treeYear:            21.77,  // kg CO₂ absorbed by one tree per year
  carKmPetrol:          0.21,  // kg CO₂ per km (avg petrol car)
  flightAmmanDubai:   195,     // kg CO₂ per passenger one-way
  smartphoneCharge:     0.0085, // kg CO₂ per charge
} as const;
```

- [ ] **Step 2: Add `materialBreakdown` to every district in `DISTRICTS`**

Replace the entire `DISTRICTS` array with this updated version that includes `materialBreakdown` on every entry:

```typescript
export const DISTRICTS: District[] = [
  {
    id: "downtown", name: "Downtown (Al-Balad)",
    polygon: [[31.943,35.924],[31.943,35.946],[31.960,35.946],[31.960,35.924]],
    centroid: [31.952, 35.934], co2Potential: 1240, co2Achieved: 1018,
    topMaterial: "Cooking Oil", orderCount: 14,
    materialBreakdown: {
      cookingOil:  { potential: 680, achieved: 612 },
      plastic:     { potential: 280, achieved: 224 },
      paper:       { potential: 200, achieved: 156 },
      electronics: { potential:  80, achieved:  26 },
    },
  },
  {
    id: "shmeisani", name: "Shmeisani",
    polygon: [[31.970,35.870],[31.970,35.895],[31.988,35.895],[31.988,35.870]],
    centroid: [31.979, 35.882], co2Potential: 890, co2Achieved: 534,
    topMaterial: "Plastic Bottles", orderCount: 8,
    materialBreakdown: {
      cookingOil:  { potential: 180, achieved:  90 },
      plastic:     { potential: 420, achieved: 294 },
      paper:       { potential: 200, achieved: 110 },
      electronics: { potential:  90, achieved:  40 },
    },
  },
  {
    id: "sweifieh", name: "Sweifieh",
    polygon: [[31.935,35.858],[31.935,35.882],[31.952,35.882],[31.952,35.858]],
    centroid: [31.944, 35.870], co2Potential: 1050, co2Achieved: 630,
    topMaterial: "Cooking Oil", orderCount: 11,
    materialBreakdown: {
      cookingOil:  { potential: 600, achieved: 390 },
      plastic:     { potential: 240, achieved: 144 },
      paper:       { potential: 140, achieved:  70 },
      electronics: { potential:  70, achieved:  26 },
    },
  },
  {
    id: "abdoun", name: "Abdoun",
    polygon: [[31.930,35.872],[31.930,35.900],[31.947,35.900],[31.947,35.872]],
    centroid: [31.940, 35.885], co2Potential: 760, co2Achieved: 608,
    topMaterial: "Cooking Oil", orderCount: 9,
    materialBreakdown: {
      cookingOil:  { potential: 420, achieved: 378 },
      plastic:     { potential: 180, achieved: 126 },
      paper:       { potential: 120, achieved:  84 },
      electronics: { potential:  40, achieved:  20 },
    },
  },
  {
    id: "jubaiha", name: "Jubaiha",
    polygon: [[31.992,35.858],[31.992,35.882],[32.012,35.882],[32.012,35.858]],
    centroid: [32.001, 35.869], co2Potential: 580, co2Achieved: 116,
    topMaterial: "Electronics", orderCount: 4,
    materialBreakdown: {
      cookingOil:  { potential:  60, achieved:  10 },
      plastic:     { potential: 120, achieved:  24 },
      paper:       { potential: 100, achieved:  18 },
      electronics: { potential: 300, achieved:  64 },
    },
  },
  {
    id: "tabarbour", name: "Tabarbour",
    polygon: [[32.005,35.908],[32.005,35.938],[32.025,35.938],[32.025,35.908]],
    centroid: [32.015, 35.922], co2Potential: 670, co2Achieved: 469,
    topMaterial: "Plastic Bottles", orderCount: 6,
    materialBreakdown: {
      cookingOil:  { potential: 130, achieved:  91 },
      plastic:     { potential: 320, achieved: 256 },
      paper:       { potential: 160, achieved: 102 },
      electronics: { potential:  60, achieved:  20 },
    },
  },
  {
    id: "eighth_circle", name: "8th Circle Area",
    polygon: [[31.950,35.842],[31.950,35.865],[31.968,35.865],[31.968,35.842]],
    centroid: [31.959, 35.853], co2Potential: 940, co2Achieved: 282,
    topMaterial: "Paper & Cardboard", orderCount: 7,
    materialBreakdown: {
      cookingOil:  { potential: 200, achieved:  60 },
      plastic:     { potential: 220, achieved:  66 },
      paper:       { potential: 400, achieved: 120 },
      electronics: { potential: 120, achieved:  36 },
    },
  },
  {
    id: "university", name: "University District",
    polygon: [[31.998,35.866],[31.998,35.892],[32.018,35.892],[32.018,35.866]],
    centroid: [32.008, 35.879], co2Potential: 440, co2Achieved: 396,
    topMaterial: "Electronics", orderCount: 3,
    materialBreakdown: {
      cookingOil:  { potential:  60, achieved:  54 },
      plastic:     { potential:  80, achieved:  72 },
      paper:       { potential: 100, achieved:  90 },
      electronics: { potential: 200, achieved: 180 },
    },
  },
  {
    id: "tlaa_ali", name: "Tlaa Al-Ali",
    polygon: [[31.940,35.845],[31.940,35.870],[31.958,35.870],[31.958,35.845]],
    centroid: [31.950, 35.857], co2Potential: 520, co2Achieved: 260,
    topMaterial: "Plastic Bottles", orderCount: 5,
    materialBreakdown: {
      cookingOil:  { potential: 100, achieved:  50 },
      plastic:     { potential: 240, achieved: 120 },
      paper:       { potential: 120, achieved:  60 },
      electronics: { potential:  60, achieved:  30 },
    },
  },
  {
    id: "airport_road", name: "Airport Road Corridor",
    polygon: [[31.895,35.930],[31.895,35.965],[31.925,35.965],[31.925,35.930]],
    centroid: [31.912, 35.947], co2Potential: 380, co2Achieved: 76,
    topMaterial: "Cooking Oil", orderCount: 3,
    materialBreakdown: {
      cookingOil:  { potential: 200, achieved:  40 },
      plastic:     { potential:  80, achieved:  16 },
      paper:       { potential:  60, achieved:  12 },
      electronics: { potential:  40, achieved:   8 },
    },
  },
];
```

- [ ] **Step 3: Run build to verify types resolve**

```bash
npm run build
```

Expected: clean build, zero TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/constants.ts
git commit -m "feat: add materialBreakdown to all districts, CO2_EQUIVALENTS, PANEL_WIDTH"
```

---

### Task 4: Add Helper Functions

**Files:**
- Modify: `src/app/helpers.ts`

- [ ] **Step 1: Add three new exported functions at the end of `helpers.ts`**

```typescript
// ── CO₂ Equivalents ──────────────────────────────────────────────────────────

import { CO2_EQUIVALENTS } from "./constants";

export function co2Equivalents(kg: number) {
  return {
    trees:   +(kg / CO2_EQUIVALENTS.treeYear).toFixed(1),
    carKm:   Math.round(kg / CO2_EQUIVALENTS.carKmPetrol),
    flights: +(kg / CO2_EQUIVALENTS.flightAmmanDubai).toFixed(2),
    phones:  Math.round(kg / CO2_EQUIVALENTS.smartphoneCharge),
  };
}

// ── District Priority Score (higher = more urgent to collect) ─────────────────

export function districtPriorityScore(d: import("./types").District): number {
  const gapPct  = (d.co2Potential - d.co2Achieved) / d.co2Potential;
  const orderPt = Math.min(d.orderCount * 2, 20);
  const gapPt   = Math.round(gapPct * 50);
  return gapPt + orderPt;
}

// ── Hub Coverage (Haversine distance, km) ────────────────────────────────────

export function haversineKm(
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

/** Returns true if the district centroid is within `radiusKm` of any active hub */
export function isDistrictCovered(
  district: import("./types").District,
  hubs: import("./types").Hub[],
  radiusKm = 5
): boolean {
  return hubs
    .filter(h => h.active)
    .some(h => haversineKm(district.centroid[0], district.centroid[1], h.lat, h.lng) <= radiusKm);
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/helpers.ts
git commit -m "feat: add co2Equivalents, districtPriorityScore, isDistrictCovered helpers"
```

---

### Task 5: Fix Critical Anti-Patterns

**Files:**
- Modify: `src/app/components/HeatMapPanel.tsx` (emoji)
- Modify: `src/app/components/RiderPanel.tsx` (panel width, aria-labels)
- Modify: `src/app/components/HubsPanel.tsx` (panel width)

- [ ] **Step 1: Remove emoji from HeatMapPanel toggle label**

In `HeatMapPanel.tsx`, find and replace:

```tsx
// BEFORE
<ToggleSwitch label="🔥 Rider hotspots" checked={showRiderHotspots} onChange={setShowRiderHotspots} />

// AFTER
<ToggleSwitch label="Rider Hotspots" checked={showRiderHotspots} onChange={setShowRiderHotspots} />
```

- [ ] **Step 2: Fix panel widths — use `PANEL_WIDTH` constant**

In `RiderPanel.tsx`, at the top add:
```tsx
import { PANEL_WIDTH } from "../constants";
```

Find the outer div style and change:
```tsx
// BEFORE
<div className="flex flex-col h-full border-l" style={{ width: 284, ...

// AFTER
<div className="flex flex-col h-full border-l" style={{ width: PANEL_WIDTH, ...
```

In `HubsPanel.tsx`, add the same import and change:
```tsx
// BEFORE
<div className="flex flex-col h-full border-l" style={{ width: 300, ...

// AFTER (import PANEL_WIDTH first)
<div className="flex flex-col h-full border-l" style={{ width: PANEL_WIDTH, ...
```

In `HeatMapPanel.tsx`:
```tsx
// BEFORE
<div className="flex flex-col h-full border-l" style={{ width: 300, ...

// AFTER
<div className="flex flex-col h-full border-l" style={{ width: PANEL_WIDTH, ...
```

- [ ] **Step 3: Add aria-labels to unlabeled icon buttons in RiderPanel.tsx**

Find the close button:
```tsx
// BEFORE
<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
  <X size={14} color="#94A3B8" />
</button>

// AFTER
<button
  aria-label="Close rider detail"
  onClick={onClose}
  className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
>
  <X size={14} color="#94A3B8" />
</button>
```

Find the chevron expand buttons in HubsPanel.tsx:
```tsx
// BEFORE
<button onClick={() => setExpanded(isExp ? null : hub.id)} className="flex-shrink-0 mt-0.5 p-0.5">
  {isExp ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
</button>

// AFTER
<button
  aria-label={isExp ? "Collapse hub details" : "Expand hub details"}
  onClick={() => setExpanded(isExp ? null : hub.id)}
  className="flex-shrink-0 mt-0.5 p-0.5"
>
  {isExp ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
</button>
```

Find the hub active toggle checkbox in HubsPanel.tsx:
```tsx
// BEFORE
<button onClick={() => toggleActive(hub.id)} className="mt-0.5 flex-shrink-0 transition-colors">

// AFTER
<button
  aria-label={`${hub.active ? "Deactivate" : "Activate"} ${hub.name}`}
  onClick={() => toggleActive(hub.id)}
  className="mt-0.5 flex-shrink-0 transition-colors"
>
```

- [ ] **Step 4: Build and verify layout didn't shift**

```bash
npm run dev
```

Open browser. Switch between Live Map, Heat Map, and Hubs views. All three panels should now be exactly the same width — no visual jump when switching.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/HeatMapPanel.tsx src/app/components/RiderPanel.tsx src/app/components/HubsPanel.tsx
git commit -m "fix: unify panel widths to PANEL_WIDTH, remove emoji, add aria-labels"
```

---

## Phase 2 — Rider Panel Redesign

### Task 6: FleetSummaryHeader (Zone 1)

**Files:**
- Create: `src/app/components/rider/FleetSummaryHeader.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Rider } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { computeTotals } from "../../helpers";

interface FleetSummaryHeaderProps {
  riders: Rider[];
  time: Date;
}

export function FleetSummaryHeader({ riders, time }: FleetSummaryHeaderProps) {
  const { co2, earnings } = computeTotals(riders);

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
      {/* Row 1: label + clock */}
      <div className="flex items-center justify-between mb-2">
        <span
          style={{
            fontSize: 10, fontWeight: 700,
            color: "var(--color-text-tertiary)",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}
        >
          Fleet Status
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {timeStr}
        </span>
      </div>

      {/* Row 2: status dots */}
      <div className="flex items-center gap-3 mb-2">
        {(["delivering", "picking_up", "idle"] as const).map(status => {
          const cfg = STATUS_CONFIG[status];
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

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: clean build (component not yet used anywhere).

- [ ] **Step 3: Commit**

```bash
git add src/app/components/rider/FleetSummaryHeader.tsx
git commit -m "feat: add FleetSummaryHeader component (rider panel Zone 1)"
```

---

### Task 7: RiderRow with Earnings Bar (Zone 2)

**Files:**
- Create: `src/app/components/rider/RiderRow.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { ChevronRight } from "lucide-react";
import { Rider } from "../../types";
import { STATUS_CONFIG, MOTO_PATH, VAN_PATH } from "../../constants";

interface RiderRowProps {
  rider: Rider;
  isSelected: boolean;
  maxEarnings: number;   // highest earnings among all riders today — for relative bar
  onSelect: (id: number) => void;
}

export function RiderRow({ rider, isSelected, maxEarnings, onSelect }: RiderRowProps) {
  const sc = STATUS_CONFIG[rider.status];
  const totalEarnings = rider.orders.reduce((s, o) => s + o.earnings, 0);
  const barPct = maxEarnings > 0 ? Math.round((totalEarnings / maxEarnings) * 100) : 0;

  const barColor =
    barPct >= 70 ? "var(--color-brand-600)" :
    barPct >= 30 ? "var(--color-amber-600)" :
    "var(--color-text-disabled)";

  const isActive = rider.status !== "idle";

  return (
    <button
      onClick={() => onSelect(rider.id)}
      aria-label={`Select rider ${rider.name}`}
      aria-pressed={isSelected}
      className="w-full text-left px-4 py-3 border-b transition-colors"
      style={{
        borderColor: "var(--color-border)",
        background: isSelected ? "var(--color-surface-card)" : "transparent",
        boxShadow: isSelected ? "inset 3px 0 0 var(--color-brand-600)" : "none",
        opacity: isActive ? 1 : 0.6,
        cursor: "pointer",
      }}
    >
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

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span
              className="truncate"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {rider.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--color-text-tertiary)",
                flexShrink: 0,
              }}
            >
              {rider.vehicle}
            </span>
          </div>

          {/* Status + order count */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <span
                style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: sc.dot, flexShrink: 0 }}
              />
              <span style={{ fontSize: 11, color: sc.color }}>{sc.label}</span>
            </div>
            {rider.orders.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                · {rider.orders.length} order{rider.orders.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Earnings bar */}
          {isActive && (
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
          )}

          {!isActive && (
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

- [ ] **Step 3: Commit**

```bash
git add src/app/components/rider/RiderRow.tsx
git commit -m "feat: add RiderRow with relative earnings bar"
```

---

### Task 8: ProgressTrail Component

**Files:**
- Create: `src/app/components/rider/ProgressTrail.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Order } from "../../types";

const STEPS: { key: Order["status"]; label: string }[] = [
  { key: "pending",   label: "Pending"   },
  { key: "accepted",  label: "Accepted"  },
  { key: "inTransit", label: "In Transit"},
  { key: "completed", label: "Completed" },
];

const STATUS_ORDER: Record<Order["status"], number> = {
  pending: 0, accepted: 1, inTransit: 2, completed: 3,
};

interface ProgressTrailProps {
  status: Order["status"];
  accentColor: string;
}

export function ProgressTrail({ status, accentColor }: ProgressTrailProps) {
  const currentIndex = STATUS_ORDER[status];

  return (
    <div
      aria-label={`Order status: ${STEPS[currentIndex].label} (step ${currentIndex + 1} of ${STEPS.length})`}
      style={{ display: "flex", alignItems: "center", gap: 0, paddingTop: 8, paddingBottom: 4 }}
    >
      {STEPS.map((step, i) => {
        const reached  = i <= currentIndex;
        const isActive = i === currentIndex;
        const isLast   = i === STEPS.length - 1;

        return (
          <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              {/* Node */}
              <div
                className={isActive ? "animate-trail-pulse" : undefined}
                style={{
                  width: 10, height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: reached ? accentColor : "var(--color-border)",
                  border: `2px solid ${reached ? accentColor : "var(--color-border)"}`,
                  transition: "background 0.2s",
                }}
              />
              {/* Line to next node */}
              {!isLast && (
                <div
                  style={{
                    flex: 1, height: 2,
                    background: i < currentIndex ? accentColor : "var(--color-border)",
                    transition: "background 0.2s",
                  }}
                />
              )}
            </div>
            {/* Label */}
            <span
              style={{
                marginTop: 4,
                fontSize: 9,
                color: reached ? accentColor : "var(--color-text-disabled)",
                fontWeight: isActive ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
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
git add src/app/components/rider/ProgressTrail.tsx
git commit -m "feat: add ProgressTrail component for order status"
```

---

### Task 9: OrderCard (Zone 3)

**Files:**
- Create: `src/app/components/rider/OrderCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { MapPin, Leaf } from "lucide-react";
import { Order } from "../../types";
import { MATERIAL_CONFIG, ORDER_STATUS } from "../../constants";
import { ProgressTrail } from "./ProgressTrail";

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const mc = MATERIAL_CONFIG[order.material];
  const os = ORDER_STATUS[order.status];

  return (
    <div
      style={{
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3)",
        border: `1px solid ${mc.color}25`,
        background: mc.bg,
      }}
    >
      {/* Header: order ID + status badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, color: mc.color }}>
          {order.id}
        </span>
        <span
          style={{
            fontSize: 10, fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            color: os.color,
            background: os.bg,
          }}
        >
          {os.label}
        </span>
      </div>

      {/* Material + quantity */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <mc.Icon size={13} color={mc.color} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", flex: 1 }}>
          {order.material}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: mc.color, flexShrink: 0 }}>
          {order.quantity} {order.unit}
        </span>
      </div>

      {/* Address */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
        <MapPin size={10} color="var(--color-text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{order.address}</span>
      </div>

      {/* Progress trail */}
      <ProgressTrail status={order.status} accentColor={mc.color} />

      {/* Footer: CO₂ + earnings */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 8, paddingTop: 8,
          borderTop: `1px solid ${mc.color}20`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Leaf size={10} color="var(--color-brand-600)" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-brand-600)", fontWeight: 500 }}>
            CO₂ {order.co2Saved.toFixed(1)} kg
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-amber-600)", fontWeight: 700 }}>
          {order.earnings.toFixed(2)} JD
        </span>
      </div>
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
git add src/app/components/rider/OrderCard.tsx
git commit -m "feat: add OrderCard with ProgressTrail integration"
```

---

### Task 10: TodayStats (Zone 3 "Today" tab)

**Files:**
- Create: `src/app/components/rider/TodayStats.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { Wind, Banknote, Clock, Radio } from "lucide-react";
import { Rider } from "../../types";
import { co2Equivalents } from "../../helpers";

interface TodayStatsProps {
  rider: Rider;
  onlineTime: Date; // when this rider came online — for display
}

export function TodayStats({ rider, onlineTime }: TodayStatsProps) {
  const completedOrders  = rider.orders.filter(o => o.status === "completed");
  const activeOrders     = rider.orders.filter(o => o.status !== "completed");
  const totalEarnings    = rider.orders.reduce((s, o) => s + o.earnings, 0);
  const totalCo2         = rider.orders.reduce((s, o) => s + o.co2Saved, 0);
  const equiv            = co2Equivalents(totalCo2);

  const onlineSince = onlineTime.toLocaleTimeString("en-JO", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const lastPingTime = new Date().toLocaleTimeString("en-JO", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  const StatRow = ({ icon: Icon, label, value, color = "var(--color-text-primary)" }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value: string;
    color?: string;
  }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
      <Icon size={14} color={color} />
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", flex: 1 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div
        style={{
          fontSize: 10, fontWeight: 700,
          color: "var(--color-text-tertiary)",
          letterSpacing: "0.1em", textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Shift Stats — Today
      </div>

      <StatRow icon={Wind}    label="CO₂ Saved"      value={`${totalCo2.toFixed(1)} kg`}          color="var(--color-brand-600)" />
      <StatRow icon={Banknote} label="Earnings"       value={`${totalEarnings.toFixed(2)} JD`}      color="var(--color-amber-600)" />
      <StatRow icon={Radio}   label="Orders"
        value={`${completedOrders.length} done · ${activeOrders.length} active`}
      />
      <StatRow icon={Clock}   label="Online since"   value={onlineSince} />

      {/* Last ping */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
        <span className="animate-pulse-soft" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--color-brand-600)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", flex: 1 }}>Last ping</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)" }}>{lastPingTime}</span>
      </div>

      {/* CO₂ equivalents */}
      {totalCo2 > 0 && (
        <div
          style={{
            marginTop: 12, padding: "var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-50)",
            border: "1px solid var(--color-brand-100)",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-brand-600)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            CO₂ Equivalents
          </div>
          {[
            { label: "Trees planted (1yr)",   value: `≈ ${equiv.trees}` },
            { label: "Car-km avoided",        value: `≈ ${equiv.carKm.toLocaleString()} km` },
            { label: "Smartphone charges",    value: `≈ ${equiv.phones.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "var(--color-brand-500)" }}>{label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--color-brand-600)" }}>{value}</span>
            </div>
          ))}
        </div>
      )}
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
git add src/app/components/rider/TodayStats.tsx
git commit -m "feat: add TodayStats with CO2 equivalents (Zone 3 Today tab)"
```

---

### Task 11: RiderDetailDrawer (Zone 3 container)

**Files:**
- Create: `src/app/components/rider/RiderDetailDrawer.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { X, AlertCircle, Wind } from "lucide-react";
import { Rider } from "../../types";
import { OrderCard } from "./OrderCard";
import { TodayStats } from "./TodayStats";

interface RiderDetailDrawerProps {
  rider: Rider;
  onClose: () => void;
}

type Tab = "orders" | "today";

export function RiderDetailDrawer({ rider, onClose }: RiderDetailDrawerProps) {
  // Tab state lives here — resets when rider changes
  const [tab, setTab] = React.useState<Tab>("orders");
  const totalCo2 = rider.orders.reduce((s, o) => s + o.co2Saved, 0);

  return (
    <div
      style={{
        background: "var(--color-surface-card)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        maxHeight: 340,
        minHeight: 200,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "12px 16px 8px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {rider.name}
          </div>
          <div style={{ fontFamily: "'Cairo', sans-serif", fontSize: 12, color: "var(--color-brand-600)", direction: "rtl" }}>
            {rider.nameAr}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {rider.phone} · {rider.vehicle}
          </div>
        </div>
        <button
          aria-label="Close rider detail"
          onClick={onClose}
          style={{
            width: 28, height: 28, border: "none", cursor: "pointer",
            background: "transparent", borderRadius: "var(--radius-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <X size={14} color="var(--color-text-tertiary)" />
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        {(["orders", "today"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "8px 0",
              fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: "transparent",
              color: tab === t ? "var(--color-brand-600)" : "var(--color-text-tertiary)",
              borderBottom: tab === t ? "2px solid var(--color-brand-600)" : "2px solid transparent",
              textTransform: "capitalize",
            }}
          >
            {t === "orders"
              ? `Orders (${rider.orders.length})`
              : "Today"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: "auto" }}>
        {tab === "orders" && (
          <div style={{ padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {rider.orders.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <AlertCircle size={22} color="var(--color-text-disabled)" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>No active orders</p>
              </div>
            ) : (
              rider.orders.map(order => <OrderCard key={order.id} order={order} />)
            )}

            {/* Total CO₂ summary */}
            {rider.orders.length > 0 && totalCo2 > 0 && (
              <div
                style={{
                  borderRadius: "var(--radius-lg)",
                  padding: "10px 12px",
                  background: "var(--color-brand-100)",
                  border: "1px solid var(--color-brand-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Wind size={12} color="var(--color-brand-600)" />
                  <span style={{ fontSize: 11, color: "var(--color-brand-600)" }}>Total CO₂ saved</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "var(--color-brand-600)" }}>
                  {totalCo2.toFixed(1)} kg
                </span>
              </div>
            )}
          </div>
        )}

        {tab === "today" && (
          <TodayStats rider={rider} onlineTime={new Date(Date.now() - 5 * 60 * 60 * 1000)} />
        )}
      </div>
    </div>
  );
}

// React must be in scope for JSX
import React from "react";
```

- [ ] **Step 2: Build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/rider/RiderDetailDrawer.tsx
git commit -m "feat: add RiderDetailDrawer with Orders/Today tabs (Zone 3)"
```

---

### Task 12: Assemble New RiderPanel

**Files:**
- Modify: `src/app/components/RiderPanel.tsx`

- [ ] **Step 1: Replace the full file content**

```tsx
import { Rider } from "../types";
import { PANEL_WIDTH } from "../constants";
import { FleetSummaryHeader } from "./rider/FleetSummaryHeader";
import { RiderRow }           from "./rider/RiderRow";
import { RiderDetailDrawer }  from "./rider/RiderDetailDrawer";

interface RiderPanelProps {
  riders: Rider[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  time: Date;
}

export function RiderPanel({ riders, selectedId, onSelect, onClose, time }: RiderPanelProps) {
  const selected = riders.find(r => r.id === selectedId) ?? null;

  const maxEarnings = Math.max(
    ...riders.map(r => r.orders.reduce((s, o) => s + o.earnings, 0)),
    0,
  );

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

      {/* Zone 2 — Rider List (scrollable, shrinks when drawer is open) */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {riders.map(rider => (
          <RiderRow
            key={rider.id}
            rider={rider}
            isSelected={rider.id === selectedId}
            maxEarnings={maxEarnings}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Zone 3 — Detail Drawer (shown when a rider is selected) */}
      {selected && (
        <RiderDetailDrawer
          rider={selected}
          onClose={onClose}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `App.tsx` to pass `time` prop to RiderPanel**

In `App.tsx`, find the `<RiderPanel>` usage and add the `time` prop:

```tsx
// BEFORE
<RiderPanel riders={RIDERS} selectedId={selectedRider} onSelect={handleRiderSelect} onClose={handleRiderClose} />

// AFTER
<RiderPanel riders={RIDERS} selectedId={selectedRider} onSelect={handleRiderSelect} onClose={handleRiderClose} time={time} />
```

- [ ] **Step 3: Build and visually verify**

```bash
npm run build && npm run dev
```

Open the Live Map view. The right panel should now show:
- Zone 1: fleet stats header with CO₂ + earnings
- Zone 2: rider list with relative earnings bars
- Zone 3: drawer slides up when a rider is clicked, showing Orders and Today tabs with progress trails

- [ ] **Step 4: Commit**

```bash
git add src/app/components/RiderPanel.tsx src/app/App.tsx
git commit -m "feat: assemble new RiderPanel with 3-zone layout"
```

---

## Phase 3 — Heat Map Intelligence

### Task 13: ViewMode Selector + App State

**Files:**
- Modify: `src/app/App.tsx`
- Create: `src/app/components/heatmap/ViewModeSelector.tsx`

- [ ] **Step 1: Add `heatMapViewMode` and `materialFilter` to App state**

In `App.tsx`, add new imports at top:
```tsx
import type { HeatMapViewMode, MaterialFilter } from "./types";
```

Add new state inside the `App` component after existing state:
```tsx
const [heatMapViewMode, setHeatMapViewMode] = useState<HeatMapViewMode>("overview");
const [materialFilter, setMaterialFilter]   = useState<MaterialFilter>("all");
```

Pass these to `HeatMapLayer` and `HeatMapPanel` (update their props — see Task 14/15):
```tsx
// In the heatmap section:
{activeView === "heatmap" && (
  <>
    <HeatMapLayer
      districts={DISTRICTS}
      selectedId={selectedDistrict}
      onSelect={handleDistrictSelect}
      viewMode={heatMapViewMode}
      materialFilter={materialFilter}
      hubs={hubs}
      showAmmanBoundary={heatMapViewMode === "overview" || heatMapViewMode === "demand"}
      showRiderHotspots={heatMapViewMode === "demand"}
      showDensityHeat={heatMapViewMode === "demand"}
      showHubCoverage={heatMapViewMode === "hubs"}
    />
    {/* ...legend overlay stays unchanged... */}
  </>
)}
{activeView === "heatmap" && (
  <HeatMapPanel
    districts={DISTRICTS}
    selectedId={selectedDistrict}
    onSelect={handleDistrictSelect}
    viewMode={heatMapViewMode}
    setViewMode={setHeatMapViewMode}
    materialFilter={materialFilter}
    setMaterialFilter={setMaterialFilter}
    showAmmanBoundary={heatMapViewMode !== "hubs"}
    setShowAmmanBoundary={() => {}}
    showRiderHotspots={heatMapViewMode === "demand"}
    setShowRiderHotspots={() => {}}
    showDensityHeat={heatMapViewMode === "demand"}
    setShowDensityHeat={() => {}}
  />
)}
```

- [ ] **Step 2: Create `ViewModeSelector.tsx`**

```tsx
import { Map, Activity, Warehouse } from "lucide-react";
import type { HeatMapViewMode } from "../../types";

const MODES: { id: HeatMapViewMode; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
  { id: "overview", label: "Overview",  Icon: Map       },
  { id: "demand",   label: "Demand",    Icon: Activity  },
  { id: "hubs",     label: "Hubs",      Icon: Warehouse },
];

interface ViewModeSelectorProps {
  value: HeatMapViewMode;
  onChange: (mode: HeatMapViewMode) => void;
}

export function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "8px 16px",
        background: "var(--color-surface-card)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {MODES.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={active}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "6px 0",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              background: active ? "var(--color-brand-600)" : "transparent",
              color: active ? "white" : "var(--color-text-secondary)",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

import React from "react";
```

- [ ] **Step 3: Build**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/App.tsx src/app/components/heatmap/ViewModeSelector.tsx
git commit -m "feat: add HeatMapViewMode state and ViewModeSelector component"
```

---

### Task 14: Material Filter Bar + Map Layer

**Files:**
- Create: `src/app/components/heatmap/MaterialFilterBar.tsx`
- Modify: `src/app/components/HeatMapLayer.tsx`
- Modify: `src/app/helpers.ts`

- [ ] **Step 1: Create `MaterialFilterBar.tsx`**

```tsx
import type { MaterialFilter } from "../../types";
import { MATERIAL_CONFIG } from "../../constants";

interface MaterialFilterBarProps {
  value: MaterialFilter;
  onChange: (f: MaterialFilter) => void;
}

const FILTERS: MaterialFilter[] = [
  "all",
  "Cooking Oil",
  "Plastic Bottles",
  "Paper & Cardboard",
  "Electronics",
];

export function MaterialFilterBar({ value, onChange }: MaterialFilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "8px 16px",
        overflowX: "auto",
        background: "var(--color-surface-card)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {FILTERS.map(f => {
        const active = value === f;
        const mc = f !== "all" ? MATERIAL_CONFIG[f as keyof typeof MATERIAL_CONFIG] : null;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            aria-pressed={active}
            style={{
              padding: "3px 10px",
              borderRadius: "var(--radius-full)",
              border: "none",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: active
                ? (mc ? mc.bg    : "var(--color-brand-100)")
                : "var(--color-surface)",
              color: active
                ? (mc ? mc.color : "var(--color-brand-600)")
                : "var(--color-text-tertiary)",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {f === "all" ? "All Materials" : f}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Add `districtFillColorForMaterial` helper to `helpers.ts`**

```typescript
import type { MaterialFilter } from "./types";

/** Returns fill color for a district when filtered by a specific material */
export function districtFillColorForMaterial(
  d: import("./types").District,
  filter: MaterialFilter
): string {
  if (filter === "all") return districtFillColor(d);

  const keyMap: Record<string, keyof import("./types").MaterialBreakdown> = {
    "Cooking Oil":       "cookingOil",
    "Plastic Bottles":   "plastic",
    "Paper & Cardboard": "paper",
    "Electronics":       "electronics",
  };
  const key = keyMap[filter];
  if (!key) return districtFillColor(d);

  const mat = d.materialBreakdown[key];
  if (!mat || mat.potential === 0) return "#E2E8F0"; // no data — gray
  const gapPct = (mat.potential - mat.achieved) / mat.potential;
  if (gapPct >= 0.7) return "#ef4444";
  if (gapPct >= 0.5) return "#f59e0b";
  if (gapPct >= 0.3) return "#84cc16";
  if (gapPct >= 0.1) return "#22c55e";
  return "#1E5C35";
}
```

- [ ] **Step 3: Update `HeatMapLayer` to accept `materialFilter`, `viewMode`, `hubs`, `showHubCoverage`**

Add to the `HeatMapLayerProps` interface:
```typescript
viewMode: HeatMapViewMode;
materialFilter: MaterialFilter;
hubs: Hub[];
showHubCoverage: boolean;
```

In the `useEffect` for districts choropleth, change the `districtFillColor` call to:
```typescript
import { districtFillColorForMaterial } from "../helpers";
// ...
const fillColor = districtFillColorForMaterial(d, materialFilter);
```

Add a new `useEffect` for hub coverage circles (after the hotspots effect):
```typescript
const coverageLayersRef = useRef<L.Layer[]>([]);

useEffect(() => {
  const map = mapRef.current;
  if (!map || !mapInitialized) return;

  coverageLayersRef.current.forEach(l => l.remove());
  coverageLayersRef.current = [];

  if (!showHubCoverage) return;

  hubs.filter(h => h.active).forEach(h => {
    const circle = L.circle([h.lat, h.lng], {
      radius: 5000, // 5km in meters
      color: "#1E5C35",
      fillColor: "#1E5C35",
      fillOpacity: 0.08,
      weight: 2,
      opacity: 0.5,
      dashArray: "6, 4",
    });
    circle.bindTooltip(
      `<b>${h.name}</b><br>5km coverage area`,
      { direction: "top", className: "rider-tip" }
    );
    circle.addTo(map);
    coverageLayersRef.current.push(circle);
  });
}, [mapInitialized, hubs, showHubCoverage]);
```

Add `materialFilter` and `showHubCoverage` to the dependency arrays of the existing district effects.

- [ ] **Step 4: Build**

```bash
npm run build
```

- [ ] **Step 5: Verify**

```bash
npm run dev
```

Switch to Heat Map → click "Hubs" view mode → hub coverage circles should appear on the map. Click "Demand" → circles disappear, hotspots appear. Click material filter chips → the district colors update.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/heatmap/MaterialFilterBar.tsx src/app/components/HeatMapLayer.tsx src/app/helpers.ts
git commit -m "feat: material filter layer + hub coverage circles on heat map"
```

---

### Task 15: District Report Card Panel

**Files:**
- Create: `src/app/components/heatmap/DistrictReportCard.tsx`
- Modify: `src/app/components/HeatMapPanel.tsx`

- [ ] **Step 1: Create `DistrictReportCard.tsx`**

```tsx
import { Wind, Package, TrendingUp, Share2, ChevronLeft } from "lucide-react";
import { District } from "../../types";
import { MATERIAL_CONFIG } from "../../constants";
import { co2Equivalents } from "../../helpers";

interface DistrictReportCardProps {
  district: District;
  onBack: () => void;
}

export function DistrictReportCard({ district, onBack }: DistrictReportCardProps) {
  const gap        = district.co2Potential - district.co2Achieved;
  const achievedPct = Math.round((district.co2Achieved / district.co2Potential) * 100);
  const gapPct      = 100 - achievedPct;
  const equiv       = co2Equivalents(district.co2Achieved);

  const MATERIAL_KEYS = [
    { key: "cookingOil" as const,  label: "Cooking Oil",       color: "var(--color-oil)",     bg: "var(--color-oil-bg)"     },
    { key: "plastic"    as const,  label: "Plastic Bottles",   color: "var(--color-plastic)", bg: "var(--color-plastic-bg)" },
    { key: "paper"      as const,  label: "Paper & Cardboard", color: "var(--color-paper)",   bg: "var(--color-paper-bg)"   },
    { key: "electronics"as const,  label: "Electronics",       color: "var(--color-ewaste)",  bg: "var(--color-ewaste-bg)"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back to district list"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6,
            padding: 0,
          }}
        >
          <ChevronLeft size={12} />
          All Districts
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
          {district.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
          {district.orderCount} active orders
        </div>
      </div>

      {/* CO₂ progress */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          CO₂ Savings
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "var(--color-brand-600)" }}>
              {district.co2Achieved.toLocaleString()}
              <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", marginLeft: 3 }}>kg</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>achieved</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {gap.toLocaleString()}
              <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 3 }}>kg</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{gapPct}% unrealized</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${achievedPct}%`, borderRadius: "var(--radius-full)", background: "var(--color-brand-600)" }} />
        </div>
      </div>

      {/* Material breakdown */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          By Material
        </div>
        {MATERIAL_KEYS.map(({ key, label, color, bg }) => {
          const mat = district.materialBreakdown[key];
          const pct = mat.potential > 0 ? Math.round((mat.achieved / mat.potential) * 100) : 0;
          return (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{label}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color }}>
                    {mat.achieved} kg
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-disabled)" }}>
                    / {mat.potential}
                  </span>
                </div>
              </div>
              <div style={{ height: 5, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: "var(--radius-full)", background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* CO₂ equivalents */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Impact Equivalents
        </div>
        {[
          { label: "Trees planted (1yr)", value: `≈ ${equiv.trees}` },
          { label: "Car-km avoided",     value: `≈ ${equiv.carKm.toLocaleString()} km` },
          { label: "Flights saved",      value: `≈ ${equiv.flights}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--color-brand-600)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* Share button (Phase 2 — disabled placeholder) */}
      <div style={{ padding: "12px 16px" }}>
        <button
          disabled
          title="Share feature coming in Phase 2"
          style={{
            width: "100%", padding: "8px 0",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "transparent", cursor: "not-allowed",
            fontSize: 12, fontWeight: 600, color: "var(--color-text-disabled)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Share2 size={12} />
          Share Report (Phase 2)
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `HeatMapPanel.tsx` to use new components**

Add imports at the top:
```tsx
import { ViewModeSelector }   from "./heatmap/ViewModeSelector";
import { MaterialFilterBar }  from "./heatmap/MaterialFilterBar";
import { DistrictReportCard } from "./heatmap/DistrictReportCard";
import type { HeatMapViewMode, MaterialFilter } from "../types";
import { districtPriorityScore } from "../helpers";
```

Update `HeatMapPanelProps` interface to add:
```tsx
viewMode: HeatMapViewMode;
setViewMode: (m: HeatMapViewMode) => void;
materialFilter: MaterialFilter;
setMaterialFilter: (f: MaterialFilter) => void;
```

Replace the entire return JSX with:
```tsx
return (
  <div
    className="flex flex-col h-full border-l"
    style={{ width: PANEL_WIDTH, flexShrink: 0, borderColor: "var(--color-border)", background: "var(--color-surface)" }}
  >
    {/* View mode selector (replaces 3 toggles) */}
    <ViewModeSelector value={viewMode} onChange={setViewMode} />

    {/* Material filter bar */}
    <MaterialFilterBar value={materialFilter} onChange={setMaterialFilter} />

    {/* District report card OR district list */}
    {selectedId ? (
      (() => {
        const district = districts.find(d => d.id === selectedId);
        return district
          ? <DistrictReportCard district={district} onBack={() => onSelect(selectedId)} />
          : null;
      })()
    ) : (
      <>
        {/* Priority-sorted district list */}
        <div style={{ padding: "8px 16px 4px", background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-border)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Districts — Priority
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[...districts]
            .sort((a, b) => districtPriorityScore(b) - districtPriorityScore(a))
            .map((d, i) => {
              const gap = d.co2Potential - d.co2Achieved;
              const gapPct = Math.round((gap / d.co2Potential) * 100);
              const achievedPct = 100 - gapPct;
              const isHighPriority = gapPct >= 70;
              return (
                <button
                  key={d.id}
                  onClick={() => onSelect(d.id)}
                  className="w-full text-left px-4 py-3 border-b transition-colors"
                  style={{
                    borderColor: "var(--color-border)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-disabled)", width: 14 }}>#{i + 1}</span>
                    {isHighPriority && (
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0, display: "inline-block" }} className="animate-pulse-soft" />
                    )}
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", flex: 1 }}>{d.name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: gapPct >= 70 ? "#ef4444" : "var(--color-text-secondary)" }}>
                      {gapPct}% gap
                    </span>
                  </div>
                  <div style={{ marginLeft: 22, height: 5, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", width: `${achievedPct}%`, borderRadius: "var(--radius-full)", background: "var(--color-brand-600)" }} />
                  </div>
                  <div style={{ marginLeft: 22, display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{d.orderCount} orders</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-brand-600)", fontWeight: 600 }}>
                      {d.co2Potential.toLocaleString()} kg potential
                    </span>
                  </div>
                </button>
              );
            })}
        </div>
      </>
    )}
  </div>
);
```

Add `PANEL_WIDTH` import at top of file:
```tsx
import { PANEL_WIDTH, MATERIAL_CONFIG } from "../constants";
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run dev
```

Open Heat Map. Verify:
1. ViewMode chips work — each mode shows different map layers
2. Material filter chips recolor the map districts
3. Clicking a district replaces the list with a Report Card showing per-material bars and CO₂ equivalents
4. "Back" returns to the district list

- [ ] **Step 4: Commit**

```bash
git add src/app/components/heatmap/ src/app/components/HeatMapPanel.tsx
git commit -m "feat: district report card, priority queue, ViewMode selector, material filter"
```

---

## Phase 4 — Integration

### Task 16: Cross-panel Idle Rider in Heat Map (Smart Zone Assignment)

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/app/components/heatmap/DistrictReportCard.tsx`

- [ ] **Step 1: Lift idle rider list into App state and pass to DistrictReportCard**

In `App.tsx`, pass idle riders to HeatMapPanel:

```tsx
// In the heatmap section, update HeatMapPanel usage:
<HeatMapPanel
  // ...existing props...
  idleRiders={RIDERS.filter(r => r.status === "idle")}
/>
```

Update `HeatMapPanelProps` to add:
```tsx
idleRiders: Rider[];
```

Pass it through to `DistrictReportCard`:
```tsx
<DistrictReportCard district={district} onBack={() => onSelect(selectedId)} idleRiders={idleRiders} />
```

- [ ] **Step 2: Add zone assignment section to `DistrictReportCard.tsx`**

Update the props interface:
```tsx
interface DistrictReportCardProps {
  district: District;
  onBack: () => void;
  idleRiders: Rider[];
}
```

Add this section between the CO₂ progress block and the material breakdown block:

```tsx
{/* Zone assignment — only show if there are idle riders */}
{idleRiders.length > 0 && (
  <div
    style={{
      padding: "12px 16px",
      background: "var(--color-brand-50)",
      borderBottom: "1px solid var(--color-brand-100)",
    }}
  >
    <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-brand-600)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
      Assign a Rider
    </div>
    {idleRiders.slice(0, 2).map(rider => (
      <div
        key={rider.id}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 0",
          borderBottom: "1px solid var(--color-brand-100)",
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{rider.name}</div>
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{rider.vehicle} · Idle</div>
        </div>
        <button
          aria-label={`Assign ${rider.name} to ${district.name}`}
          onClick={() => {
            // Phase 2: dispatch assignment action
            // For now: show a browser toast as confirmation
            alert(`${rider.name} assigned to ${district.name} (Phase 2 will wire this to real dispatch)`);
          }}
          style={{
            padding: "5px 12px",
            borderRadius: "var(--radius-sm)",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
            background: "var(--color-brand-600)",
            color: "white",
          }}
        >
          Assign →
        </button>
      </div>
    ))}
    {idleRiders.length > 2 && (
      <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 4 }}>
        +{idleRiders.length - 2} more idle riders available
      </div>
    )}
  </div>
)}
```

- [ ] **Step 3: Final build**

```bash
npm run build
```

- [ ] **Step 4: Full visual verification checklist**

```bash
npm run dev
```

Open each view and verify:

**Live Map:**
- [ ] All three panels (sidebar, map, rider panel) same width ✓
- [ ] Rider panel Zone 1 shows CO₂ + earnings totals + status counts ✓
- [ ] Rider rows have relative earnings bars ✓
- [ ] Clicking a rider shows Zone 3 drawer with Orders + Today tabs ✓
- [ ] Order cards show ProgressTrail ✓
- [ ] Today tab shows CO₂ equivalents ✓
- [ ] Close button has aria-label ✓

**Heat Map:**
- [ ] ViewMode selector shows Overview / Demand / Hubs ✓
- [ ] Material filter chips recolor the districts ✓
- [ ] Hubs view mode shows 5km coverage circles ✓
- [ ] Clicking a district shows Report Card (not list item highlight) ✓
- [ ] Report Card shows material breakdown bars ✓
- [ ] Report Card shows CO₂ equivalents ✓
- [ ] Idle rider assignment section appears in district report card ✓
- [ ] Back button returns to district list ✓

**Hubs:**
- [ ] Panel is exactly same width as Rider + HeatMap panels ✓
- [ ] Hub toggles have aria-labels ✓
- [ ] No emoji anywhere ✓

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: zone assignment in district report card — Phase 4 complete"
```

---

## What this plan does NOT include (Phase 2 features)

These are intentionally excluded to keep this plan independently shippable. They require a backend:

- Real-time rider location updates (WebSocket)
- Actual order assignment dispatch (API call)
- Shareable district report link (URL token generation)
- Historical CO₂ trend chart (data store)
- Real business client pins (client database)
- Rider performance history chart
- cmdk command palette (⌘K search)
- Notification/alert feed
- Dark mode

Each of these can be a standalone plan once Phase 4 above is merged.

---

## Dependency order (critical — do not skip phases)

```
Task 1 (CSS tokens)
  └─▶ Task 2 (types) — uses types for tokens
       └─▶ Task 3 (constants) — adds materialBreakdown using new types
            └─▶ Task 4 (helpers) — uses MaterialBreakdown from types
                 └─▶ Task 5 (anti-pattern fixes) — uses PANEL_WIDTH from constants
                      ├─▶ Tasks 6–12 (Rider Panel) — all use design tokens + types
                      └─▶ Tasks 13–15 (Heat Map) — all use materialBreakdown + helpers
                           └─▶ Task 16 (Integration) — connects both panels
```

Never start a task before all its upstream tasks are committed. Each `npm run build` between tasks is a hard gate.

---

*Last updated: 2026-06-25 · Dawer Operations Dashboard*
