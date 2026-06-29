---
description: "Create a TanStack Query hook that wraps a Supabase table query, including Realtime invalidation, optimistic mutations, and error toasts. For Dawer dashboard data fetching."
mode: agent
tools:
  - codebase
  - editFiles
  - runCommands
  - problems
  - search
---

# Supabase Query Hook — Dawer Dashboard

You are a senior React/TypeScript engineer creating a TanStack Query data hook for the **Dawer (دوّر)** admin dashboard. This hook wraps a Supabase query with proper caching, background refresh, Realtime invalidation, optimistic mutations, and error toasts.

**You have full workspace access. Read the existing hooks and src/lib/ files first, then write the new hook.**

---

## Before Writing Anything

Read these files first:

```bash
cat src/lib/supabase.ts
cat src/lib/adapters.ts
ls src/hooks/
cat src/hooks/useHubs.ts 2>/dev/null || cat src/hooks/useRiders.ts 2>/dev/null
```

Also verify TanStack Query is installed:

```bash
cat package.json | grep tanstack
```

If `@tanstack/react-query` is not in package.json, install it first:

```bash
npm install @tanstack/react-query
```

Then check if `QueryClientProvider` is already in `src/main.tsx`:

```bash
cat src/main.tsx | grep QueryClient
```

If not, add it:

```tsx
// src/main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
    },
  },
});

// Wrap root with:
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

---

## Hook Template — Read Only (no mutations)

```typescript
// src/hooks/use<Entities>.ts
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { adapt<Entity> } from "../lib/adapters";
import type { <Entity> } from "../app/types";

const QUERY_KEY = ["<entities>"] as const;

export function use<Entities>() {
  const queryClient = useQueryClient();

  // 1. Supabase Realtime subscription — invalidates cache on any change
  useEffect(() => {
    const channel = supabase
      .channel("dash-<entities>")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "<table_name>" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // 2. TanStack Query fetch
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<<Entity>[]> => {
      const { data, error } = await supabase
        .from("<table_name>")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw new Error(error.message);
      return (data ?? []).map(adapt<Entity>);
    },
    staleTime: 30_000,         // cache is fresh for 30s
    refetchInterval: 60_000,   // background refresh every 60s
  });
}
```

---

## Hook Template — With Mutations (CRUD)

For tables where the dashboard writes data (hubs, partner tier updates, green points):

```typescript
// src/hooks/use<Entities>.ts
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { adapt<Entity> } from "../lib/adapters";
import type { <Entity> } from "../app/types";

const QUERY_KEY = ["<entities>"] as const;

export function use<Entities>() {
  const queryClient = useQueryClient();

  // Realtime invalidation
  useEffect(() => {
    const channel = supabase
      .channel("dash-<entities>-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "<table_name>" }, () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Fetch query
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<<Entity>[]> => {
      const { data, error } = await supabase.from("<table_name>").select("*");
      if (error) throw new Error(error.message);
      return (data ?? []).map(adapt<Entity>);
    },
  });

  // Add mutation (optimistic)
  const add<Entity> = useMutation({
    mutationFn: async (payload: Omit<<Entity>, "id" | "createdAt">) => {
      const { error } = await supabase.from("<table_name>").insert([payload]);
      if (error) throw new Error(error.message);
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<<Entity>[]>(QUERY_KEY);
      queryClient.setQueryData<<Entity>[]>(QUERY_KEY, (old = []) => [
        ...old,
        { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...payload } as <Entity>,
      ]);
      return { previous };
    },
    onError: (_err, _payload, ctx) => {
      queryClient.setQueryData(QUERY_KEY, ctx?.previous);
      toast.error("Failed to add <entity> — changes rolled back.");
    },
    onSuccess: () => {
      toast.success("<Entity> added successfully.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  // Update mutation
  const update<Entity> = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<<Entity>> & { id: string }) => {
      const { error } = await supabase.from("<table_name>").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ id, ...patch }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<<Entity>[]>(QUERY_KEY);
      queryClient.setQueryData<<Entity>[]>(QUERY_KEY, (old = []) =>
        old.map(e => e.id === id ? { ...e, ...patch } : e)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(QUERY_KEY, ctx?.previous);
      toast.error("Failed to update <entity> — changes rolled back.");
    },
    onSuccess: () => {
      toast.success("<Entity> updated.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  return {
    ...query,
    add<Entity>,
    update<Entity>,
  };
}
```

---

## Usage Pattern in Components

```tsx
// In any feature component:
import { useHubs } from "../../hooks/useHubs";
import { useHubStore } from "../../stores/hubStore";

export function HubsPanel() {
  const { data: hubs = [], isLoading, error } = useHubs();
  const selectedHubId = useHubStore(s => s.selectedHubId);
  
  if (isLoading) return <div>Loading hubs…</div>;
  if (error) return <div>Failed to load hubs.</div>;
  
  return (
    <ul>
      {hubs.map(hub => (
        <HubCard key={hub.id} hub={hub} isSelected={hub.id === selectedHubId} />
      ))}
    </ul>
  );
}
```

---

## Realtime Event Mapping

| Supabase table | Event types to subscribe | What to invalidate |
|---|---|---|
| `driver_locations` | `UPDATE` only | `["riders"]` |
| `orders` | `INSERT`, `UPDATE` | `["riders"]`, `["orders"]` |
| `hubs` | `INSERT`, `UPDATE`, `DELETE` | `["hubs"]` |
| `users` (partners) | `UPDATE` | `["clients"]` |

---

## Verification

After writing the hook, verify:

1. TypeScript compiles:
```bash
npx tsc --noEmit
```

2. The hook is importable from its expected path (no circular imports):
```bash
node -e "require('./src/hooks/use<Entities>.ts')" 2>&1 | head -5
```

3. If `sonner` is used for toasts, confirm it's in `main.tsx`:
```bash
grep -n "Toaster" src/main.tsx
```

If not, add `<Toaster />` from `"sonner"` to `main.tsx` — it must be outside `RouterProvider` but inside the root div.
