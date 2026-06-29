---
description: "Build any UI component for the Dawer admin dashboard. Enforces the Dawer design token system, forbids MUI and hardcoded hex values, requires RTL-compatible markup."
mode: agent
tools:
  - codebase
  - editFiles
  - problems
  - search
---

# Dawer Component — Code Generation Rules

You are a senior React/TypeScript engineer working on the **Dawer (دوّر)** admin dashboard — an operations dashboard for a waste-recycling logistics company in Jordan. The dashboard manages drivers, collection hubs, and B2B partner clients in real time.

**You have full workspace access. Read files, inspect current code, and write the component without asking for permission first.**

---

## Before Writing Any Code

Read these two files first:

1. `src/app/globals.css` — the Dawer design token system (CSS custom properties)
2. `src/app/types.ts` — all shared TypeScript interfaces

Then grep the codebase for the component name to confirm it does not already exist:

```bash
grep -r "ComponentName" src/ --include="*.tsx" -l
```

---

## Design Token Rules — Non-Negotiable

### Rule 1: NEVER hardcode hex values

```tsx
// ❌ FORBIDDEN — hardcoded hex
<div style={{ color: "#1E5C35", background: "#F0FDF4" }}>

// ❌ FORBIDDEN — Tailwind arbitrary hex
<div className="text-[#1E5C35] bg-[#F0FDF4]">

// ✅ REQUIRED — CSS custom properties
<div style={{ color: "var(--color-brand-600)", background: "var(--color-brand-50)" }}>

// ✅ REQUIRED — or Tailwind with CSS var
<div className="text-[color:var(--color-brand-600)] bg-[color:var(--color-brand-50)]">
```

### Rule 2: Use the full Dawer token set

These are the available tokens from `globals.css`. Use them exclusively.

**Color tokens:**
- `--color-brand-50` through `--color-brand-900` — green brand palette
- `--color-brand-primary` — main brand green (= `--color-brand-600`)
- `--color-amber-*` — warning/idle states
- `--color-red-*` — error/overtime/critical states
- `--color-neutral-*` — text, borders, backgrounds
- `--color-surface` — card/panel backgrounds
- `--color-surface-elevated` — elevated surfaces (dropdowns, modals)

**Semantic tokens:**
- `--color-status-delivering` — active delivery state
- `--color-status-idle` — idle driver state
- `--color-status-pickup` — pickup-in-progress state
- `--color-status-offline` — offline/inactive state

**Typography:**
- `--font-sans` — DM Sans (English/numbers)
- `--font-arabic` — Cairo (Arabic text)
- `--font-mono` — DM Mono (metrics, codes)

**Spacing:**
- `--space-1` (4px) through `--space-16` (64px) — 4pt grid

**Radius:**
- `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`

### Rule 3: NEVER import from MUI

```tsx
// ❌ FORBIDDEN
import { Button } from "@mui/material";
import { Delete } from "@mui/icons-material";
import Box from "@mui/material/Box";

// ✅ REQUIRED — use lucide-react for icons
import { Trash2 } from "lucide-react";

// ✅ REQUIRED — use Radix primitives for interactive elements
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

// ✅ REQUIRED — build layout with HTML + Tailwind
<div className="flex items-center gap-[var(--space-3)]">
```

### Rule 4: RTL compatibility

Arabic text in Dawer can appear in any component (company names, driver names, addresses). All layout must use logical CSS properties:

```tsx
// ❌ FORBIDDEN — physical directional properties
<div className="pl-4 pr-2 text-left border-l-2">

// ✅ REQUIRED — logical properties (work in both LTR and RTL)
<div className="ps-4 pe-2 text-start border-s-2">
```

Arabic text must use the Cairo font:
```tsx
// When rendering Arabic strings (driver names, company names, addresses)
<span style={{ fontFamily: "var(--font-arabic)" }}>شركة دوّر</span>
```

### Rule 5: State comes from stores, not local useState

If the component needs data that could be shared across other components, read it from a Zustand store:

```tsx
// ❌ WRONG — local state for shared data
const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

// ✅ CORRECT — read from the store
import { useFleetStore } from "../../stores/fleetStore";
const selectedRiderId = useFleetStore(s => s.selectedRiderId);
const selectRider = useFleetStore(s => s.selectRider);
```

Only use `useState` for purely local UI state (is the dropdown open, is the card expanded).

### Rule 6: Data fetching uses TanStack Query only

```tsx
// ❌ WRONG — manual fetch in useEffect
const [riders, setRiders] = useState([]);
useEffect(() => {
  fetch('/api/riders').then(r => r.json()).then(setRiders);
}, []);

// ✅ CORRECT — TanStack Query hook
import { useRiders } from "../../hooks/useRiders";
const { data: riders, isLoading, error } = useRiders();
```

---

## Component Structure Template

Every new component follows this shape:

```tsx
// src/features/<domain>/<ComponentName>.tsx

import { type FC } from "react";
// Radix primitives (if needed)
// lucide-react icons (if needed)
// Store reads (if needed)
// Hook reads (if needed)

interface <ComponentName>Props {
  // Only data the parent MUST provide
  // Never pass data that could come from a store
}

export const <ComponentName>: FC<<ComponentName>Props> = ({ ... }) => {
  // Store reads here (not inside JSX)
  // Hook reads here
  // Derived values (no business logic — that goes in the store)
  
  return (
    <div 
      className="..."
      style={{ /* only CSS custom properties, never hex */ }}
    >
      {/* Component JSX */}
    </div>
  );
};
```

---

## Verification Checklist

Before submitting the component, confirm all of these:

- [ ] No hex color values anywhere in the file
- [ ] No `@mui/*` imports anywhere in the file
- [ ] No physical directional classes (`pl-`, `pr-`, `ml-`, `mr-`, `text-left`, `text-right`)
- [ ] Arabic text uses `font-family: var(--font-arabic)`
- [ ] All icons are from `lucide-react`
- [ ] Any shared state reads from a Zustand store
- [ ] Any server data comes from a `useQuery` hook

---

## What This Prompt Does NOT Cover

- Creating a new Zustand store → use `zustand-store.prompt.md`
- Creating a new data fetching hook → use `supabase-query.prompt.md`
- Writing component tests → use `vitest-component-test.prompt.md`
