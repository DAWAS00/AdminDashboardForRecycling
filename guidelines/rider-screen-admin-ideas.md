# Rider Screen — Admin Control Ideas
> Technique: SCAMPER + Jobs to be Done (JTBD) + First Principles
> Goal: Small additions with outsized admin impact — no redesign, no new screens

---

## What the Admin Actually Needs (First Principles)

Strip everything back to the five things an admin needs to do their job:

| # | Need | Current gap |
|---|------|-------------|
| 1 | Know who is working right now | Status dot exists but no elapsed time |
| 2 | Know if something is wrong | Admin must manually check each card |
| 3 | Locate a specific rider fast | Must scan the whole list |
| 4 | Understand daily fleet performance | Must open Reports screen |
| 5 | Take action when there's a problem | No action buttons in the panel |

Every idea below maps to one of these five needs.

---

## JTBD Analysis (Jobs to be Done)

**When** I open the dashboard in the morning,  
**I want** to see fleet health at a glance  
**so I can** start the day confident everything is okay.

**When** a delivery seems to be taking too long,  
**I want** an automatic warning  
**so I can** intervene before the client complains.

**When** a new order arrives,  
**I want** to see who is available and closest  
**so I can** assign it in seconds.

**When** the fleet is large (10+ riders),  
**I want** to filter down to just the problem cases  
**so I'm** not overwhelmed.

**When** the day ends,  
**I want** to see who performed best  
**so I can** give feedback without opening the Reports screen.

---

## SCAMPER on the Rider Panel

| Lens | Applied to rider panel | Idea spawned |
|------|------------------------|--------------|
| **Substitute** | Replace static status dot → timed badge | Delivery Timer badge (elapsed minutes) |
| **Combine** | Panel header + fleet summary | Fleet Status Bar (always-visible strip) |
| **Adapt** | Heatmap urgency concept → rider cards | Urgency color coding (green→amber→red) |
| **Modify** | Make the panel header actionable | Alert Notification Dot on header |
| **Put to other use** | Use earnings number as live performance | Daily Mini-Stats on each card |
| **Eliminate** | Remove info admin can't act on | Show only actionable data per card |
| **Reverse** | Admin hunts for problems → system surfaces them | Overtime Alert auto-triggers |

---

## 20 Ideas

### Group A — Instant Fleet Overview

| # | Idea | One-liner |
|---|------|-----------|
| 1 | **Fleet Status Bar** | Fixed strip at panel top: "6 Active · 2 Idle · 4 Orders Pending" — 3 chips, always visible |
| 2 | **Urgency Auto-Sort** | Rider cards auto-sort: overdue deliveries float to top, idle riders sink to bottom |
| 3 | **Filter Tabs** | All / Active / Idle / Alerts — filter the rider list in one click |
| 4 | **Rider Search** | Text input to find a rider by name instantly when the fleet grows beyond 8 |

### Group B — Per-Rider Intelligence

| # | Idea | One-liner |
|---|------|-----------|
| 5 | **Delivery Timer** | Each active card shows elapsed time with color: green (<15 min) → amber (15–25) → red (>25) |
| 6 | **ETA Chip** | Small chip: "~7 min to delivery" or "3 min late" — computed from the ETA helper |
| 7 | **Overtime Alert** | If delivery exceeds estimate by 20%, card gets a pulsing red left-border + alert icon |
| 8 | **Idle Warning** | Rider idle >10 min shows "Idle 14 min" in amber — admin knows to investigate |
| 9 | **Daily Mini-Stats** | Under rider name: "Today · 4 orders · 8.2 kg · JD 6.50" — no need to open Reports |
| 10 | **Order Queue Badge** | Badge showing how many orders rider has queued: "2 queued" — prevents overloading one rider |

### Group C — Map Intelligence

| # | Idea | One-liner |
|---|------|-----------|
| 11 | **One-Click Map Focus** | Click any rider card → map pans + zooms to that rider immediately |
| 12 | **Coverage Zone Rings** | Faint circles around each active rider showing their ~2 km service radius — reveals gaps |
| 13 | **Hub Route Lines** | Thin lines from active riders to their assigned hub — admin sees where materials are going |
| 14 | **Idle Rider Dimming** | Idle rider markers fade to 40% opacity on the map so active deliveries stand out visually |

### Group D — Admin Action Controls

| # | Idea | One-liner |
|---|------|-----------|
| 15 | **Quick Status Toggle** | Inline button to manually flip a rider's status (idle ↔ available) without editing constants |
| 16 | **Reassign Order Button** | On any active order card, a reassign button lets admin move it to a different rider |
| 17 | **Pending Orders Tray** | Collapsible tray at panel bottom showing unassigned orders + nearest idle rider suggestion |
| 18 | **One-Click Call** | Tap rider phone number → opens phone dialer (mobile) or copies to clipboard (desktop) |

### Group E — Smart Alert System

| # | Idea | One-liner |
|---|------|-----------|
| 19 | **Alert Notification Dot** | Red dot on panel header tab the moment ANY rider has an issue — admin never misses it |
| 20 | **Fleet Health Score** | Single 0–100 score in the panel header (avg delivery time × on-time rate) — one number tells the story |

---

## NAF Scoring

| # | Idea | N | A | F | Total |
|---|------|---|---|---|-------|
| 7 | Overtime Alert | 8 | 10 | 8 | **26** |
| 5 | Delivery Timer | 7 | 10 | 9 | **26** |
| 1 | Fleet Status Bar | 5 | 10 | 10 | **25** |
| 19 | Alert Notification Dot | 6 | 10 | 9 | **25** |
| 8 | Idle Warning | 7 | 9 | 9 | **25** |
| 11 | One-Click Map Focus | 5 | 10 | 9 | **24** |
| 6 | ETA Chip | 8 | 9 | 7 | **24** |
| 3 | Filter Tabs | 5 | 9 | 9 | **23** |
| 2 | Urgency Auto-Sort | 6 | 9 | 8 | **23** |
| 9 | Daily Mini-Stats | 6 | 9 | 8 | **23** |
| 14 | Idle Rider Dimming | 6 | 8 | 9 | **23** |
| 17 | Pending Orders Tray | 7 | 9 | 7 | **23** |
| 18 | One-Click Call | 5 | 9 | 9 | **23** |
| 10 | Order Queue Badge | 5 | 8 | 10 | **23** |
| 4 | Rider Search | 4 | 8 | 10 | **22** |
| 16 | Reassign Order Button | 8 | 8 | 6 | **22** |
| 12 | Coverage Zone Rings | 8 | 7 | 7 | **22** |
| 20 | Fleet Health Score | 8 | 8 | 7 | **23** |
| 15 | Quick Status Toggle | 7 | 8 | 6 | **21** |
| 13 | Hub Route Lines | 7 | 7 | 7 | **21** |

> N = Novelty · A = Attractiveness (admin impact) · F = Feasibility (1–10 each)

---

## Top 5 Concept Cards

---

### Concept 1 — Delivery Timer Badge (Score: 26)

```
IDEA: Delivery Timer Badge
TAGLINE: Every rider card shows how long the current delivery has been running — in color.
PROBLEM: Admin has no idea if a 30-minute delivery is normal or a problem without checking manually.
SOLUTION:
  Each rider card in "delivering" or "picking_up" status shows an elapsed timer:
  "18 min" — green under 15 min, amber 15–25 min, red above 25 min.
  Timer uses Date.now() - order.acceptedAt (not a counter) so it never drifts.
  Color matches existing design tokens: brand-600, amber-600, danger-600.
TARGET USER: Admin watching 6–10 active riders simultaneously.
KEY INSIGHT: Color tells the story instantly — admin doesn't need to read numbers to know who needs attention.
EFFORT: S (2–3 hours — computed in the card component, no new state needed)
BIGGEST RISK: Need to add acceptedAt timestamp to the Order type (one line in types.ts).
QUICKEST TEST: Hardcode a timer into one rider card for 30 minutes in dev — see if it actually draws attention.
NEXT STEP: Add acceptedAt: number to Order in types.ts. Compute elapsed in the RiderCard component.
```

---

### Concept 2 — Overtime Alert (Score: 26)

```
IDEA: Overtime Alert
TAGLINE: The card itself tells admin "this delivery is late" — no manual checking.
PROBLEM: Admin cannot watch all riders at once. A late delivery can go unnoticed for 20+ minutes.
SOLUTION:
  Compare elapsed time against a per-material estimate:
    Cooking Oil pickup: 20 min avg
    Plastic/Paper: 15 min avg
    Electronics: 25 min avg
  When elapsed > estimate × 1.2, the rider card shows a pulsing left border (4px, var(--color-danger-600))
  and a small alert icon (Lucide AlertTriangle) next to the status text.
  The Alert Notification Dot on the panel header also activates (Concept 5).
TARGET USER: Admin managing the fleet without a dedicated dispatcher.
KEY INSIGHT: The system alerts the admin — admin doesn't need to babysit the list.
EFFORT: S–M (4–5 hours — estimates as constants, comparison in card render, CSS animation)
BIGGEST RISK: Too many false positives if estimates are wrong → amber state first, red only at 1.5×.
QUICKEST TEST: Add one hardcoded "overdue" rider to constants.ts and check that the card looks urgent.
NEXT STEP: Add MATERIAL_ESTIMATE_MINUTES constant map to constants.ts. Add overtime logic to RiderCard.
```

---

### Concept 3 — Fleet Status Bar (Score: 25)

```
IDEA: Fleet Status Bar
TAGLINE: Three numbers at the top of the rider panel — admin knows fleet state in 1 second.
PROBLEM: Admin must scroll through all rider cards to understand overall fleet state.
SOLUTION:
  Fixed strip pinned to the top of the rider panel (below the panel header, above the list):
  [6 Active]  [2 Idle]  [4 Orders Pending]
  Each chip is clickable — clicking "Idle" filters the list to idle riders only (connects to Filter Tabs idea).
  Numbers computed from RIDERS array — zero new state, derived values only.
  Height: 36px. Background: var(--color-surface). Border-bottom: 1px solid var(--color-border).
TARGET USER: Admin who opens the dashboard and immediately needs situational awareness.
KEY INSIGHT: A header that gives context makes every card below easier to read.
EFFORT: S (2 hours — purely computed from existing data, no new types)
BIGGEST RISK: Number of "Orders Pending" requires defining what "pending" means (unassigned? or accepted-but-not-started?).
QUICKEST TEST: Add a static strip with hardcoded numbers first — check placement and readability.
NEXT STEP: Add FleetStatusBar component, compute three values from RIDERS in App.tsx, pass as props.
```

---

### Concept 4 — Alert Notification Dot (Score: 25)

```
IDEA: Alert Notification Dot
TAGLINE: A red dot on the "Riders" panel tab the moment any rider has a problem.
PROBLEM: Admin may be looking at the Heatmap or Hub screen when a rider goes overtime — they miss it.
SOLUTION:
  A 8px red circle (var(--color-danger-600)) appears on the Rider panel tab/header
  whenever ANY of these conditions is true:
    - Any rider is overtime (>1.2× estimate)
    - Any rider has been idle for >10 minutes
  The dot disappears automatically when all alerts are resolved.
  Computed as a derived boolean from RIDERS in App.tsx — zero network calls.
TARGET USER: Admin multitasking across screens.
KEY INSIGHT: A dot on the tab catches attention even when admin is on a different panel.
EFFORT: S (1–2 hours — one derived boolean, one CSS dot with conditional render)
BIGGEST RISK: If alerts are too sensitive, the dot is always on and admins start ignoring it.
QUICKEST TEST: Force an overtime condition in constants.ts, verify dot appears on the rider panel tab.
NEXT STEP: Add hasActiveAlerts boolean to App.tsx state, pass to panel tab component as prop.
```

---

### Concept 5 — Idle Warning + One-Click Map Focus (Score: 25 + 24)

```
IDEA: Idle Warning + Map Focus (bundled — small effort, high return)
TAGLINE: Idle riders surface themselves. Click any rider → map jumps to them.
PROBLEM (Idle Warning):
  An idle rider for 15+ minutes might be lost, on break without telling anyone, or have a vehicle issue.
  Admin currently has no signal for this.
SOLUTION (Idle Warning):
  Rider cards with status "idle" show elapsed idle time using the same timer logic as Delivery Timer:
  "Idle · 14 min" in var(--color-amber-600).
  Above 20 min it turns var(--color-danger-600).

PROBLEM (Map Focus):
  When the fleet has 10+ riders spread across Amman, finding a specific rider on the map means
  visually hunting for their marker while also reading the panel.
SOLUTION (Map Focus):
  Clicking any rider card calls map.flyTo([rider.lat, rider.lng], 15, { duration: 0.8 }).
  Smooth, fast, one click. Selected rider marker scales up 1.3× via CSS.

TARGET USER: Admin managing a real fleet where riders are spread across the city.
KEY INSIGHT: These two ideas together make the rider panel feel like mission control — every card is actionable.
EFFORT: S (3 hours total for both — idle timer reuses Delivery Timer logic, map focus is one Leaflet call)
BIGGEST RISK: Map flyTo can be disorienting if triggered by accident — add a small delay (200ms) before flying.
NEXT STEP: Add idleSince: number to Rider type. Add onClick handler to RiderCard that calls onFocusRider(id).
```

---

## Impact / Effort Matrix

```
HIGH IMPACT
│
│  Overtime Alert ●      Fleet Status Bar ●     Alert Dot ●
│  Delivery Timer ●      Map Focus ●
│  ETA Chip ●
│                        Idle Warning ●
│         Pending Orders Tray ●   Daily Mini-Stats ●
│                                                  Filter Tabs ●
│         Coverage Zones ●   Reassign Button ●    Urgency Sort ●
│                                                  Rider Search ●
│  Hub Route Lines ●     Quick Status Toggle ●    One-Click Call ●
│                        Order Queue Badge ●       Idle Dimming ●
│                        Fleet Health Score ●
└─────────────────────────────────────────────────────────────────
LOW EFFORT ←─────────────────────────────────────────→ HIGH EFFORT
```

**Quick Wins (high impact, low effort — build first):**
1. Fleet Status Bar (25) — 2 hours
2. Alert Notification Dot (25) — 2 hours
3. Delivery Timer Badge (26) — 3 hours
4. One-Click Map Focus (24) — 1 hour
5. Idle Warning (25) — 2 hours

**Big Bets (high impact, more work — plan before building):**
- ETA Chip (24) — needs ETA helper from tracking plan
- Overtime Alert (26) — needs MATERIAL_ESTIMATE constants
- Pending Orders Tray (23) — needs order assignment logic

---

## Recommended Build Order

These 8 ideas form one coherent upgrade without touching the map or redesigning anything:

```
Phase 1 — Always Visible (1 day)
  Task A: Fleet Status Bar — 3 chips in panel header
  Task B: Alert Notification Dot — red dot on panel tab
  Task C: One-Click Map Focus — map.flyTo on card click

Phase 2 — Per-Card Intelligence (1 day)  
  Task D: Delivery Timer Badge — elapsed time with color
  Task E: Idle Warning — idle time with color
  Task F: Order Queue Badge — "2 queued" badge on card

Phase 3 — Active Intervention (1 day)
  Task G: Overtime Alert — pulsing border + alert icon
  Task H: Filter Tabs — All / Active / Idle / Alerts
```

Total: ~3 days of focused development. Zero new screens. Zero redesign. The panel just becomes smarter.

---

## New Types Needed

```typescript
// Add to Order in types.ts:
acceptedAt?: number;    // Date.now() when status changed to "accepted" — enables timers

// Add to Rider in types.ts:
idleSince?: number;     // Date.now() when rider last became "idle" — enables idle warning
```

## New Constants Needed

```typescript
// Add to constants.ts:
export const MATERIAL_DELIVERY_ESTIMATE_MS: Record<Order["material"], number> = {
  "Cooking Oil":      20 * 60 * 1000,  // 20 min
  "Plastic Bottles":  15 * 60 * 1000,  // 15 min
  "Paper & Cardboard":15 * 60 * 1000,  // 15 min
  "Electronics":      25 * 60 * 1000,  // 25 min
};

export const IDLE_WARNING_MS  = 10 * 60 * 1000;   // 10 min → amber
export const IDLE_CRITICAL_MS = 20 * 60 * 1000;   // 20 min → red
```

## New Helper Functions Needed

```typescript
// Add to helpers.ts:

/** Returns elapsed ms since order was accepted. Returns 0 if no timestamp. */
export function deliveryElapsedMs(order: Order): number {
  if (!order.acceptedAt) return 0;
  return Date.now() - order.acceptedAt;
}

/** Returns urgency color token based on elapsed time vs estimate. */
export function deliveryUrgencyColor(elapsedMs: number, estimateMs: number): string {
  const ratio = elapsedMs / estimateMs;
  if (ratio > 1.2) return "var(--color-danger-600)";   // overtime
  if (ratio > 0.7) return "var(--color-amber-600)";    // getting close
  return "var(--color-brand-600)";                      // on track
}

/** Returns true if any rider in the array has an active alert. */
export function hasFleetAlerts(riders: Rider[]): boolean {
  return riders.some(r => {
    if (r.status === "idle" && r.idleSince && Date.now() - r.idleSince > IDLE_WARNING_MS) return true;
    const activeOrder = r.orders.find(o => o.status === "inTransit" || o.status === "accepted");
    if (!activeOrder || !activeOrder.acceptedAt) return false;
    const estimate = MATERIAL_DELIVERY_ESTIMATE_MS[activeOrder.material];
    return Date.now() - activeOrder.acceptedAt > estimate * 1.2;
  });
}
```

---

*Dawer — Rider Screen Admin Control Ideas*
*June 2026 | Techniques: SCAMPER + JTBD + First Principles*
