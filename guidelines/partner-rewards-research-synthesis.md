# Partner & Rewards Screen — Research Synthesis
> Dawer Admin Dashboard — June 2026
> Research sources: Lago, PRM market analysis, Recyclebank/Waste Management, Almonds AI green loyalty, B2B SaaS pricing guides

---

## What the Industry Does — 5 Key Findings

### Finding 1: The Recyclebank Model (Biggest Validation)
**Source:** Waste Management's strategic investment in Recyclebank (2010–2014, ~20M customers)

Waste Management + Recyclebank proved the playbook:
- Customers earn green rewards **per kg recycled** — not per dollar spent
- Rewards are redeemable for **real discounts** at partner brands (Madewell, retailers)
- The program motivates MORE recycling, which generates MORE revenue for the platform
- The platform shows customers a running score: "You've kept X kg out of landfill"

**Dawer application:** Restaurants and hotels earn "Green Points" per kg collected. Points reduce their monthly service fee OR unlock premium features. More recycling = more loyal clients = more rider revenue. Virtuous cycle.

---

### Finding 2: Green Loyalty in Hospitality Is a Fast-Growing Category
**Source:** Almonds AI, Ascendant Loyalty, multiple hospitality loyalty reports 2025

Hotels and restaurants are **actively looking** for green loyalty programs to attach to their sustainability reports. Key patterns:

- **Double points for green actions** — e.g., Leela Palaces rewards guests who refuse daily linen changes
- **Real numbers matter most** — "47 trees saved" beats "4.2 kg CO₂" every time. Visual, tangible equivalents drive engagement
- **ESG reporting demand is rising** — EU CSRD regulation now requires large companies (250+ employees) to report sustainability data from 2025. Hotels need verified numbers
- **Social proof through leaderboards** — showing ranked lists of top eco-performers creates competition among businesses in the same category (restaurants compete with restaurants)

**Dawer application:** The Partner screen should give each client a **verified impact certificate** they can submit to CSRD auditors. That's a $0 feature that creates enterprise stickiness.

---

### Finding 3: B2B SaaS Custom Pricing Is the #1 Admin Need
**Source:** Railsware, Lago, Enterprise SaaS Pricing guide 2026

Two types of B2B pricing: structured and unstructured.

**Structured discounting** (rules in the system):
- Volume thresholds: "10+ collections/month → 10% off"
- Tier step-up incentives: "Upgrade to Pro and get 15% off first 3 months"
- Multi-year commitment discounts: "Annual plan → 20% off vs monthly"
- Partner channel margins: "Referred partner → 5% lifetime discount"

**Unstructured (per-client) discounting** (negotiated per deal):
- Admin manually sets a custom price for a specific client
- Enterprise clients almost always need custom pricing
- Requires per-client price override capability in the admin panel
- Example: "Amman Sheraton negotiated 180 JD/month flat rate" vs standard 240 JD

**Research conclusion:** For products under $25K ACV (Dawer's range), price transparency + self-serve tier upgrade works for Basic/Pro. For Enterprise (large hotels, chains), admin must be able to set a fully custom monthly price and contract terms.

---

### Finding 4: PRM Platforms in 2025 Focus on Personalization + Behavioral Analytics
**Source:** Partner Relationship Management market analysis 2026

PRM (Partner Relationship Management) platforms are evolving toward:
- **Personalized dashboards per partner** — each client sees THEIR own numbers, not a generic template
- **Behavioral analytics** — track how partners engage: do they log in, do they place orders consistently, are they reading impact reports?
- **AI-driven recommendations** — "This partner's volume suggests they'd benefit from Pro tier"
- **Segment-based reporting** — filter all partners by type: see only restaurants vs only hotels vs only offices

**Dawer application:** The admin panel doesn't need to BE a PRM — it needs to THINK like one. Partner cards should show behavioral signals: "Last login: 18 days ago", "Order frequency: declining", "Downloaded certificate: never."

---

### Finding 5: Contextual Upgrade Nudges Outperform Generic Upsell
**Source:** B2B SaaS UX guide: "Hidden upgrade paths stall conversion — use transparent pricing and contextual upgrade nudges"

Generic upsell banners ("Upgrade to Pro!") don't work. What works:
- Show the specific feature they're missing: "You'd get priority 4-hour pickup if you were on Pro — you're 3 orders away"
- Show the ROI of upgrading: "Pro clients save 18% more CO₂ on average due to priority scheduling"
- Offer a one-click trial: "Try Pro for 30 days free"

---

## What Dawer's Partner Screen Must Do — Prioritized Feature Set

Based on research + the 20 ideas from the previous document, here is the final prioritized feature set for the Partners screen:

---

## TIER 1 — Core (Build First, ~2 days)

### Feature 1: Partner Card Grid with Tier Badges
The foundational view. Each card shows:
- Company name (large) + Arabic name (small)
- Type icon: 🍽️ Restaurant / 🏨 Hotel / 🏢 Office / 🏪 Retail / 🏥 Hospital
- **Tier badge**: Free (gray) / Basic (blue) / Pro (amber) / Enterprise (green)
- **Health score**: 0–100 colored number (green/amber/red)
- **Impact story**: "🌳 47 trees saved" (not raw CO₂ kg)
- **Renewal date**: "Renews in 12 days" (red if <30 days)
- **Custom price indicator**: lock icon 🔒 if this client has a negotiated price
- Click → opens Partner Detail Drawer

### Feature 2: Churn Risk Alert Panel
At the TOP of the screen, a collapsible "Needs Attention" section.
Auto-detects:
- No orders in 30+ days
- Volume declining >30% vs last month
- Contract expires in <30 days
- Custom price expired (if contract end date passed)

Each alert row: company name + reason + one-click call button 📞

### Feature 3: MRR Header Strip
A 4-number strip across the top (below the page title):
- **MRR**: total monthly recurring revenue (sum of all active subscription prices)
- **Partners**: total active clients
- **This Month**: total collections across all partners
- **At-Risk**: count of partners in churn risk

---

## TIER 2 — Intelligence (Build Second, ~1.5 days)

### Feature 4: Partnership Health Score Algorithm
Computed from:
- Collection frequency last 30 days (40 points max)
- Volume trend: this month vs last month (30 points max)
- Tier level (20 points max — higher tier = more committed)
- Certificate downloaded in last 90 days (10 points max — shows engagement)

```typescript
function computePartnerHealth(client: Client): number {
  const ordersThisMonth = client.orders.filter(
    o => new Date(o.createdAt) >= thirtyDaysAgo
  ).length;
  const ordersPrevMonth = client.orders.filter(
    o => new Date(o.createdAt) >= sixtyDaysAgo && new Date(o.createdAt) < thirtyDaysAgo
  ).length;

  const freqScore  = Math.min(ordersThisMonth * 5, 40); // 8+ orders = max
  const trendRatio = ordersPrevMonth > 0 ? ordersThisMonth / ordersPrevMonth : 1;
  const trendScore = Math.min(Math.round(trendRatio * 30), 30);
  const tierScore  = { free: 0, basic: 10, pro: 15, enterprise: 20 }[client.contractTier];
  const certScore  = client.lastCertificateDownload ? 10 : 0;

  return freqScore + trendScore + tierScore + certScore;
}
```

### Feature 5: Tier Progression Tracker
On each partner card, a progress bar + text:
- "68% to Enterprise — 3 more collections unlocks priority pickup"
- Thresholds: Free→Basic (3/mo), Basic→Pro (10/mo), Pro→Enterprise (25/mo or custom contract)
- Button: "Upgrade Now" → opens pricing/contract editor

### Feature 6: Green Points Rewards System
Each client earns points:
- **1 point per kg** of material collected
- **Bonus 2x** during seasonal campaigns (Ramadan clean-up, etc.)
- Points displayed on card: "🌿 1,240 Green Points"
- Redemption catalog: 100pts = 5% off next month / 500pts = priority pickup for 1 month / 1,000pts = dedicated rider for 1 month
- Admin can manually award or deduct points

---

## TIER 3 — Pricing Customization (Build Third, ~1.5 days)

### Feature 7: Per-Client Price Editor (The Critical Feature)

This is the most powerful and most admin-requested feature in any B2B SaaS platform.

**The Problem:** Not all clients pay the same. Amman Sheraton may have a negotiated enterprise deal at 180 JD/month. A small restaurant may pay the standard 50 JD/month. The admin needs to set, track, and manage these custom prices per client.

**The Solution — Partner Detail Drawer with Pricing Tab:**

```
┌─────────────────────────────────────────┐
│ Amman Marriott Hotel         [ENTERPRISE]│
│                                          │
│ [Overview] [Pricing] [Orders] [History]  │
│                                          │
│ PRICING TAB:                             │
│                                          │
│ Plan Type:  ○ Standard  ● Custom         │
│                                          │
│ Standard Pro Price:     240 JD/mo        │
│ Custom Price:          [180    ] JD/mo   │
│ Discount:               -25%             │
│                                          │
│ Billing Cycle: ○ Monthly  ● Annual       │
│ Annual Rate:   [2,000  ] JD/year         │
│ Annual Savings: 160 JD vs monthly        │
│                                          │
│ Contract Start: 2026-01-01               │
│ Contract End:   [2026-12-31]             │
│                                          │
│ Price Notes:                             │
│ [Negotiated during Jan partnership       │
│  meeting — includes 3 dedicated riders  ]│
│                                          │
│ [Save Price] [Reset to Standard]         │
└─────────────────────────────────────────┘
```

**Fields on `Client` type to add:**
```typescript
export interface Client {
  // existing fields...
  contractTier:    ContractTier;
  renewalDate:     string;            // ADD: ISO date
  billingCycle:    "monthly" | "annual";  // ADD
  customPriceJD?:  number;            // ADD: null = use standard tier price
  standardPriceJD: number;            // ADD: computed from tier
  contractNotes?:  string;            // ADD: admin notes
  lastCertificateDownload?: string;   // ADD: ISO date, for health score
  greenPoints:     number;            // ADD: accumulated reward points
  referredBy?:     string;            // ADD: client id who referred them
}
```

**Standard tier prices (in constants.ts):**
```typescript
export const TIER_PRICES_JD: Record<ContractTier, { monthly: number; annual: number }> = {
  free:       { monthly: 0,   annual: 0     },
  basic:      { monthly: 30,  annual: 300   },  // 300 JD/yr = 25 JD/mo → 17% savings
  pro:        { monthly: 80,  annual: 800   },  // 800 JD/yr = 67 JD/mo → 17% savings
  enterprise: { monthly: 200, annual: 2000  },  // 2000 JD/yr = 167 JD/mo → 17% savings
};
```

**Effective price logic:**
```typescript
function getEffectivePriceJD(client: Client): number {
  if (client.customPriceJD !== undefined) return client.customPriceJD;
  const prices = TIER_PRICES_JD[client.contractTier];
  return client.billingCycle === "annual"
    ? prices.annual / 12   // monthly equivalent
    : prices.monthly;
}
```

### Feature 8: What They're Missing — Upgrade Nudge
Below the pricing section, show: "At Pro tier, [company] would get:
- ✅ Priority 4-hour pickup (currently waiting 24h)
- ✅ Dedicated rider (currently shared)
- ✅ Monthly impact report email
- ✅ CO₂ certificate for ESG filing

Annual Pro: 800 JD/year. Current Basic annual cost: 300 JD. Upgrade difference: +500 JD/year."

Then: **[Send Upgrade Proposal via WhatsApp/Email]** button that generates a pre-written message with the partner's specific numbers.

---

## TIER 4 — Delight (Build Last, ~1 day)

### Feature 9: Impact Certificate Quick-Fire
One button per partner: "Generate Certificate" → instant branded PDF using existing `Co2CertificateReport.tsx` logic, pre-filled with company name, date range, CO₂ saved, materials, tree equivalents. Admin emails it or the client self-downloads from their portal.
Records `lastCertificateDownload` date → improves health score.

### Feature 10: ESG Badge Wall
Collectible milestone badges per partner card:
- 🌱 "First Collection" — placed first order
- 📦 "100 kg Club" — collected 100kg total
- 🌳 "Tree Saver" — saved equivalent of 10 trees
- 🏆 "6-Month Partner" — active for 6 months
- ⭐ "Top Contributor" — in top 3 of their city this month
- 💎 "Enterprise Champion" — on Enterprise tier for 12+ months

### Feature 11: Partner Leaderboard Tab
A secondary tab on the Partners screen showing all partners ranked by CO₂ this month.
Medal icons 🥇🥈🥉 for top 3.
Filter by type: "Restaurants only" / "Hotels only".
Admin can share a screenshot with partners to drive friendly competition.

---

## Complete Screen Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🏢  Partners & Rewards                          [+ Add Partner] │
│                                                                   │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ MRR      │ Partners │ Orders   │ At-Risk  │                  │
│  │ 1,840 JD │ 14       │ 47 this  │ ⚠️ 2     │                  │
│  │ ↑ +12%   │ active   │ month    │ clients  │                  │
│  └──────────┴──────────┴──────────┴──────────┘                  │
│                                                                   │
│  ⚠️  NEEDS ATTENTION  ───────────────────────────────────────    │
│  🔴 Amman Marriott — No orders in 38 days          [📞 Call]    │
│  🟡 Zara Restaurant — Contract expires in 12 days  [📞 Call]    │
│                                                                   │
│  [All (14)] [Enterprise (3)] [Pro (5)] [Basic (4)] [Free (2)]   │
│  [🍽️ Rest.] [🏨 Hotel] [🏢 Office]    🔍 Search partners        │
│                                                                   │
│  [Partners] [Leaderboard] [Rewards]                              │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ 🏨 ENTERPRISE 💎 │  │ 🍽️ PRO ⭐        │  │ 🏢 BASIC     │  │
│  │ Amman Sheraton   │  │ Zara Restaurant  │  │ TechOffice   │  │
│  │ Health: 87 🟢    │  │ Health: 71 🟢    │  │ Health: 34 🔴│  │
│  │ 🌳 142 trees     │  │ 🌳 63 trees      │  │ 🌳 12 trees  │  │
│  │ 🔒 180 JD/mo     │  │ 80 JD/mo         │  │ 30 JD/mo     │  │
│  │ 🌿 4,820 pts     │  │ 🌿 2,100 pts     │  │ 🌿 340 pts   │  │
│  │ Renews: 90d 🟢   │  │ Renews: 12d 🔴   │  │ Renews: 45d  │  │
│  │ [████████─] 82%→ │  │ [█████────] 68%→ │  │ [██────] 40%→│  │
│  │ [View Details]   │  │ [View Details]   │  │ [Upgrade Now]│  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Partner Detail Drawer** (opens on card click, slides in from right):
```
┌─────────────────────────────────────┐
│ ← Amman Sheraton Hotel   [ENTERPRISE]│
│                                      │
│ [Overview] [Pricing] [Orders] [Certs]│
│                                      │
│ OVERVIEW:                            │
│ 🌳 47 trees  🚗 3,200km  📱 8,400   │
│                                      │
│ Health Score: 87/100 🟢              │
│ [████████████████████░░░░] 87%       │
│                                      │
│ 🏅 Badges:                           │
│ 🌱 🌳 📦 🏆 ⭐ 💎                   │
│                                      │
│ 🌿 Green Points: 4,820               │
│ ────────────────────────────         │
│ 📞 +962 6 555 0123                   │
│ ✉️  gm@sheraton-amman.com            │
│                                      │
│ [Generate Certificate] [Send Report] │
└─────────────────────────────────────┘
```

---

## Data Model Additions Needed

### `types.ts` — Add to `Client` interface:
```typescript
renewalDate:              string;           // ISO date "2027-01-01"
billingCycle:             "monthly" | "annual";
customPriceJD?:           number;           // undefined = use standard tier price
contractNotes?:           string;
lastCertificateDownload?: string;           // ISO date
greenPoints:              number;           // 0 default
referredBy?:              string;           // client id
```

### `constants.ts` — Add:
```typescript
export const TIER_PRICES_JD: Record<ContractTier, { monthly: number; annual: number }> = {
  free:       { monthly: 0,   annual: 0     },
  basic:      { monthly: 30,  annual: 300   },
  pro:        { monthly: 80,  annual: 800   },
  enterprise: { monthly: 200, annual: 2000  },
};

export const TIER_ORDER: ContractTier[] = ["free", "basic", "pro", "enterprise"];

export const TIER_MONTHLY_THRESHOLDS: Record<ContractTier, number> = {
  free:       0,
  basic:      3,
  pro:        10,
  enterprise: 25,
};

export const GREEN_POINTS_PER_KG = 1;

export const GREEN_POINTS_REDEMPTION = {
  100:  "5% off next month",
  500:  "Priority pickup for 1 month",
  1000: "Dedicated rider for 1 month",
};

export const TIER_BENEFITS: Record<ContractTier, string[]> = {
  free:       ["Standard pickup (48h)"],
  basic:      ["Standard pickup (24h)", "Monthly stats email"],
  pro:        ["Priority pickup (4h)", "Dedicated rider", "Monthly impact report", "CO₂ certificate"],
  enterprise: ["Priority pickup (2h)", "Dedicated rider team", "Weekly reports", "CO₂ certificate + CSRD data export", "Custom contract pricing"],
};
```

### `helpers.ts` — Add:
```typescript
export function computePartnerHealth(client: Client): number { /* ... */ }
export function computeTierProgress(client: Client): { pct: number; nextTier: ContractTier | null; ordersNeeded: number }
export function getEffectivePriceJD(client: Client): number
export function isChurnRisk(client: Client): { risk: boolean; reasons: string[] }
export function computePartnerMRR(clients: Client[]): number
```

---

## Build Plan Summary

| Phase | Features | Est. Effort | Business Impact |
|-------|----------|-------------|-----------------|
| 1 — Core Grid | Partner cards + Churn alerts + MRR strip | 2 days | Admin has full visibility |
| 2 — Intelligence | Health score + Tier progress + Green Points | 1.5 days | Proactive retention + upsell |
| 3 — Pricing | Per-client price editor + Upgrade nudge | 1.5 days | Revenue management |
| 4 — Delight | Certificates + Badges + Leaderboard | 1 day | Client loyalty + CSRD compliance |

**Total: ~6 days** for a fully functional Partner & Rewards CRM built into the dashboard.

---

## Key Research-Backed Design Rules for This Screen

1. **Show trees, not kg** — "47 trees saved" drives 3× more partner engagement than "4.2 kg CO₂" (Almonds AI green loyalty research)
2. **Health score in ONE colored number** — admins scan, they don't analyze. Red/amber/green is all they need at a glance
3. **Contextual upgrade nudge, not banner** — "You're 3 orders from Pro" on the card works. "Upgrade Now!" banners don't (B2B SaaS UX research)
4. **Per-client pricing is non-negotiable at enterprise level** — every enterprise client negotiates. Lock icon + custom price must be visible (B2B pricing research)
5. **CSRD compliance angle** — any hotel or company with 250+ employees in the EU/Jordan needs verified CO₂ data for their 2025/2026 sustainability reports. Dawer's certificate is a legal compliance tool, not just a feel-good badge
6. **Churn prevention at top of screen** — every B2B SaaS study confirms: admins act on what they SEE first. Put at-risk clients at the TOP, not buried in a tab

---

*Partner & Rewards Screen — Research + Ideas Synthesis*
*June 2026 — Sources: Recyclebank/WM, Almonds AI, Lago, PRM market analysis, B2B SaaS pricing guides 2025–2026*
