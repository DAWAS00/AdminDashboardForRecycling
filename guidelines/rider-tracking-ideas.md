# Rider Route Tracking — Ideas & Feature Design

> **Feature goal:** When an admin clicks any order, the map shows the real road route the rider will take, animates the rider moving along it, counts down a live ETA, and captures trip performance data that flows into reports.

**Techniques used:** First Principles, SCAMPER, Cross-Domain Analogies (Uber, Air Traffic Control, F1 pit stop timer), NAF Scoring

---

## 1. First Principles — What Does Tracking Actually Need?

| Admin question | Required data |
|---|---|
| Where is the rider going? | Rider position + delivery address coordinates |
| Which road will they take? | A route polyline on the map |
| How long will it take? | Distance ÷ speed = ETA |
| How well are they performing? | Actual time vs estimated time, per trip |

Everything else builds on these four. This defines the minimum viable version.

---

## 2. Current State Gap

| Need | Have | Gap |
|---|---|---|
| Rider position | ✅ `rider.lat`, `rider.lng` | None |
| Delivery address coordinates | ❌ Only a string address | Add `deliveryLat`, `deliveryLng` to Order |
| Hub coordinates (pickup) | ✅ `hub.lat`, `hub.lng` | None |
| Route polyline | ❌ None | Need routing API (OSRM) |
| Movement simulation | ❌ Riders are static | Need `setInterval` + interpolation |
| ETA calculation | ❌ None | Distance → time formula |
| Trip time capture | ❌ None | Record `startedAt` / `completedAt` |
| Performance metrics | ❌ None | `CompletedTrip[]` state + aggregation |

**Critical enabler — OSRM (Open Source Routing Machine):**
- Public demo server: `router.project-osrm.org` — no API key, no cost
- Endpoint: `https://router.project-osrm.org/route/v1/driving/{lng},{lat};{lng},{lat}?overview=full&geometries=geojson`
- Returns: GeoJSON route geometry, `duration` (seconds), `distance` (meters)
- This is what makes real road routes feasible with no backend

---

## 3. SCAMPER Analysis

| Lens | Application |
|---|---|
| **Substitute** | Replace static rider markers with animated dots sliding along route polylines |
| **Combine** | Merge route line + ETA + pickup pin + delivery pin into one "trip card" on the map |
| **Adapt** | Adapt Uber's surge zones → Dawer "slow zones" — districts where deliveries consistently take longer |
| **Modify** | Speed variation: rider moves slower in Downtown (dense), faster on Airport Road |
| **Put to other use** | Completed route data → "best paths" library → suggest faster routes to future riders |
| **Eliminate** | Remove need to click — auto-show the active route for any rider currently delivering |
| **Reverse** | Instead of admin watching → riders see their own route on a mobile link; admin sees fleet-wide overview |

---

## 4. Cross-Domain Analogies

| Domain | Analogy | Dawer Application |
|---|---|---|
| **Uber/Deliveroo** | Route + ETA shown to customer | Show to admin for multiple riders simultaneously |
| **Air Traffic Control** | All flights visible with paths | "Fleet Radar Mode" — all active routes at once, colored by on-time status |
| **Formula 1** | Every second tracked, pit crew knows exact time | Auto-start timer on `inTransit`, auto-stop on `completed` |
| **Google Maps** | "Arrive in 12–18 min" range | Show ETA range not single number — more honest |

---

## 5. All Ideas (25 Total)

### A — Route Visualization

| # | Idea | Description |
|---|---|---|
| A1 | **OSRM Route Polyline** | Fetch real road route from OSRM on order click. Draw as styled polyline on Leaflet map |
| A2 | **Animated Dashes** | Route polyline uses CSS `dashOffset` animation — dashes move in direction of travel |
| A3 | **Pickup + Delivery Pins** | Hub marker (warehouse icon) at start, destination marker (building icon) at end |
| A4 | **Multi-stop Route** | Rider with 2+ orders → one continuous route through all stops, nearest first |
| A5 | **Route Arc Fallback** | If OSRM fails, draw a Leaflet Bezier curve between points — always shows direction |
| A6 | **Fleet Radar Mode** | Toggle that shows ALL active rider routes simultaneously, color coded by ETA status |
| A7 | **Route Highlight on Hover** | Hovering a rider in the panel glows their route on the map without selecting |

### B — Movement Simulation

| # | Idea | Description |
|---|---|---|
| B1 | **Polyline Interpolation** | Move rider marker along OSRM route coords via `setInterval` every 300ms |
| B2 | **Speed Variation by District** | Slower in Downtown/Balad, faster on Airport Road — speed multiplier per zone |
| B3 | **Stop Simulation** | Pause rider 3s at pickup hub (loading), then continue to delivery |
| B4 | **Position Jitter** | ±0.0001° random noise per step — looks more like real GPS |
| B5 | **Camera Follow Mode** | Optional toggle: map pans to keep selected rider centered |
| B6 | **Staleness Indicator** | If simulated "last ping" >2 min ago, show grey ring + "Signal lost" on rider icon |

### C — ETA & Time Intelligence

| # | Idea | Description |
|---|---|---|
| C1 | **Live ETA Countdown** | OSRM duration → live countdown in rider drawer: "ETA: 14:32 (8 min remaining)" |
| C2 | **ETA Range** | Show "12–18 min" not a single number — ±30% variance makes it honest |
| C3 | **Time-of-Day Multiplier** | Morning peak 7–9am → ×1.4, afternoon 4–7pm → ×1.3, other → ×1.0 |
| C4 | **District Speed Benchmark** | Track avg delivery time per district → reports: "Downtown avg 22 min" |
| C5 | **ETA Confidence Color** | Green (>20% buffer), Amber (<20%), Red (already late) |
| C6 | **Arrival Ring Animation** | <1 min away → pulsing expanding ring from destination pin |

### D — Performance Data Capture (→ Reports)

| # | Idea | Description |
|---|---|---|
| D1 | **Auto Trip Timer** | `tripStartedAt = Date.now()` on `inTransit`, stop on `completed` |
| D2 | **Efficiency Score** | `osrmEstimate / actualDuration × 100` → 100% = exactly on time, >100% = faster |
| D3 | **On-Time Rate** | % orders completed within 110% of OSRM estimate, per rider |
| D4 | **Distance per Order** | km driven per order — high value = inefficient zone assignment |
| D5 | **Idle Detection** | Rider idle >10 min with no movement → flagged in report |
| D6 | **Rider Performance Card** | New report template: orders completed, avg time, efficiency %, total km, CO₂, earnings |
| D7 | **Slowest Districts Report** | Aggregate all trip times by district → shows admin where deliveries are hardest |

### E — UX Polish

| # | Idea | Description |
|---|---|---|
| E1 | **Route Progress Bar** | In order card: horizontal bar filling as rider moves. "63% · 1.8 km left · ~6 min" |
| E2 | **Estimated Arrival Chip** | Small chip next to each active order in panel: `~12 min` counting down live |
| E3 | **Route Distance Label** | Label on polyline midpoint: "3.2 km · 11 min" |
| E4 | **Trip Status Shimmer** | Rider name in panel shows subtle shimmer animation when actively moving |

---

## 6. NAF Scoring

| # | Idea | N | A | F | Total | Phase |
|---|---|---|---|---|---|---|
| B1 | Polyline Interpolation | 7 | 10 | 8 | **25** | 🔴 1 |
| C1 | Live ETA Countdown | 6 | 10 | 9 | **25** | 🔴 1 |
| A1 | OSRM Route Polyline | 6 | 10 | 8 | **24** | 🔴 1 |
| D1 | Auto Trip Timer | 5 | 10 | 9 | **24** | 🔴 1 |
| C5 | ETA Confidence Color | 6 | 9 | 9 | **24** | 🔴 1 |
| E1 | Route Progress Bar | 6 | 9 | 9 | **24** | 🔴 1 |
| A3 | Pickup + Delivery Pins | 5 | 9 | 9 | **23** | 🔴 1 |
| A2 | Animated Dashes | 7 | 8 | 8 | **23** | 🔴 1 |
| E3 | Route Distance Label | 7 | 8 | 8 | **23** | 🔴 1 |
| A4 | Multi-stop Route | 8 | 9 | 7 | **24** | 🟡 2 |
| D2 | Efficiency Score | 8 | 9 | 7 | **24** | 🟡 2 |
| D6 | Rider Performance Card | 8 | 9 | 7 | **24** | 🟡 2 |
| A6 | Fleet Radar Mode | 9 | 9 | 6 | **24** | 🟡 2 |
| D3 | On-Time Rate | 7 | 9 | 7 | **23** | 🟡 2 |
| D7 | Slowest Districts Report | 9 | 8 | 6 | **23** | 🟡 2 |
| B2 | Speed Variation by District | 8 | 8 | 7 | **23** | 🟡 2 |
| C3 | Time-of-Day Multiplier | 8 | 7 | 7 | **22** | 🟡 2 |
| C6 | Arrival Ring Animation | 8 | 7 | 7 | **22** | 🟡 2 |
| B5 | Camera Follow Mode | 7 | 7 | 8 | **22** | 🟡 2 |
| D5 | Idle Detection | 8 | 8 | 6 | **22** | 🟡 2 |
| A5 | Route Arc Fallback | 5 | 7 | 9 | **21** | 🔴 1 |
| B3 | Stop Simulation | 7 | 7 | 7 | **21** | 🟡 2 |

---

## 7. Concept Cards (Top 5)

---

### CONCEPT 1 — OSRM Route + Animated Rider Movement

**TAGLINE:** "Click any order — the road appears, the rider starts moving."

**PROBLEM:** The map shows rider positions as static dots. Admin can't see where they're going, which road, or if they'll be on time.

**SOLUTION:**
1. Admin clicks an order card in the drawer
2. App calls: `GET https://router.project-osrm.org/route/v1/driving/{hubLng},{hubLat};{orderLng},{orderLat}?overview=full&geometries=geojson`
3. OSRM returns: `geometry.coordinates[]` (road path), `duration` (seconds), `distance` (meters)
4. Leaflet draws green polyline with animated dashes
5. `setInterval` at 300ms advances rider marker along route coords
6. ETA countdown starts from OSRM duration

**New component:** `src/app/components/RouteLayer.tsx`
- Manages: one Leaflet Polyline + one animated marker + interval ref
- Cleans up on unmount (follows existing `useRef` + `.remove()` pattern)
- Props: `{ route: Route | null; riderId: number }`

**EFFORT:** M

**BIGGEST RISK:** OSRM demo server can go down → always render A5 Arc Fallback first, replace with real route when OSRM responds.

**QUICKEST TEST:** Hardcode one route (any two Amman hub coords), draw as static polyline, verify it follows real roads.

---

### CONCEPT 2 — Live ETA Countdown with Confidence Color

**TAGLINE:** "11 minutes. Green. Turning red if they're falling behind."

**SOLUTION:**
```typescript
// Store when trip starts:
tripStartedAt = Date.now();
adjustedDuration = osrmDuration * etaMultiplier(); // time-of-day factor

// Every second in a useEffect:
const elapsed = (Date.now() - tripStartedAt) / 1000;
const remaining = adjustedDuration - elapsed;
const isLate = elapsed > adjustedDuration * 1.1;

// Color logic:
const etaColor =
  remaining > adjustedDuration * 0.2 ? "var(--color-brand-600)"  // green
  : remaining > 0                     ? "var(--color-amber-600)"  // amber
  : "var(--color-danger-600)";        // red — running late

// Time-of-day multiplier:
function etaMultiplier(): number {
  const h = new Date().getHours();
  if (h >= 7 && h <= 9)   return 1.4;
  if (h >= 16 && h <= 19) return 1.3;
  return 1.0;
}
```

Show in two places:
- Order card in drawer: full countdown "ETA 14:32 · 8 min remaining" in confidence color
- Rider row in list: small chip `~8 min` next to order count

**EFFORT:** S

**BIGGEST RISK:** Timer and animation drift → always compute remaining time from `Date.now() - tripStartedAt`, never from a counter.

---

### CONCEPT 3 — Auto Trip Timer → Performance Data

**TAGLINE:** "Every completed order tells us how efficient the rider was."

**SOLUTION:**

```typescript
// New state in App.tsx:
const [completedTrips, setCompletedTrips] = useState<CompletedTrip[]>([]);

// When order → inTransit:
const startTrip = (orderId: string, riderId: number, route: Route) => {
  setActiveRoute({ orderId, riderId, startedAt: Date.now(), route });
};

// When order → completed:
const endTrip = () => {
  if (!activeRoute) return;
  const actualSeconds = (Date.now() - activeRoute.startedAt) / 1000;
  const efficiencyScore = (activeRoute.route.adjustedDurationSeconds / actualSeconds) * 100;
  setCompletedTrips(prev => [...prev, {
    orderId: activeRoute.orderId,
    riderId: activeRoute.riderId,
    startedAt: activeRoute.startedAt,
    completedAt: Date.now(),
    actualSeconds,
    osrmEstimateSeconds: activeRoute.route.adjustedDurationSeconds,
    distanceKm: activeRoute.route.distanceKm,
    efficiencyScore,
    district: getDistrictForCoords(activeRoute.route.coords.at(-1)!),
  }]);
};
```

**Rider Performance Card (new report template):**
```
Ahmad Al-Mansouri
Orders completed today:  6
Avg trip time:          14.2 min  (est. 13.8 min)
Efficiency score:       97% ✅
Total km driven:        34.2 km
CO₂ saved:              12.4 kg
Earnings:               18.50 JD
```

**EFFORT:** S (state) + M (report template)

**Important:** Label simulated data clearly — "Simulated estimates. Replace with real GPS in Phase 2."

---

### CONCEPT 4 — Fleet Radar Mode

**TAGLINE:** "One toggle — see every active delivery on the map at once."

**SOLUTION:**
Header toggle "Fleet Radar". When ON:
```typescript
// Fetch all active routes in parallel:
const activeRiders = riders.filter(r => r.status === "delivering");
const routes = await Promise.all(
  activeRiders.map(r => fetchOsrmRoute(nearestHub(r), r.activeOrder))
);

// Draw all routes simultaneously:
routes.forEach((route, i) => {
  const color = getEtaStatusColor(activeRiders[i]);
  L.polyline(route.coords, { color, weight: 2, opacity: 0.6 }).addTo(map);
});
```

Color coding:
- `var(--color-brand-600)` — green, on time
- `var(--color-amber-600)` — amber, within 5 min of late
- `var(--color-danger-600)` — red, overdue

When one rider is selected → their route goes to 100% opacity + 4px width, others fade to 15% opacity.

**EFFORT:** M

**BIGGEST RISK:** Visual noise with 10 routes. Fix: only show routes for `delivering` status (not `picking_up` or `idle`) + limit route line weight to 2px in radar mode.

---

### CONCEPT 5 — Route Progress Bar in Order Card

**TAGLINE:** "The order card shows exactly how far along the route the rider is."

**SOLUTION:**
Track `currentCoordIndex` in the animation loop. Compute:
```typescript
const progressPct = (currentCoordIndex / route.coords.length) * 100;
const remainingCoords = route.coords.length - currentCoordIndex;
const coordsPerKm = route.coords.length / route.distanceKm;
const kmRemaining = remainingCoords / coordsPerKm;
```

Render in the order card (replaces ProgressTrail for `inTransit` orders):
```
Hub ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━● Delivery
    [████████████████████████░░░░░░░░░░░░░░░]
         63% · 1.8 km left · ~6 min
```

Switch back to the 4-step ProgressTrail when `status === "completed"`.

**EFFORT:** S — reads from existing animation state, just renders a different bar.

---

## 8. Data Flow: Tracking → Reports

```
Admin clicks order in drawer
        │
        ▼
RouteLayer fetches OSRM route
Stores: { coords[], durationSeconds, distanceKm }
        │
        ▼
setInterval animates rider along coords
tripStartedAt = Date.now()
        │
        ▼
ETA countdown ticks every second
Route progress bar fills
Rider icon moves on map
        │
        ▼
Order marked completed (manual or animation end)
tripCompletedAt = Date.now()
efficiencyScore computed
        │
        ▼
Push to completedTrips[] state
        │
        ▼
Reports screen reads completedTrips[]
        │
    ┌───┴───┐
    │       │
    ▼       ▼
Rider      Slowest
Performance Districts
Card       Report
```

---

## 9. New Types Required

```typescript
// Add to src/app/types.ts

// Extend Order:
// deliveryLat: number;
// deliveryLng: number;

export interface Route {
  coords: [number, number][];          // [lat, lng][] — road path from OSRM
  distanceKm: number;
  durationSeconds: number;             // raw OSRM estimate
  adjustedDurationSeconds: number;     // after time-of-day multiplier
}

export interface ActiveRoute {
  orderId: string;
  riderId: number;
  route: Route;
  currentCoordIndex: number;
  startedAt: number;                   // Date.now()
  progressPct: number;                 // 0–100
}

export interface CompletedTrip {
  orderId: string;
  riderId: number;
  startedAt: number;
  completedAt: number;
  actualSeconds: number;
  osrmEstimateSeconds: number;
  distanceKm: number;
  efficiencyScore: number;             // 100 = perfect, >100 = faster than estimated
  district: string;                    // for district-level aggregation in reports
}
```

---

## 10. New Files Required

| File | Responsibility |
|---|---|
| `src/app/components/RouteLayer.tsx` | Manages Leaflet polyline + animated marker + setInterval for one active route |
| `src/app/components/FleetRadarLayer.tsx` | Manages multiple simultaneous routes for Fleet Radar Mode |
| `src/app/lib/osrm.ts` | `fetchRoute(startLat, startLng, endLat, endLng): Promise<Route>` — OSRM API wrapper with Arc fallback |
| `src/app/lib/eta.ts` | `etaMultiplier()`, `formatEta(seconds)`, `getEtaColor(remaining, total)` |
| `src/app/lib/performance.ts` | `computeRiderStats(riderId, completedTrips[])`, `computeDistrictStats(completedTrips[])` |

---

## 11. Phase Breakdown

### Phase 1 — No Backend (simulation only)
- OSRM route fetch + polyline on order click
- Rider movement animation along route
- Live ETA countdown with confidence color
- Auto trip timer (start/stop)
- Route progress bar in order card
- Pickup + delivery pins
- Route arc fallback when OSRM fails
- Route distance label on map

### Phase 2 — With Backend/Mobile
- Real GPS position updates from rider mobile app (WebSocket)
- Real trip data persisted to database
- Multi-stop optimized routing (nearest hub algorithm)
- Fleet Radar Mode with real-time updates
- Speed variation calibrated from actual trip history
- Idle detection (real position comparison)
- Rider Performance Report with historical data

### Phase 3 — Intelligence Layer
- District speed benchmark from real history
- Slowest Districts Report
- Route suggestion engine (best paths from past trips)
- Demand forecasting by district + time of day

---

## 12. Connection to Other Features

| This feature | Connects to |
|---|---|
| `CompletedTrip.district` | **Heatmap** — overlay delivery time data on district choropleth |
| `CompletedTrip.efficiencyScore` per rider | **Rider Panel** → TodayStats tab (show efficiency score) |
| `CompletedTrip[]` aggregated | **Reports** → Rider Performance Card + Slowest Districts |
| `Route.distanceKm` | **CO₂ calculations** — actual km driven vs km saved by not using a car |
| `FleetRadarLayer` | **Hub placement** — where do routes cluster? → informs next hub location |

---

*Created: 2026-06-25 · Dawer Operations Dashboard · Rider Route Tracking Ideas*
