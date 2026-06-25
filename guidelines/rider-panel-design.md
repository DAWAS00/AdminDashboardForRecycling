# Rider Panel — Design Spec

> **Scope:** The right-side panel on the Live Map view (`activeView === "map"`).
> **Current file:** `src/app/components/RiderPanel.tsx`
> **Status:** Redesign — replacing the current flat list + detail pattern with a proper fleet operations layout.

---

## Why the current design falls short

The existing panel is a scrollable list of rider rows that collapses when one is selected, pushing the list into a fixed ~232px window. This creates three problems:

1. **The most important data (earnings, CO₂, live orders) is hidden until you click a rider.** An operations admin needs the fleet's health at a glance — not after two interactions.
2. **The selected rider view has no sense of time or progress.** An order status badge ("In Transit") tells you a state but not how long it's been in that state, or what happens next.
3. **There are zero quick actions.** If a rider is stuck or idle, the admin has no way to act from the panel.

---

## Layout — Three zones, always visible

The panel is `--panel-width: 288px` at all times. It splits vertically into three zones that are always present, not conditionally swapped.

```
┌─────────────────────────────┐
│  ZONE 1 · Fleet Summary     │  56px fixed — never scrolls
│  8 online · 1,247 kg CO₂   │
│  2 idle  · 328.50 JD today  │
├─────────────────────────────┤
│  ZONE 2 · Rider List        │  flex-1, scrollable
│  ┌───────────────────────┐  │
│  │ Ahmad Khalil      [●] │  │  selected rider — highlighted
│  │ Motorcycle · 2 orders │  │
│  │ ████░░░  18.50 JD     │  │
│  └───────────────────────┘  │
│  Omar Hassan          [●]   │
│  ...                        │
├─────────────────────────────┤
│  ZONE 3 · Rider Detail      │  fixed height ~280px, or
│  (shows when rider selected)│  collapses to 48px "tap to expand"
│  Orders · Performance · Act │
└─────────────────────────────┘
```

**Why this works:** Zone 2 always shows all riders. Zone 3 is a persistent drawer at the bottom — it doesn't collapse the list, it slides up from the bottom of the panel. The list shrinks proportionally to make room.

---

## Zone 1 — Fleet Summary Header

**Purpose:** One glance tells the admin the state of the whole fleet right now.

### Layout

```
┌─────────────────────────────────────────┐
│  FLEET STATUS                    14:22  │  ← section label + live clock (DM Mono)
│                                         │
│  ●8 active   ●2 idle   ●1 picking up   │  ← status counts, colored dots
│                                         │
│  1,247.3 kg CO₂        328.50 JD       │  ← today totals, DM Mono, large
└─────────────────────────────────────────┘
```

### Specs

| Element | Token | Value |
|---|---|---|
| Background | `--color-surface-card` | `#FFFFFF` |
| Border-bottom | `--color-border` | `1px solid #E2E8F0` |
| Height | fixed | `72px` |
| Section label | `--text-2xs` + uppercase + `--color-text-tertiary` | `10px / #94A3B8` |
| Status counts | `--text-xs` | `11px`, colored by status |
| Metric values | `--font-mono` + `--text-lg` + `--weight-bold` | `18px bold` |
| CO₂ color | `--color-brand-600` | `#1E5C35` |
| Earnings color | `--color-amber-600` | `#C8860A` |

**Active dot:** `6px` circle, `animation: pulse 2s ease-in-out infinite`, no emoji.

**"Today" scope:** The totals reset at midnight Amman time. Show `"TODAY"` as a 10px label above each metric — not parenthetical.

---

## Zone 2 — Rider List

**Purpose:** Scannable fleet roster. The admin should be able to assess every rider's status without clicking anything.

### Rider row anatomy

```
┌──────────────────────────────────────────────┐
│ [vehicle] Ahmad Khalil          Motorcycle   │
│           ● Delivering  ·  2 orders active   │
│           ████████░░  78%    18.50 JD earned │
└──────────────────────────────────────────────┘
```

**Selected state:** `box-shadow: inset 3px 0 0 var(--color-brand-600)` + `background: var(--color-brand-50)`.

**Idle rider:** Muted — entire row at `opacity: 0.6`. The vehicle icon uses `--color-text-disabled`. No earnings bar shown (empty state: `—`).

### Row specs

| Element | Spec |
|---|---|
| Row height | `64px` minimum |
| Padding | `12px 16px` (`--space-3` / `--space-4`) |
| Name | `--text-sm` / `--weight-semibold` / `--color-text-primary` — 13px |
| Vehicle badge | `--text-xs` / `--color-text-tertiary` — 11px, right-aligned |
| Status pill | `6px dot + label`, same colors as `STATUS_CONFIG` |
| Earnings bar | 6px tall progress bar, width = earnings / today's max earnings across all riders |
| Earnings value | `--font-mono` / `--text-xs` / right-aligned |
| Click target | Full row is clickable, `cursor: pointer`, `min-height: 44px` for accessibility |

### Progress bar — earnings visualization

The bar width is relative: `(rider.totalEarnings / maxRiderEarnings) * 100%`. This gives the admin instant visual ranking without sorting. Top earner = full bar. This is more useful than an absolute number read in isolation.

Color:
- `< 30%` → `--color-text-disabled` (gray) — rider just started or idle
- `30–70%` → `--color-amber-600` (amber) — performing
- `> 70%` → `--color-brand-600` (green) — top performer

### Sort & filter row (future — Phase 2)

Reserve 36px below Zone 1 for a filter strip. Don't build it now, but don't fill that space with list items either. Leave a `min-height: 36px` div with a comment:

```tsx
{/* FUTURE: Sort by status / earnings / orders. Filter: delivering | idle | picking_up */}
```

---

## Zone 3 — Rider Detail Drawer

**Purpose:** Deep-dive on a single selected rider. Three tabs: **Orders**, **Today**, **Actions** (future).

### Header (always visible, 48px)

```
┌────────────────────────────────────────────┐
│ Ahmad Khalil   أحمد خليل    [✕ close]      │
│ +962 79 123 4567   ·  Motorcycle  ·  ●     │
└────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Name | `--text-sm` / `--weight-bold` / `--color-text-primary` |
| Arabic name | `font-family: --font-ar` / `--text-xs` / `--color-brand-600` / RTL |
| Phone | `--font-mono` / `--text-xs` / `--color-text-secondary` |
| Status dot | `8px` animated dot, color from `STATUS_CONFIG` |
| Close button | `32×32px` hit area, `aria-label="Close rider detail"`, `<X size={14} />` |

### Tab: Orders (default)

Each order is a card — not a list item. Cards give the admin space to read without squinting.

#### Order card layout

```
┌─────────────────────────────────────────┐
│  ORD-2841                    In Transit │
│  ──────────────────────────────────────│
│  🫗 Cooking Oil              45 L       │  ← material icon (SVG) + name + qty
│  📍 Al-Balad, Downtown                  │  ← address
│  ──────────────────────────────────────│
│  [Pending] ──●── [Accepted] ──── [Done]│  ← progress trail
│  ──────────────────────────────────────│
│  CO₂ 112.5 kg              18.50 JD   │
└─────────────────────────────────────────┘
```

#### Progress trail

The trail replaces the status badge. It shows the rider's journey at a glance:

```
Pending  →  Accepted  →  In Transit  →  Completed
  ○ ─────────● ─────────── ● ────────────── ○
```

- Filled circle (`●`) = reached this state
- Empty circle (`○`) = not yet
- Active step: circle with pulsing ring, `--color-brand-600`
- Line between steps: `2px` solid, color transitions from `--color-border` (incomplete) to `--color-brand-600` (complete)
- Labels: `10px` / `--font-sans` / `--color-text-tertiary`, below each node

This takes ~28px of height and replaces both the status badge AND the guesswork about what happens next.

#### Order card specs

| Element | Spec |
|---|---|
| Card background | material's `bg` color (e.g., `#FEF3C7` for oil) |
| Card border | `1px solid {material.color}30` |
| Card radius | `--radius-lg` (12px) |
| Card padding | `--space-3` (12px) |
| Order ID | `--font-mono` / `--text-xs` / `color: material.color` |
| Material name | `--text-sm` / `--weight-semibold` / `--color-text-primary` |
| Quantity | `--font-mono` / `--text-sm` / `--weight-bold` / `color: material.color` |
| Address | `--text-xs` / `--color-text-secondary` / `<MapPin size={10} />` before |
| CO₂ | `--font-mono` / `10px` / `--color-brand-600` / `<Leaf size={10} />` before |
| Earnings | `--font-mono` / `11px` / `--weight-bold` / `--color-amber-600` |

#### Empty state (no active orders)

```
┌──────────────────────────────────────┐
│                                      │
│        [Rider icon, 32px muted]      │
│        No active orders              │
│        Last completed: ORD-2810      │  ← if exists
│                                      │
└──────────────────────────────────────┘
```

Never show a blank white box. Show context: when did they last complete an order?

### Tab: Today (summary)

A mini performance view. Not charts yet — just clear numbers.

```
┌──────────────────────────────────────┐
│  SHIFT STATS — TODAY                 │
│                                      │
│  Orders:    3 completed  2 active    │
│  Earnings:  46.50 JD                 │
│  CO₂:       280.5 kg saved           │
│  Materials: Oil ×3  Plastic ×2       │
│                                      │
│  Online since  09:14                 │
│  Last ping     14:22:07              │
└──────────────────────────────────────┘
```

All numbers use `--font-mono`. Labels use `--text-xs` / `--color-text-secondary`. Values use `--text-base` / `--weight-semibold`.

"Online since" and "Last ping" are the two most operationally critical time signals — they tell the admin if the rider is alive and connected.

### Tab: Actions (Phase 2 placeholder)

Reserve the tab but render it as disabled with a tooltip: "Coming in next release".

When built, this tab will contain:
- **Call Rider** — `tel:` link opens phone dialer
- **Send Message** — opens in-app chat (future)
- **Reassign Order** — move an order from this rider to another (drag or dropdown)
- **Mark Rider Offline** — admin override for a rider that's unreachable
- **View Route on Map** — center the map on this rider and show their delivery path

---

## States & Edge Cases

### All riders idle

Zone 1 shows `0 active`. Zone 2 shows all riders at `opacity: 0.6`. Zone 3 is collapsed with: `"No rider selected"` and a hint: `"Click a rider on the map or in the list to track them."`.

### Rider with no orders (idle)

Zone 3 shows:
```
Ahmad is idle
Available for assignment
Last order: 2h ago (ORD-2804, completed)
```

### Rider offline / disconnected (future Phase 2)

Rider row has a `⚠` icon badge, row border-left color = `--color-danger-600`, status pill says "Offline". Zone 3 shows last known location time: `"Last seen 14:05"` in amber.

### Network loading (future Phase 2)

When the data is fetching, rider rows show a skeleton shimmer:
- Name placeholder: `140px × 13px` rounded rect, `--color-border` animated gradient
- Earnings placeholder: `60px × 6px` rounded rect

No spinners. Skeletons maintain layout so there's zero CLS.

---

## Quick Actions — Per Row (Phase 2)

On hover, each rider row reveals two icon buttons at the right edge:

```
Ahmad Khalil     [📞] [↗]
```

- `[📞]` = Call — `tel:+96279...`, `aria-label="Call Ahmad Khalil"`
- `[↗]` = Focus on map — centers Leaflet on this rider, `aria-label="Show Ahmad on map"`

Both are `32×32px` hit areas. They appear with `opacity: 0 → 1` on `transition: opacity 150ms ease-out`. On mobile (touch), they're always visible (no hover).

---

## Accessibility Requirements

Every interactive element in this panel must meet these minimums before shipping:

| Requirement | Implementation |
|---|---|
| All icon buttons have `aria-label` | `<button aria-label="Close rider detail">` |
| Rider rows are keyboard-navigable | `role="button"` or `<button>`, Tab order = list order |
| Status is not color-only | Status dot always paired with text label |
| Focus ring visible | `outline: 2px solid var(--color-brand-600); outline-offset: 2px` on `:focus-visible` |
| Close button reachable by keyboard | `tabIndex={0}`, responds to `Enter` and `Space` |
| Progress trail has text alternative | `aria-label="Order status: In Transit (step 3 of 4)"` on the trail container |
| Earnings bar has text alternative | `aria-label="Ahmad has earned 18.50 JD today, 78% of top earner"` |

---

## What NOT to do (enforced rules)

These are specifically what the current implementation does wrong and must not be repeated:

| ❌ Don't | ✅ Do instead |
|---|---|
| `maxHeight: 232px` to shrink the list when a rider is selected | Use flex layout — Zone 3 expands, Zone 2 shrinks proportionally |
| Status as a pill badge only | Status pill + progress trail in orders |
| `fontFamily: "'DM Sans',sans-serif"` on every element | Set it once on the panel root element |
| `style={{ borderColor: "#E2E8F0" }}` raw hex | `style={{ borderColor: "var(--color-border)" }}` |
| `<button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-50">` with no aria-label | `<button aria-label="Close rider detail" onClick={onClose}>` |
| `width: 284` (RiderPanel) vs `width: 300` (HubsPanel) | Always `width: var(--panel-width)` = `288px` |
| Empty close button with no label for screen readers | Always label every control |
| Showing "No active orders" with just a centered `<AlertCircle>` and text | Show last completed order context + next suggested action |

---

## Component file changes

### Files to modify

```
src/app/components/RiderPanel.tsx       ← full redesign
src/app/components/LiveMapLayer.tsx     ← add hover affordance for quick actions
src/app/constants.ts                    ← add --panel-width: 288 to layout constants
src/styles/globals.css                  ← add progress trail animation keyframes
```

### New sub-components to extract

```
src/app/components/rider/FleetSummaryHeader.tsx    ← Zone 1
src/app/components/rider/RiderRow.tsx              ← single rider in Zone 2
src/app/components/rider/RiderDetailDrawer.tsx     ← Zone 3
src/app/components/rider/OrderCard.tsx             ← order card with progress trail
src/app/components/rider/ProgressTrail.tsx         ← the 4-step order status bar
src/app/components/rider/TodayStats.tsx            ← Zone 3 / Today tab
```

Breaking RiderPanel (~180 lines) into these focused components makes each one testable and replaceable when Phase 2 features land.

---

## Phase 2 — Features to design for (not build yet)

Reserve layout space and component slots for these now so we don't have to redesign the panel layout when they ship.

| Feature | Where it goes | What it needs |
|---|---|---|
| **Real-time location ping** | Zone 3 header → `"Last seen 14:22:07"` | Timestamp from backend, auto-refresh every 30s |
| **Call / message rider** | Zone 3 Actions tab | `tel:` link + future in-app chat |
| **Reassign order** | Zone 3 Orders tab → per-order action | Order assignment API, rider availability check |
| **Rider performance history** | Zone 3 Today tab → "View this week" link | Recharts area chart, daily earnings + CO₂ for past 7 days |
| **Mark rider offline** | Zone 3 Actions tab | Admin override, confirmation dialog |
| **Alert badge on rider row** | Zone 2 → right edge of row | Alert conditions: idle >30min, order pending >15min |
| **Route preview on map** | Zone 3 → "View Route" button | Leaflet polyline, centers map on rider |
| **Filter + sort strip** | Below Zone 1 (36px reserved) | Filter: status · Sort: earnings / orders / name |
| **Shift start/end time** | Zone 3 Today tab | Clock-in/out from rider mobile app |
| **CO₂ equivalents** | Zone 3 Today tab below CO₂ value | "= 12 trees planted" — calculated from kg value |

---

## Typography quick reference for this panel

| Use | Font | Size | Weight | Color token |
|---|---|---|---|---|
| Section labels ("FLEET STATUS") | DM Sans | 10px | 700 | `--color-text-tertiary` + uppercase + `letter-spacing: 0.1em` |
| Rider name | DM Sans | 13px | 600 | `--color-text-primary` |
| Rider Arabic name | Cairo | 12px | 600 | `--color-brand-600` |
| Status label | DM Sans | 11px | 500 | From `STATUS_CONFIG` |
| Order ID | DM Mono | 11px | 500 | `material.color` |
| Quantity / earnings values | DM Mono | 13–18px | 700 | `material.color` or `--color-amber-600` |
| Address / meta text | DM Sans | 11px | 400 | `--color-text-secondary` |
| Tab labels | DM Sans | 12px | 600 | Active: `--color-brand-600`, Inactive: `--color-text-tertiary` |
| CO₂ values | DM Mono | 11px | 500 | `--color-brand-600` |
| Phone number | DM Mono | 11px | 400 | `--color-text-secondary` |
| Time values (last ping) | DM Mono | 11px | 400 | `--color-text-tertiary` |

---

## Spacing quick reference for this panel

| Context | Token | Value |
|---|---|---|
| Panel horizontal padding | `--space-4` | 16px |
| Between rider rows | `border-bottom: 1px solid var(--color-border)` | — |
| Order card padding | `--space-3` | 12px |
| Gap between order cards | `--space-3` | 12px |
| Zone 3 internal padding | `--space-4` | 16px |
| Progress trail node size | — | `10px × 10px` circle |
| Progress trail line height | — | `2px` |
| Tab bar height | — | `36px` |

---

*Last updated: 2026-06-25 · Dawer Operations Dashboard · Phase 1 redesign*
