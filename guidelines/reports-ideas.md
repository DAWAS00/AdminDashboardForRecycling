# Dawer Reports Screen — Ideas & Monetization Strategy

> **Context:** The Reports view is currently a placeholder. This doc covers: what reports to build, how the UI should work, which data from other screens to pull, and how to turn the reports feature into a revenue/funding engine.

**Creativity methods used:** SCAMPER, Jobs-to-Be-Done (JTBD), First Principles, Multi-Persona Parallel, NAF Scoring

---

## 1. Who Are We Reporting To? (JTBD × 5 Buyers)

Before building, nail the audience — each buyer needs different framing from the same data:

| Buyer | Job to Be Done | Primary Data Source |
|---|---|---|
| **Admin (internal)** | "Plan next week's operations" | Rider map + hubs |
| **B2B Client** (restaurant, office, hotel) | "Prove sustainability to stakeholders" | CO₂ totals per their orders |
| **Municipality / NGO** | "Justify recycling budget to government" | Heatmap district data |
| **Corporate ESG team** | "File annual sustainability disclosure" | CO₂ equivalents + material tonnage |
| **Investor** | "Evaluate platform traction" | Growth metrics, district penetration |

**Core insight:** The same Dawer data has 5 different price points depending on framing and buyer. Reports is the monetization engine.

---

## 2. SCAMPER Analysis

| Lens | Application to Reports |
|---|---|
| **Substitute** | Replace static PDF exports with interactive shareable links — each report gets a URL clients can embed in their own website |
| **Combine** | Merge all 4 screens → one "Operations Bundle" that narratively connects rider performance + hub capacity + district CO₂ + material value |
| **Adapt** | Map GRI 306 (Waste) and CDP disclosure fields to Dawer data — companies drop Dawer output directly into their sustainability reports |
| **Modify** | Add time granularity: daily snapshot, weekly ops, monthly trend, quarterly market intelligence — same template, different window |
| **Put to other use** | Heatmap district data → sell as market intelligence to companies deciding where to open Amman locations |
| **Eliminate** | Remove manual report assembly → one-click "Snapshot Now" generates a full report from current dashboard state |
| **Reverse** | Instead of admin pushing reports to clients → clients self-serve via a portal, pull their own CO₂ certificates anytime |

---

## 3. All Ideas (28 Total)

### A — Report Builder UI

| # | Idea | Description |
|---|---|---|
| A1 | **Template Gallery** | Card grid of 6 report types, each with preview, data source label, one-click Generate |
| A2 | **Data Block Composer** | Drag-and-drop "blocks" (CO₂ chart, district table, rider summary) onto a canvas |
| A3 | **Snapshot Mode** | One button — "Generate from current view" — captures exactly what the dashboard shows |
| A4 | **Compare Mode** | Side-by-side: this week vs last week, or District A vs District B |
| A5 | **Scheduled Auto-Report** | Set cadence (weekly/monthly), report emails automatically |
| A6 | **Client-Branded Export** | Client logo + colors on the PDF — their branding, Dawer data |

### B — Report Types (Cross-Screen Intelligence)

| # | Report Name | Pulls From | Delivers |
|---|---|---|---|
| B1 | **Operations Summary** | Rider map + hubs | Orders, earnings, CO₂, materials — by rider, by hub |
| B2 | **District Intelligence Brief** | Heatmap | CO₂ gap per district, top materials, order density, coverage analysis |
| B3 | **CO₂ Impact Certificate** | CO₂ totals | Printable cert: X kg saved = Y trees = Z car-km, QR verification link |
| B4 | **Hub Efficiency Report** | Hubs screen | Capacity utilization %, shipment frequency, material flow, idle capacity flags |
| B5 | **Material Market Pulse** | All screens | What's collected, at what rate, at what density — supply map |
| B6 | **ESG Readiness Package** | CO₂ + materials | Pre-formatted for GRI 306 (Waste) + CDP disclosures |
| B7 | **Investor Update Pack** | Everything | District penetration, fleet growth, collection volume trend, earnings trajectory |
| B8 | **Municipality District Report** | Heatmap | Per-district for government: achieved vs potential, coverage gaps, hub placement needs |
| B9 | **Client Order History** | Rider map | For a specific business: all orders, CO₂ saved, materials recycled, month-by-month |
| B10 | **Strategic Expansion Report** | Heatmap + hubs | Uncovered districts ranked by CO₂ potential — hub placement justification |

### C — Monetization / Funding

| # | Idea | Model | Revenue |
|---|---|---|---|
| C1 | **CO₂ Certificate SaaS** | Monthly subscription | Restaurants/hotels pay JD 30–120/month for verified CO₂ certificates |
| C2 | **Municipality Intelligence Contract** | Annual contract | Amman municipality pays for district recycling intelligence to guide policy |
| C3 | **ESG Data-as-a-Service** | Per-report or subscription | Corporations filing sustainability reports pay for verified Jordanian recycling data |
| C4 | **White-Label Report API** | Per API call | Other recycling startups buy Dawer's analytics infrastructure |
| C5 | **Carbon Credit Prep Data** | One-time + annual | Feed verified data into Gold Standard/Verra — Dawer earns % of carbon credits |
| C6 | **Grant-Funded Public Dashboard** | Grants | EU Green Deal, USAID, Jordan Ministry of Environment fund a public layer |
| C7 | **Premium Client Portal** | Tiered SaaS | Clients self-serve their CO₂ data — free monthly PDF vs paid real-time + API |
| C8 | **Quarterly Market Research Reports** | One-time purchase | "Amman Recycling Market Q3 2026" — sold to consultants/NGOs for JD 150–500 |
| C9 | **Consulting Upsell** | Project fee | District intelligence → sell "recycling strategy" consulting to malls, hotels, hospitals |
| C10 | **Expansion Investor Deck** | Revenue share / equity | Show investors uncovered districts (heatmap) = market size → fundraising asset |
| C11 | **Corporate Challenge** | Sponsorship | "Amman Green Race" — companies compete on CO₂ saved, Dawer sells leaderboard + certificates |
| C12 | **B2B Referral Program** | Commission | Clients refer companies → discount on their own subscription |

---

## 4. NAF Scoring

| # | Idea | N | A | F | Total | Phase |
|---|---|---|---|---|---|---|
| B3 | CO₂ Impact Certificate | 7 | 10 | 9 | **26** | 🔴 1 |
| C1 | CO₂ Certificate SaaS | 7 | 10 | 8 | **25** | 🔴 1 |
| A1 | Template Gallery | 6 | 9 | 9 | **24** | 🔴 1 |
| B9 | Client Order History | 6 | 9 | 9 | **24** | 🔴 1 |
| A3 | Snapshot Mode | 5 | 9 | 10 | **24** | 🔴 1 |
| B1 | Operations Summary | 4 | 10 | 10 | **24** | 🔴 1 |
| B2 | District Intelligence Brief | 8 | 9 | 7 | **24** | 🟡 2 |
| C7 | Premium Client Portal | 8 | 9 | 7 | **24** | 🟡 2 |
| B6 | ESG Readiness Package | 9 | 9 | 6 | **24** | 🟡 2 |
| C2 | Municipality Contract | 8 | 9 | 6 | **23** | 🟡 2 |
| B10 | Strategic Expansion Report | 9 | 8 | 6 | **23** | 🟡 2 |
| A4 | Compare Mode | 7 | 8 | 7 | **22** | 🟡 2 |
| C8 | Market Research Reports | 9 | 7 | 6 | **22** | 🟡 2 |
| C9 | Consulting Upsell | 7 | 8 | 7 | **22** | 🟡 2 |
| C5 | Carbon Credit Prep | 10 | 8 | 4 | **22** | 🔵 3 |
| C6 | Grant Funding | 9 | 8 | 5 | **22** | 🔵 3 |
| C11 | Corporate Challenge | 9 | 7 | 5 | **21** | 🔵 3 |

---

## 5. Top Concept Cards (Phase 1 Priority)

---

### CONCEPT 1 — CO₂ Impact Certificate

**TAGLINE:** "Prove your impact in one click — shareable, branded, verified."

**PROBLEM:** Businesses using Dawer have no tangible proof of their environmental contribution. They can't show customers, partners, or ESG auditors anything.

**SOLUTION:** Client clicks "Generate Certificate." Dawer pulls their order history — total CO₂ saved, kg per material, CO₂ equivalents (trees, car-km, flights) — outputs a branded PDF with a QR code linking to a live verification page. Client posts it at their entrance, shares on social media, or submits to their ESG report.

**REVENUE MODEL:**
- Basic JD 25/month — monthly PDF certificate
- Pro JD 60/month — real-time certificate + QR verification page + API embed
- Enterprise JD 120/month — custom branding, multi-location, full ESG package

**TARGET USER:** Restaurant owners, hotel chains, supermarkets, hospitals, corporate offices

**KEY INSIGHT:** Dawer already collects this data. It is worth money to the businesses generating it — not as raw numbers, but as formatted proof they can use in their own marketing.

**EFFORT:** M (PDF generation + per-client data filter)

**BIGGEST RISK:** Clients don't pay before trusting data accuracy → solve with 3 free trial months

**QUICKEST TEST:** Generate 3 certificates manually (Word/Canva) and send to existing clients. Ask "Would you pay JD 25/month for this automatically?"

---

### CONCEPT 2 — Template Gallery + Snapshot Mode

**TAGLINE:** "Pick a template, hit generate — your report is ready in 3 seconds."

**PROBLEM:** Building a full report composer is months of work. The Reports screen needs to be useful immediately.

**SOLUTION:** Card grid of 6 report templates. Each shows: report name, which screens it pulls from, mini preview thumbnail, Generate button. Clicking generates a structured layout — charts, tables, key numbers — assembled from live data. Export as PDF via browser print (zero library dependencies in Phase 1).

**Phase 1 templates (6):**
1. Weekly Operations Summary → rider map + hubs
2. District Intelligence Brief → heatmap
3. CO₂ Impact Certificate → CO₂ screen
4. Hub Performance Report → hubs screen
5. Material Collection Overview → all screens
6. Expansion Opportunity Map → heatmap (uncovered districts)

**PDF implementation note:** Use `window.print()` + print-specific CSS (`@media print`) first. Ships in an afternoon. Add jsPDF + html2canvas only in Phase 2 if richer formatting is needed.

**EFFORT:** S (template grid UI) + M (print CSS per template)

**BIGGEST RISK:** Print CSS across browsers is unpredictable on complex layouts → test in Chrome first, scope to Chrome in Phase 1

---

### CONCEPT 3 — Client Order History Report

**TAGLINE:** "Every business that works with Dawer gets their own data portal."

**PROBLEM:** Clients have zero visibility into their own recycling history. They call admin to ask "how much have we recycled this month?" — wastes everyone's time.

**SOLUTION:**
- **Phase 1 (dashboard):** Admin selects a client from dropdown → generates PDF of all their orders, monthly CO₂ totals, material breakdown, earnings paid → emails it
- **Phase 2 (portal):** Client login → self-serve dashboard → download own reports → upgrade to Pro for real-time data

**DATA STRUCTURE NEEDED:**
```typescript
// Each Order already has an `address` field — 
// Phase 1: filter orders by address substring matching
// Phase 2: add `clientId` field to Order type
```

**REVENUE MODEL:** Phase 2 self-serve portal = JD 15/month/client

**EFFORT:** S (Phase 1 filter + PDF) → L (Phase 2 portal with auth)

---

### CONCEPT 4 — District Intelligence Brief (→ Revenue)

**TAGLINE:** "The only market intelligence report on recycling in Amman."

**PROBLEM:** No one in Jordan publishes reliable data on recycling rates, material availability by district, or CO₂ potential by geography. Consultants, NGOs, municipalities, and investors are guessing.

**SOLUTION:** Dawer's heatmap data — district CO₂ potential vs achieved, material density, collection efficiency, coverage gaps — becomes a quarterly "Amman Recycling Market Report." Generated automatically from heatmap. Sold as:
- PDF report to consultants/NGOs — JD 150–400/report
- Annual subscription to municipality — JD 2,000–8,000/year
- Free public summary → press coverage + platform trust

**UNIQUE MOAT:** Dawer holds ground-truth operational data that no one else in Jordan collects at this district granularity. That is a defensible competitive advantage.

**BIGGEST RISK:** Data must be defensibly accurate before selling. Label first version "operational estimates, not official statistics."

**EFFORT:** M (report template + time-period filter) + S (sales outreach to 3 potential buyers)

---

### CONCEPT 5 — Funding Stack (Three-Track Strategy)

**TAGLINE:** "Use Dawer's own reports to fund Dawer."

---

**TRACK A — Grants (Fastest, lowest risk, 1–3 months to apply)**

| Grant | Why Dawer Fits | Application Asset |
|---|---|---|
| **EU Green Deal / SWITCH-Med** | Circular economy platform in MENA region | Heatmap CO₂ data + district coverage analysis |
| **USAID Jordan** | Active climate + waste programs in Jordan | Rider ops data + CO₂ impact certificates |
| **Jordan Ministry of Environment (RREACH)** | Funds environmental data initiatives | Full dashboard as working prototype |
| **EBRD (SME finance Jordan)** | Green business development | Revenue model + B2B client proof |

**Application play:** The Reports screen IS the grant application. Generate a "Platform Impact Report" from Dawer's own data, attach it as Annex A in every grant submission.

---

**TRACK B — B2B Revenue (3–6 months)**

5-step pilot:
1. Identify 5 Amman restaurants/hotels that already care about sustainability
2. Give 3-month free CO₂ Certificate trial
3. Collect testimonials + refine the certificate design
4. Convert to JD 30/month paid
5. 50 clients = JD 1,500 MRR → proof point for investors

---

**TRACK C — Corporate ESG Sponsorship (Fastest large revenue, 2–4 months)**

Target 2–3 large Jordanian corporations with public ESG commitments:
- Zain Jordan (telecom, active CSR)
- Arab Bank (sustainability reporting)
- Safeway Jordan (retail, packaging commitments)

**Offer:** "Dawer ESG Partnership" — JD 3,000–10,000/year for:
- Verified CO₂ offset certificates for their annual report
- Co-branding on Dawer's public impact reports
- Early access to district intelligence data
- Logo on "Powered by Dawer" rider vehicles

**Why this works:** These companies need ESG data anyway. Dawer sells them verified, locally-produced data they can't get anywhere else. It's cheaper than hiring a consultant, more credible than self-reported data.

---

## 6. Report Builder UI Layout

```
Reports View — Full Screen (minus sidebar)

┌─────────────────────────────────────────────────────────────────┐
│  Reports                                      [+ New Report]    │
│  ─────────────────────────────────────────────────────────────  │
│  Period: [This Week ▾]    Client: [All Clients ▾]               │
│                                                                  │
│  GENERATE                                                        │
│  ──────────────────────────────────────────────────────────     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ 📊            │  │ 🗺️            │  │ 🌿            │         │
│  │ Weekly Ops   │  │ District     │  │ CO₂          │         │
│  │ Summary      │  │ Intelligence │  │ Certificate  │         │
│  │              │  │              │  │              │         │
│  │ Rider + Hubs │  │ Heatmap      │  │ CO₂ screen   │         │
│  │ [Generate ↓] │  │ [Generate ↓] │  │ [Generate ↓] │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ 🏭            │  │ 📦            │  │ 📈            │         │
│  │ Hub          │  │ Material     │  │ Expansion    │         │
│  │ Efficiency   │  │ Market Pulse │  │ Opportunity  │         │
│  │              │  │              │  │              │         │
│  │ Hubs screen  │  │ All screens  │  │ Heatmap gaps │         │
│  │ [Generate ↓] │  │ [Generate ↓] │  │ [Generate ↓] │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  RECENT                                                          │
│  ──────────────────────────────────────────────────────────     │
│  Weekly Ops · Jun 18, 2026 · PDF   [↓ Download] [👁 Preview]   │
│  District Brief · Jun 15, 2026     [↓ Download] [👁 Preview]   │
│  CO₂ Certificate · Jun 10, 2026    [↓ Download] [🔗 Share]     │
└─────────────────────────────────────────────────────────────────┘

Right panel (288px — matching all other panels):
→ Empty state: "Select a template to preview"
→ After Generate: Rendered report preview
→ Footer: [Download PDF] [Copy Share Link]
```

---

## 7. Cross-Screen Data Dependencies

How each report pulls from other screens — these connections must not break when other screens change:

| Report | Rider Map | Heatmap | Hubs | CO₂ Screen |
|---|---|---|---|---|
| Weekly Operations Summary | ✅ orders, earnings, CO₂ | — | ✅ capacity, shipments | — |
| District Intelligence Brief | ✅ order count per district | ✅ all district data | ✅ hub coverage | — |
| CO₂ Impact Certificate | ✅ per-client CO₂ | — | — | ✅ equivalents |
| Hub Efficiency Report | — | — | ✅ all hub data | — |
| Material Market Pulse | ✅ materials per order | ✅ topMaterial per district | ✅ currentLoad | — |
| Expansion Opportunity Report | — | ✅ coverage gaps | ✅ hub locations | — |

---

## 8. New Types and Helpers Needed

```typescript
// types.ts additions

export interface ReportConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  dataSources: ("riders" | "hubs" | "districts" | "co2")[];
  availableForClient: boolean; // can be generated per-client
}

export interface GeneratedReport {
  id: string;
  configId: string;
  generatedAt: Date;
  period: "day" | "week" | "month" | "quarter";
  clientFilter: string | null;
  data: Record<string, unknown>; // report-specific data snapshot
}
```

```typescript
// helpers.ts additions

export function aggregateRiderStats(riders: Rider[], clientFilter?: string) {
  // Returns total CO₂, earnings, order counts, material breakdown
  // clientFilter: filter by orders whose address contains clientFilter string
}

export function computeHubUtilization(hubs: Hub[]) {
  // Returns utilization % per hub + fleet-wide average
}

export function computeMaterialTotals(riders: Rider[]) {
  // Returns { cookingOil: kg, plastic: kg, paper: kg, electronics: kg }
}

export function computeCoverageGaps(districts: District[], hubs: Hub[]) {
  // Returns districts not covered by any active hub within 5km
}
```

---

## 9. Phase Breakdown

### Phase 1 — No Backend Required
- Template Gallery (6 cards)
- Snapshot Mode (browser print)
- Operations Summary report (existing rider/hub data)
- CO₂ Impact Certificate (existing helpers)
- Hub Efficiency Report (existing hub data)
- Period filter (week/month)

### Phase 2 — Requires Backend / Client Data
- Client Order History (needs `clientId` on orders)
- District Intelligence Brief with real historical data
- Scheduled auto-reports (email delivery)
- Share link (unique URL per report)
- Premium Client Portal (auth system)

### Phase 3 — Requires ML / External APIs
- ESG Readiness Package (mapped to GRI/CDP fields)
- Carbon Credit Prep Data (Verra/Gold Standard format)
- Market Research PDF with statistical analysis
- Investor Update Pack with trend forecasting

---

## 10. Quick Wins (Ship This Week)

1. **Build the Template Gallery** — 6 static cards, no real data yet, just the layout
2. **Wire up Operations Summary** — pull `computeTotals()` from helpers, render a printable page
3. **Build CO₂ Certificate** — use `co2Equivalents()` helper, styled PDF via print CSS
4. **Add period filter** — `week` / `month` toggle using `Date.now()` comparisons against hardcoded dates

These four items together make the Reports screen genuinely useful and give you **something to show to potential clients within days**.

---

*Created: 2026-06-25 · Dawer Operations Dashboard · Reports Screen Ideas + Monetization*
