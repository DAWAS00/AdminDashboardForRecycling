# Dawer Dashboard — v2 Stack Recommendation

> **Author:** Architecture review, June 2026
> **Scope:** What to remove, what to activate, what to add — and the Copilot prompts to enforce it.
> **Anti-goal:** This document deliberately avoids generic "best practices." Every recommendation is tied to a specific constraint of this project.

---

## 1. Diagnosis — What the Dependency List Reveals

Running `package.json` against the guidelines reveals a split-personality problem:

```
Installed and used:          Installed and NOT used:       Installed and HARMFUL:
─────────────────────        ──────────────────────────    ──────────────────────
react-leaflet + leaflet      react-router                  @mui/material
lucide-react                 recharts                      @emotion/react
Radix UI (full suite)        react-dnd                     @emotion/styled
react-hook-form              motion (Framer)
date-fns                     vaul (drawer)
tailwind v4                  sonner (toasts)
clsx + tailwind-merge        cmdk (command palette)
class-variance-authority     react-day-picker
canvas-confetti              @tanstack/* (not installed)
```

**The core contradiction:** The project built a precise CSS design token system (`--color-brand-*`, `--font-sans`, `--space-*`) and simultaneously installed Material UI — a component library with its own theming engine, its own color system, and its own CSS-in-JS layer (`@emotion`). These two systems will fight each other on every AI-generated code snippet. MUI is the single largest source of "AI slope" risk in this project.

**The second problem:** `App.tsx` is 361 lines and growing. After Phase 2 wires three Supabase hooks into it, it will cross 450 lines. Every new feature goes into `App.tsx` because that's where state lives. This pattern collapses at the first time two views need to share ephemeral state without re-rendering the whole tree.

**The third problem:** `react-router` is installed but the app uses `useState<ViewId>` for navigation. This means no deep linking, no browser back button, no bookmarkable URLs. When an operations admin opens the dashboard on a second monitor and wants to go directly to the heat map, they can't.

---

## 2. What to Remove

### Remove immediately: MUI + Emotion

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling"
npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled react-popper
```

**Why:** MUI has its own theming system that conflicts with Tailwind v4 and the CSS custom property token system. When Copilot generates code, it defaults to MUI components and MUI `sx={{}}` props — these bypass the Dawer design tokens entirely, introducing hardcoded colors and spacing that the design system was built to prevent. The Radix UI suite (already installed) handles all the accessible primitive components that MUI was presumably added for.

**What replaces MUI components:** Every MUI component has a direct Radix UI equivalent already in the project:
| MUI component | Already installed |
|---|---|
| Dialog / Modal | `@radix-ui/react-dialog` |
| Dropdown | `@radix-ui/react-dropdown-menu` |
| Tooltip | `@radix-ui/react-tooltip` |
| Tabs | `@radix-ui/react-tabs` |
| Switch | `@radix-ui/react-switch` |
| Select | `@radix-ui/react-select` |
| Slider | `@radix-ui/react-slider` |
| Progress | `@radix-ui/react-progress` |
| Icons | `lucide-react` |

### Remove: react-popper

Duplicate of Radix's internal floating-ui. Not needed.

### Remove: react-slick

`embla-carousel-react` is already installed and is the better modern choice. Having both creates confusion.

---

## 3. What to Activate (Already Installed, Not Yet Used)

These packages are paid for (bundle size) but deliver zero value. Activating them unlocks features the guidelines already describe.

### 3a. react-router → URL-based navigation

**Current problem:** `useState<ViewId>("map")` means the URL never changes. Deep linking is impossible.

**Activation:**

```tsx
// src/main.tsx — replace ReactDOM.createRoot(...).render(<App />) with:
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  { path: "/",          element: <AppShell />, children: [
    { index: true,      element: <MapView /> },
    { path: "heatmap",  element: <HeatmapView /> },
    { path: "hubs",     element: <HubsView /> },
    { path: "partners", element: <PartnersView /> },
    { path: "reports",  element: <ReportsView /> },
  ]},
]);
```

**Payoff:** Admin bookmarks `https://dashboard.dawer.app/heatmap`. Operations manager opens `https://dashboard.dawer.app/partners` directly. Browser back button works.

### 3b. recharts → Reports + trend charts

**Current state:** Reports screen is a placeholder. The `reports-ideas.md` describes 10 report types, all requiring charts.

**Immediate use cases:**
- Weekly CO₂ trend line (B1 — Operations Summary)
- District achievement bar chart (B2 — District Intelligence Brief)
- Material breakdown pie/donut (B5 — Material Market Pulse)
- Earnings trend per rider (B1)

These are 4-8 lines of JSX each using the already-installed recharts. No new dependency needed.

### 3c. vaul → Drawers (RiderDetailDrawer, PartnerDetailDrawer)

**Current pattern:** Zone 3 of the Rider panel (per the design spec) is a persistent drawer at the bottom. The PartnerDetailDrawer in the existing guidelines spec is a full-height slide-in.

`vaul` is a Radix-compatible drawer component designed exactly for this. It handles touch gestures, backdrop, and snap points. Use it for:
- `RiderDetailDrawer` (Zone 3 of rider panel)
- `PartnerDetailDrawer` (partner card click → detail)
- `DistrictReportCard` (heatmap district click → detail panel)

### 3d. sonner → Operational feedback toasts

Every CRUD operation currently fails silently or needs manual error display. `sonner` gives the admin:
- "Hub Downtown marked as Ready to Ship" (green toast)
- "Failed to connect to Supabase — check your connection" (red toast, with retry)
- "Rider Ahmad Khalil — overtime alert (22 min, estimated 20)" (amber toast with dismiss)

### 3e. motion → GPU-accelerated map marker animation

The `passive-animation-plan.md` uses `setInterval + marker.setLatLng()` directly on Leaflet instances. This works but is CPU-based. `motion` (Framer Motion v11+) can animate rider marker positions using GPU transforms via its independent animation engine — no React re-renders during movement.

### 3f. cmdk → Admin command palette

The `reports-ideas.md` and fleet management research describe an admin who manages multiple things at once. A command palette (`Cmd+K` / `Ctrl+K`) lets them:
- Jump to a specific rider: "Ahmad"
- Jump to a district: "Sweifieh"
- Generate a report: "export downtown week"
- Focus a hub: "Hub Jubaiha"

`cmdk` is already installed. Wire it to a `Cmd+K` keydown listener in App.tsx. It's 30 minutes of work.

### 3g. react-dnd → Report builder drag-and-drop

The reports-ideas.md describes Idea A2: "Data Block Composer — drag-and-drop blocks onto a canvas." `react-dnd` + `react-dnd-html5-backend` are already installed. This is the only missing wiring for the full reports builder.

### 3h. react-day-picker → Heatmap time scrubber

The heatmap-ideas.md describes a time scrubber: "a slider from 'Now' to '30 days ago.'" `react-day-picker` provides a range picker for selecting the time window. Wire to the heatmap view's period toggle.

---

## 4. What to Add (Genuinely Missing)

### 4a. Zustand — state management

**Install:** `npm install zustand`

**Why:** `App.tsx` at 361 lines already contains state that logically belongs to separate domains:
- `selectedRider`, fleet filters → **FleetStore**
- `selectedHub`, `placingHub`, `pendingCoords` → **HubStore**
- `activeView` → **ViewStore** (or replaced by react-router state)
- `heatMapViewMode`, `materialFilter`, `selectedDistrict` → **HeatmapStore**
- `activeRoute`, `completedTrips`, `fleetRadar` → **AnimationStore**

Zustand makes each store independently subscribable. A component that only cares about `selectedRider` does not re-render when `materialFilter` changes. This is impossible with App.tsx prop drilling.

**Store shape:**
```typescript
// src/stores/fleetStore.ts
import { create } from "zustand";

interface FleetState {
  selectedRiderId: string | null;
  filterStatus: "all" | "delivering" | "picking_up" | "idle";
  selectRider: (id: string | null) => void;
  setFilter: (f: FleetState["filterStatus"]) => void;
}

export const useFleetStore = create<FleetState>((set) => ({
  selectedRiderId: null,
  filterStatus: "all",
  selectRider: (id) => set({ selectedRiderId: id }),
  setFilter: (f) => set({ filterStatus: f }),
}));
```

Components call `useFleetStore(s => s.selectedRiderId)` — no prop drilling, no context, no re-render cascade.

### 4b. TanStack Query — data caching layer

**Install:** `npm install @tanstack/react-query`

**Why the current hooks are insufficient:** The `useRiders`, `useHubs`, `useClients` hooks we wrote in Phase 2 work correctly but have no caching, no deduplication, no background refresh, and no loading/error state that survives navigation. Every time the user switches from the map view back to it, `useRiders` runs `fetch()` again from scratch.

**Pattern with TanStack Query + Supabase:**

```typescript
// src/hooks/useRiders.ts (v2)
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useRiders() {
  return useQuery({
    queryKey: ["riders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users").select("*").eq("role", "driver");
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,          // treat data as fresh for 30s
    refetchInterval: 60_000,    // background refresh every 60s
    refetchOnWindowFocus: true, // refresh when admin tabs back
  });
}
```

Supabase Realtime events then call `queryClient.invalidateQueries(["riders"])` to trigger a precise re-fetch — not a blind re-mount of everything.

**Mutations (hub CRUD) become optimistic:**
```typescript
const addHub = useMutation({
  mutationFn: (newHub) => supabase.from("hubs").insert(newHub),
  onMutate: async (newHub) => {
    // Cancel outgoing queries, snapshot current state, optimistically update
    await queryClient.cancelQueries(["hubs"]);
    const prev = queryClient.getQueryData(["hubs"]);
    queryClient.setQueryData(["hubs"], (old) => [...old, { id: "temp", ...newHub }]);
    return { prev };
  },
  onError: (err, newHub, ctx) => {
    queryClient.setQueryData(["hubs"], ctx.prev); // rollback
    toast.error("Failed to add hub");
  },
  onSettled: () => queryClient.invalidateQueries(["hubs"]),
});
```

The admin clicks "Add Hub" and it appears immediately — even before Supabase confirms. If Supabase fails, it rolls back with a toast.

### 4c. Vitest + Testing Library + Playwright

**Install:**
```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/user-event jsdom
npm install -D playwright @playwright/test
```

**Why this matters for "AI slope" prevention:** Without tests, every AI-generated code change is a gamble. The guidelines describe precise behavior that must be preserved — the severity ladder for delivery timer badges (levels 0–4), the earnings bar scaling, the Realtime event handlers. Vitest tests lock these behaviors in. Any AI-generated refactor that breaks them fails the test suite before it's committed.

**Vitest config for Vite:**
```typescript
// vite.config.ts — add test block
export default defineConfig({
  // ...existing config
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

**What to test first** (highest value per the guidelines' research):
1. `deliveryUrgencyLevel()` — the 5-level severity ladder. 5 test cases, covers the most important operational behavior.
2. `adaptRider()` from adapters.ts — confirms Supabase rows map to the right status.
3. `useHubs` mutation — optimistic update + rollback.

**Playwright** for the flows that can't be unit tested:
- Admin adds a hub via map click → hub appears in panel → verify in DB
- Driver location update → rider marker moves on live map (Realtime)
- Hub status cycle: collecting → ready → shipped → Supabase verified

### 4d. Zod — form validation

**Install:** `npm install zod`

Already have `react-hook-form`. Zod gives it schema-level validation that generates TypeScript types simultaneously:

```typescript
const addHubSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(60),
  address: z.string().min(5),
  schedule: z.enum(["weekly", "monthly"]),
});

type AddHubForm = z.infer<typeof addHubSchema>; // TypeScript type is free
```

This matters because AI-generated form code frequently adds validation as ad-hoc `if` statements. Zod forces validation to be declared, typed, and testable.

### 4e. @react-pdf/renderer — CO₂ certificates and reports

**Install:** `npm install @react-pdf/renderer`

The reports screen's highest-value feature (per `reports-ideas.md`) is the CO₂ Impact Certificate (Report B3): a downloadable PDF personalized with company name, CO₂ saved, material tonnage, and CO₂ equivalents (trees, car-km). The `Co2CertificateReport.tsx` component already exists — it needs a PDF rendering layer.

`@react-pdf/renderer` lets you write the PDF as React components using Dawer's design tokens. The certificate can use Cairo font for Arabic business names.

---

## 5. Architecture Shift: Feature Folders

**Current structure (flat, everything in `src/app/components/`):**
```
src/app/
  App.tsx          ← 361 lines, all state, all handlers
  components/
    RiderPanel.tsx
    HeatMapPanel.tsx
    HeatMapLayer.tsx
    HubsPanel.tsx
    LeftSidebar.tsx
    partners/
    reports/
    rider/
    heatmap/
```

**Target structure (feature-scoped, mirrors the Flutter app's architecture):**
```
src/
  stores/              ← Zustand (one per domain)
    fleetStore.ts
    hubStore.ts
    heatmapStore.ts
    animationStore.ts
  hooks/               ← TanStack Query wrappers
    useRiders.ts
    useHubs.ts
    useClients.ts
    useOrders.ts
  lib/                 ← Supabase client + adapters (already done in Phase 2)
    supabase.ts
    adapters.ts
  routes/              ← react-router route components (thin shells)
    MapRoute.tsx
    HeatmapRoute.tsx
    HubsRoute.tsx
    PartnersRoute.tsx
    ReportsRoute.tsx
  features/            ← All feature logic lives here
    fleet/
      FleetMap.tsx
      FleetPanel.tsx
      RiderRow.tsx
      RiderDetailDrawer.tsx
      FleetSummaryHeader.tsx
    heatmap/
      HeatmapMap.tsx
      HeatmapPanel.tsx
      DistrictCard.tsx
      MaterialFilterBar.tsx
      ViewModeSelector.tsx
    hubs/
      HubsMap.tsx
      HubsPanel.tsx
      HubCard.tsx
      AddHubModal.tsx
    partners/
      PartnersView.tsx
      PartnerCard.tsx
      PartnerDetailDrawer.tsx
      MRRStrip.tsx
      ChurnAlertPanel.tsx
    reports/
      ReportsScreen.tsx
      ReportTemplateCard.tsx
      Co2Certificate.tsx
  ui/                  ← Shared design system (NOT MUI)
    tokens.ts          ← CSS var names as TS constants (prevents AI hardcoding hex)
    Button.tsx
    Badge.tsx
    Card.tsx
    Drawer.tsx         ← wraps vaul
    Toast.tsx          ← wraps sonner
  main.tsx             ← QueryClientProvider + RouterProvider
```

**The AppShell component** (replaces the current `App.tsx` rendering logic) becomes thin:
```tsx
// src/features/shell/AppShell.tsx
export function AppShell() {
  return (
    <div className="app-shell">
      <LeftSidebar />
      <StatsBar />
      <Outlet />          {/* react-router fills this */}
      <CommandPalette />  {/* cmdk, always mounted */}
    </div>
  );
}
```

State that was in App.tsx moves to Zustand stores. Props that were drilled 3 levels down become single-line store reads.

---

## 6. Avoiding the AI Slope — 4 Rules

The "AI slope" describes the tendency of AI-generated code to gravitate toward the safest, most generic implementation — which in React typically means:

1. Reaching for MUI (removed — problem solved at dependency level)
2. Hardcoding color hex values instead of using design tokens
3. Creating new `useState` in the component instead of reading from the store
4. Writing `useEffect` + `fetch()` instead of using `useQuery`

These four rules prevent the slope when using Copilot:

**Rule 1 — Never hardcode colors.** If you see `color: "#1E5C35"` in generated code, reject it. The correct form is `color: var(--color-brand-600)` or the Tailwind class `text-[color:var(--color-brand-600)]`. The `tokens.ts` file maps these to TypeScript constants so autocomplete surfaces them.

**Rule 2 — Never create local fetch state.** If generated code has `const [data, setData] = useState([])` + `useEffect(() => { fetch(...) }, [])`, reject it. Data that comes from Supabase always lives in a `useQuery` hook.

**Rule 3 — Never add state to a feature component.** If generated code has `useState` inside `RiderRow.tsx` or `PartnerCard.tsx`, reject it unless it's purely UI-local (open/closed, hover). Anything business-logic-adjacent belongs in a Zustand store.

**Rule 4 — Never import from MUI.** This is enforced by removing the package. If MUI somehow reappears in generated code, it's a sign the developer reinstalled it — which is the prompt to revisit this document.

---

## 7. Copilot Prompts to Build for This Stack

Save all four to `.github/prompts/` in the dashboard project. These enforce the rules above at the code-generation level.

### Prompt 1: `dawer-component.prompt.md`
Teaches Copilot the Dawer design system. Prevents hardcoded hex values and MUI imports. Required for all UI work.

### Prompt 2: `zustand-store.prompt.md`
Generates a new Zustand store following the project's pattern. Accepts the domain name as input and produces the store file + TypeScript types.

### Prompt 3: `supabase-query.prompt.md`
Generates a TanStack Query hook for a Supabase table. Includes optimistic mutation pattern, Realtime invalidation wiring, and error toast.

### Prompt 4: `vitest-component-test.prompt.md`
Generates Vitest + Testing Library tests for a given component or hook. Enforces the dashboard's testing conventions: mock Supabase client, mock Zustand stores, test behavior not implementation.

---

## 8. Execution Order

Do not attempt all of this at once. The right order:

| Step | Action | Risk if skipped |
|---|---|---|
| **1** | Remove MUI + Emotion | Every future AI codegen reaches for MUI |
| **2** | Add Zustand | App.tsx grows past 600 lines, becomes impossible to refactor |
| **3** | Wire react-router | Deep linking never works, can't add Playwright tests |
| **4** | Add TanStack Query | Phase 2 hooks have no caching or optimistic updates |
| **5** | Add Vitest | Stack changes have no regression net |
| **6** | Activate recharts + vaul + sonner | Reports and drawers stay as placeholders |
| **7** | Add Zod | Form validation stays as ad-hoc `if` statements |
| **8** | Add @react-pdf/renderer | CO₂ certificates can't be generated |
| **9** | Write 4 Copilot prompts | AI slope continues in every future session |

Steps 1–5 are the foundation. Steps 6–8 are feature unlocks. Step 9 makes all the above sustainable.

---

## Summary

| Category | Package | Action | Reason |
|---|---|---|---|
| **REMOVE** | @mui/material + @emotion | Uninstall | Conflicts with design token system; primary AI slope source |
| **REMOVE** | react-popper | Uninstall | Duplicate of Radix internals |
| **REMOVE** | react-slick | Uninstall | Duplicate of embla-carousel |
| **ACTIVATE** | react-router | Wire up | URL navigation, deep linking |
| **ACTIVATE** | recharts | Wire up | Reports screen charts |
| **ACTIVATE** | vaul | Wire up | Rider + Partner drawers |
| **ACTIVATE** | sonner | Wire up | Operational toast feedback |
| **ACTIVATE** | motion | Wire up | GPU-accelerated rider markers |
| **ACTIVATE** | cmdk | Wire up | Admin command palette |
| **ACTIVATE** | react-dnd | Wire up | Report builder drag-and-drop |
| **ACTIVATE** | react-day-picker | Wire up | Heatmap time scrubber |
| **ADD** | zustand | Install | Replace App.tsx god state |
| **ADD** | @tanstack/react-query | Install | Data caching, optimistic mutations |
| **ADD** | vitest + @testing-library/react | Install | Regression safety net |
| **ADD** | playwright | Install | E2E for Realtime + map flows |
| **ADD** | zod | Install | Type-safe form validation |
| **ADD** | @react-pdf/renderer | Install | CO₂ certificate PDF export |
