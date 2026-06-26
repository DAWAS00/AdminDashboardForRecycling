---
description: "Close the bidirectional loop between the Dwaar admin dashboard and the Flutter mobile app — admin dispatches orders to drivers, sends push notifications, approves suppliers, and sees all pending orders in real time. Phase 3 of the App ↔ Supabase ↔ Dashboard integration."
mode: agent
tools:
  - codebase
  - editFiles
  - runCommands
  - problems
  - search
  - findTestFiles
---

# Phase 3 — Dashboard ↔ App Bidirectional Connectivity (Dwaar)

You are a senior React/TypeScript engineer who understands Supabase Edge Functions, RLS, push notification pipelines, and real-time bidirectional data flows. You are working on the **Dwaar admin dashboard** (`E:\Dawer DashBorad\AdminDashboardForRecycling`) — a React 18 + TypeScript + Vite + Tailwind v4 application that was wired to Supabase in Phase 2. Your job is to close the bidirectional loop: admin actions taken in the dashboard must reach the **Flutter mobile app** through Supabase, and app events (new supplier orders, driver completions) must surface in new dashboard views in real time.

**Prerequisite:** Phases 1 and 2 must be complete. The Supabase client (`src/lib/supabase.ts`), adapters (`src/lib/adapters.ts`), and all three hooks (`useRiders`, `useHubs`, `useClients`) must exist and build cleanly.

**You have full workspace access. Read all files you need without asking permission. Run `npm run build` after every task to gate progress.**

---

## Architecture Overview — What Phase 3 Closes

```
Flutter App                Supabase                 Dashboard (Phase 3)
──────────                 ────────                 ──────────────────
Driver app reads    <──── orders table ────────     Admin assigns order to driver
  orders assigned              │                    Admin reassigns between drivers
  to their auth_id             │
                               │
Supplier creates   ────────>  orders table ────>   Dispatch view shows pending orders
  pickup request                                    Admin clicks to assign driver

Driver registers   ────────>  users.push_token     send-push Edge Function reads it
  push token                                        and fires Expo/FCM notification

Supplier awaits    <─────── users.is_verified      Admin clicks "Approve" → verified = true
  verification                                     → push notification sent to supplier
```

---

## Context You Must Read First

Read these files before writing a single line of code:

1. `src/app/types.ts` — all TypeScript interfaces
2. `src/app/constants.ts` — `CLIENTS`, `RIDERS`, `DISTRICTS`, `NAV_ITEMS`, `ViewId`
3. `src/app/App.tsx` — current state, hooks, view routing
4. `src/lib/supabase.ts` — existing client + row types
5. `src/lib/adapters.ts` — existing adapt functions
6. `src/app/components/partners/PartnersView.tsx` — existing partner view pattern
7. `src/app/components/LeftSidebar.tsx` — nav items rendering

---

## Pre-flight Checks

Run all of these before creating any files.

### 1. Phase 2 complete?

```bash
ls src/lib/supabase.ts src/lib/adapters.ts src/hooks/useRiders.ts src/hooks/useHubs.ts src/hooks/useClients.ts
```

Expected: all 5 files exist. If any are missing, Phase 2 is not done — stop.

### 2. Build currently clean?

```bash
npm run build 2>&1 | tail -10
```

Must be 0 errors before starting.

### 3. Supabase CLI available?

```bash
npx supabase --version
```

If not installed: `npm install -g supabase`

### 4. Existing hooks directory?

```bash
ls src/hooks/
```

Report which hooks exist.

### 5. Existing tables?

```bash
# Run in Supabase SQL editor or via CLI
# SELECT table_name FROM information_schema.tables WHERE table_schema='public';
```

Confirm: `users`, `orders`, `driver_locations`, `hubs` exist.
Report whether `notifications` already exists.

### Pre-flight report

| Check | Status | Action needed |
|---|---|---|
| Phase 2 files present | ✅/❌ | complete Phase 2 first |
| Build clean | ✅/❌ | fix errors first |
| Supabase CLI | ✅/⬜ | install if missing |
| notifications table | ✅/⬜ | Task 12 will create |
| push_token column | ✅/⬜ | Task 12 will add |

---

## Task 12 — DB Migration: Notifications + Push Tokens

Apply this migration via Supabase Dashboard → SQL editor, or via CLI.

**File:** `supabase/migrations/20260626_notifications_push.sql`

```sql
-- Push token storage on the user record (Flutter app writes on login)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS push_token    text,
  ADD COLUMN IF NOT EXISTS push_platform text CHECK (push_platform IN ('expo', 'fcm', 'apns'));

-- Admin-to-app notification log
CREATE TABLE IF NOT EXISTS public.notifications (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        REFERENCES public.users(id) ON DELETE CASCADE,
  title      text        NOT NULL,
  body       text        NOT NULL,
  type       text        NOT NULL CHECK (type IN (
               'order_assigned', 'order_reassigned', 'order_cancelled',
               'account_verified', 'account_rejected', 'system', 'hub_update'
             )),
  data       jsonb,
  read_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);

-- orders table: add delivery coordinates as plain float columns
-- (PostGIS geography is useful for the app but the dashboard needs plain lat/lng)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_lat float8,
  ADD COLUMN IF NOT EXISTS delivery_lng float8;

-- RLS: dashboard service role bypasses all; app users read their own notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = (SELECT auth_id FROM public.users WHERE id = user_id));

-- Service role (used by dashboard) bypasses RLS — no extra policy needed.
```

**Apply and verify:**

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('push_token','push_platform');
-- Expected: 2 rows

SELECT table_name FROM information_schema.tables
WHERE table_name = 'notifications';
-- Expected: 1 row
```

---

## Task 13 — Supabase Edge Functions

### 13a. `send-push` Edge Function

Create `supabase/functions/send-push/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface PushPayload {
  user_ids: string[];   // public.users.id (not auth_id)
  title: string;
  body: string;
  data?: Record<string, unknown>;
  type: string;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const payload: PushPayload = await req.json();
  const { user_ids, title, body, data = {}, type } = payload;

  // 1. Look up push tokens
  const { data: users, error } = await supabase
    .from("users")
    .select("id, push_token, push_platform")
    .in("id", user_ids)
    .not("push_token", "is", null);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  // 2. Write notification log entries
  if (users && users.length > 0) {
    await supabase.from("notifications").insert(
      users.map((u: { id: string }) => ({ user_id: u.id, title, body, type, data }))
    );

    // 3. Send Expo push notifications (handles both Expo managed + bare)
    const expoTokens = (users as { push_token: string; push_platform: string }[])
      .filter(u => u.push_platform === "expo" && u.push_token.startsWith("ExponentPushToken"))
      .map(u => ({
        to: u.push_token,
        title,
        body,
        data,
        sound: "default",
        priority: "high",
      }));

    if (expoTokens.length > 0) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expoTokens),
      });
    }
  }

  return new Response(JSON.stringify({ sent: users?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 13b. `dispatch-order` Edge Function

Create `supabase/functions/dispatch-order/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

interface DispatchPayload {
  order_id: string;
  driver_id: string;   // public.users.id of the driver
  reassign: boolean;   // true if order already had a driver_id
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  const { order_id, driver_id, reassign }: DispatchPayload = await req.json();

  // 1. Atomically assign the order to the driver
  const { data: order, error: updateErr } = await supabase
    .from("orders")
    .update({ driver_id, status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", order_id)
    .select("id, waste_types, estimated_weight_kg")
    .single();

  if (updateErr) return new Response(JSON.stringify({ error: updateErr.message }), { status: 500 });

  // 2. Send push notification to the assigned driver
  const type = reassign ? "order_reassigned" : "order_assigned";
  const title = reassign ? "Order Reassigned to You" : "New Order Assigned";
  const body = `${order.waste_types.join(", ")} — ${order.estimated_weight_kg} kg`;

  await supabase.functions.invoke("send-push", {
    body: { user_ids: [driver_id], title, body, type, data: { order_id } },
  });

  return new Response(JSON.stringify({ success: true, order_id }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### 13c. Deploy Edge Functions

```bash
npx supabase functions deploy send-push --project-ref bpzuwwbtqqrpohfqjcuo
npx supabase functions deploy dispatch-order --project-ref bpzuwwbtqqrpohfqjcuo
```

Verify in Supabase Dashboard → Edge Functions: both appear with status "Active".

---

## Task 14 — Update Row Types + Adapters

### 14a. Add new row types to `src/lib/supabase.ts`

Append to the existing file:

```typescript
export interface SupabaseNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

// Extend SupabaseUser with new columns
// (add to existing SupabaseUser interface)
//   push_token: string | null;
//   push_platform: "expo" | "fcm" | "apns" | null;
```

Update the `SupabaseUser` interface — add these two lines inside it:

```typescript
push_token: string | null;
push_platform: "expo" | "fcm" | "apns" | null;
```

Update `SupabaseOrder` — add delivery coordinates:

```typescript
delivery_lat: number | null;
delivery_lng: number | null;
```

### 14b. Fix delivery coordinates in `src/lib/adapters.ts`

In `adaptOrder`, replace the centroid fallback with real coordinates:

```typescript
// Replace:
deliveryLat: 31.963,   // PostGIS geography not parsed here — centroid fallback
deliveryLng: 35.910,

// With:
deliveryLat: row.delivery_lat ?? 31.963,
deliveryLng: row.delivery_lng ?? 35.910,
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 15 — New Hook: `useOrders`

Create `src/hooks/useOrders.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { supabase, SupabaseOrder } from "../lib/supabase";
import { adaptOrder } from "../lib/adapters";
import { Order } from "../app/types";

export interface OrderRow extends Order {
  driverId: string | null;
  supplierId: string | null;
  companyId: string | null;
  isUrgent: boolean;
  rawWasteTypes: string[];
}

function adaptFullOrder(row: SupabaseOrder): OrderRow {
  const base = adaptOrder(row);
  return {
    ...base,
    driverId:      row.driver_id ?? null,
    supplierId:    row.supplier_id ?? null,
    companyId:     row.company_id ?? null,
    isUrgent:      row.is_urgent,
    rawWasteTypes: row.waste_types,
  };
}

export function useOrders(statusFilter?: SupabaseOrder["status"][]) {
  const [orders, setOrders]   = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const refetch = useCallback(async () => {
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter && statusFilter.length > 0) {
      query = query.in("status", statusFilter);
    }

    const { data, error: e } = await query;
    if (e) { setError(e.message); return; }
    setOrders((data as SupabaseOrder[]).map(adaptFullOrder));
    setLoading(false);
  }, [statusFilter?.join(",")]);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refetch();

    const ch = supabase.channel("dash-all-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" },
        () => refetch())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const dispatchOrder = useCallback(async (orderId: string, driverId: string, reassign = false) => {
    const { error: e } = await supabase.functions.invoke("dispatch-order", {
      body: { order_id: orderId, driver_id: driverId, reassign },
    });
    if (e) throw new Error(e.message);
    await refetch();
  }, [refetch]);

  const cancelOrder = useCallback(async (orderId: string) => {
    const { error: e } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);
    if (e) throw new Error(e.message);
    await refetch();
  }, [refetch]);

  return { orders, loading, error, dispatchOrder, cancelOrder, refetch };
}
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 16 — New Hook: `useSuppliers`

Create `src/hooks/useSuppliers.ts`:

```typescript
import { useState, useEffect, useCallback } from "react";
import { supabase, SupabaseUser } from "../lib/supabase";

export interface SupplierRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  supplierType: "individual" | "storeBusiness" | null;
  isVerified: boolean;
  isAvailable: boolean;
  address: string | null;
  categories: string[];
  rating: number;
  totalOrders: number;
  joinedAt: string;
}

function adaptSupplier(u: SupabaseUser): SupplierRow {
  return {
    id:            u.id,
    name:          u.name,
    phone:         u.phone,
    email:         u.email,
    supplierType:  u.supplier_type,
    isVerified:    u.is_verified,
    isAvailable:   u.is_available,
    address:       u.address,
    categories:    u.categories,
    rating:        u.rating,
    totalOrders:   u.total_orders,
    joinedAt:      u.created_at,
  };
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: e } = await supabase
      .from("users")
      .select("*")
      .eq("role", "supplier")
      .order("created_at", { ascending: false });
    if (e) { setError(e.message); return; }
    setSuppliers((data as SupabaseUser[]).map(adaptSupplier));
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const verifySupplier = useCallback(async (id: string) => {
    const { error: e } = await supabase
      .from("users").update({ is_verified: true }).eq("id", id);
    if (e) throw new Error(e.message);
    // Notify supplier via push
    await supabase.functions.invoke("send-push", {
      body: {
        user_ids: [id],
        title: "Account Verified ✓",
        body: "Your Dwaar supplier account has been approved. You can now post pickup requests.",
        type: "account_verified",
      },
    });
    await refetch();
  }, [refetch]);

  const rejectSupplier = useCallback(async (id: string, reason?: string) => {
    const { error: e } = await supabase
      .from("users").update({ is_verified: false }).eq("id", id);
    if (e) throw new Error(e.message);
    await supabase.functions.invoke("send-push", {
      body: {
        user_ids: [id],
        title: "Account Verification Required",
        body: reason ?? "Please contact support to complete your account setup.",
        type: "account_rejected",
      },
    });
    await refetch();
  }, [refetch]);

  const toggleAvailability = useCallback(async (id: string, available: boolean) => {
    const { error: e } = await supabase
      .from("users").update({ is_available: available }).eq("id", id);
    if (e) throw new Error(e.message);
    await refetch();
  }, [refetch]);

  const pendingVerification = suppliers.filter(s => !s.isVerified);
  const verified            = suppliers.filter(s => s.isVerified);

  return {
    suppliers, pendingVerification, verified,
    loading, error,
    verifySupplier, rejectSupplier, toggleAvailability,
    refetch,
  };
}
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 17 — New Hook: `useNotifications`

Create `src/hooks/useNotifications.ts`:

```typescript
import { useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useNotifications() {
  const sendToUser = useCallback(async (
    userId: string,
    title: string,
    body: string,
    type: string,
    data?: Record<string, unknown>
  ) => {
    const { error } = await supabase.functions.invoke("send-push", {
      body: { user_ids: [userId], title, body, type, data: data ?? {} },
    });
    if (error) throw new Error(error.message);
  }, []);

  const broadcast = useCallback(async (
    role: "driver" | "supplier" | "recyclingCo",
    title: string,
    body: string,
    type = "system"
  ) => {
    const { data: users, error } = await supabase
      .from("users")
      .select("id")
      .eq("role", role)
      .not("push_token", "is", null);
    if (error) throw new Error(error.message);
    if (!users || users.length === 0) return;

    const { error: fnError } = await supabase.functions.invoke("send-push", {
      body: { user_ids: users.map((u: { id: string }) => u.id), title, body, type },
    });
    if (fnError) throw new Error(fnError.message);
  }, []);

  return { sendToUser, broadcast };
}
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 18 — New Views: Dispatch + Users

### 18a. Add view IDs to `src/app/types.ts`

Update the `ViewId` type:

```typescript
// Replace:
export type ViewId = "map" | "heatmap" | "hubs" | "partners" | "reports";

// With:
export type ViewId = "map" | "heatmap" | "hubs" | "partners" | "reports" | "dispatch" | "users";
```

### 18b. Create `src/app/components/dispatch/DispatchView.tsx`

This view shows all orders with assign/reassign capability. Keep it self-contained.

```typescript
import { useState, useMemo } from "react";
import { Zap, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useOrders, OrderRow } from "../../../hooks/useOrders";
import { Rider } from "../../types";
import { ORDER_STATUS } from "../../constants";

interface DispatchViewProps {
  riders: Rider[];
}

const STATUS_TABS: { id: string; label: string; statuses: string[] }[] = [
  { id: "pending",   label: "Unassigned",  statuses: ["pending"]             },
  { id: "active",    label: "Active",      statuses: ["accepted", "inTransit"] },
  { id: "completed", label: "Completed",   statuses: ["completed"]            },
  { id: "cancelled", label: "Cancelled",   statuses: ["cancelled"]            },
];

export function DispatchView({ riders }: DispatchViewProps) {
  const [tab, setTab]               = useState("pending");
  const [selectedOrder, setSelected] = useState<OrderRow | null>(null);
  const [assigning, setAssigning]   = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const activeTab = STATUS_TABS.find(t => t.id === tab)!;
  const { orders, loading, dispatchOrder, cancelOrder } = useOrders(
    activeTab.statuses as ("pending" | "accepted" | "inTransit" | "completed" | "cancelled")[]
  );

  const idleRiders = useMemo(
    () => riders.filter(r => r.status === "idle"),
    [riders]
  );

  async function handleAssign(driverId: string) {
    if (!selectedOrder) return;
    setAssigning(true);
    setError(null);
    try {
      await dispatchOrder(selectedOrder.id, driverId, !!selectedOrder.driverId);
      setSelected(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Assignment failed.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleCancel(orderId: string) {
    setError(null);
    try {
      await cancelOrder(orderId);
      if (selectedOrder?.id === orderId) setSelected(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Cancel failed.");
    }
  }

  return (
    <div className="flex h-full" style={{ background: "#F4F6F5", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Order list */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tab bar */}
        <div className="flex gap-1 px-4 pt-4 pb-2 border-b flex-shrink-0" style={{ background: "white", borderColor: "#E2E8F0" }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelected(null); }}
              style={{
                padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: "none", cursor: "pointer",
                background: tab === t.id ? "#1E5C35" : "transparent",
                color: tab === t.id ? "white" : "#64748B",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "8px 16px", fontSize: 12 }}>
            {error}
          </div>
        )}

        {/* Order cards */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 16 }}>
          {loading ? (
            <div style={{ color: "#94A3B8", fontSize: 13, padding: 24, textAlign: "center" }}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div style={{ color: "#94A3B8", fontSize: 13, padding: 24, textAlign: "center" }}>No orders in this category.</div>
          ) : orders.map(order => (
            <div
              key={order.id}
              onClick={() => setSelected(s => s?.id === order.id ? null : order)}
              style={{
                background: selectedOrder?.id === order.id ? "#F0FDF4" : "white",
                border: `1.5px solid ${selectedOrder?.id === order.id ? "#1E5C35" : "#E2E8F0"}`,
                borderRadius: 10, padding: "10px 14px", marginBottom: 8,
                cursor: "pointer", transition: "border-color 0.15s",
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>{order.id.slice(0, 8)}…</span>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.bg ?? "#F1F5F9",
                  color:      ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.color ?? "#64748B",
                }}>
                  {ORDER_STATUS[order.status as keyof typeof ORDER_STATUS]?.label ?? order.status}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                {order.material} · {order.quantity} {order.unit}
                {order.isUrgent && <span style={{ color: "#C8860A", fontWeight: 700, marginLeft: 6 }}>⚡ Urgent</span>}
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                {order.driverId ? `Assigned · Driver ${order.driverId.slice(0, 6)}` : "Unassigned"}
              </div>
              {tab === "pending" && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(order); }}
                    style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, border: "none", background: "#1E5C35", color: "white", cursor: "pointer" }}
                  >
                    Assign Driver
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleCancel(order.id); }}
                    style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "white", color: "#EF4444", cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {tab === "active" && order.driverId && (
                <button
                  onClick={e => { e.stopPropagation(); setSelected(order); }}
                  style={{ marginTop: 6, fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "white", color: "#1E40AF", cursor: "pointer" }}
                >
                  <RefreshCw size={10} style={{ display: "inline", marginRight: 4 }} />
                  Reassign
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Assign panel */}
      {selectedOrder && (tab === "pending" || tab === "active") && (
        <div style={{ width: 260, flexShrink: 0, background: "white", borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #E2E8F0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a1a1a" }}>
              {selectedOrder.driverId ? "Reassign Order" : "Assign Driver"}
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
              {selectedOrder.material} · {selectedOrder.quantity} {selectedOrder.unit}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.06em", marginBottom: 8 }}>
              IDLE DRIVERS ({idleRiders.length})
            </div>
            {idleRiders.length === 0 ? (
              <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center", padding: 16 }}>
                No idle drivers available.
              </div>
            ) : idleRiders.map(r => (
              <button
                key={r.id}
                disabled={assigning}
                onClick={() => handleAssign(String(r.id))}
                style={{
                  width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 8,
                  border: "1px solid #E2E8F0", background: assigning ? "#F8FAFC" : "white",
                  marginBottom: 6, cursor: assigning ? "not-allowed" : "pointer",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a" }}>{r.name}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{r.vehicle} · {r.phone}</div>
              </button>
            ))}
          </div>

          <div style={{ padding: 12, borderTop: "1px solid #E2E8F0" }}>
            <button
              onClick={() => setSelected(null)}
              style={{ width: "100%", padding: "7px", borderRadius: 8, border: "1px solid #E2E8F0", background: "white", fontSize: 12, color: "#64748B", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 18c. Create `src/app/components/users/UsersView.tsx`

This view manages supplier verification and driver availability.

```typescript
import { useState } from "react";
import { CheckCircle, XCircle, UserCheck, Phone } from "lucide-react";
import { useSuppliers } from "../../../hooks/useSuppliers";
import { useRiders } from "../../../hooks/useRiders";

type UsersTab = "pending" | "suppliers" | "drivers";

export function UsersView() {
  const [tab, setTab]     = useState<UsersTab>("pending");
  const [error, setError] = useState<string | null>(null);

  const {
    pendingVerification, verified,
    verifySupplier, rejectSupplier, toggleAvailability,
    loading: suppLoading,
  } = useSuppliers();

  const { riders, loading: ridersLoading } = useRiders();

  async function handle(fn: () => Promise<void>) {
    setError(null);
    try { await fn(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Action failed."); }
  }

  const TABS: { id: UsersTab; label: string; count?: number }[] = [
    { id: "pending",   label: "Pending Verification", count: pendingVerification.length },
    { id: "suppliers", label: "Suppliers",             count: verified.length           },
    { id: "drivers",   label: "Drivers",               count: riders.length             },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#F4F6F5", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, padding: "12px 16px", background: "white", borderBottom: "1px solid #E2E8F0", flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: tab === t.id ? "#1E5C35" : "transparent",
              color: tab === t.id ? "white" : "#64748B",
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span style={{ marginLeft: 6, background: tab === t.id ? "rgba(255,255,255,0.3)" : "#E2E8F0", borderRadius: 10, padding: "1px 6px", fontSize: 10 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "8px 16px", fontSize: 12, flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {/* Pending verification */}
        {tab === "pending" && (suppLoading ? (
          <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: 24 }}>Loading…</div>
        ) : pendingVerification.length === 0 ? (
          <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: 24 }}>
            <CheckCircle size={32} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
            No pending verifications.
          </div>
        ) : pendingVerification.map(s => (
          <div key={s.id} style={{ background: "white", border: "1.5px solid #FCD34D", borderRadius: 10, padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                  {s.supplierType === "storeBusiness" ? "Business" : "Individual"} · {s.phone}
                </div>
                {s.categories.length > 0 && (
                  <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 3 }}>
                    {s.categories.join(", ")}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                  Joined {new Date(s.joinedAt).toLocaleDateString("en-JO")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => handle(() => verifySupplier(s.id))}
                  style={{ padding: "5px 12px", borderRadius: 7, border: "none", background: "#1E5C35", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <UserCheck size={12} /> Approve
                </button>
                <button
                  onClick={() => handle(() => rejectSupplier(s.id))}
                  style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #E2E8F0", background: "white", color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <XCircle size={12} /> Reject
                </button>
              </div>
            </div>
          </div>
        )))}

        {/* Verified suppliers */}
        {tab === "suppliers" && (suppLoading ? (
          <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: 24 }}>Loading…</div>
        ) : verified.map(s => (
          <div key={s.id} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{s.phone} · {s.totalOrders} orders · ★ {s.rating.toFixed(1)}</div>
            </div>
            <button
              onClick={() => handle(() => toggleAvailability(s.id, !s.isAvailable))}
              style={{
                padding: "4px 10px", borderRadius: 7, border: "1px solid #E2E8F0",
                background: s.isAvailable ? "#D1FAE5" : "#F1F5F9",
                color: s.isAvailable ? "#1E5C35" : "#64748B",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              {s.isAvailable ? "Active" : "Inactive"}
            </button>
          </div>
        )))}

        {/* Drivers */}
        {tab === "drivers" && (ridersLoading ? (
          <div style={{ color: "#94A3B8", fontSize: 13, textAlign: "center", padding: 24 }}>Loading…</div>
        ) : riders.map(r => (
          <div key={r.id} style={{ background: "white", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{r.name}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{r.vehicle} · {r.phone}</div>
            </div>
            <a
              href={`https://wa.me/${r.phone.replace(/\s+/g, "").replace(/^\+/, "")}`}
              target="_blank" rel="noreferrer"
              style={{ padding: "4px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#F0FDF4", color: "#1E5C35", fontSize: 11, fontWeight: 600, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
            >
              <Phone size={11} /> WhatsApp
            </a>
          </div>
        )))}
      </div>
    </div>
  );
}
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 19 — Wire New Views into App.tsx

### 19a. Update imports in `src/app/App.tsx`

Add to the existing import block:

```typescript
import { DispatchView } from "./components/dispatch/DispatchView";
import { UsersView }    from "./components/users/UsersView";
import { useOrders }    from "../hooks/useOrders";
import { useNotifications } from "../hooks/useNotifications";
```

### 19b. Add hooks inside `App()` function

After the existing hooks (`useRiders`, `useHubs`, `useClients`):

```typescript
const { broadcast }      = useNotifications();
// useOrders is used inside DispatchView directly — no need to hoist to App
```

### 19c. Extend `viewTitle` and `viewSubtitle` records

```typescript
// Add to viewTitle:
dispatch: "Order Dispatch",
users:    "User Management",

// Add to viewSubtitle:
dispatch: "Assign, reassign, and monitor all active orders",
users:    "Approve suppliers, manage drivers",
```

### 19d. Add view rendering inside the main area `<div>`

After `{activeView === "reports" && <ReportsScreen />}`:

```tsx
{activeView === "dispatch" && <DispatchView riders={riders} />}
{activeView === "users"    && <UsersView />}
```

### 19e. Update `NAV_ITEMS` in `src/app/constants.ts`

Add the two new nav entries (import `Truck` and `Users2` from lucide-react at the top of constants.ts):

```typescript
import { ..., Truck, Users2 } from "lucide-react";

// Add to NAV_ITEMS array:
{ icon: Truck,  label: "Dispatch", id: "dispatch" },
{ icon: Users2, label: "Users",    id: "users"    },
```

**Build gate:** `npm run build` — 0 errors.

---

## Task 20 — Broadcast Button in Header

Add a broadcast button in `App.tsx` header — visible on all views — for emergency driver alerts.

Inside the `<header>` flex, before the clock block:

```tsx
<button
  onClick={async () => {
    const msg = window.prompt("Broadcast message to all drivers:");
    if (!msg) return;
    try {
      await broadcast("driver", "Dwaar Operations Alert", msg, "system");
    } catch (e) {
      console.error("Broadcast failed:", e);
    }
  }}
  style={{
    padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
    border: "1px solid #E2E8F0", background: "white",
    color: "#64748B", cursor: "pointer",
  }}
>
  📢 Broadcast
</button>
```

> Note: `window.prompt` is used here for simplicity. For production, replace with a modal (`AlertDialog` from shadcn already in the project).

**Final build gate:**

```bash
npm run build 2>&1
```

Expected: **0 errors, 0 warnings**.

---

## Pinpoint Verification

Run these manually after `npm run dev`.

### V1 — Dispatch view renders with live orders

Navigate to Dispatch → "Unassigned" tab. Any pending orders in Supabase must appear within 2 seconds of page load. If no orders exist, create one in Supabase SQL editor:

```sql
INSERT INTO public.orders (type, status, waste_types, estimated_weight_kg, reward_jd, is_urgent)
VALUES ('pickup', 'pending', ARRAY['plastic'], 12.5, 5.00, false);
```

Expected: order card appears in the Dispatch view without page refresh (Realtime).

### V2 — Assign order → driver app reflects it

With the Flutter app open (logged in as a driver):

1. In Dispatch view, click "Assign Driver" on a pending order.
2. Select an idle driver whose device has the Flutter app open.
3. Expected within 2 seconds: the order appears in the driver's app order list.

If no device is available, verify via Supabase:

```sql
SELECT id, driver_id, status, accepted_at
FROM public.orders
WHERE id = '<your_order_id>';
-- Expected: driver_id set, status = 'accepted', accepted_at not null
```

### V3 — Push notification sent

After assigning an order, check Supabase:

```sql
SELECT title, body, type, created_at
FROM public.notifications
ORDER BY created_at DESC LIMIT 3;
```

Expected: a row with `type = 'order_assigned'` for the driver.

### V4 — Supplier verification flow

Navigate to Users → "Pending Verification". If no pending suppliers, insert one:

```sql
INSERT INTO public.users (name, phone, role, supplier_type, is_verified, categories, rating, total_orders, points, is_available, has_chemical_permit, contract_tier, green_points)
VALUES ('Test Supplier', '+962 79 000 0001', 'supplier', 'individual', false, ARRAY['plastic'], 5, 0, 0, true, false, 'free', 0);
```

Click "Approve". Expected:
- Row moves from Pending tab to Suppliers tab.
- `is_verified = true` in Supabase.
- Notification log entry created with `type = 'account_verified'`.

### V5 — Realtime order update from app

With Dispatch view open in browser, have a driver accept an order in the Flutter app (or run in SQL):

```sql
UPDATE public.orders SET status = 'accepted', driver_id = '<driver_uuid>' WHERE id = '<order_id>';
```

Expected: card moves from Unassigned tab to Active tab within 2 seconds.

### V6 — Broadcast to drivers

Click the "📢 Broadcast" button in the header. Enter a test message. Expected:

```sql
SELECT title, body FROM public.notifications WHERE type = 'system' ORDER BY created_at DESC LIMIT 5;
```

One row per online driver with push_token set.

### V7 — No console errors

Open browser DevTools → Console. 0 uncaught errors after navigating all 7 views.

---

## Verification Report

| Check | Expected | Actual | Pass? |
|---|---|---|---|
| V1 — Dispatch view live orders | real-time order feed | | ✅/❌ |
| V2 — Assign order → app driver | order in driver app < 2s | | ✅/❌ |
| V3 — Notification log entry | row in notifications table | | ✅/❌ |
| V4 — Supplier verification | is_verified = true + notification | | ✅/❌ |
| V5 — App status change → dashboard | card moves without refresh | | ✅/❌ |
| V6 — Broadcast | notification rows per driver | | ✅/❌ |
| V7 — No console errors | 0 uncaught errors | | ✅/❌ |

**All 7 must pass before Phase 3 is declared complete.**

---

## Git Commit

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling"
git add \
  supabase/migrations/20260626_notifications_push.sql \
  supabase/functions/send-push/index.ts \
  supabase/functions/dispatch-order/index.ts \
  src/lib/supabase.ts \
  src/lib/adapters.ts \
  src/hooks/useOrders.ts \
  src/hooks/useSuppliers.ts \
  src/hooks/useNotifications.ts \
  src/app/types.ts \
  src/app/constants.ts \
  src/app/App.tsx \
  src/app/components/dispatch/DispatchView.tsx \
  src/app/components/users/UsersView.tsx
git commit -m "feat(dashboard): Phase 3 — bidirectional dashboard ↔ app connectivity

- DB migration: notifications table + push_token/platform cols on users
- Edge Functions: send-push (Expo push API wrapper) + dispatch-order (atomic assign)
- useOrders hook: live all-orders feed with Realtime + dispatchOrder/cancelOrder
- useSuppliers hook: verification queue with verifySupplier/rejectSupplier/toggleAvailability
- useNotifications hook: sendToUser + broadcast helpers
- DispatchView: assign/reassign orders to idle drivers with real-time Realtime updates
- UsersView: supplier approval queue + driver roster with WhatsApp contact links
- Header broadcast button: push system alert to all drivers
- ViewId extended: 'dispatch' + 'users' nav entries wired in App.tsx
- All 7 pinpoint verification checks passed

Depends on: Phase 1 migrations + Phase 2 Supabase wiring
See .github/prompts/phase3-dashboard-app-connectivity.prompt.md"
```

---

## What Phase 3 Does NOT Touch

- ❌ No changes to Flutter Dart code (app reads Supabase — admin writes to it, that's the contract)
- ❌ No changes to existing map, heatmap, hubs, partners, or reports views
- ❌ No changes to DISTRICTS, MATERIAL_CONFIG, or static config constants
- ❌ No changes to existing hooks (useRiders, useHubs, useClients)
- ❌ No PostGIS geography parsing — delivery_lat/lng float columns used instead
- ❌ No FCM/APNS direct integration — Expo push API handles routing to both platforms
