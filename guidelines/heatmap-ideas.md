# Heat Map — Ideas, Intelligence & Hub Foundation

> **Current file:** `src/app/components/HeatMapLayer.tsx` + `HeatMapPanel.tsx`
> **Status:** Creative expansion — from passive visualization to operational intelligence tool.

---

## The core problem with what exists today

The current heat map shows a choropleth (colors by CO₂ gap %) + three static toggles. An admin can *see* that "8th Circle has 70% unrealized CO₂ potential" — but they cannot **do anything** about it from this screen.

The gap between insight and action is the biggest design problem to solve.

> **Design principle for everything below:**
> Every layer, feature, and panel on this screen must answer one of three questions:
> 1. **Where should I send riders right now?**
> 2. **What is the ROI of our operations this week/month?**
> 3. **Where should we build the next hub?**

---

## Framework: Three user jobs on this screen

Before generating ideas, define who uses the heatmap and what they're trying to accomplish:

| User | Job to be Done | Current pain |
|---|---|---|
| **Operations admin** | "When I'm managing a shift, I need to know which district needs coverage most urgently so I can assign an idle rider before the opportunity disappears" | The map shows potential but no urgency signal |
| **Company client** (restaurant, factory) | "When I'm evaluating Dawer as a partner, I want to see the environmental and financial impact of my participation so I can justify the program to my management" | No client-facing output exists |
| **Strategic manager** | "When planning infrastructure, I need to see where collection density is growing so I can decide where to place the next hub" | Hub placement is guesswork — no coverage visualization |

---

## SCAMPER on the current heatmap

### S — Substitute
**What if we substituted the CO₂ gap metric with revenue density?**
Show JD per km² instead of kg CO₂ per km². This reveals where the money is concentrated — useful for justifying new hub investment. Both layers exist, just flip the lens.

**What if we substituted static district polygons with live demand circles?**
Instead of fixed administrative boundaries, show organic demand zones that expand and contract based on real-time order density. The "Downtown" zone might be a tight cluster at lunch; it expands in the evening when restaurants close out.

### C — Combine
**Combine the heatmap with the Live Map:**
When a district is selected on the heat map, idle riders from the Live Map view appear as pins *on the heat map*. The admin sees both the opportunity (district gap) and the resource (available rider) in the same view. One click → assign → done.

**Combine time-of-day with material type:**
Cooking oil spikes after restaurant hours (evening). Electronics and paper spike mid-week. A time-aware material filter would show which materials are "ripe" right now based on historical patterns.

### A — Adapt (from another domain)
**Adapt weather map conventions:**
Weather maps show probability of rain + wind direction. Adapt this: show *probability of successful collection* (green = high, red = low based on day/time/material patterns) + direction arrows showing where rider traffic is flowing.

**Adapt Uber's surge pricing model:**
Not for pricing — but for *priority scoring*. When a district hits certain thresholds (X days since last collection, Y% capacity at nearby hub, Z unrealized orders), it becomes a "Priority Zone" that visually pulses and appears in a priority queue on the panel.

### M — Modify
**Modify the single progress bar per district into a stacked material breakdown:**
Instead of one bar showing total CO₂ achieved %, show four mini-bars stacked — one per material type. You can instantly see "Sweifieh is green on oil but red on electronics." This is the most immediately buildable change.

**Modify the period toggle (week/month) into a time scrubber:**
A slider from "Now" to "30 days ago." The map recolors as you drag, showing how each district's CO₂ gap has evolved. This is a powerful story-telling tool for clients.

### P — Put to other use
**Put the heatmap data to use as a shareable report:**
Generate a one-page district impact summary (PDF or shareable link). Clients whose facilities are in a district can receive: kg CO₂ saved this month from their area, earnings distributed to riders, equivalent trees planted. This becomes a marketing and retention tool.

### E — Eliminate
**Eliminate the "show/hide" toggle complexity:**
Currently the panel has three separate toggles: Amman Boundary, Rider Hotspots, Request Density. Most admins won't understand the difference. Replace with a single **"View Mode" selector**: `Overview` / `Demand` / `Routes` / `Coverage`. Each mode activates the right combination of layers automatically.

### R — Reverse
**What if the heatmap showed what's WORKING, not just what's not?**
Current focus: red = bad (high unrealized potential). Reverse: highlight green zones as **success stories** to replicate. "Downtown has 82% achievement — what are we doing there that we can copy to 8th Circle?"

---

## Ideas by category

### Category A: Map Intelligence Layers

**A1 — Demand Forecast Layer** *(NAF: 8/9/6 = 23)*
Show a predicted heatmap for the next 24 hours based on day-of-week patterns. Monday mornings = paper and cardboard from weekend accumulation. Friday evenings = high cooking oil from restaurants. Visualized as a ghost overlay — translucent future-heat on top of current reality. Admin can toggle "Today" vs "Tomorrow" vs "This Weekend."

**A2 — Material Filter Layer** *(NAF: 9/9/8 = 26)*
Filter the entire map by material type. When "Cooking Oil" is selected, only oil-relevant zones light up — colored by oil availability score. When "Electronics" is selected, different zones emerge. This completely changes how riders are assigned. A motorcycle rider might specialize in oil pickups; a van driver handles electronics. The filter makes specialization visible.

*Implementation:* Add a material chip filter row above the map (or in the panel). When one is active, `districtFillColor()` is calculated only from that material's sub-score. Already have `HubMaterials` type — extend `District` with per-material breakdown.

**A3 — Hub Coverage Overlay** *(NAF: 9/10/7 = 26)*
Show a circle (radius = practical pickup distance, ~5km) around each active hub. Districts that fall **outside** all coverage circles are highlighted in a warning color. This is the foundation for hub placement decisions and directly feeds the Hubs page. An admin looking at this immediately sees the gap the next hub should fill.

*This is the most important idea for the hub page foundation.*

**A4 — Route Efficiency Heatmap** *(NAF: 7/8/5 = 20)*
Show road segments colored by "collection efficiency" — how many kg of material per km traveled. Segments where riders collect the most material relative to distance traveled are bright green. Inefficient long routes with little collection appear amber. This helps route planning without a full routing engine.

**A5 — Time Animation** *(NAF: 8/7/6 = 21)*
A play button that animates the heatmap across the last 30 days. Watch the districts "breathe" as collection happens and potential rebuilds. Powerful for: presenting to stakeholders, identifying seasonal patterns, showing growth.

---

### Category B: Business Intelligence for Companies

**B1 — Business Client Pins** *(NAF: 8/10/7 = 25)*
Place a pin on the map for each registered business client (restaurant, factory, supermarket). Pin size = their material volume contribution. Hovering shows: "Al-Balad Restaurant — 120L cooking oil this month — 300 kg CO₂ saved — 48 JD distributed to riders."

This is the seed of a **B2B client portal**. Every business can see their own pin and know their contribution. It makes the environmental impact concrete and location-anchored.

**B2 — District Impact Report Card** *(NAF: 9/10/6 = 25)*
When a district is selected, the panel transforms from the ranking list into a **District Report Card:**

```
Downtown (Al-Balad)
────────────────────────────────
This Month:
  CO₂ Saved:      1,018 kg  ████████░░ 82%
  Earnings:       406 JD distributed
  Collections:    14 completed

Equivalent to:
  ≈ 46 trees planted this month
  ≈ 4,400 km of driving avoided

Top Material:     Cooking Oil (68%)
Active Clients:   7 businesses
Rider Hours:      23 hrs

📄 Share this report →
```

The "Share this report" generates a PDF or link. This is a retention and acquisition tool — businesses share it to their sustainability reports. **Zero extra development cost** — the data already exists.

**B3 — CO₂ Equivalents Calculator** *(NAF: 8/9/8 = 25)*
Transform the raw `co2Achieved` number into human-scale equivalents. Every district's CO₂ saved shown as: trees planted, car-km offset, flight-hours avoided, smartphone charges equivalent. Makes the impact emotionally meaningful for both admins and clients. Static lookup table, no backend needed.

```
1,018 kg CO₂ ≈
  • 46 trees planted for one year
  • 4,400 km not driven by car
  • 5 return flights Amman → Dubai avoided
```

**B4 — Material Value Tracker** *(NAF: 7/8/7 = 22)*
Show not just CO₂ but **financial value** of collected materials by district. Each material has a market price (cooking oil → biodiesel value, paper → pulp price, electronics → component recovery value). The heatmap can be toggled to show JD value per km² — this answers "which district is most economically valuable to serve?"

---

### Category C: Rider Optimization

**C1 — Smart Zone Assignment** *(NAF: 9/10/6 = 25)*
The most actionable feature. When a district is selected **and** an idle rider exists, show a one-click assignment panel in the district detail:

```
8th Circle Area — 70% Unrealized
─────────────────────────────────
Suggested rider: Khalid Nasser
  Van · Idle · 3.2 km away
  
[→ Assign Khalid to this zone]
```

No routing engine needed. Just: idle rider + nearby district + one button. The assignment is logged and the rider shows as "assigned to zone" on the Live Map.

**C2 — Priority Queue Panel** *(NAF: 9/9/7 = 25)*
Replace the current static district ranking list with a **live priority queue.** Districts rise in urgency based on:
- Days since last collection (+2 pts per day)
- Unrealized CO₂ gap above 60% (+3 pts)
- Nearby hub approaching capacity (+4 pts)
- Day-of-week pattern match (material likely available today) (+2 pts)

The queue auto-ranks. The highest-priority district is always at the top with a clear "Action needed" label. This is the operations admin's to-do list.

**C3 — Rider Gap Visualizer** *(NAF: 8/8/6 = 22)*
Overlay all current riders as small vehicle icons on the heat map. Districts with no rider within 5km AND high unrealized potential are flagged with a diamond warning marker. Admin sees at a glance: "8th Circle is red and has no nearby rider."

**C4 — Optimal Cluster Stops** *(NAF: 8/7/5 = 20)*
Within a high-demand district, show the 2–3 optimal stop points where a rider can collect the most material by stopping once (based on business pin density). Not a full routing engine — just a heuristic: "if you stop at these 3 points, you cover 80% of this district's collection." Visualized as numbered waypoint markers on the map.

---

### Category D: Hub Placement Intelligence *(foundation for Hub page)*

**D1 — Coverage Gap Heatmap** *(NAF: 10/10/7 = 27)*
The single most important layer for hub strategy. Show:
- Green zone: within 5km of an active hub
- Amber zone: 5–10km from a hub
- Red zone: >10km from any hub

Currently, districts like Airport Road Corridor and Jubaiha appear to be underserved. This layer makes the argument for the next hub's location visually obvious. **This should be the default view when the admin first opens the Hubs page.**

**D2 — Hub Placement Simulator** *(NAF: 10/9/5 = 24)*
Drop a pin anywhere on the map. The system calculates: if a hub were placed here, what % of currently uncovered potential CO₂ would fall within range? What additional JD in earnings would it enable? Show this as a live tooltip while dragging the pin. The admin can compare 2–3 candidate locations before committing.

*This is the "Add Hub" flow's predecessor — before you commit coordinates, simulate the impact.*

**D3 — District-to-Hub Flow Lines** *(NAF: 8/8/6 = 22)*
Show animated flow lines (like Sankey on a map) from each district to its nearest hub. Line thickness = volume of material flowing. This makes the logistics network tangible and shows which hubs are overloaded (many thick lines) vs underutilized (thin or no lines).

**D4 — Hub Demand Score** *(NAF: 9/8/7 = 24)*
Each district gets a "Hub Demand Score" — a composite of: unrealized potential, distance from nearest hub, order count, material diversity. Districts scoring above a threshold are tagged "Needs hub nearby." The top-scoring cluster of districts defines the ideal location for the next hub. This score auto-updates as hubs are added.

---

## Idea scoring summary

| # | Idea | Novelty | Attractiveness | Feasibility | Total | Priority |
|---|---|---|---|---|---|---|
| A2 | Material Filter Layer | 9 | 9 | 8 | **26** | Build now |
| A3 | Hub Coverage Overlay | 9 | 10 | 7 | **26** | Build now |
| D1 | Coverage Gap Heatmap | 10 | 10 | 7 | **27** | Build now |
| B2 | District Report Card | 9 | 10 | 6 | **25** | Build now |
| B1 | Business Client Pins | 8 | 10 | 7 | **25** | Build now |
| B3 | CO₂ Equivalents | 8 | 9 | 8 | **25** | Build now |
| C1 | Smart Zone Assignment | 9 | 10 | 6 | **25** | Build now |
| C2 | Priority Queue Panel | 9 | 9 | 7 | **25** | Phase 2 |
| D4 | Hub Demand Score | 9 | 8 | 7 | **24** | Phase 2 |
| D2 | Hub Placement Simulator | 10 | 9 | 5 | **24** | Phase 2 |
| B4 | Material Value Tracker | 7 | 8 | 7 | **22** | Phase 2 |
| A1 | Demand Forecast Layer | 8 | 9 | 6 | **23** | Phase 3 |
| A5 | Time Animation | 8 | 7 | 6 | **21** | Phase 3 |
| C4 | Optimal Cluster Stops | 8 | 7 | 5 | **20** | Phase 3 |

---

## Redesigned panel structure

The current panel has: period toggle → 3 toggles → legend → district list.

Proposed structure:

```
┌─────────────────────────────────────────┐
│  VIEW MODE  [Overview] [Demand] [Hubs]  │  ← replaces 3 individual toggles
├─────────────────────────────────────────┤
│  PERIOD  [Today] [Week] [Month]         │  ← expanded from week/month
├─────────────────────────────────────────┤
│  FILTER BY MATERIAL                     │
│  [All] [Oil] [Plastic] [Paper] [E-waste]│  ← new
├─────────────────────────────────────────┤
│  PRIORITY QUEUE  (or District List)     │
│  ┌─────────────────────────────────┐    │
│  │ ⚠ 8th Circle — ACTION NEEDED  │    │  ← priority flag
│  │   70% gap · no rider nearby    │    │
│  │   [→ Assign rider]             │    │  ← inline action
│  └─────────────────────────────────┘    │
│  #2  Downtown · 18% gap                 │
│  #3  Airport Road · 80% gap             │
│  ...                                    │
├─────────────────────────────────────────┤
│  SELECTED DISTRICT (expands on click)   │
│  Report card + CO₂ equivalents + share  │
└─────────────────────────────────────────┘
```

---

## What to build now vs later

### Phase 1 (immediate — no new data needed)

These use only the data already in `constants.ts`:

1. **Material Filter Layer** — filter map by material type. Add `filterMaterial: MaterialType | "all"` to App state, pass to HeatMapLayer, compute separate fill color per material.
2. **Hub Coverage Overlay** — draw 5km radius circles around each hub from `INITIAL_HUBS`. Requires importing hub data into HeatMapLayer.
3. **District Report Card** — replace the district list item click behavior. When a district is selected, the list panel transforms into the report card view. All data is already on the `District` type.
4. **CO₂ Equivalents** — add a lookup function: `kg → trees`, `kg → car-km`, `kg → flights`. Pure math, no data needed.
5. **View Mode selector** — collapse the 3 toggles into one "View Mode" chip row: `Overview` / `Demand` / `Hubs`. Each sets the right combination of the existing 3 booleans.
6. **Stacked material bars** — replace the single district progress bar with 4 mini-bars. Requires adding per-material CO₂ data to the `District` type.

### Phase 2 (requires backend / real data)

7. **Business Client Pins** — backend provides list of registered clients with lat/lng and volume data.
8. **Smart Zone Assignment** — requires connecting Live Map rider state to HeatMap view.
9. **Priority Queue** — requires a scoring algorithm that runs on real-time data.
10. **Hub Demand Score** — composite scoring across districts and hub distances.
11. **District-to-Hub Flow Lines** — requires mapping each order to its destination hub.

### Phase 3 (ML / prediction)

12. **Demand Forecast Layer** — requires historical order data per district per day-of-week.
13. **Hub Placement Simulator** — requires geo-math (Haversine distance) + potential calculation.
14. **Time Animation** — requires historical snapshot data per period.
15. **Route Efficiency Heatmap** — requires actual rider GPS tracks.

---

## CO₂ Equivalents reference table

Use these constants for the equivalents calculator (Phase 1, no backend needed):

```ts
// src/app/constants.ts additions
export const CO2_EQUIVALENTS = {
  treeYear: 21.77,          // kg CO₂ absorbed by one tree per year
  carKm: 0.21,              // kg CO₂ per km driven (average petrol car)
  flightAmmanDubai: 195,    // kg CO₂ per passenger, one way
  smartphoneCharge: 0.0085, // kg CO₂ per smartphone charge (100% renewable baseline)
  beefKg: 27,               // kg CO₂ per kg of beef (for food context)
} as const;

export function co2Equivalents(kg: number) {
  return {
    trees:     +(kg / CO2_EQUIVALENTS.treeYear).toFixed(1),
    carKm:     Math.round(kg / CO2_EQUIVALENTS.carKm),
    flights:   +(kg / CO2_EQUIVALENTS.flightAmmanDubai).toFixed(2),
    phones:    Math.round(kg / CO2_EQUIVALENTS.smartphoneCharge),
  };
}
```

Example output for Downtown (1,018 kg CO₂):
- **46.8 trees** planted for a full year
- **4,848 km** not driven by car
- **5.2 return flights** Amman ↔ Dubai avoided
- **119,765 smartphone charges** offset

---

## Data model extensions needed

To support Phase 1 ideas, the `District` type needs these additions:

```ts
// Current District type (from types.ts)
export interface District {
  id: string;
  name: string;
  polygon: [number, number][];
  centroid: [number, number];
  co2Potential: number;
  co2Achieved: number;
  topMaterial: string;
  orderCount: number;
}

// Extended District type (Phase 1 additions)
export interface District {
  // ...existing fields...
  
  // Per-material breakdown (for stacked bars and material filter)
  materialBreakdown: {
    cookingOil:  { potential: number; achieved: number };
    plastic:     { potential: number; achieved: number };
    paper:       { potential: number; achieved: number };
    electronics: { potential: number; achieved: number };
  };
  
  // For business client pins (Phase 2 — null until backend)
  businessCount?: number;
  
  // Urgency scoring (Phase 2 — computed field)
  priorityScore?: number;
  lastCollectionDate?: string;
}
```

---

## Foundation for the Hub page

Everything on this heatmap feeds directly into the third page (Hubs). Here's the connection:

| Heat Map insight | Hub page application |
|---|---|
| Hub Coverage Overlay (circles) | Default "Coverage" view on Hub page — shows which districts each hub serves |
| Coverage Gap (red zones) | Hub page header: "2 districts uncovered — consider adding a hub" |
| District-to-Hub flow lines | Hub page: shows incoming material flow per hub |
| Hub Demand Score | Hub page: "Suggested next hub location" recommendation card |
| Material Filter Layer | Hub page: filter hubs by which materials they accept |
| Priority Queue | Hub page: hubs accepting the priority-queue materials shown first |

The Hub page should feel like a **management view of the same intelligence** — the heat map shows districts, the hub page shows the infrastructure that serves them. Same data, different angle.

---

## Concept card — Top idea: Material Filter Layer

```
IDEA: Material Filter Layer
TAGLINE: See the city through any material's eyes
PROBLEM: The map treats all recyclable materials as one. A van driver 
         specializing in electronics needs a different view than a 
         motorcycle rider collecting cooking oil from restaurants.
SOLUTION: A chip row above the map (or in the panel). When "Cooking Oil" 
          is selected, the choropleth re-renders using only oil data — 
          districts color by oil potential gap. Other materials fade to gray.
          The district list re-ranks by oil performance.
TARGET USER: Operations admin assigning riders by vehicle/material specialty
KEY INSIGHT: Not all riders are equal — specialization by material + vehicle 
             type is more efficient than generalist routing
EFFORT: S (small — extend District type + pass filterMaterial state)
BIGGEST RISK: District data doesn't have per-material breakdowns yet
QUICKEST TEST: Add the chip UI first, wire it to a filter that just highlights
               districts whose topMaterial matches — no new data needed
NEXT STEP: Add materialBreakdown to District type in constants.ts
```

---

## Concept card — Top idea: Hub Coverage Overlay

```
IDEA: Hub Coverage Overlay
TAGLINE: See who's covered and who's not — instantly
PROBLEM: There's no visual connection between districts (heat map) and hubs 
         (hub page). The admin can't see which districts are "served" by 
         existing hubs and which are logistically isolated.
SOLUTION: Import hub lat/lng into HeatMapLayer. Draw a semi-transparent 
          circle (radius 5km) around each active hub. Districts inside ≥1 
          circle are "covered" — those outside are candidates for a new hub 
          or for mobile collection points.
TARGET USER: Strategic manager planning infrastructure
           / Operations admin understanding rider range
KEY INSIGHT: Hub placement is currently intuitive. Making coverage visual 
             makes it data-driven.
EFFORT: S (import INITIAL_HUBS, add L.circle calls, toggle in View Mode)
BIGGEST RISK: 5km radius may not be accurate for Amman's geography/traffic
QUICKEST TEST: Add the circles as always-visible in Hubs view mode — 
               see if admins immediately understand the visual
NEXT STEP: Add "Hubs" option to the View Mode selector
```

---

## Concept card — Top idea: District Report Card

```
IDEA: District Report Card
TAGLINE: Every district tells its own story — and you can share it
PROBLEM: When an admin clicks a district, they see a static list row 
         highlighted. There's no depth — no narrative, no actionable summary, 
         no way to share the district's performance with a business client.
SOLUTION: Clicking a district transforms the panel's lower half into a 
          structured Report Card: CO₂ bar + equivalents, earnings distributed, 
          top material breakdown, active businesses count, and a "Share" 
          button that generates a shareable link or PDF.
TARGET USER: Operations admin + B2B account manager showing clients their impact
KEY INSIGHT: Clients stay loyal when they can see their impact concretely. 
             A shareable district report is a zero-cost retention tool.
EFFORT: M (medium — panel state management + CO₂ equivalents function + 
        share modal)
BIGGEST RISK: "Share" requires a backend endpoint to generate a token/link
QUICKEST TEST: Build the report card panel first (no share button). Verify 
               admins find it useful before building the share feature.
NEXT STEP: Design the Report Card layout in the panel; add co2Equivalents() 
           function to helpers.ts
```

---

*Last updated: 2026-06-25 · Dawer Operations Dashboard · Heat Map Intelligence*
