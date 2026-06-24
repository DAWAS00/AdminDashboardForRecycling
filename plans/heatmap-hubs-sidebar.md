# Plan: Heat Map View + Hub Management + Sidebar Restructure

## Context
The admin dashboard needs two new views beyond the live rider map: a CO₂ heat map for strategic insight (where can we save the most?), and a hub management screen where admins designate collection points, track capacity, and schedule factory shipments. The sidebar nav is also being restructured to house these.

---

## 1. Sidebar Restructure

| # | Icon | Label | Route |
|---|------|-------|-------|
| 1 | `MapPin` | Live Map | existing |
| 2 | `Layers` | Heat Map | new |
| 3 | `Warehouse` | Hubs | new |
| 4 | `BarChart2` | CO₂ Stats | existing |
| 5 | `FileText` | Reports | existing |

A single `activeView` state string drives which panel + map overlay renders. Sidebar is unchanged structurally — only the nav items change.

---

## 2. Heat Map View

### Map layer
Vanilla Leaflet — no plugin needed. Each Amman district gets two layered elements:
- **Fill polygon**: `L.polygon` with district boundary coords, filled with a green-to-amber color ramp based on CO₂ savings potential score
- **Circle pulse**: `L.circleMarker` at the district centroid, radius proportional to total material volume collected

Color scale (5 steps):
- `#166534` (≥80% potential) → `#22c55e` → `#84cc16` → `#f59e0b` → `#e5e7eb` (low/no data)

Districts to model (with approximate boundary polygons):
Downtown, Shmeisani, Sweifieh, Abdoun, Jubaiha, Tabarbour, 8th Circle area, Airport Road corridor, University district, Tlaa Al-Ali

### Data per district
Derived from order history (mock):
- `co2Potential` — estimated kg CO₂ saveable per week
- `co2Achieved` — kg already saved from orders
- `achievementPct` — achieved / potential
- `topMaterial` — highest volume material in that area
- `orderCount` — orders this period

### Right panel (district ranking)
A scrollable table, one row per district:
```
[color dot] Downtown          ████████░░  82%   1,240 kg potential
[color dot] Sweifieh          ██████░░░░  61%     890 kg potential
...
```
Columns: Rank · District · Progress bar · Achievement % · CO₂ potential · Top material chip

Toggle buttons at top: **Week** / **Month** (switches the data period — mock data switches between two datasets)

### Hover interaction
Hovering a district polygon highlights it and shows a tooltip:
- District name
- CO₂ potential this period
- Materials breakdown (oil/plastic/paper/electronics chips)
- "Active orders: N"

---

## 3. Hub Management View

### Concept
Hubs are physical collection points (a warehouse, a petrol station, a grocery store back-lot) where riders drop off collected materials. After a set period the hub ships a batch to the recycling factory.

### Map layer
- Hub markers use a distinct icon: filled square with a warehouse SVG (not a circle like riders)
- Color: dark green (`#1E5C35`) for Active, amber for "Ready to Ship", gray for Inactive
- Clicking a hub selects it and highlights it in the right panel

### Right panel — Hub list
Header: "Collection Hubs" + "**+ Add Hub**" button (green, opens placement mode)

Each hub row is a card with a **checkbox** (active/inactive toggle):
```
☑  [icon] Hub Al-Sweifieh
           Sweifieh Commercial District
           ████████░░  78% capacity  |  Next: Weekly · Thu
           Oil 120L · Plastic 34kg · Paper 18kg
           [Ready to Ship ▼]   [View Detail]
```

Fields per hub:
| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Admin-editable |
| `address` | string | |
| `lat/lng` | number | Set by clicking map |
| `active` | boolean | Checkbox toggle |
| `capacity` | number | Max kg/L per cycle |
| `currentLoad` | MaterialBreakdown | Running total since last shipment |
| `schedule` | "weekly" \| "monthly" | Dropdown |
| `nextShipmentDate` | Date | Auto-calculated |
| `lastShipmentDate` | Date | |
| `status` | "collecting" \| "ready" \| "shipped" | |

### Hub detail (expanded card or slide-over)
- Material breakdown bars (oil/plastic/paper/electronics)
- Capacity fill bar (color changes: green < 60%, amber 60–90%, red > 90%)
- Shipment history table: Date · Materials · Weight · Factory
- **"Schedule Shipment"** button — sets status to "ready", records date
- **"Mark as Shipped"** button — resets current load, updates last shipment date

### "Add Hub" placement flow
1. Admin clicks **+ Add Hub** → map cursor changes to crosshair, a banner says "Click on the map to place hub"
2. Click on map → modal/form appears: Name, Address (auto-filled from coordinates), Schedule (weekly/monthly), Capacity
3. Confirm → hub appears on map and in list

---

## 4. Data model additions

```ts
interface HubMaterials {
  cookingOil: number;   // L
  plastic: number;      // kg
  paper: number;        // kg
  electronics: number;  // kg
}

interface Hub {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  active: boolean;
  capacity: number;         // kg equivalent
  currentLoad: HubMaterials;
  schedule: "weekly" | "monthly";
  nextShipmentDate: string;
  lastShipmentDate: string;
  status: "collecting" | "ready" | "shipped";
}

interface District {
  id: string;
  name: string;
  polygon: [number, number][];   // lat/lng pairs
  centroid: [number, number];
  co2Potential: number;          // kg/week
  co2Achieved: number;
  topMaterial: string;
  orderCount: number;
}
```

---

## 5. Report-readiness

Every piece of data displayed maps cleanly to export columns:

| Report | Columns |
|--------|---------|
| Hub Shipment Report | Hub · Date · Material · Weight · CO₂ saved · Earnings |
| District CO₂ Report | District · Period · Potential · Achieved · % · Top material |
| Rider Performance | Rider · Orders · Materials · Earnings · CO₂ |
| Platform Summary | Total orders · Total earnings · Total CO₂ · Total materials by type |

---

## 6. Files to modify

| File | Change |
|------|--------|
| `src/app/App.tsx` | Add `activeView` state, new view components (`HeatMapView`, `HubsView`), updated `NAV_ITEMS`, hub + district mock data, `AddHubModal` |

No new files needed — all within `App.tsx` to keep the sandbox simple.

---

## 7. Verification
- Switching sidebar nav items swaps the view without losing map state
- Heat map polygons color correctly and tooltip on hover shows district data
- Hub checkboxes toggle active/inactive and update the map marker color
- "+ Add Hub" placement mode works: click map → form → hub appears
- "Schedule Shipment" and "Mark as Shipped" buttons update hub status chip and capacity bar
- Stats bar updates remain visible across all views
