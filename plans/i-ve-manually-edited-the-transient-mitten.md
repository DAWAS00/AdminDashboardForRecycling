# Plan: Real Map + Improved Rider Tracking Dashboard

## Context
The user wants the dashboard to use a **real interactive map** (not the current hand-drawn SVG) with Amman, Jordan tiles, and wants each rider to be clearly identifiable on the map by their vehicle type (motorcycle vs. van). The reference image shows a two-panel layout: a narrow dark left sidebar for navigation, the map dominating the center, and data panels on the right. The current implementation uses a hand-coded SVG approximation of Amman with no geographic accuracy.

---

## Layout Redesign (matching reference image)

```
┌──────────┬──────────────────────────────┬──────────────────┐
│ Left Nav │        Real Leaflet Map       │  Right Panel     │
│ sidebar  │   (Amman, dark tile layer)    │  Rider list +    │
│ (icons + │   Rider markers on real       │  selected detail │
│ labels)  │   coordinates                 │  + order cards   │
├──────────┴──────────────────────────────┴──────────────────┤
│            Stats bar: CO2 + Materials                       │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Steps

### 1. Install mapping library
```
npm install react-leaflet leaflet
npm install -D @types/leaflet
```

### 2. Import Leaflet CSS
Add to `src/styles/fonts.css` (or a new import in the app entrypoint):
```css
@import 'leaflet/dist/leaflet.css';
```

### 3. Replace SVG map with real Leaflet map

**File: `src/app/App.tsx`**

Replace `AmmanMap` SVG component with a `<MapContainer>` from `react-leaflet` centered on Amman:
- Center: `[31.963, 35.910]`, zoom `13`
- Tile layer: **CartoDB Dark Matter** (free, no API key needed):  
  `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`  
  attribution: `© OpenStreetMap © CARTO`

### 4. Custom rider markers

Use Leaflet's `divIcon` to render a custom HTML element per rider:
- **Shape**: pill/badge showing a vehicle SVG icon + rider initials
- **Color**: green (delivering) / amber (picking_up) / slate (idle) — same STATUS_CONFIG
- **Vehicle icon**: inline SVG — a small motorcycle silhouette for "Motorcycle", a small van silhouette for "Van"
- **Size**: ~36×36px circle with a small label below showing the short name
- **Selected state**: larger border ring + elevated z-index
- Clicking a marker selects the rider and opens their detail in the right panel

**Real lat/lng coordinates for each rider** (replacing SVG x/y):

| Rider | Location | Lat | Lng |
|-------|----------|-----|-----|
| Ahmad Khalil | Downtown | 31.952 | 35.924 |
| Omar Hassan | 4th Circle | 31.957 | 35.885 |
| Tariq Mansour | Sweifieh | 31.944 | 35.871 |
| Khalid Nasser | Shmeisani | 31.978 | 35.882 |
| Yousef Rami | Jubaiha | 32.001 | 35.868 |
| Faisal Amin | Abdoun | 31.940 | 35.885 |
| Rami Diab | Tabarbour | 32.015 | 35.922 |
| Nidal Saad | 8th Circle | 31.959 | 35.855 |
| Bassam Qasim | Airport Rd | 31.912 | 35.950 |
| Imad Saleh | University | 32.008 | 35.878 |

### 5. Map interaction
- `Marker` onClick → sets `selectedId` state → right panel slides to show that rider's orders
- Selected marker: renders with a highlighted ring (larger icon, brighter border)
- Tooltip on hover shows rider name + status

### 6. Left sidebar refinement
A narrow sidebar (~60px icons + labels on hover, or ~180px expanded) with:
- RecycleJO logo/leaf icon
- Nav items: Live Map, Riders, Reports, CO₂ Stats (icons from lucide-react)
- "LIVE" pulse indicator at top

### 7. Right panel — keep existing `RiderPanel` logic
- Scrollable rider list with vehicle type visible (icon + "Motorcycle" / "Van")
- Selected rider expands to show order cards (material, qty, address, status badge, CO₂)
- Vehicle type shown prominently with a small icon in the rider list item

### 8. Stats bar — keep existing
No changes needed, already working well.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/app/App.tsx` | Replace `AmmanMap` SVG → Leaflet `MapContainer`; update rider data with real lat/lng; add left nav sidebar; improve rider list to show vehicle icons |
| `src/styles/fonts.css` | Add `@import 'leaflet/dist/leaflet.css'` |

---

## Verification
1. App loads without errors — Leaflet map tiles appear (dark CartoDB style)
2. All 10 rider markers visible at correct Amman locations with vehicle-type icons
3. Clicking a marker selects the rider and shows orders in right panel
4. Clicking the same rider in the list highlights their marker on the map
5. CO2 counter and material stats render correctly in the footer
6. No console errors about missing Leaflet CSS or icon assets
