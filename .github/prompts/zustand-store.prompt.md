---
description: "Create a new Zustand store for a Dawer dashboard domain (fleet, hubs, heatmap, partners, animation). Follows the project's slice pattern, TypeScript conventions, and domain naming."
mode: agent
tools:
  - codebase
  - editFiles
  - problems
  - search
---

# Zustand Store — Dawer Dashboard

You are a senior React/TypeScript engineer creating a new Zustand state store for the **Dawer (دوّر)** admin dashboard. Zustand stores replace the monolithic `App.tsx` state that previously held all application state in one component.

**You have full workspace access. Do not ask for permission before reading files or writing code.**

---

## Before Writing Anything

1. Read `src/app/types.ts` — understand the TypeScript types for the domain
2. Read `src/stores/` directory — understand the existing store pattern (grep below):

```bash
ls src/stores/ 2>/dev/null || echo "No stores directory yet — creating first store"
cat src/stores/*.ts 2>/dev/null | head -80
```

3. Read the relevant section of `App.tsx` to understand what state is being extracted:

```bash
grep -n "useState\|useCallback\|selectedRider\|selectedHub\|heatMapViewMode\|activeView" src/app/App.tsx | head -40
```

---

## Store Pattern

Every Dawer store follows this exact pattern:

```typescript
// src/stores/<domain>Store.ts
import { create } from "zustand";
import { type <DomainType> } from "../app/types"; // adjust import path

// 1. State shape — what the store holds
interface <Domain>State {
  // Data fields (read by components)
  selected<Entity>Id: string | null;
  filter: "<option1>" | "<option2>" | "all";
  // ... other state

  // Actions (called by components)
  select<Entity>: (id: string | null) => void;
  setFilter: (filter: <Domain>State["filter"]) => void;
  reset: () => void;
}

// 2. Initial state — extracted so reset() can use it
const initialState: Pick<<Domain>State, "selected<Entity>Id" | "filter"> = {
  selected<Entity>Id: null,
  filter: "all",
};

// 3. Create the store
export const use<Domain>Store = create<<Domain>State>((set) => ({
  ...initialState,

  select<Entity>: (id) => set({ selected<Entity>Id: id }),
  setFilter: (filter) => set({ filter }),
  reset: () => set(initialState),
}));
```

### Naming conventions

| Domain | Store name | File |
|---|---|---|
| Fleet (riders) | `useFleetStore` | `src/stores/fleetStore.ts` |
| Hubs | `useHubStore` | `src/stores/hubStore.ts` |
| Heatmap | `useHeatmapStore` | `src/stores/heatmapStore.ts` |
| Partners (clients) | `usePartnerStore` | `src/stores/partnerStore.ts` |
| Animation (map) | `useAnimationStore` | `src/stores/animationStore.ts` |

---

## Store Responsibilities by Domain

When creating a store, include ONLY state that belongs to that domain. Use this as a guide:

### FleetStore — rider selection and fleet filters

```typescript
interface FleetState {
  selectedRiderId: string | null;
  filterStatus: "all" | "delivering" | "picking_up" | "idle" | "offline";
  showFleetRadar: boolean;
  
  selectRider: (id: string | null) => void;
  setFilterStatus: (status: FleetState["filterStatus"]) => void;
  toggleFleetRadar: () => void;
  reset: () => void;
}
```

### HubStore — hub selection and placement mode

```typescript
interface HubState {
  selectedHubId: string | null;
  placingHub: boolean;
  pendingCoords: { lat: number; lng: number } | null;
  
  selectHub: (id: string | null) => void;
  startPlacing: () => void;
  cancelPlacing: () => void;
  confirmCoords: (coords: { lat: number; lng: number }) => void;
  reset: () => void;
}
```

### HeatmapStore — view mode, material filter, district selection

```typescript
type HeatmapViewMode = "operations" | "demand" | "hub-placement";
type MaterialFilter = "all" | "cookingOil" | "plastic" | "paper" | "electronics";

interface HeatmapState {
  viewMode: HeatmapViewMode;
  materialFilter: MaterialFilter;
  selectedDistrict: string | null;
  selectedPeriod: "today" | "week" | "month" | "custom";
  customDateRange: { from: Date; to: Date } | null;
  
  setViewMode: (mode: HeatmapViewMode) => void;
  setMaterialFilter: (filter: MaterialFilter) => void;
  selectDistrict: (name: string | null) => void;
  setPeriod: (period: HeatmapState["selectedPeriod"]) => void;
  setCustomRange: (range: { from: Date; to: Date } | null) => void;
  reset: () => void;
}
```

### PartnerStore — client selection and tier filters

```typescript
interface PartnerState {
  selectedClientId: string | null;
  filterTier: "all" | "free" | "basic" | "pro" | "enterprise";
  sortBy: "health" | "earnings" | "joined" | "renewal";
  
  selectClient: (id: string | null) => void;
  setFilterTier: (tier: PartnerState["filterTier"]) => void;
  setSortBy: (sort: PartnerState["sortBy"]) => void;
  reset: () => void;
}
```

---

## Anti-Patterns to Avoid

```typescript
// ❌ WRONG — server data in Zustand (this belongs in TanStack Query, not stores)
interface FleetState {
  riders: Rider[];           // ❌ server data
  isLoading: boolean;        // ❌ loading state
  fetchRiders: () => void;   // ❌ async action
}

// ✅ CORRECT — only ephemeral UI state in Zustand
interface FleetState {
  selectedRiderId: string | null;  // ✅ selection state
  filterStatus: string;            // ✅ filter state
  showFleetRadar: boolean;         // ✅ toggle state
}
```

```typescript
// ❌ WRONG — computed values in the store
interface HubState {
  activeHubCount: number;    // ❌ derived from server data, not store's job
  totalCapacity: number;     // ❌ computed value
}

// ✅ CORRECT — compute in the component from useHubs() data
const { data: hubs } = useHubs();
const activeHubCount = hubs?.filter(h => h.active).length ?? 0;
```

---

## After Creating the Store

1. Check if the store is used in `App.tsx` for state currently there:

```bash
grep -n "selectedRider\|selectedHub\|heatMap\|filterStatus" src/app/App.tsx
```

2. If App.tsx has state that belongs in the new store, replace it:

```tsx
// In App.tsx — REMOVE:
const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

// In the component that needs it — ADD:
const selectedRiderId = useFleetStore(s => s.selectedRiderId);
const selectRider = useFleetStore(s => s.selectRider);
```

3. Verify App.tsx compiles:

```bash
npx tsc --noEmit
```

4. Confirm no `useState` for the migrated fields remains in App.tsx:

```bash
grep -n "selectedRider\|selectedHub" src/app/App.tsx
```

Expected: no matches (or only comments).
