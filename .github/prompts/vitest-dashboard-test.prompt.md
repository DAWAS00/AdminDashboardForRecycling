---
description: "Write Vitest + Testing Library tests for a Dawer dashboard component or hook. Enforces the project's testing conventions: mock Supabase, mock Zustand stores, test behavior not implementation."
mode: agent
tools:
  - codebase
  - editFiles
  - runCommands
  - problems
  - search
  - findTestFiles
---

# Vitest Component Test — Dawer Dashboard

You are a senior React/TypeScript engineer writing tests for the **Dawer (دوّر)** admin dashboard. Tests use Vitest + @testing-library/react. The project's test philosophy: **test behavior, not implementation** — test what the admin sees and what actions produce, not which internal functions were called.

**You have full workspace access. Read the component being tested before writing any tests.**

---

## Before Writing Tests

1. Read the component or hook to be tested
2. Check if a test file already exists:

```bash
find src -name "*.test.tsx" -o -name "*.test.ts" | head -20
```

3. Verify the test setup file exists:

```bash
cat src/test/setup.ts 2>/dev/null || echo "MISSING — create it first"
```

If missing, create `src/test/setup.ts`:

```typescript
// src/test/setup.ts
import "@testing-library/jest-dom";
```

4. Verify `vite.config.ts` has the test block:

```bash
grep -A 6 "test:" vite.config.ts
```

If missing, add:

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

---

## Test File Location

Tests live next to the files they test:

```
src/features/fleet/RiderRow.tsx       → src/features/fleet/RiderRow.test.tsx
src/hooks/useHubs.ts                  → src/hooks/useHubs.test.ts
src/lib/adapters.ts                   → src/lib/adapters.test.ts
src/stores/fleetStore.ts              → src/stores/fleetStore.test.ts
```

---

## Supabase Mock

All tests that touch hooks must mock Supabase. Never make real network calls in tests.

```typescript
// At the top of any test file that imports Supabase-dependent hooks
import { vi, beforeEach } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));
```

---

## Zustand Store Mock

When testing a component that reads from a Zustand store, mock the store:

```typescript
import { vi } from "vitest";
import * as fleetStore from "../../stores/fleetStore";

// Before each test that needs specific store state:
vi.spyOn(fleetStore, "useFleetStore").mockImplementation((selector) =>
  selector({
    selectedRiderId: "rider-abc",
    filterStatus: "all",
    selectRider: vi.fn(),
    setFilterStatus: vi.fn(),
    toggleFleetRadar: vi.fn(),
    reset: vi.fn(),
    showFleetRadar: false,
  })
);
```

---

## TanStack Query Wrapper

Components that use `useQuery`/`useMutation` must be wrapped in `QueryClientProvider`:

```typescript
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },    // no retries in tests
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

// Usage:
render(<HubsPanel />, { wrapper: createWrapper() });
```

---

## Test Patterns by Type

### Pure function tests (adapters, utilities)

```typescript
// src/lib/adapters.test.ts
import { describe, it, expect } from "vitest";
import { adaptHub } from "./adapters";

describe("adaptHub", () => {
  it("converts snake_case Supabase row to camelCase Hub", () => {
    const row = {
      id: "hub-uuid",
      name: "Hub Al-Sweifieh",
      address: "Sweifieh Commercial District",
      lat: 31.944,
      lng: 35.871,
      active: true,
      capacity_kg: 1200,
      current_load: { cookingOil: 312, plastic: 156, paper: 94, electronics: 37 },
      schedule: "weekly",
      next_shipment_date: "2026-06-27",
      last_shipment_date: "2026-06-20",
      status: "collecting",
      created_at: "2026-06-01T00:00:00Z",
    };

    const hub = adaptHub(row);

    expect(hub.id).toBe("hub-uuid");
    expect(hub.capacityKg).toBe(1200);
    expect(hub.currentLoad.cookingOil).toBe(312);
    expect(hub.nextShipmentDate).toEqual(new Date("2026-06-27"));
  });

  it("handles null date fields", () => {
    const hub = adaptHub({ ...minimalRow, next_shipment_date: null, last_shipment_date: null });
    expect(hub.nextShipmentDate).toBeNull();
    expect(hub.lastShipmentDate).toBeNull();
  });
});
```

### Business logic tests (severity ladder, status transitions)

The delivery timer severity ladder is the most critical business logic in the dashboard. These tests must pass:

```typescript
// src/features/fleet/deliveryUrgency.test.ts
import { describe, it, expect } from "vitest";
import { deliveryUrgencyLevel } from "./deliveryUrgency";

describe("deliveryUrgencyLevel", () => {
  it("returns 0 when no elapsed time (within 80% of estimate)", () => {
    expect(deliveryUrgencyLevel({ elapsedMin: 10, estimatedMin: 20 })).toBe(0);
  });

  it("returns 1 (amber) at 80-100% of estimated time", () => {
    expect(deliveryUrgencyLevel({ elapsedMin: 16, estimatedMin: 20 })).toBe(1);
  });

  it("returns 2 (orange) at 100-125% of estimated time", () => {
    expect(deliveryUrgencyLevel({ elapsedMin: 22, estimatedMin: 20 })).toBe(2);
  });

  it("returns 3 (red) at 125-150% of estimated time", () => {
    expect(deliveryUrgencyLevel({ elapsedMin: 28, estimatedMin: 20 })).toBe(3);
  });

  it("returns 4 (pulsing red) beyond 150% of estimated time", () => {
    expect(deliveryUrgencyLevel({ elapsedMin: 35, estimatedMin: 20 })).toBe(4);
  });
});
```

### Hub status cycle test

```typescript
// src/lib/adapters.test.ts — nextStatus helper
import { describe, it, expect } from "vitest";
import { nextHubStatus } from "./adapters";

describe("nextHubStatus", () => {
  it("cycles: collecting → ready → shipped → collecting", () => {
    expect(nextHubStatus("collecting")).toBe("ready");
    expect(nextHubStatus("ready")).toBe("shipped");
    expect(nextHubStatus("shipped")).toBe("collecting");
  });
});
```

### Component behavior test

```typescript
// src/features/fleet/RiderRow.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RiderRow } from "./RiderRow";
import * as fleetStore from "../../stores/fleetStore";

const mockRider = {
  id: "r1",
  name: "Ahmad Khalil",
  status: "delivering" as const,
  activeOrder: "ORD-001",
  deliveryMinutes: 22,
  estimatedMinutes: 20,
  lat: 31.95,
  lng: 35.93,
  idleSince: null,
  material: "Cooking Oil" as const,
  co2Saved: 58.0,
};

describe("RiderRow", () => {
  it("displays rider name and status", () => {
    render(<RiderRow rider={mockRider} isSelected={false} />);
    expect(screen.getByText("Ahmad Khalil")).toBeInTheDocument();
    expect(screen.getByText(/delivering/i)).toBeInTheDocument();
  });

  it("calls selectRider with rider id on click", () => {
    const mockSelect = vi.fn();
    vi.spyOn(fleetStore, "useFleetStore").mockImplementation(s =>
      s({ selectedRiderId: null, filterStatus: "all", selectRider: mockSelect,
          setFilterStatus: vi.fn(), toggleFleetRadar: vi.fn(), reset: vi.fn(), showFleetRadar: false })
    );
    
    render(<RiderRow rider={mockRider} isSelected={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(mockSelect).toHaveBeenCalledWith("r1");
  });

  it("shows overtime badge when delivery exceeds estimated time", () => {
    render(<RiderRow rider={mockRider} isSelected={false} />); // 22/20 min = 110% = level 2
    const badge = screen.getByTestId("delivery-timer-badge");
    expect(badge).toHaveStyle({ color: "var(--color-amber-600)" }); // adjust to actual token
  });
});
```

---

## Running Tests

```bash
npx vitest run           # run once
npx vitest               # watch mode
npx vitest --ui          # visual UI at localhost:51204
npx vitest run --reporter=verbose  # see all test names
```

---

## Verification Checklist

Before submitting tests:

- [ ] No real Supabase calls (supabase is mocked)
- [ ] No `import { something } from "@mui/material"` anywhere in test file
- [ ] Tests describe what the admin SEES or what HAPPENS, not which function was called
- [ ] All tests have descriptive names ("shows overtime badge when delivery exceeds estimated time" — not "renders correctly")
- [ ] Test file is co-located with the tested file
- [ ] `npx vitest run` passes with no errors
