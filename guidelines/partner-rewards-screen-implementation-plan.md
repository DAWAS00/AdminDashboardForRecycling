# Partner & Rewards Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder CO₂ Stats screen (`ViewId = "co2"`) with a fully functional Partner & Rewards management screen that shows B2B partner health scores, churn risk alerts, MRR metrics, tier progression, green loyalty points, and an inline pricing editor.

**Architecture:** New `ViewId = "partners"` renders `PartnersView` — a full-height React screen assembled from 5 focused sub-components (`MRRStrip`, `ChurnAlertPanel`, `PartnerCard`, `PartnerDetailDrawer`) all living under `src/app/components/partners/`. Data flows down from `useState<Client[]>(CLIENTS)` in PartnersView; mutations (tier changes, price overrides, notes) call `onUpdate(client)` which merges into local state. No backend — persistence is in-session only.

**Tech Stack:** React 18 + TypeScript + Tailwind CSS v4 · Lucide React icons · DM Sans / DM Mono fonts · raw hex color values (matches existing codebase — no CSS variables)

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Modify | `src/app/types.ts` | Add new Client fields; add "partners" to ViewId |
| Modify | `src/app/constants.ts` | Add TIER_CONFIG, TIER_PRICES_JD, tier/points constants; extend buildClient + CLIENTS; update NAV_ITEMS |
| Modify | `src/app/helpers.ts` | Add computePartnerHealth, computeTierProgress, getEffectivePriceJD, isChurnRisk, computePartnerMRR |
| Create | `src/app/components/partners/MRRStrip.tsx` | 4-stat header: MRR, partner count, avg health, churn alert count |
| Create | `src/app/components/partners/ChurnAlertPanel.tsx` | Amber banner listing at-risk partners as clickable chips |
| Create | `src/app/components/partners/PartnerCard.tsx` | Single partner card — health bar, MRR, green points, renewal countdown |
| Create | `src/app/components/partners/PartnerDetailDrawer.tsx` | Right-side slide-out with 4 tabs: Overview / Pricing / Orders / Impact |
| Create | `src/app/components/partners/PartnersView.tsx` | Main screen: assembles all sub-components, owns `clients` state |
| Modify | `src/app/App.tsx` | Import PartnersView; add "partners" to viewTitle/viewSubtitle; render it; remove "co2" view |

---

## Task 1: Extend types.ts — ViewId + Client interface

**Files:**
- Modify: `src/app/types.ts`

- [ ] **Step 1: Open types.ts and add "partners" to ViewId and new Client fields**

Find line 75 (current `ViewId` type) and the `Client` interface (lines 90–103). Apply both changes:

```typescript
// Line 75 — change:
// BEFORE:
export type ViewId = "map" | "heatmap" | "hubs" | "co2" | "reports";
// AFTER:
export type ViewId = "map" | "heatmap" | "hubs" | "partners" | "reports";
```

```typescript
// Client interface (line 90–103) — replace the whole block with:
/** A B2B recycling client */
export interface Client {
  id: string;
  name: string;
  nameAr?: string;
  type: ClientType;
  address: string;
  phone: string;
  email: string;
  contractTier: ContractTier;
  joinedDate: string;           // ISO date
  orders: Order[];
  totalCo2Saved: number;        // computed
  totalEarnings: number;        // computed
  // ── Partner & Rewards fields ──────────────────────
  renewalDate: string;          // ISO date of next contract renewal
  billingCycle: "monthly" | "annual";
  greenPoints: number;          // loyalty points earned (1 per kg recycled)
  customPriceJD?: number;       // if set, overrides standard tier price (monthly JD)
  contractNotes?: string;       // free-text admin notes
  lastCertificateDownload?: string; // ISO date of last CO₂ certificate download
  referredBy?: string;          // client name who referred this partner
}
```

- [ ] **Step 2: Verify the build fails with expected TypeScript errors**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npm run build 2>&1 | head -40
```

Expected errors:
- `Property 'renewalDate' is missing in type ...` on the CLIENTS array (in constants.ts)
- `Type '"co2"' is not assignable to type 'ViewId'` in App.tsx and constants.ts NAV_ITEMS

These are expected — Tasks 2 and 9 fix them.

---

## Task 2: Extend constants.ts — tier system, CLIENTS, NAV_ITEMS

**Files:**
- Modify: `src/app/constants.ts`

- [ ] **Step 1: Add lucide icon import for the partners nav item**

Find line 3:
```typescript
// BEFORE:
import {
  Droplets, Package, Zap,
  MapPin, Layers, Warehouse, BarChart2, FileText,
  Activity, TrendingUp, Wind
} from "lucide-react";
// AFTER:
import {
  Droplets, Package, Zap,
  MapPin, Layers, Warehouse, BarChart2, FileText,
  Activity, TrendingUp, Wind, Users,
} from "lucide-react";
```

- [ ] **Step 2: Add TIER_CONFIG constant after the ORDER_STATUS_ORDER line (after line 28)**

Insert after `export const ORDER_STATUS_ORDER`:

```typescript
// ── Partner tier display config ───────────────────────────────────────────────
export const TIER_CONFIG: Record<ContractTier, {
  label: string; color: string; bg: string; borderColor: string;
}> = {
  free:       { label: "Free",       color: "#64748B", bg: "#F1F5F9", borderColor: "#CBD5E1" },
  basic:      { label: "Basic",      color: "#1E40AF", bg: "#DBEAFE", borderColor: "#BFDBFE" },
  pro:        { label: "Pro",        color: "#1E5C35", bg: "#D1FAE5", borderColor: "#A7F3D0" },
  enterprise: { label: "Enterprise", color: "#92400E", bg: "#FEF3C7", borderColor: "#FCD34D" },
};

// ── Partner pricing constants (JD) ───────────────────────────────────────────
export const TIER_PRICES_JD: Record<ContractTier, { monthly: number; annual: number }> = {
  free:       { monthly: 0,   annual: 0    },
  basic:      { monthly: 30,  annual: 300  },
  pro:        { monthly: 80,  annual: 800  },
  enterprise: { monthly: 200, annual: 2000 },
};

// Ordered from lowest to highest — used for tier progression UI
export const TIER_ORDER: ContractTier[] = ["free", "basic", "pro", "enterprise"];

// Minimum completed orders in the last 30 days to qualify for each tier
export const TIER_MONTHLY_THRESHOLDS: Record<ContractTier, number> = {
  free: 0, basic: 3, pro: 10, enterprise: 25,
};

// Loyalty: 1 green point awarded per kg of material recycled
export const GREEN_POINTS_PER_KG = 1;

// Perks visible in the Impact tab per tier
export const TIER_BENEFITS: Record<ContractTier, string[]> = {
  free:       ["Basic pickup scheduling", "Email support"],
  basic:      ["Priority pickup", "Monthly CO₂ report", "Email + WhatsApp support"],
  pro:        ["Same-day pickup", "Weekly CO₂ reports", "Certificate PDF", "Dedicated account manager"],
  enterprise: ["On-demand pickup", "Custom reporting cadence", "CSRD-ready certificates", "Quarterly business review", "API access"],
};
```

- [ ] **Step 3: Update the buildClient function to accept new partner fields**

Find the existing `buildClient` function (around line 447) and replace it entirely:

```typescript
function buildClient(
  id: string,
  name: string,
  nameAr: string,
  type: ClientType,
  address: string,
  phone: string,
  email: string,
  tier: ContractTier,
  joined: string,
  extras: {
    renewalDate: string;
    billingCycle: "monthly" | "annual";
    greenPoints: number;
    customPriceJD?: number;
    contractNotes?: string;
    lastCertificateDownload?: string;
    referredBy?: string;
  }
): Client {
  const orders = baseClientOrders[id] ?? [];
  return {
    id, name, nameAr, type, address, phone, email,
    contractTier: tier,
    joinedDate: joined,
    orders,
    totalCo2Saved: orders.reduce((s, o) => s + o.co2Saved, 0),
    totalEarnings: orders.reduce((s, o) => s + o.earnings, 0),
    ...extras,
  };
}
```

- [ ] **Step 4: Replace the CLIENTS array with data that includes new partner fields**

Find the `export const CLIENTS: Client[] = [` block and replace it:

```typescript
export const CLIENTS: Client[] = [
  buildClient(
    "fakhreddine", "Fakhreddine Restaurant", "مطعم فخر الدين",
    "restaurant", "Downtown, Rainbow St", "+962 7 9012 3456", "ops@fakhreddine.jo",
    "pro", "2025-02-14",
    { renewalDate: "2026-08-14", billingCycle: "monthly", greenPoints: 450 }
  ),
  buildClient(
    "al-quds-hotel", "Al-Quds Hotel", "فندق القدس",
    "hotel", "Abdoun, Shmesani Bridge", "+962 7 8123 4567", "gm@alquds.com",
    "enterprise", "2024-09-03",
    {
      renewalDate: "2026-09-03", billingCycle: "annual", greenPoints: 1240,
      customPriceJD: 180,
      contractNotes: "Preferred partner — custom SLA includes monthly CO₂ reporting. Key contact: GM Samer Khoury.",
    }
  ),
  buildClient(
    "ojeh", "Ojeh Electronics", "أوجيه للإلكترونيات",
    "retail", "Sweifieh, Orchid St", "+962 7 7234 5678", "logistics@ojeh.jo",
    "basic", "2025-05-20",
    { renewalDate: "2026-06-20", billingCycle: "monthly", greenPoints: 45 }
    // renewalDate is 5 days overdue + low points → churn risk for demo
  ),
  buildClient(
    "zara-jo", "Zara Jordan", "زارا الأردن",
    "retail", "Sweifieh, Wakalat St", "+962 7 6345 6789", "store@zara.jo",
    "pro", "2024-11-12",
    { renewalDate: "2026-07-12", billingCycle: "annual", greenPoints: 320, referredBy: "Fakhreddine Restaurant" }
  ),
  buildClient(
    "istishari", "Istishari Hospital", "مستشفى استشاري",
    "hospital", "Abdoun, Kullieh Circle", "+962 7 5456 7890", "waste@istishari.jo",
    "enterprise", "2023-07-08",
    {
      renewalDate: "2026-07-08", billingCycle: "annual", greenPoints: 2100,
      customPriceJD: 195,
      lastCertificateDownload: "2026-06-20",
      contractNotes: "CSRD compliance reporting required quarterly. Key contact: Dr. Nidal Mansour, Waste Mgmt Dept.",
    }
  ),
];
```

- [ ] **Step 5: Update NAV_ITEMS to replace "co2" with "partners"**

Find the `NAV_ITEMS` export (near the end of constants.ts) and change the CO₂ Stats entry:

```typescript
export const NAV_ITEMS: { icon: React.ComponentType<{ size: number }>; label: string; id: ViewId }[] = [
  { icon: MapPin,    label: "Live Map",  id: "map"      },
  { icon: Layers,    label: "Heat Map",  id: "heatmap"  },
  { icon: Warehouse, label: "Hubs",      id: "hubs"     },
  { icon: Users,     label: "Partners",  id: "partners" },
  { icon: FileText,  label: "Reports",   id: "reports"  },
];
```

- [ ] **Step 6: Verify TypeScript error count reduced**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npm run build 2>&1 | head -40
```

Expected remaining errors: only `Type '"co2"' is not assignable` in App.tsx (viewTitle/viewSubtitle/render block) — fixed in Task 9. All constants.ts errors should be gone.

- [ ] **Step 7: Commit**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && git add src/app/types.ts src/app/constants.ts && git commit -m "feat(partners): extend Client type, tier constants, CLIENTS data, NAV_ITEMS"
```

---

## Task 3: Add partner helpers to helpers.ts

**Files:**
- Modify: `src/app/helpers.ts`

- [ ] **Step 1: Add imports at the top of helpers.ts if not already present**

Ensure these imports exist at the top of helpers.ts. If the file already imports from types/constants, add the new names to the existing import lines:

```typescript
import { Client, ContractTier } from "./types";
import { TIER_PRICES_JD, TIER_ORDER, TIER_MONTHLY_THRESHOLDS } from "./constants";
```

- [ ] **Step 2: Append all five partner helper functions to the end of helpers.ts**

```typescript
// ── Partner & Rewards helpers ─────────────────────────────────────────────────

/**
 * Computes a 0–100 health score for a partner.
 * Deductions:
 *   - Order recency: no completed/inTransit order in 30 days → -25; in 14–30 days → -10
 *   - Renewal proximity: overdue → -30; within 14 days → -20; within 30 days → -10
 *   - Green points engagement: below tier threshold → -15
 */
export function computePartnerHealth(client: Client): number {
  const TODAY = new Date("2026-06-24");
  let score = 100;

  // Factor 1 — order recency
  const activeOrders = client.orders.filter(o => o.status === "completed" || o.status === "inTransit");
  if (activeOrders.length === 0) {
    score -= 25;
  } else {
    const latestMs = activeOrders
      .map(o => new Date(o.createdAt).getTime())
      .sort((a, b) => b - a)[0];
    const daysSince = Math.floor((TODAY.getTime() - latestMs) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) score -= 25;
    else if (daysSince > 14) score -= 10;
  }

  // Factor 2 — renewal proximity
  const renewal = new Date(client.renewalDate);
  const daysToRenewal = Math.floor((renewal.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  if (daysToRenewal < 0)   score -= 30;  // overdue
  else if (daysToRenewal < 14) score -= 20;
  else if (daysToRenewal < 30) score -= 10;

  // Factor 3 — green points engagement
  const pointsThreshold: Record<ContractTier, number> = {
    free: 0, basic: 50, pro: 150, enterprise: 400,
  };
  if (client.greenPoints < pointsThreshold[client.contractTier]) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/** Returns true when health score < 60 — triggers ChurnAlertPanel chip */
export function isChurnRisk(client: Client): boolean {
  return computePartnerHealth(client) < 60;
}

/**
 * Returns how many orders the client placed in the last 30 days,
 * which tier comes next, the threshold to reach it, and progress %.
 */
export function computeTierProgress(client: Client): {
  currentOrders: number;
  nextTier: ContractTier | null;
  nextTierThreshold: number;
  pct: number;
} {
  const TODAY = new Date("2026-06-24");
  const thirtyDaysAgo = new Date(TODAY.getTime() - 30 * 24 * 60 * 60 * 1000);

  const currentOrders = client.orders.filter(
    o => o.status !== "pending" && new Date(o.createdAt) >= thirtyDaysAgo
  ).length;

  const idx = TIER_ORDER.indexOf(client.contractTier);
  const nextTier: ContractTier | null = idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;

  if (!nextTier) return { currentOrders, nextTier: null, nextTierThreshold: 0, pct: 100 };

  const threshold = TIER_MONTHLY_THRESHOLDS[nextTier];
  const pct = Math.min(100, Math.round((currentOrders / threshold) * 100));
  return { currentOrders, nextTier, nextTierThreshold: threshold, pct };
}

/**
 * Returns the effective monthly price in JD.
 * Priority: customPriceJD → annual÷12 → standard monthly.
 */
export function getEffectivePriceJD(client: Client): number {
  if (client.customPriceJD !== undefined) return client.customPriceJD;
  const prices = TIER_PRICES_JD[client.contractTier];
  if (client.billingCycle === "annual") return Math.round((prices.annual / 12) * 100) / 100;
  return prices.monthly;
}

/** Monthly Recurring Revenue across all non-free partners (JD) */
export function computePartnerMRR(clients: Client[]): number {
  return Math.round(
    clients
      .filter(c => c.contractTier !== "free")
      .reduce((sum, c) => sum + getEffectivePriceJD(c), 0) * 100
  ) / 100;
}
```

- [ ] **Step 3: Verify build is still broken only in App.tsx**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npm run build 2>&1 | grep "error TS"
```

Expected: only errors pointing to App.tsx (`"co2"` not assignable to ViewId). Zero errors in helpers.ts, types.ts, constants.ts.

- [ ] **Step 4: Commit**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && git add src/app/helpers.ts && git commit -m "feat(partners): add partner health, churn risk, tier progress, MRR helpers"
```

---

## Task 4: Create MRRStrip.tsx

**Files:**
- Create: `src/app/components/partners/MRRStrip.tsx`

- [ ] **Step 1: Create the partners directory and MRRStrip component**

```bash
mkdir -p "E:\Dawer DashBorad\AdminDashboardForRecycling\src\app\components\partners"
```

Create `src/app/components/partners/MRRStrip.tsx`:

```tsx
import { DollarSign, Users, Heart, AlertTriangle } from "lucide-react";
import { Client } from "../../types";
import { computePartnerHealth, computePartnerMRR, isChurnRisk } from "../../helpers";

interface MRRStripProps {
  clients: Client[];
}

export function MRRStrip({ clients }: MRRStripProps) {
  const mrr = computePartnerMRR(clients);
  const paidCount   = clients.filter(c => c.contractTier !== "free").length;
  const totalCount  = clients.length;
  const avgHealth   = totalCount
    ? Math.round(clients.reduce((s, c) => s + computePartnerHealth(c), 0) / totalCount)
    : 0;
  const churnCount  = clients.filter(isChurnRisk).length;

  const healthColor = avgHealth >= 70 ? "#1E5C35" : avgHealth >= 50 ? "#C8860A" : "#DC2626";
  const churnColor  = churnCount > 0 ? "#DC2626" : "#1E5C35";

  const tiles = [
    {
      icon: DollarSign,
      label: "Monthly MRR",
      value: `${mrr.toFixed(0)} JD`,
      sub: `${paidCount} paid partner${paidCount !== 1 ? "s" : ""}`,
      color: "#1E5C35",
    },
    {
      icon: Users,
      label: "Total Partners",
      value: String(totalCount),
      sub: `${totalCount - paidCount} on free tier`,
      color: "#1E40AF",
    },
    {
      icon: Heart,
      label: "Avg Health",
      value: `${avgHealth}%`,
      sub: avgHealth >= 70 ? "Fleet healthy" : "Review needed",
      color: healthColor,
    },
    {
      icon: AlertTriangle,
      label: "Churn Risk",
      value: String(churnCount),
      sub: churnCount > 0 ? "Need attention" : "All clear",
      color: churnColor,
    },
  ] as const;

  return (
    <div
      className="flex gap-3 px-4 py-3 border-b flex-shrink-0"
      style={{ background: "white", borderColor: "#E2E8F0" }}
    >
      {tiles.map(({ icon: Icon, label, value, sub, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 flex-1 px-3 py-2 rounded-xl"
          style={{ background: "#F8FAFC" }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18` }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {label}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Mono',monospace", lineHeight: 1.2 }}>
              {value}
            </div>
            <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
              {sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Verify file created without TypeScript errors (standalone check)**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npx tsc --noEmit 2>&1 | grep "partners/MRRStrip"
```

Expected: no output (no errors in the new file).

- [ ] **Step 3: Commit**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && git add src/app/components/partners/MRRStrip.tsx && git commit -m "feat(partners): add MRRStrip header stats component"
```

---

## Task 5: Create ChurnAlertPanel.tsx

**Files:**
- Create: `src/app/components/partners/ChurnAlertPanel.tsx`

- [ ] **Step 1: Create ChurnAlertPanel.tsx**

```tsx
import { AlertTriangle } from "lucide-react";
import { Client } from "../../types";
import { computePartnerHealth, isChurnRisk } from "../../helpers";

interface ChurnAlertPanelProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

export function ChurnAlertPanel({ clients, onSelectClient }: ChurnAlertPanelProps) {
  const atRisk = clients.filter(isChurnRisk);
  if (atRisk.length === 0) return null;

  return (
    <div
      className="mx-4 mt-3 rounded-xl border p-3 flex-shrink-0"
      style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={13} style={{ color: "#C8860A" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E", fontFamily: "'DM Sans',sans-serif" }}>
          {atRisk.length} partner{atRisk.length > 1 ? "s" : ""} need attention
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {atRisk.map(c => {
          const health = computePartnerHealth(c);
          const isCritical = health < 40;
          return (
            <button
              key={c.id}
              onClick={() => onSelectClient(c.id)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all hover:shadow-sm"
              style={{ background: "white", borderColor: "#E2E8F0" }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif" }}>
                {c.name}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: isCritical ? "#FEE2E2" : "#FEF3C7",
                  color:      isCritical ? "#DC2626" : "#92400E",
                  fontFamily: "'DM Mono',monospace",
                }}
              >
                {health}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors in new file**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npx tsc --noEmit 2>&1 | grep "partners/Churn"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && git add src/app/components/partners/ChurnAlertPanel.tsx && git commit -m "feat(partners): add ChurnAlertPanel risk banner"
```

---

## Task 6: Create PartnerCard.tsx

**Files:**
- Create: `src/app/components/partners/PartnerCard.tsx`

- [ ] **Step 1: Create PartnerCard.tsx**

```tsx
import { AlertTriangle, Leaf, Lock } from "lucide-react";
import { Client, ClientType } from "../../types";
import { TIER_CONFIG } from "../../constants";
import { computePartnerHealth, getEffectivePriceJD, isChurnRisk } from "../../helpers";

const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  restaurant: "🍽 Restaurant",
  hotel:      "🏨 Hotel",
  office:     "🏢 Office",
  retail:     "🛍 Retail",
  hospital:   "🏥 Hospital",
  other:      "📦 Other",
};

interface PartnerCardProps {
  client: Client;
  onClick: () => void;
}

export function PartnerCard({ client, onClick }: PartnerCardProps) {
  const health    = computePartnerHealth(client);
  const mrr       = getEffectivePriceJD(client);
  const atRisk    = isChurnRisk(client);
  const tierCfg   = TIER_CONFIG[client.contractTier];
  const TODAY     = new Date("2026-06-24");
  const renewal   = new Date(client.renewalDate);
  const daysToRenewal = Math.floor((renewal.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));

  const healthColor = health >= 70 ? "#1E5C35" : health >= 50 ? "#C8860A" : "#DC2626";
  const healthBg    = health >= 70 ? "#D1FAE5" : health >= 50 ? "#FEF3C7" : "#FEE2E2";

  const renewalLabel = daysToRenewal < 0
    ? `${Math.abs(daysToRenewal)}d overdue`
    : daysToRenewal === 0
    ? "Renews today"
    : `Renews in ${daysToRenewal}d`;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border p-4 transition-all hover:shadow-md"
      style={{
        background:   "white",
        borderColor:  atRisk ? "#FCD34D" : "#E2E8F0",
        boxShadow:    "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header row: badges + lock icon */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "#F1F5F9", color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}
          >
            {CLIENT_TYPE_LABELS[client.type]}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: tierCfg.bg, color: tierCfg.color, fontFamily: "'DM Sans',sans-serif" }}
          >
            {tierCfg.label}
          </span>
        </div>
        {client.customPriceJD !== undefined && (
          <Lock size={11} style={{ color: "#94A3B8", flexShrink: 0 }} />
        )}
      </div>

      {/* Company name + address */}
      <div style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.3 }}>
        {client.name}
      </div>
      <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>
        {client.address}
      </div>

      {/* Divider */}
      <div className="my-3 h-px" style={{ background: "#F1F5F9" }} />

      {/* Health bar row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: healthBg, color: healthColor, fontFamily: "'DM Mono',monospace" }}
          >
            {health}%
          </span>
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${health}%`, background: healthColor }}
            />
          </div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Mono',monospace" }}>
          {mrr > 0 ? `${mrr} JD/mo` : "Free"}
        </span>
      </div>

      {/* Orders + points + renewal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
            📦 {client.orders.length} order{client.orders.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-0.5" style={{ fontSize: 11, color: "#1E5C35", fontFamily: "'DM Sans',sans-serif" }}>
            <Leaf size={10} /> {client.greenPoints.toLocaleString()} pts
          </span>
        </div>
        <div className="flex items-center gap-1">
          {atRisk && <AlertTriangle size={10} style={{ color: "#C8860A" }} />}
          <span style={{ fontSize: 10, color: atRisk ? "#C8860A" : "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
            {renewalLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Verify no errors**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npx tsc --noEmit 2>&1 | grep "partners/PartnerCard"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && git add src/app/components/partners/PartnerCard.tsx && git commit -m "feat(partners): add PartnerCard with health bar, MRR, renewal countdown"
```

---

## Task 7: Create PartnerDetailDrawer.tsx

**Files:**
- Create: `src/app/components/partners/PartnerDetailDrawer.tsx`

- [ ] **Step 1: Create the drawer component**

Create `src/app/components/partners/PartnerDetailDrawer.tsx`:

```tsx
import { useState } from "react";
import { X, TrendingUp, Lock, Unlock, FileText, Leaf, Download } from "lucide-react";
import { Client, ContractTier } from "../../types";
import { TIER_CONFIG, TIER_PRICES_JD, TIER_ORDER, TIER_BENEFITS, CO2_EQUIVALENTS } from "../../constants";
import {
  computePartnerHealth,
  computeTierProgress,
  getEffectivePriceJD,
  isChurnRisk,
} from "../../helpers";

type DrawerTab = "overview" | "pricing" | "orders" | "impact";

interface PartnerDetailDrawerProps {
  client: Client;
  onClose: () => void;
  onUpdate: (updated: Client) => void;
}

export function PartnerDetailDrawer({ client, onClose, onUpdate }: PartnerDetailDrawerProps) {
  const [activeTab, setActiveTab]     = useState<DrawerTab>("overview");
  const [editPrice, setEditPrice]     = useState(false);
  const [draftPrice, setDraftPrice]   = useState(
    client.customPriceJD !== undefined ? String(client.customPriceJD) : ""
  );
  const [draftNotes, setDraftNotes]   = useState(client.contractNotes ?? "");
  const [draftBilling, setDraftBilling] = useState<"monthly" | "annual">(client.billingCycle);
  const [draftTier, setDraftTier]     = useState<ContractTier>(client.contractTier);

  const health    = computePartnerHealth(client);
  const progress  = computeTierProgress(client);
  const tierCfg   = TIER_CONFIG[client.contractTier];
  const atRisk    = isChurnRisk(client);
  const clientCo2 = client.orders.reduce((s, o) => s + o.co2Saved, 0);
  const trees     = Math.floor(clientCo2 / CO2_EQUIVALENTS.treeYear);
  const carKm     = Math.floor(clientCo2 / CO2_EQUIVALENTS.carKmPetrol);
  const charges   = Math.floor(clientCo2 / CO2_EQUIVALENTS.smartphoneCharge);

  const healthColor = health >= 70 ? "#1E5C35" : health >= 50 ? "#C8860A" : "#DC2626";

  function handleSavePricing() {
    const parsed = parseFloat(draftPrice);
    onUpdate({
      ...client,
      contractTier:  draftTier,
      billingCycle:  draftBilling,
      customPriceJD: editPrice && !isNaN(parsed) ? parsed : undefined,
      contractNotes: draftNotes.trim() || undefined,
    });
  }

  const TABS: { id: DrawerTab; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
    { id: "overview", label: "Overview", Icon: TrendingUp },
    { id: "pricing",  label: "Pricing",  Icon: Lock       },
    { id: "orders",   label: "Orders",   Icon: FileText   },
    { id: "impact",   label: "Impact",   Icon: Leaf       },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.18)" }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{ width: 400, background: "white", boxShadow: "-6px 0 32px rgba(0,0,0,0.10)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between p-4 border-b flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: tierCfg.bg, color: tierCfg.color, fontFamily: "'DM Sans',sans-serif" }}
              >
                {tierCfg.label}
              </span>
              {atRisk && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#FEE2E2", color: "#DC2626", fontFamily: "'DM Sans',sans-serif" }}
                >
                  ⚠ At Risk
                </span>
              )}
              {client.customPriceJD !== undefined && (
                <span
                  className="text-[10px] flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                  style={{ background: "#FEF3C7", color: "#92400E", fontFamily: "'DM Sans',sans-serif" }}
                >
                  <Lock size={9} /> Custom Price
                </span>
              )}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif" }}>
              {client.name}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
              {client.address} · {client.phone}
            </div>
          </div>
          <button onClick={onClose} className="ml-3 p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X size={16} style={{ color: "#64748B" }} />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
              style={{
                borderBottom: activeTab === id ? "2px solid #1E5C35" : "2px solid transparent",
                color: activeTab === id ? "#1E5C35" : "#94A3B8",
              }}
            >
              <Icon size={13} />
              <span style={{ fontSize: 10, fontFamily: "'DM Sans',sans-serif", fontWeight: activeTab === id ? 600 : 400 }}>
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ──── OVERVIEW ──── */}
          {activeTab === "overview" && (
            <>
              {/* Health score */}
              <div className="rounded-xl p-3 border" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                    Partner Health Score
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: healthColor, fontFamily: "'DM Mono',monospace" }}>
                    {health}/100
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${health}%`, background: healthColor }}
                  />
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6, fontFamily: "'DM Sans',sans-serif" }}>
                  {health >= 70
                    ? "Healthy relationship — keep it up"
                    : health >= 50
                    ? "Some signals need attention"
                    : "High churn risk — take action now"}
                </div>
              </div>

              {/* Tier progress (only if not at top tier) */}
              {progress.nextTier && (
                <div className="rounded-xl p-3 border" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                      Towards {TIER_CONFIG[progress.nextTier].label}
                    </span>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Mono',monospace" }}>
                      {progress.currentOrders}/{progress.nextTierThreshold} orders/30d
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress.pct}%`, background: TIER_CONFIG[progress.nextTier].color }}
                    />
                  </div>
                </div>
              )}

              {/* Green points */}
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#D1FAE5" }}>
                  <Leaf size={18} style={{ color: "#1E5C35" }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1E5C35", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                    {client.greenPoints.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "#166534", fontFamily: "'DM Sans',sans-serif" }}>
                    Green Points earned
                  </div>
                </div>
                {client.referredBy && (
                  <div className="ml-auto text-right">
                    <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>Referred by</div>
                    <div style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>{client.referredBy}</div>
                  </div>
                )}
              </div>

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "CO₂ Saved",    value: `${client.totalCo2Saved.toFixed(1)} kg`, color: "#1E5C35" },
                  { label: "Revenue",       value: `${client.totalEarnings.toFixed(2)} JD`, color: "#1E40AF" },
                  { label: "Total Orders",  value: String(client.orders.length),             color: "#64748B" },
                  { label: "Member Since",  value: new Date(client.joinedDate).toLocaleDateString("en-JO", { month: "short", year: "numeric" }), color: "#64748B" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg p-2.5" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em" }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'DM Mono',monospace", marginTop: 1 }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Tier benefits */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif", marginBottom: 6 }}>
                  {tierCfg.label} Benefits
                </div>
                <ul className="space-y-1">
                  {TIER_BENEFITS[client.contractTier].map(b => (
                    <li key={b} className="flex items-center gap-2" style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                      <span style={{ color: "#1E5C35" }}>✓</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* ──── PRICING ──── */}
          {activeTab === "pricing" && (
            <>
              {/* Effective price display */}
              <div className="rounded-xl p-4" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                <div style={{ fontSize: 10, color: "#166534", fontFamily: "'DM Sans',sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em" }}>
                  Effective Monthly Price
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span style={{ fontSize: 30, fontWeight: 800, color: "#1E5C35", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                    {getEffectivePriceJD(client) > 0 ? getEffectivePriceJD(client) : "0"}
                  </span>
                  <span style={{ fontSize: 14, color: "#166534", fontFamily: "'DM Sans',sans-serif" }}>JD / month</span>
                </div>
                {client.customPriceJD !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <Lock size={9} style={{ color: "#C8860A" }} />
                    <span style={{ fontSize: 10, color: "#92400E", fontFamily: "'DM Sans',sans-serif" }}>
                      Custom negotiated — overrides standard {TIER_PRICES_JD[client.contractTier].monthly} JD/mo
                    </span>
                  </div>
                )}
              </div>

              {/* Tier selector */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                  Contract Tier
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TIER_ORDER.map(tier => {
                    const cfg   = TIER_CONFIG[tier];
                    const price = TIER_PRICES_JD[tier];
                    const sel   = draftTier === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => setDraftTier(tier)}
                        className="rounded-xl p-2.5 text-left border-2 transition-all"
                        style={{ borderColor: sel ? cfg.color : "#E2E8F0", background: sel ? cfg.bg : "white" }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, fontFamily: "'DM Sans',sans-serif" }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'DM Mono',monospace" }}>
                          {price.monthly > 0 ? `${price.monthly} JD/mo` : "Free"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Billing cycle */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                  Billing Cycle
                </div>
                <div className="flex gap-2">
                  {(["monthly", "annual"] as const).map(cycle => {
                    const prices  = TIER_PRICES_JD[draftTier];
                    const saving  = draftTier !== "free" && prices.monthly > 0
                      ? Math.round((1 - prices.annual / (prices.monthly * 12)) * 100)
                      : 0;
                    return (
                      <button
                        key={cycle}
                        onClick={() => setDraftBilling(cycle)}
                        className="flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all capitalize"
                        style={{
                          borderColor: draftBilling === cycle ? "#1E5C35" : "#E2E8F0",
                          background:  draftBilling === cycle ? "#D1FAE5" : "white",
                          color:       draftBilling === cycle ? "#1E5C35" : "#64748B",
                          fontFamily:  "'DM Sans',sans-serif",
                        }}
                      >
                        {cycle}
                        {cycle === "annual" && saving > 0 && (
                          <span className="ml-1 text-[9px]" style={{ color: "#166534" }}>({saving}% off)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom price override */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                    Custom Price Override
                  </div>
                  <button
                    onClick={() => { setEditPrice(p => !p); setDraftPrice(""); }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border"
                    style={{ borderColor: "#E2E8F0", color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    {editPrice ? <Unlock size={9} /> : <Lock size={9} />}
                    {editPrice ? "Clear override" : "Set custom price"}
                  </button>
                </div>
                {editPrice && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={draftPrice}
                      onChange={e => setDraftPrice(e.target.value)}
                      placeholder="e.g. 180"
                      className="flex-1 px-3 py-2 rounded-lg border text-sm"
                      style={{ borderColor: "#E2E8F0", fontFamily: "'DM Mono',monospace", fontSize: 14, outline: "none" }}
                    />
                    <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>JD/mo</span>
                  </div>
                )}
              </div>

              {/* Contract notes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                  Contract Notes
                </div>
                <textarea
                  value={draftNotes}
                  onChange={e => setDraftNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. 3-year commitment, includes quarterly reporting..."
                  className="w-full px-3 py-2 rounded-xl border text-xs resize-none"
                  style={{ borderColor: "#E2E8F0", fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: "none" }}
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSavePricing}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#1E5C35", color: "white", fontFamily: "'DM Sans',sans-serif" }}
              >
                Save Pricing Changes
              </button>
            </>
          )}

          {/* ──── ORDERS ──── */}
          {activeTab === "orders" && (
            <>
              <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
                {client.orders.length} order{client.orders.length !== 1 ? "s" : ""} on record
              </div>
              {client.orders.length === 0 ? (
                <div className="text-center py-12" style={{ color: "#94A3B8", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                  No orders yet
                </div>
              ) : (
                client.orders.map(order => {
                  const statusColors: Record<typeof order.status, { bg: string; color: string; label: string }> = {
                    pending:   { bg: "#FEF3C7", color: "#92400E", label: "Pending"    },
                    accepted:  { bg: "#D1FAE5", color: "#1E5C35", label: "Accepted"   },
                    inTransit: { bg: "#DBEAFE", color: "#1E40AF", label: "In Transit" },
                    completed: { bg: "#DCFCE7", color: "#166534", label: "Completed"  },
                  };
                  const sc = statusColors[order.status];
                  return (
                    <div key={order.id} className="rounded-xl p-3 border" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                      <div className="flex items-start justify-between mb-1.5">
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Mono',monospace" }}>
                          {order.id}
                        </span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: sc.bg, color: sc.color, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}
                        >
                          {sc.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                          {order.material} · {order.quantity} {order.unit}
                        </span>
                        <div className="text-right">
                          <div style={{ fontSize: 11, color: "#1E5C35", fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>
                            {order.co2Saved} kg CO₂
                          </div>
                          <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'DM Mono',monospace" }}>
                            {order.earnings} JD
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "#CBD5E1", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                        {new Date(order.createdAt).toLocaleDateString("en-JO", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ──── IMPACT ──── */}
          {activeTab === "impact" && (
            <>
              {/* CO2 headline */}
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: "linear-gradient(135deg,#D1FAE5 0%,#A7F3D0 100%)", border: "1px solid #6EE7B7" }}
              >
                <div style={{ fontSize: 38, fontWeight: 800, color: "#1E5C35", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                  {clientCo2.toFixed(1)} kg
                </div>
                <div style={{ fontSize: 12, color: "#166534", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                  CO₂ prevented from the atmosphere
                </div>
              </div>

              {/* Equivalents */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                That's equivalent to…
              </div>
              {[
                { emoji: "🌳", label: `${trees} tree${trees !== 1 ? "s" : ""}`, sub: "absorbing CO₂ for a full year" },
                { emoji: "🚗", label: `${carKm.toLocaleString()} km`,           sub: "NOT driven in a petrol car"   },
                { emoji: "📱", label: `${charges.toLocaleString()} charges`,    sub: "of smartphone energy saved"   },
              ].map(({ emoji, label, sub }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                >
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
                      {sub}
                    </div>
                  </div>
                </div>
              ))}

              {/* Certificate download */}
              <div className="rounded-xl p-3 border" style={{ borderColor: "#E2E8F0", background: "white" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>
                  CO₂ Impact Certificate
                </div>
                {client.lastCertificateDownload && (
                  <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                    Last downloaded:{" "}
                    {new Date(client.lastCertificateDownload).toLocaleDateString("en-JO", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                )}
                <button
                  className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: "#1E5C35", color: "white", fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}
                  onClick={() => window.alert(`PDF generation for ${client.name} — wire up to ReportsScreen co2-certificate template`)}
                >
                  <Download size={13} />
                  Download Certificate PDF
                </button>
              </div>
            </>
          )}

        </div>{/* end scroll container */}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors in the new file**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npx tsc --noEmit 2>&1 | grep "PartnerDetailDrawer"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && git add src/app/components/partners/PartnerDetailDrawer.tsx && git commit -m "feat(partners): add PartnerDetailDrawer with 4 tabs (Overview/Pricing/Orders/Impact)"
```

---

## Task 8: Create PartnersView.tsx

**Files:**
- Create: `src/app/components/partners/PartnersView.tsx`

- [ ] **Step 1: Create the main view component**

```tsx
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { CLIENTS, TIER_CONFIG, TIER_ORDER } from "../../constants";
import { Client, ContractTier, ClientType } from "../../types";
import { isChurnRisk } from "../../helpers";
import { MRRStrip } from "./MRRStrip";
import { ChurnAlertPanel } from "./ChurnAlertPanel";
import { PartnerCard } from "./PartnerCard";
import { PartnerDetailDrawer } from "./PartnerDetailDrawer";

type TierFilter = ContractTier | "all";
type TypeFilter = ClientType | "all";

const CLIENT_TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: "all",        label: "All Types"   },
  { id: "restaurant", label: "Restaurants" },
  { id: "hotel",      label: "Hotels"      },
  { id: "hospital",   label: "Hospitals"   },
  { id: "retail",     label: "Retail"      },
  { id: "office",     label: "Offices"     },
];

export function PartnersView() {
  const [clients, setClients]       = useState<Client[]>(CLIENTS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch]         = useState("");

  const selectedClient = selectedId ? clients.find(c => c.id === selectedId) ?? null : null;

  const filtered = useMemo(() => clients.filter(c => {
    if (tierFilter !== "all" && c.contractTier !== tierFilter) return false;
    if (typeFilter !== "all" && c.type !== typeFilter)         return false;
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.address.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [clients, tierFilter, typeFilter, search]);

  function handleUpdate(updated: Client) {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedId(null);
  }

  const TIER_FILTER_OPTIONS: { id: TierFilter; label: string }[] = [
    { id: "all", label: "All Tiers" },
    ...TIER_ORDER.filter(t => t !== "free").map(t => ({ id: t, label: TIER_CONFIG[t].label })),
    { id: "free", label: "Free" },
  ];

  const churnCount = filtered.filter(isChurnRisk).length;

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "#F4F6F5", fontFamily: "'DM Sans',sans-serif" }}>

      {/* MRR header strip */}
      <MRRStrip clients={clients} />

      {/* Churn alert panel (only when at-risk partners exist) */}
      <ChurnAlertPanel clients={clients} onSelectClient={setSelectedId} />

      {/* Filter bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 flex-wrap"
        style={{ background: "white", borderColor: "#E2E8F0" }}
      >
        {/* Search */}
        <div className="relative" style={{ minWidth: 200 }}>
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#94A3B8" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search partners..."
            className="pl-8 pr-3 py-1.5 rounded-lg border w-full"
            style={{ borderColor: "#E2E8F0", fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: "none" }}
          />
        </div>

        {/* Tier filter chips */}
        <div className="flex gap-1.5 flex-wrap">
          {TIER_FILTER_OPTIONS.map(({ id, label }) => {
            const active = tierFilter === id;
            const cfg    = id !== "all" ? TIER_CONFIG[id] : null;
            return (
              <button
                key={id}
                onClick={() => setTierFilter(id)}
                className="text-[11px] px-3 py-1 rounded-full border transition-all"
                style={{
                  background:   active ? (cfg?.bg  ?? "#1E5C35") : "white",
                  borderColor:  active ? (cfg?.color ?? "#1E5C35") : "#E2E8F0",
                  color:        active ? (cfg?.color ?? "#1E5C35") : "#64748B",
                  fontWeight:   active ? 600 : 400,
                  fontFamily:   "'DM Sans',sans-serif",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Type filter chips */}
        <div className="flex gap-1.5 flex-wrap ml-auto">
          {CLIENT_TYPE_OPTIONS.slice(0, 4).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              className="text-[11px] px-3 py-1 rounded-full border transition-all"
              style={{
                background:  typeFilter === id ? "#1E5C35" : "white",
                borderColor: typeFilter === id ? "#1E5C35" : "#E2E8F0",
                color:       typeFilter === id ? "white"   : "#64748B",
                fontFamily:  "'DM Sans',sans-serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count + sort hint */}
      <div className="px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
          {filtered.length} partner{filtered.length !== 1 ? "s" : ""}
          {churnCount > 0 && (
            <span style={{ color: "#C8860A", marginLeft: 6 }}>· {churnCount} at risk</span>
          )}
        </span>
      </div>

      {/* Partner card grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-48" style={{ color: "#94A3B8", fontSize: 13 }}>
            No partners match your filters
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {filtered.map(c => (
              <PartnerCard key={c.id} client={c} onClick={() => setSelectedId(c.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail drawer — renders when a partner is selected */}
      {selectedClient && (
        <PartnerDetailDrawer
          client={selectedClient}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors in the partners folder**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npx tsc --noEmit 2>&1 | grep "partners/"
```

Expected: no output (all 5 partner files clean).

- [ ] **Step 3: Commit**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && git add src/app/components/partners/ && git commit -m "feat(partners): add PartnersView main screen — card grid, filter bar, drawer"
```

---

## Task 9: Wire up App.tsx — replace CO₂ view with Partners screen

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Add the PartnersView import**

Find the imports at the top of App.tsx. After the `ReportsScreen` import (around line 22), add:

```typescript
import { PartnersView } from "./components/partners/PartnersView";
```

- [ ] **Step 2: Update viewTitle record**

Find the `viewTitle` record (around line 139). Replace the `co2` entry with `partners`:

```typescript
const viewTitle: Record<ViewId, string> = {
  map:      "Live Operations Map",
  heatmap:  "CO₂ Savings Heat Map",
  hubs:     "Collection Hubs",
  partners: "Partners & Rewards",   // ← was: co2: "CO₂ Statistics"
  reports:  "Reports & Certificates",
};
```

- [ ] **Step 3: Update viewSubtitle record**

Find the `viewSubtitle` record (around line 147). Replace the `co2` entry with `partners`:

```typescript
const viewSubtitle: Record<ViewId, string> = {
  map:      `Amman, Jordan — tracking ${ONLINE_COUNT} active riders`,
  heatmap:  "District-level CO₂ savings potential across Amman",
  hubs:     "Real-time hub status and material loads",
  partners: "B2B client health, renewals, pricing & green loyalty",  // ← was: co2: ""
  reports:  "",
};
```

- [ ] **Step 4: Replace the CO₂ PlaceholderView render with PartnersView**

Find this line (around line 312):

```tsx
{activeView === "co2" && <PlaceholderView icon={BarChart2} title="CO₂ Statistics" desc="Charts and analytics coming soon" />}
```

Replace it with:

```tsx
{activeView === "partners" && <PartnersView />}
```

- [ ] **Step 5: Verify the build succeeds with zero errors**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && npm run build 2>&1
```

Expected output ends with:
```
✓ built in Xs
```
Zero TypeScript errors. Zero Vite warnings about missing exports.

- [ ] **Step 6: Visual verification checklist**

Run `npm run dev` and navigate to the Partners view in the sidebar:

- [ ] Sidebar shows "Partners" label with Users icon (replacing "CO₂ Stats")
- [ ] MRR strip shows 4 stat tiles (MRR ≈ 552 JD, 5 partners, avg health, 1 at risk)
- [ ] Amber churn alert panel appears showing "Ojeh Electronics · 55%" chip
- [ ] 5 partner cards render in a responsive grid
- [ ] Ojeh Electronics card has amber border + "⚠ Renews Xd overdue"
- [ ] Al-Quds Hotel and Istishari Hospital cards show 🔒 icon (custom price)
- [ ] Clicking any card opens the right-side drawer with header + 4 tabs
- [ ] Overview tab shows health bar, tier progress (if not enterprise), green points
- [ ] Pricing tab shows effective price, tier selector, billing toggle, custom price input, notes
- [ ] Orders tab shows order cards for that client
- [ ] Impact tab shows CO₂ total in kg, equivalents (trees / km / charges), certificate button
- [ ] "Save Pricing Changes" button in Pricing tab updates the card and closes the drawer
- [ ] Clicking outside the drawer (backdrop) closes it
- [ ] Search box filters cards by name or address
- [ ] Tier chips filter the grid correctly

- [ ] **Step 7: Final commit**

```bash
cd "E:\Dawer DashBorad\AdminDashboardForRecycling" && git add src/app/App.tsx && git commit -m "feat(partners): wire PartnersView into App — replace CO2 placeholder"
```

---

## Self-Review

### Spec Coverage

| Requirement | Task |
|------------|------|
| Replace CO₂ screen with Partners view | Task 9 |
| MRR header strip with 4 KPIs | Task 4 |
| Churn risk alert panel | Task 5 |
| Partner card grid with health, MRR, green points, renewal | Task 6 |
| Right-side detail drawer with 4 tabs | Task 7 |
| Per-client price editor with custom override + lock icon | Task 7 (Pricing tab) |
| Contract notes field | Task 7 (Pricing tab) |
| Billing cycle toggle (monthly / annual + discount %) | Task 7 (Pricing tab) |
| Tier selector in admin UI | Task 7 (Pricing tab) |
| Green loyalty points display | Task 6 + Task 7 (Overview tab) |
| Tier progression bar toward next tier | Task 7 (Overview tab) |
| CO₂ equivalents (trees, km, charges) | Task 7 (Impact tab) |
| CO₂ certificate download button | Task 7 (Impact tab) |
| Search + tier + type filter bar | Task 8 |
| Health score algorithm (recency + renewal + points) | Task 3 |
| Churn risk function (health < 60) | Task 3 |
| CLIENTS seeded with realistic demo data | Task 2 |
| Ojeh Electronics as churn risk demo case | Task 2 (comments) |

### Placeholder Scan

✅ No TBD/TODO/placeholder steps — every step has complete code.  
✅ No "similar to Task N" references — all code is repeated in full.  
✅ All types used in later tasks (`ContractTier`, `DrawerTab`, helper return types) are defined in earlier tasks.

### Type Consistency

- `computePartnerHealth(client: Client): number` — defined Task 3, used Tasks 4, 5, 6, 7 ✓
- `isChurnRisk(client: Client): boolean` — defined Task 3, used Tasks 4, 5, 8 ✓
- `computeTierProgress(client)` returns `{ currentOrders, nextTier, nextTierThreshold, pct }` — defined Task 3, destructured in Task 7 ✓
- `getEffectivePriceJD(client: Client): number` — defined Task 3, used Tasks 6, 7 ✓
- `computePartnerMRR(clients: Client[]): number` — defined Task 3, used Task 4 ✓
- `TIER_CONFIG`, `TIER_PRICES_JD`, `TIER_ORDER`, `TIER_BENEFITS`, `CO2_EQUIVALENTS` — all defined Task 2, imported Tasks 4–8 ✓
- `Client.renewalDate`, `Client.billingCycle`, `Client.greenPoints`, `Client.customPriceJD`, `Client.contractNotes`, `Client.lastCertificateDownload`, `Client.referredBy` — all defined Task 1, all read in Tasks 6–8 ✓
