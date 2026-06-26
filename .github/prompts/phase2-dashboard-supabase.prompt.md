---
description: "Wire the Dwaar admin dashboard (React 18 + TypeScript + Vite) to the shared Supabase backend — installs client, builds type adapters, creates live hooks for riders/hubs/partners, replaces all hardcoded constants with real-time data. Phase 2 of the App ↔ Supabase ↔ Dashboard integration."
mode: agent
tools:
  - codebase
  - editFiles
  - runCommands
  - problems
  - search
  - findTestFiles
---

# Phase 2 — Dashboard Supabase Integration (Dwaar)

You are a senior React/TypeScript engineer who also understands Supabase Realtime, RLS, and data adapter patterns. You are working on the **Dwaar admin dashboard** (`E:\Dawer DashBorad\AdminDashboardForRecycling`) — a React 18 + TypeScript + Vite + Tailwind v4 + Leaflet application that currently runs entirely on hardcoded static mock data. Your job is to replace every hardcoded constant with live Supabase reads and writes, implement Realtime subscriptions for the rider map, and wire CRUD operations into the existing UI panels.

**Prerequisite:** Phase 1 migrations must be applied to Supabase before this phase. The `hubs` table and partner fields on `public.users` must exist. Verify before starting.

**You have full workspace access. Read all files you need without asking permission. Run `npm run build` after every task to gate progress.**

---

## Context You Must Read First

Read these files before writing a single line of code:

1. `src/app/types.ts` — all TypeScript interfaces (`Rider`, `Hub`, `Order`, `Client`, `District`, etc.)
2. `src/app/constants.ts` — the static `RIDERS` and `INITIAL_HUBS` arrays you will replace
3. `src/app/App.tsx` — how state flows, which components receive what props
4. `src/app/components/RiderPanel.tsx` — current rider panel implementation
5. `src/app/components/HubsPanel.tsx` — current hub panel + AddHubModal wiring
6. `src/app/components/partners/PartnersView.tsx` — current partner view
7. `devPlans/2026-06-26-supabase-integration-plan.md` — Phase 2 spec (Tasks 4–11)

---

## Pre-flight Checks

Run all of these before creating any files.

### 1. Phase 1 complete?

```bash
# Must return 1 for each — if any returns 0, stop and run Phase 1 first
npx supabase db execute --sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='hubs';"
npx supabase db execute --sql "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='users' AND column_name='contract_tier';"
npx supabase db execute --sql "SELECT COUNT(*) FROM public.hubs;"
```

Expected: `1`, `1`, `4`. If any differ, stop — Phase 1 is not complete.

### 2. Supabase JS already installed?

```bash
cat package.json | grep supabase
```

If `@supabase/supabase-js` is listed, skip Task 4's install step.

### 3. Hooks already exist?

```bash
ls src/hooks/ 2>/dev/null || echo "hooks dir missing"
```

Report which of these already exist: `useRiders.ts`, `useHubs.ts`, `useClients.ts`.

### 4. .env.local has credentials?

```bash
cat .env.local 2>/dev/null | grep VITE_SUPABASE_URL || echo "MISSING"
```

If missing, you must create `.env.local` before the Supabase client will work.

### 5. Current build clean?

```bash
npm run build 2>&1 | tail -5
```

The build must be clean before you start. Fix any pre-existing errors first.

### Pre-flight report

| Check | Status | Action needed |
|---|---|---|
| Phase 1 DB applied | ✅/❌ | — |
| @supabase/supabase-js installed | ✅/⬜ | npm install |
| src/hooks/ exists | ✅/⬜ | will create |
| useRiders.ts exists | ✅/⬜ | will create |
| useHubs.ts exists | ✅/⬜ | will create |
| useClients.ts exists | ✅/⬜ | will create |
| .env.local present | ✅/⬜ | will prompt |
| Build currently clean | ✅/❌ | fix first |

---

## Task 4 — Install + Environment

### 4a. Install @supabase/supabase-js (skip if already present)

```bash
npm install @supabase/supabase-js
```

### 4b. Create `.env.local`

Only create if missing. **Never overwrite an existing `.env.local`.**

```
VITE_SUPABASE_URL=https://bpzuwwbtqqrpohfqjcuo.supabase.co
VITE_SUPABASE_SERVICE_KEY=<PASTE YOUR SERVICE_ROLE KEY HERE>
```

> The service_role key is in: Supabase Dashboard → Project Settings → API → `service_role` (secret).
> This file must NOT be committed. Confirm `.gitignore` includes `.env.local`.

### 4c. Verify Vite exposes VITE_ vars

Check `vite.config.ts` — Vite exposes all `VITE_*` vars automatically unless `envPrefix` is overridden. If it is, add `'VITE_'` to the prefix list.

### 4d. Build gate

```bash
npm run build
```

Expected: no errors. Commit only `package.json` and `package-lock.json`.

---

## Task 5 — Supabase Client + Raw Row Types

Create `src/lib/supabase.ts`:

```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://bpzuwwbtqqrpohfqjcuo.supabase.co";
const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY ?? "";

if (!SUPABASE_SERVICE_KEY) {
  console.warn(
    "[Dwaar Dashboard] VITE_SUPABASE_SERVICE_KEY not set. Add to .env.local."
  );
}

/** Service-role client — bypasses RLS. Never expose this key to end users. */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Raw Supabase row types (snake_case, mirrors Postgres schema exactly) ──────

export interface SupabaseUser {
  id: string;
  auth_id: string;
  name: string;
  phone: string;
  email: string | null;
  role: "driver" | "supplier" | "recyclingCo";
  supplier_type: "individual" | "storeBusiness" | null;
  rating: number;
  total_orders: number;
  is_verified: boolean;
  is_available: boolean;
  points: number;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
  vehicle_type: "motorcycle" | "car" | "pickup" | "van" | "truck" | "heavyTruck" | null;
  has_chemical_permit: boolean;
  address: string | null;
  profile_photo_url: string | null;
  categories: string[];
  // Partner fields (recyclingCo only — added in Phase 1)
  contract_tier: "free" | "basic" | "pro" | "enterprise";
  renewal_date: string | null;
  billing_cycle: "monthly" | "annual" | null;
  green_points: number;
  custom_price_jd: number | null;
  contract_notes: string | null;
  last_certificate_download: string | null;
  referred_by: string | null;
  created_at: string;
}

export interface SupabaseOrder {
  id: string;
  type: "pickup" | "collection" | "collectionSale";
  status: "pending" | "accepted" | "inTransit" | "completed" | "cancelled";
  supplier_id: string | null;
  driver_id: string | null;
  company_id: string | null;
  waste_types: string[];
  estimated_weight_kg: number;
  actual_weight_kg: number | null;
  reward_jd: number;
  is_urgent: boolean;
  notes: string | null;
  created_at: string;
  accepted_at: string | null;
  in_transit_at: string | null;
  completed_at: string | null;
}

export interface SupabaseDriverLocation {
  driver_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

export interface SupabaseHub {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  active: boolean;
  capacity_kg: number;
  current_load: {
    cookingOil: number;
    plastic: number;
    paper: number;
    electronics: number;
  };
  schedule: "weekly" | "monthly";
  next_shipment_date: string | null;
  last_shipment_date: string | null;
  status: "collecting" | "ready" | "shipped";
  created_at: string;
}
```

**Build gate:** `npm run build` — no errors.

---

## Task 6 — Type Updates + Data Adapters

### 6a. Update `src/app/types.ts` — change Rider.id and Hub.id from number → string

Open `types.ts`. Make these two targeted changes only:

```typescript
// Rider interface: change id type
id: string;  // was: id: number

// Hub interface: change id type  
id: string;  // was: id: number
```

### 6b. Fix downstream type errors

Run `npm run build 2>&1 | grep "error TS"` to find all breakages. The typical ones:

- `App.tsx`: `selectedRider: number | null` → `string | null`
- `App.tsx`: `selectedHub: number | null` → `string | null`
- Any `.find(r => r.id === someNumber)` comparison — the number literal becomes a string literal

Fix each error. Do not change any logic — only fix type compatibility.

### 6c. Create `src/lib/adapters.ts`

```typescript
import { Rider, Order, Hub, Client, ClientType, ContractTier } from "../app/types";
import {
  SupabaseUser, SupabaseOrder, SupabaseDriverLocation, SupabaseHub,
} from "./supabase";

// ── Waste type → dashboard material ────────────────────────────────────────────
const WASTE_TO_MATERIAL: Record<string, Order["material"]> = {
  oil: "Cooking Oil", cookingOil: "Cooking Oil",
  plastic: "Plastic Bottles", rubber: "Plastic Bottles",
  electronics: "Electronics", batteries: "Electronics", copperAluminium: "Electronics",
  paper: "Paper & Cardboard", cardboard: "Paper & Cardboard",
  glass: "Plastic Bottles", metal: "Plastic Bottles",
};

function mapWasteTypes(wasteTypes: string[]): Order["material"] {
  for (const wt of wasteTypes) {
    const mapped = WASTE_TO_MATERIAL[wt];
    if (mapped) return mapped;
  }
  return "Plastic Bottles";
}

// ── CO₂ estimate ───────────────────────────────────────────────────────────────
const CO2_PER_KG: Partial<Record<Order["material"], number>> = {
  "Cooking Oil": 2.7, "Plastic Bottles": 1.8,
  "Paper & Cardboard": 1.1, "Electronics": 8.0,
};

function estimateCo2(material: Order["material"], kg: number): number {
  return Math.round(((CO2_PER_KG[material] ?? 1.5) * kg) * 10) / 10;
}

// ── Status mapping ─────────────────────────────────────────────────────────────
function mapOrderStatus(s: SupabaseOrder["status"]): Order["status"] {
  if (s === "inTransit") return "inTransit";
  if (s === "completed") return "completed";
  if (s === "accepted")  return "accepted";
  return "pending";
}

function deriveRiderStatus(orders: Order[]): Rider["status"] {
  const active = orders.find(o => o.status === "inTransit" || o.status === "accepted");
  if (!active) return "idle";
  return active.status === "inTransit" ? "delivering" : "picking_up";
}

function mapVehicleType(vt: SupabaseUser["vehicle_type"]): Rider["vehicle"] {
  return (vt === "van" || vt === "truck" || vt === "heavyTruck") ? "Van" : "Motorcycle";
}

// ── Public adapters ────────────────────────────────────────────────────────────

export function adaptOrder(row: SupabaseOrder): Order {
  const material = mapWasteTypes(row.waste_types);
  const kg = row.actual_weight_kg ?? row.estimated_weight_kg;
  return {
    id: row.id,
    material,
    quantity: kg,
    unit: "kg",
    address: row.notes ?? "Jordan",
    deliveryLat: 31.963,   // PostGIS geography not parsed here — centroid fallback
    deliveryLng: 35.910,
    status: mapOrderStatus(row.status),
    co2Saved: estimateCo2(material, kg),
    earnings: row.reward_jd,
    createdAt: row.created_at.split("T")[0],
    completedAt: row.completed_at?.split("T")[0],
    acceptedAt: row.accepted_at ? new Date(row.accepted_at).getTime() : undefined,
  };
}

export function adaptRider(
  user: SupabaseUser,
  location: SupabaseDriverLocation | null,
  orders: SupabaseOrder[]
): Rider {
  const adaptedOrders = orders.map(adaptOrder);
  const status = deriveRiderStatus(adaptedOrders);
  return {
    id: user.id,
    name: user.name,
    nameAr: user.name,
    phone: user.phone,
    lat: location?.lat ?? 31.963,
    lng: location?.lng ?? 35.910,
    status,
    vehicle: mapVehicleType(user.vehicle_type),
    orders: adaptedOrders,
    idleSince: status === "idle" ? Date.now() - 5 * 60 * 1000 : undefined,
  };
}

export function adaptHub(row: SupabaseHub): Hub {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    active: row.active,
    capacityKg: row.capacity_kg,
    currentLoad: row.current_load,
    schedule: row.schedule,
    nextShipmentDate: row.next_shipment_date ?? "",
    lastShipmentDate: row.last_shipment_date ?? "",
    status: row.status,
  };
}

export function adaptClient(user: SupabaseUser): Client {
  return {
    id: user.id,
    name: user.name,
    type: "other" as ClientType,
    address: user.address ?? "",
    phone: user.phone,
    email: user.email ?? "",
    contractTier: (user.contract_tier ?? "free") as ContractTier,
    joinedDate: user.created_at.split("T")[0],
    orders: [],
    totalCo2Saved: 0,
    totalEarnings: 0,
    renewalDate: user.renewal_date ?? "",
    billingCycle: (user.billing_cycle ?? "monthly") as "monthly" | "annual",
    greenPoints: user.green_points ?? 0,
    customPriceJD: user.custom_price_jd ?? undefined,
    contractNotes: user.contract_notes ?? undefined,
    lastCertificateDownload: user.last_certificate_download ?? undefined,
    referredBy: user.referred_by ?? undefined,
  };
}
```

**Build gate:** `npm run build` — 0 errors before proceeding.

---

## Task 7 — Live Rider Hook with Realtime

Create `src/hooks/useRiders.ts`:

```typescript
import { useState, useEffect } from "react";
import { supabase, SupabaseUser, SupabaseDriverLocation, SupabaseOrder } from "../lib/supabase";
import { adaptRider } from "../lib/adapters";
import { Rider } from "../app/types";

export function useRiders() {
  const [riders, setRiders]   = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetch() {
      setLoading(true);
      const { data: users, error: e } = await supabase
        .from("users").select("*").eq("role", "driver");
      if (e || !users || cancelled) { if (e) setError(e.message); return; }

      const { data: locations } = await supabase
        .from("driver_locations").select("*");

      const ids = (users as SupabaseUser[]).map(u => u.id);
      const { data: orders } = await supabase
        .from("orders").select("*")
        .in("driver_id", ids)
        .in("status", ["pending", "accepted", "inTransit"]);

      if (cancelled) return;

      const locMap: Record<string, SupabaseDriverLocation> = {};
      for (const l of (locations ?? []) as SupabaseDriverLocation[]) locMap[l.driver_id] = l;

      const ordMap: Record<string, SupabaseOrder[]> = {};
      for (const o of (orders ?? []) as SupabaseOrder[]) {
        if (o.driver_id) (ordMap[o.driver_id] ??= []).push(o);
      }

      setRiders((users as SupabaseUser[]).map(u =>
        adaptRider(u, locMap[u.id] ?? null, ordMap[u.id] ?? [])
      ));
      setLoading(false);
    }

    fetch();

    // Realtime: re-fetch on any driver_location or order change
    const locCh = supabase.channel("dash-locations")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations" },
        () => { if (!cancelled) fetch(); })
      .subscribe();

    const ordCh = supabase.channel("dash-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" },
        () => { if (!cancelled) fetch(); })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(locCh);
      supabase.removeChannel(ordCh);
    };
  }, []);

  return { riders, loading, error };
}
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 8 — Hub CRUD Hook

Create `src/hooks/useHubs.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { supabase, SupabaseHub } from "../lib/supabase";
import { adaptHub } from "../lib/adapters";
import { Hub } from "../app/types";

export function useHubs() {
  const [hubs, setHubs]       = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: e } = await supabase
      .from("hubs").select("*").order("created_at", { ascending: true });
    if (e) { setError(e.message); return; }
    setHubs((data as SupabaseHub[]).map(adaptHub));
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const addHub = useCallback(
    async (coords: { lat: number; lng: number }, name: string, address: string) => {
      const { error: e } = await supabase.from("hubs").insert({
        name, address, lat: coords.lat, lng: coords.lng,
        active: true, capacity_kg: 1000,
        current_load: { cookingOil: 0, plastic: 0, paper: 0, electronics: 0 },
        schedule: "weekly", status: "collecting",
      });
      if (e) throw new Error(e.message);
      await refetch();
    }, [refetch]
  );

  const toggleHubActive = useCallback(
    async (hubId: string, active: boolean) => {
      const { error: e } = await supabase.from("hubs").update({ active }).eq("id", hubId);
      if (e) throw new Error(e.message);
      await refetch();
    }, [refetch]
  );

  const updateHubStatus = useCallback(
    async (hubId: string, status: Hub["status"]) => {
      const { error: e } = await supabase.from("hubs").update({ status }).eq("id", hubId);
      if (e) throw new Error(e.message);
      await refetch();
    }, [refetch]
  );

  return { hubs, loading, error, addHub, toggleHubActive, updateHubStatus };
}
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 9 — Partner CRUD Hook

Create `src/hooks/useClients.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { supabase, SupabaseUser } from "../lib/supabase";
import { adaptClient } from "../lib/adapters";
import { Client, ContractTier } from "../app/types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: e } = await supabase
      .from("users").select("*").eq("role", "recyclingCo")
      .order("created_at", { ascending: false });
    if (e) { setError(e.message); return; }
    setClients((data as SupabaseUser[]).map(adaptClient));
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const updateTier = useCallback(async (id: string, tier: ContractTier) => {
    const { error: e } = await supabase.from("users")
      .update({ contract_tier: tier }).eq("id", id);
    if (e) throw new Error(e.message);
    await refetch();
  }, [refetch]);

  const updateNotes = useCallback(async (id: string, notes: string) => {
    const { error: e } = await supabase.from("users")
      .update({ contract_notes: notes }).eq("id", id);
    if (e) throw new Error(e.message);
    await refetch();
  }, [refetch]);

  const awardPoints = useCallback(async (id: string, delta: number) => {
    const client = clients.find(c => c.id === id);
    if (!client) return;
    const { error: e } = await supabase.from("users")
      .update({ green_points: client.greenPoints + delta }).eq("id", id);
    if (e) throw new Error(e.message);
    await refetch();
  }, [clients, refetch]);

  return { clients, loading, error, updateTier, updateNotes, awardPoints };
}
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 10 — Wire Hooks into `App.tsx`, Remove Static Constants

### 10a. Remove from `src/app/constants.ts`

Delete the `RIDERS` export array entirely (the full `export const RIDERS: Rider[] = [...]` block).
Delete the `INITIAL_HUBS` export array entirely (the full `export const INITIAL_HUBS: Hub[] = [...]` block).

Keep all other exports: `MATERIAL_CONFIG`, `STATUS_CONFIG`, `ORDER_STATUS`, `TIER_CONFIG`, `DISTRICTS`, `HUB_STATUS_CONFIG`, `MATERIAL_DELIVERY_ESTIMATE_MS`, `IDLE_WARNING_MS`, `IDLE_CRITICAL_MS`, etc.

### 10b. Update `src/app/App.tsx`

**Imports — replace RIDERS and INITIAL_HUBS imports:**

```typescript
// Remove from the constants import line: RIDERS, INITIAL_HUBS
// Add new hook imports:
import { useRiders } from "../hooks/useRiders";
import { useHubs }   from "../hooks/useHubs";
import { useClients } from "../hooks/useClients";
```

**Inside `App()` function — add hooks at the top:**

```typescript
const { riders, loading: ridersLoading } = useRiders();
const { hubs, loading: hubsLoading, addHub, toggleHubActive, updateHubStatus } = useHubs();
const { clients, updateTier, updateNotes, awardPoints } = useClients();
```

**Remove:** `const [hubs, setHubs] = useState<Hub[]>(INITIAL_HUBS);`

**Replace every `RIDERS` reference** with `riders` (the hook result). Common occurrences:
- `RIDERS.find(...)` → `riders.find(...)`
- `RIDERS.filter(...)` → `riders.filter(...)`
- `riders={RIDERS}` prop → `riders={riders}`

**Add loading screen** — insert before the `return (` statement:

```typescript
if (ridersLoading || hubsLoading) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "var(--color-surface)",
      color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)", fontSize: 15,
    }}>
      Connecting to Supabase…
    </div>
  );
}
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 11 — Wire CRUD into Panels

### 11a. `HubsPanel.tsx` — status cycle button

Add `onUpdateStatus` to the panel's props interface:

```typescript
interface HubsPanelProps {
  hubs: Hub[];
  selectedHub: string | null;
  onHubSelect: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onUpdateStatus: (id: string, status: Hub["status"]) => void;
}
```

Add a helper and a "Next Status" button to each hub card:

```typescript
function nextStatus(current: Hub["status"]): Hub["status"] {
  if (current === "collecting") return "ready";
  if (current === "ready")      return "shipped";
  return "collecting";
}

// In hub card JSX:
<button
  onClick={() => onUpdateStatus(hub.id, nextStatus(hub.status))}
  style={{ fontSize: 12, padding: "4px 10px", borderRadius: "var(--radius-sm)",
           background: "var(--color-surface)", border: "1px solid var(--color-border)",
           cursor: "pointer", color: "var(--color-text-secondary)" }}
>
  Mark as {nextStatus(hub.status)}
</button>
```

Pass `onUpdateStatus={updateHubStatus}` from `App.tsx` to `HubsPanel`.

### 11b. `AddHubModal.tsx` — async confirm

The `onConfirm` prop must now be async. Add `submitting` state and error display to the modal's confirm handler:

```typescript
const [submitting, setSubmitting] = useState(false);
const [submitError, setSubmitError] = useState<string | null>(null);

async function handleConfirm() {
  setSubmitting(true);
  setSubmitError(null);
  try {
    await onConfirm(coords, name, address);
    onClose();
  } catch (e: unknown) {
    setSubmitError(e instanceof Error ? e.message : "Failed to save hub.");
  } finally {
    setSubmitting(false);
  }
}
```

In `App.tsx`, the hub confirm handler becomes:

```typescript
async function handleHubConfirm(
  coords: { lat: number; lng: number },
  name: string,
  address: string
) {
  await addHub(coords, name, address);
  setPendingCoords(null);
}
```

### 11c. `PartnersView.tsx` — accept hook props

Add to props interface:

```typescript
interface PartnersViewProps {
  clients: Client[];
  onUpdateTier: (id: string, tier: ContractTier) => Promise<void>;
  onUpdateNotes: (id: string, notes: string) => Promise<void>;
  onAwardPoints: (id: string, delta: number) => Promise<void>;
}
```

Pass from `App.tsx`:

```tsx
{activeView === "partners" && (
  <PartnersView
    clients={clients}
    onUpdateTier={updateTier}
    onUpdateNotes={updateNotes}
    onAwardPoints={awardPoints}
  />
)}
```

**Final build gate:**

```bash
npm run build 2>&1
```

Expected: **0 errors, 0 warnings** (fix any warnings that appear).

---

## Pinpoint Verification

Run these manually after `npm run dev`:

### V1 — Rider panel shows Supabase data
Open `http://localhost:5173`. Switch to Live Map view. The rider count in the panel header must match the number of driver-role users in Supabase. If no drivers exist yet, the panel shows empty state (not a crash).

### V2 — Hub panel shows seeded hubs
Switch to Hubs view. Exactly 4 hubs must appear — Hub Al-Sweifieh, Hub Downtown, Hub Jubaiha, Hub Tabarbour. Hub Tabarbour must appear inactive.

### V3 — Realtime updates live
With the dashboard open, run in Supabase SQL editor:
```sql
UPDATE public.driver_locations SET lat = lat + 0.001 WHERE true;
```
Rider marker(s) should move on the map within 2 seconds — no page refresh.

### V4 — Add hub persists to Supabase
Click `+ Add Hub` on the map, place a pin, enter name "Test Hub", confirm. The hub must appear immediately in the panel AND persist in Supabase:
```sql
SELECT name FROM public.hubs WHERE name = 'Test Hub';
```
Expected: 1 row returned.

### V5 — Toggle hub active writes to Supabase
Toggle Hub Tabarbour active. Confirm in Supabase:
```sql
SELECT name, active FROM public.hubs WHERE name = 'Hub Tabarbour';
```
Expected: `active = true`.

### V6 — No console errors
Open browser DevTools → Console. There must be no uncaught errors. The only acceptable output is the `VITE_SUPABASE_SERVICE_KEY not set` warning if `.env.local` is missing.

---

## Verification Report

| Check | Expected | Actual | Pass? |
|---|---|---|---|
| V1 — riders from Supabase | count matches DB | | ✅/❌ |
| V2 — 4 seeded hubs visible | Hub Al-Sweifieh … Tabarbour | | ✅/❌ |
| V3 — Realtime update | marker moves < 2s | | ✅/❌ |
| V4 — add hub persists | row in DB | | ✅/❌ |
| V5 — toggle active persists | active = true in DB | | ✅/❌ |
| V6 — no console errors | 0 uncaught errors | | ✅/❌ |

**All 6 must pass before Phase 2 is declared complete.**

---

## Git Commit

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling"
git add \
  src/lib/supabase.ts \
  src/lib/adapters.ts \
  src/hooks/useRiders.ts \
  src/hooks/useHubs.ts \
  src/hooks/useClients.ts \
  src/app/types.ts \
  src/app/App.tsx \
  src/app/constants.ts \
  src/app/components/HubsPanel.tsx \
  src/app/components/AddHubModal.tsx \
  src/app/components/partners/PartnersView.tsx \
  package.json package-lock.json
git commit -m "feat(dashboard): Phase 2 — wire Supabase live data replacing all static constants

- @supabase/supabase-js installed, service-role client in src/lib/supabase.ts
- Type adapters: Supabase snake_case rows → dashboard camelCase types
- useRiders: live driver data + Realtime subscriptions (locations + orders)
- useHubs: hub CRUD (add, toggle active, update status) against hubs table
- useClients: partner CRUD (tier, notes, green points) against users table
- App.tsx: RIDERS and INITIAL_HUBS constants replaced by hook data
- HubsPanel, AddHubModal, PartnersView: async CRUD wired through
- All 6 pinpoint verification checks passed

Depends on: Phase 1 migrations (20260626_hubs + partner_fields + seed_hubs)
See devPlans/2026-06-26-supabase-integration-plan.md Tasks 4-11"
```

---

## What Phase 2 Does NOT Touch

- ❌ No Flutter Dart code
- ❌ No Supabase SQL migrations (those are Phase 1)
- ❌ No changes to map rendering logic (Leaflet layers, district polygons, routes)
- ❌ No changes to existing UI layout or styling
- ❌ No changes to `MATERIAL_CONFIG`, `DISTRICTS`, `STATUS_CONFIG`, or other non-data constants
