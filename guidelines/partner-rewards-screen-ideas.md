# Partner & Rewards Screen — Creative Ideas
> Replaces the CO₂ Stats screen (`ViewId = "co2"`) in the Dawer Admin Dashboard
> June 2026 — SCAMPER + JTBD + Multi-Persona ideation

---

## Context

The codebase already has:
- `ViewId = "co2"` — the screen being replaced
- `Client` type with: `id, name, type (ClientType), contractTier, joinedDate, orders, totalCo2Saved, totalEarnings`
- `ClientType`: `"restaurant" | "hotel" | "office" | "retail" | "hospital" | "other"`
- `ContractTier`: `"free" | "basic" | "pro" | "enterprise"`
- `Co2CertificateReport.tsx` already exists in the Reports section (kept there)

**New ViewId:** `"partners"` — replaces `"co2"`

---

## Jobs to Be Done (Why This Screen Exists)

| Job | Who | Situation | Outcome |
|-----|-----|-----------|---------|
| Know which clients are valuable | Admin | Monthly review | Prioritize top partners for renewal calls |
| See which clients risk churning | Admin | Weekly ops | Reach out before they cancel |
| Celebrate a partner's impact | Admin | Onboarding or renewal | Show them their CO₂ story, build loyalty |
| Show partners what they're paying for | Admin | Sales call | Demonstrate premium tier value clearly |
| Track revenue from subscriptions | Admin | Investor/management report | Know MRR, renewals, churn rate |
| Know who to upsell | Admin | Growth planning | Move basic → pro → enterprise clients |

---

## 20 Ideas — Full List

### Technique 1: SCAMPER

**Substitute** (swap CO₂ raw stats for partner-centric view):

**1. Partner Tier Cards Grid**
Display each client as a card showing: company name, type icon (restaurant/hotel), tier badge (Free/Basic/Pro/Enterprise), total CO₂ saved, total earnings paid, and renewal date. Cards sorted by tier desc, then earnings desc. Clicking a card opens a detail drawer.

**2. Live Subscription MRR Panel**
A top-strip showing Monthly Recurring Revenue broken down by tier (Free: 0 JD, Basic: X JD, Pro: Y JD, Enterprise: Z JD) with month-over-month change arrows. Tells admin "how much are subscriptions worth right now?"

**3. Impact Certificate Quick-Fire**
A one-click button per partner card: "Generate Certificate" → instantly downloads a branded PDF (using existing Co2CertificateReport logic) personalized with the company name, date range, and CO₂ / material stats. Replaces the manual report flow.

**Combine** (merge partner management + rewards + health):

**4. Partnership Health Score** ⭐ TOP PICK
A 0–100 score computed per client: collection frequency (40%), volume trend (30%), contract tier (20%), referral activity (10%). Color coded: green (70+), amber (40–69), red (<40). Admin sees at a glance who is thriving and who needs attention.

**5. Tier Progression Tracker** ⭐ TOP PICK
For each partner, a horizontal progress bar showing how far along they are to the next tier. "Amman Sheraton is 68% to Enterprise — needs 3 more monthly collections." Drives upsell conversations with data.

**Adapt** (borrow from airline/hotel loyalty programs):

**6. Green Miles Rewards System**
Every kg recycled earns "Green Miles". Partners accumulate miles and redeem for: priority pickup slot, dedicated rider assignment, or discount on next month's fee. Admin panel shows each partner's balance, earn rate, and redemption history.

**7. Partner Leaderboard**
Ranked list of all partners by CO₂ saved this month. Medal icons (🥇🥈🥉) for top 3. Weekly reset. Partners compete — hotels tell each other their rank. Admin uses it as a conversation starter.

**Modify** (make existing data richer):

**8. Impact Story Cards**
Instead of raw numbers, show a narrative: "Amman Marriott has prevented the equivalent of 47 trees being cut, 3,200 km of car travel, and kept 2.1 tons of materials out of landfill since joining." Uses existing `co2Equivalents()` helper.

**9. Renewal Risk Timeline**
Visual horizontal timeline showing all partner contracts. Color-coded by days until renewal: green (>90 days), amber (30–90), red (<30 days). No partner slips through unnoticed.

**Put to other use** (repurpose partner data for new admin jobs):

**10. Referral Network Map**
Track which partner referred which other partner. Show a simple tree/chain: "Restaurant A referred Hotel B and Office C, earning 10% discount." Admin assigns referral credit and sees the referral growth chain.

**11. Exclusive Benefits Showcase**
A visible benefits matrix per tier: "As a Pro partner, you get: dedicated rider, priority 4-hour pickup, monthly impact report, CO₂ certificate, and API access." Admin uses it on sales calls. Partners see what they're missing at lower tiers.

**Eliminate** (remove the friction of chasing churning clients):

**12. Churn Risk Intelligence Panel** ⭐ TOP PICK
Auto-detects partners at risk: no collection in 30 days, declining volume trend over 3 months, expired or expiring contract. Shows a list of "at-risk" partners with recommended actions: "Call Ahmad at Marriott — last collection was 38 days ago." Prevents silent churn.

**Reverse** (flip the admin view into a partner-first view):

**13. Partner Portal Preview**
A "preview as partner" button that shows the admin what the partner's own view would look like — their personal impact numbers, their tier status, their next benefits. Used in sales demos and onboarding calls.

---

### Technique 2: JTBD-Driven Ideas

**14. Partner CRM Mini-View** ⭐ TOP PICK
Full contact card per partner: company name, Arabic name, type, address, contact person, phone/email, contract tier, joined date, total orders, total CO₂, total earnings, notes field (admin-editable). A mini CRM built into the dashboard. No need to go to a separate system.

**15. Revenue Forecasting Strip**
Shows projected next 3 months of subscription revenue based on current partner base and renewal rates. "If 2 Pro partners churn next month, MRR drops from 1,200 to 900 JD." Helps admin prioritize retention efforts.

**16. Partner Onboarding Checklist**
For new partners (joined <30 days), show a setup completion checklist: first order placed ✅, rider assigned ✅, impact report sent ❌, welcome call done ❌. Admin knows exactly who needs follow-up.

---

### Technique 3: Multi-Persona Parallel

**From a "Sustainability Officer at a hotel" persona:**

**17. ESG Badge Wall**
Collectible achievement badges per partner: "First 1,000 kg Recycled", "6-Month Partner", "Zero Plastic Month", "Top Contributor Q2". Admin awards them, partner gets a notification. Displayed on the partner card. Creates emotional attachment to the program.

**18. Shareable Impact Widget**
A small embeddable HTML widget the partner can put on their own website: "Amman Sheraton is proud to have saved 4.2 tons of CO₂ with Dawer Recycling in 2026." Admin generates the embed code. Marketing value for the partner = sticky retention for Dawer.

**From a "Dawer Growth Manager" persona:**

**19. Upsell Opportunity Flags**
Auto-flags partners who qualify for the next tier based on their volume: "This Basic partner has done 12 collections this month — Pro threshold is 10. Show them what they're missing." Generates upsell conversation starters automatically.

**20. Partner Growth Journey Map**
A visual path: 🌱 Starter → 🌿 Regular → 🌳 Champion → 🏆 Ambassador. Each milestone has requirements and rewards. Partners see where they are and what's next. Admin sees the fleet-level progress map. Gamified but professional.

---

## NAF Scores — All 20 Ideas

| # | Idea | N | A | F | Total |
|---|------|---|---|---|-------|
| 1  | Partner Tier Cards Grid          | 6 | 9 | 9 | **24** |
| 2  | Live Subscription MRR Panel      | 7 | 9 | 8 | **24** |
| 3  | Impact Certificate Quick-Fire     | 6 | 9 | 8 | **23** |
| 4  | Partnership Health Score          | 8 | 9 | 8 | **25** |
| 5  | Tier Progression Tracker          | 7 | 9 | 8 | **24** |
| 6  | Green Miles Rewards               | 9 | 7 | 6 | **22** |
| 7  | Partner Leaderboard               | 7 | 8 | 9 | **24** |
| 8  | Impact Story Cards                | 8 | 8 | 8 | **24** |
| 9  | Renewal Risk Timeline             | 8 | 9 | 9 | **26** |
| 10 | Referral Network Map              | 8 | 7 | 6 | **21** |
| 11 | Exclusive Benefits Showcase       | 6 | 8 | 8 | **22** |
| 12 | Churn Risk Intelligence           | 9 | 9 | 8 | **26** |
| 13 | Partner Portal Preview            | 8 | 7 | 6 | **21** |
| 14 | Partner CRM Mini-View             | 7 | 9 | 9 | **25** |
| 15 | Revenue Forecasting Strip         | 7 | 9 | 7 | **23** |
| 16 | Partner Onboarding Checklist      | 8 | 8 | 8 | **24** |
| 17 | ESG Badge Wall                    | 9 | 7 | 7 | **23** |
| 18 | Shareable Impact Widget           | 8 | 8 | 6 | **22** |
| 19 | Upsell Opportunity Flags          | 8 | 9 | 8 | **25** |
| 20 | Partner Growth Journey Map        | 8 | 7 | 7 | **22** |

---

## Top 8 — Build These (Score ≥ 24)

Ranked by score, then by feasibility:

| Rank | Idea | Score | Why It's First |
|------|------|-------|----------------|
| 🥇 | Renewal Risk Timeline | 26 | Admin's biggest pain: clients lapsing silently. High ROI. |
| 🥇 | Churn Risk Intelligence | 26 | Prevents revenue loss. Uses existing order date data. |
| 🥉 | Partnership Health Score | 25 | Single number tells admin everything at a glance. |
| 4 | Partner CRM Mini-View | 25 | Replaces needing external CRM. Huge daily use. |
| 5 | Upsell Opportunity Flags | 25 | Drives revenue growth from existing base. |
| 6 | Partner Tier Cards Grid | 24 | The core page layout — everything else lives here. |
| 7 | Live MRR Panel | 24 | Business visibility for management reporting. |
| 8 | Tier Progression Tracker | 24 | Gamified upsell — visual and motivating. |
| 8 | Partner Leaderboard | 24 | Lowest effort, high engagement value. |
| 8 | Impact Story Cards | 24 | Emotional retention — partners love their impact story. |
| 8 | Partner Onboarding Checklist | 24 | Prevents early churn from poor onboarding. |

---

## Concept Cards — Top 5

---

### CONCEPT 1: Partner Tier Cards Grid
**Tagline:** Every partner at a glance — tier, health, next renewal.

**Problem:** Admin has no single view of all partner companies. Information is scattered.

**Solution:** A responsive card grid (3 columns desktop, 1 mobile) — each card shows: company logo initial, company name, type icon, tier badge, health score (colored number), CO₂ saved, earnings, and days until renewal. Cards clickable to open a detail drawer.

**Target User:** Dawer admin doing a morning review

**Key Insight:** The card IS the CRM entry point — clicking it reveals everything else.

**Effort:** M — 1 day to build grid + seed data

**Biggest Risk:** Seeding realistic client data takes time

**Quickest Test:** Render 5 hardcoded client cards, check layout

**Next Step:** Define `CLIENTS` seed data array in `constants.ts`

---

### CONCEPT 2: Partnership Health Score
**Tagline:** One number that tells you if a partner is thriving or slipping.

**Problem:** Admin has no fast way to know which partners need attention TODAY.

**Solution:** A 0–100 score per client computed from: collection frequency over last 30 days (40pts), volume trend month-over-month (30pts), contract tier level (20pts), has referred others (10pts). Color: green ≥ 70, amber 40–69, red < 40. Shown as a ring/donut chip on the partner card.

**Target User:** Admin scanning partners in 30 seconds

**Key Insight:** A single colored score is infinitely faster to scan than a table of raw numbers.

**Effort:** S — 2 helper functions + visual chip component

**Biggest Risk:** Score formula needs tuning based on real usage

**Quickest Test:** Compute scores for 5 hardcoded clients, verify color distribution makes sense

**Next Step:** Write `computePartnerHealth(client): number` in `helpers.ts`

---

### CONCEPT 3: Churn Risk Intelligence Panel
**Tagline:** Know who's about to leave before they do.

**Problem:** Partners quietly stop ordering, then cancel — admin finds out too late.

**Solution:** A "Needs Attention" section at the top of the Partners screen. Shows clients matching any of: (a) no order in 30+ days, (b) volume declined >30% vs previous month, (c) contract expires in <30 days. Each row shows the risk reason + recommended action + one-click phone button.

**Target User:** Admin doing a Thursday retention sweep

**Key Insight:** Churn prevention is 5x cheaper than acquisition. This screen makes it automatic.

**Effort:** S — pure computed logic from existing `Client.orders` + `contractTier` data

**Biggest Risk:** Need `renewalDate` field on `Client` type (add it)

**Quickest Test:** Seed 2 "at-risk" clients and verify they appear in the panel

**Next Step:** Add `renewalDate: string` to `Client` type in `types.ts`

---

### CONCEPT 4: Tier Progression Tracker
**Tagline:** Show partners what they're missing — and how close they are.

**Problem:** Partners on Basic have no idea they're close to Pro. They never ask to upgrade.

**Solution:** On each partner card (and in the detail drawer), show a horizontal progress bar: "You are 68% to Pro tier — 3 more collections this month unlocks priority pickup + monthly report." Admin sees this too and uses it as an upsell talking point.

**Tier thresholds (proposed):**
- Free → Basic: 3 orders / month
- Basic → Pro: 10 orders / month
- Pro → Enterprise: 25 orders / month OR custom contract

**Target User:** Admin on a partner call ("Let me show you how close you are...")

**Key Insight:** Showing progress to the next milestone is the most powerful upsell tool that requires zero sales pressure.

**Effort:** S — computed from order count + tier config constants

**Biggest Risk:** Thresholds need business validation

**Quickest Test:** Render progress bar for 3 clients with different activity levels

**Next Step:** Define `TIER_THRESHOLDS` constant in `constants.ts`

---

### CONCEPT 5: Impact Story Cards
**Tagline:** Replace numbers with a narrative partners can share.

**Problem:** "You saved 4.2 kg CO₂" means nothing to a hotel manager. "You saved the equivalent of planting 12 trees" means everything.

**Solution:** Replace raw CO₂ numbers on the partner card with a human story using the existing `co2Equivalents()` helper: trees 🌳, car km 🚗, flights ✈️, phone charges 📱. Admin can send partners a screenshot or generate a certificate from the card. Feels like a reward, not a report.

**Target User:** Partner companies — their sustainability officer

**Key Insight:** Emotional resonance creates brand loyalty. The CO₂ number is data. The tree equivalent is a story.

**Effort:** XS — `co2Equivalents()` already exists in `helpers.ts`

**Biggest Risk:** None — this is additive, not replacing any existing logic

**Quickest Test:** Render one impact story card with hardcoded data

**Next Step:** Wire `co2Equivalents(client.totalCo2Saved)` into the partner card JSX

---

## Proposed Screen Layout

```
┌────────────────────────────────────────────────────────┐
│  🏢 Partners & Rewards                    [+ Add Partner]│
│                                                          │
│  ⚠️ NEEDS ATTENTION (2 partners)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🔴 Amman Marriott — No orders in 38 days [Call]  │   │
│  │ 🟡 Zara Restaurant — Contract expires in 12 days │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  📊 MRR: 1,840 JD/mo  ↑ +12%   Clients: 14             │
│                                                          │
│  [All] [Enterprise] [Pro] [Basic] [Free]  🔍 Search     │
│                                                          │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ 🏨 ENTERPRISE│ │ 🏢 PRO       │ │ 🍽️ BASIC     │    │
│  │ Amman Sheraton│ │ Zara Rest.  │ │ Office Park  │    │
│  │ Health: 87 🟢 │ │ Health: 71🟢 │ │ Health: 34 🔴│    │
│  │ 🌳 142 trees  │ │ 🌳 63 trees │ │ 🌳 12 trees  │    │
│  │ 📦 38 orders  │ │ 📦 17 orders│ │ 📦 6 orders  │    │
│  │ Renews: 90d   │ │ Renews: 12d │ │ Renews: 45d  │    │
│  │ ──── 82% ────►│ │ ── 68% ──►  │ │ ─ 40% ►     │    │
│  │ [Next: Max]   │ │ [Next: Ent] │ │ [Next: Pro]  │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
└────────────────────────────────────────────────────────┘
```

---

## Data Needs (What's in `types.ts` vs what to add)

| Field | Status | Notes |
|-------|--------|-------|
| `Client.id` | ✅ Exists | |
| `Client.name` | ✅ Exists | |
| `Client.type` (ClientType) | ✅ Exists | restaurant, hotel, office, retail, hospital |
| `Client.contractTier` | ✅ Exists | free, basic, pro, enterprise |
| `Client.joinedDate` | ✅ Exists | |
| `Client.orders` | ✅ Exists | |
| `Client.totalCo2Saved` | ✅ Exists | |
| `Client.totalEarnings` | ✅ Exists | |
| `Client.renewalDate` | ❌ Missing | Add: `renewalDate: string` |
| `Client.phone` | ✅ Exists | |
| `Client.email` | ✅ Exists | |
| `Client.referredBy?` | ❌ Missing | Add for referral tracking |

**New constants needed:**
```typescript
export const TIER_THRESHOLDS = {
  free:       { ordersPerMonth: 0,  label: "Free",       color: "var(--text-tertiary)" },
  basic:      { ordersPerMonth: 3,  label: "Basic",      color: "var(--brand-400)"    },
  pro:        { ordersPerMonth: 10, label: "Pro",        color: "var(--amber-600)"    },
  enterprise: { ordersPerMonth: 25, label: "Enterprise", color: "var(--brand-600)"    },
};

export const TIER_ORDER: ContractTier[] = ["free", "basic", "pro", "enterprise"];
```

**New helpers needed:**
```typescript
computePartnerHealth(client: Client): number          // 0–100 score
computeTierProgress(client: Client): { pct: number; nextTier: ContractTier | null; ordersNeeded: number }
isChurnRisk(client: Client): { risk: boolean; reason: string }
```

---

## Build Priority

| Phase | What to Build | Effort |
|-------|--------------|--------|
| **Phase 1 — Core** | Partner Tier Cards Grid + Churn Risk Panel + Health Score | 2 days |
| **Phase 2 — Upsell** | Tier Progression Tracker + MRR Strip + Upsell Flags | 1 day |
| **Phase 3 — Story** | Impact Story Cards + ESG Badges + Certificate Quick-Fire | 1 day |
| **Phase 4 — Growth** | Referral Map + Partner Portal Preview + Leaderboard | 2 days |

---

*Dawer Partner & Rewards Screen — June 2026*
*20 ideas · NAF scored · Top 8 selected · 5 concept cards*
