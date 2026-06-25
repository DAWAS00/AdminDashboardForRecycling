# Rider Panel — JTBD Priority Analysis
> Deep-dive: Jobs to be Done × Industry Research × Feature Ranking
> Source: 6 web research sources, 2 UX case studies, fleet management surveys

---

## Research Foundation

Before scoring anything, here is what the industry evidence actually says:

### Finding 1 — Status Visibility is the #1 Heuristic Violation in delivery dashboards
A UX case study that improved delivery dashboard usability by **64%** found that the single biggest problem was "Visibility of System Status" — the dashboard didn't clearly show whether a delivery was on track, late, or complete. The top fix was **color-coded status with better contrast**. No redesign. Just color + time on the card.
> Source: *UX Case Study: Improving Usability of a Delivery Dashboard by 64%* (Medium / UX Mahi, 2024)

### Finding 2 — Dispatchers need the map + status as their core view, not reports
Hicron Software's fleet management research (updated April 2026) found: *"For dispatchers, their dashboard should prioritize the real-time map, route progress, and communication tools to manage daily logistics and driver assignments effectively."* Critical numbers must be visible at the top without scrolling.
> Source: *Fleet Management Dashboard Design: A Complete Guide* (Hicron Software, 2026)

### Finding 3 — Alert fatigue is real and dangerous
A controlled study (n = 52) showed that participants receiving **generic alerts** reported average cognitive load score of **58.7** (NASA-TLX scale). Participants receiving **action-oriented, severity-tiered alerts** scored **41.2** — a 30% drop. When alerts fire for trivial events, admins begin ignoring all of them. Solution: severity tiers (amber → red) and suppression of low-value noise.
> Source: *Alert Fatigue in Modern Operations* (SIGNL4 + NIH PMC study on clinical decision support systems)

### Finding 4 — The shift from reactive to proactive is the #1 business value
Hicron, FarEye, and Locus research all converge on the same point: the dashboard's job is to shift the admin from *chasing problems* to *managing by exception*. When the system surfaces problems, the admin acts. When the admin must hunt for problems, they miss them.
> Source: *Real-Time Visibility in Fleet Dispatch* (FarEye), *Fleet Management Dashboard Design* (Hicron)

### Finding 5 — Filtering is the 2nd biggest usability win
The UX case study found that the 2nd most impactful improvement was **filter design** — specifically the ability to select multiple filters and see which filters are currently active as chips. "The problem of selection of filters is solved with this design."
> Source: *UX Case Study: Improving Delivery Dashboard Usability by 64%* (UX Mahi)

### Finding 6 — Onfleet's most-used dispatcher feature is real-time tracking, not analytics
Onfleet (the leading last-mile delivery platform) reports that operations managers primarily use the dashboard for: (1) live driver visibility, (2) auto-assignment, (3) route progress. Analytics are used post-shift, not during operations.
> Source: *Onfleet Last Mile Delivery Software Features* (Onfleet, 2026)

---

## JTBD Deep Analysis

Each job is mapped to: the trigger situation, the motivation, the outcome wanted, what the research says, and which features address it.

---

### JOB 1 — Instant Fleet Health on Open

**Trigger:** Admin opens the dashboard at start of day or after switching tabs.
**Motivation:** I want to know if everything is okay without clicking or scrolling.
**Outcome wanted:** In under 3 seconds, know: how many riders are active, if any problem exists.

**What research says:**
> "Critical numbers sit in large-type, high-contrast cards at the very top of the screen. No user should scroll to find out whether their fleet is healthy." — Hicron Software

**Features that address it:**

| Feature | Match | Why |
|---|---|---|
| Fleet Status Bar | ✅ Perfect | "6 Active · 2 Idle · 4 Pending" answers the job in one glance |
| Alert Notification Dot | ✅ Perfect | Red dot = problem exists, no scrolling needed |
| Urgency Auto-Sort | ✅ Good | Problem cards float to top automatically |

**Research verdict:** JOB 1 features are the highest priority in the literature. Every fleet management UX guide lists "top-level summary" as rule #1. These are **non-negotiable**.

---

### JOB 2 — Know When a Delivery Is Late Without Watching

**Trigger:** Admin is managing multiple things at once; a delivery has been running longer than normal.
**Motivation:** I want the system to tell me, not make me check.
**Outcome wanted:** A clear, un-ignorable signal that one specific rider is overdue.

**What research says:**
> "When ETA changes, AI recalculates automatically, operations teams gain time to act instead of react." — FarEye (2025)
> "The dispatcher shifts from chasing calls to exception manager." — FarEye
> "Alert fatigue emerges when alerting systems exceed cognitive capacity." — SIGNL4

**Features that address it:**

| Feature | Match | Why |
|---|---|---|
| Delivery Timer Badge | ✅ Perfect | Color change is passive — admin sees it without being "alerted" |
| Overtime Alert (pulsing border) | ✅ Good | Active signal for crossing a threshold — but must be TIERED |
| Alert Notification Dot | ✅ Good | Cross-screen signal — works when admin is on another panel |

**Critical design constraint from research:**
The overtime alert must fire at **1.5× estimate (red), NOT 1.2× (amber)**. Alert fatigue research shows that alerts firing too early train admins to ignore them. The amber state (1.2×) should be a passive color change on the card — not a pulsing alert. The pulsing red border + dot should fire only at 1.5× or higher.

```
Timeline:
0 → 1.0× estimate    = Green timer  (on track)
1.0× → 1.2× estimate = Amber timer  (getting slow, no pulse)
1.2× → 1.5× estimate = Red timer    (late, card border turns red, NO pulse yet)
>1.5× estimate       = Red pulsing border + Alert Dot fires
```

**Research verdict:** The timer badge is more valuable than the overtime alert because it gives continuous information without alert fatigue. The alert is the backstop — the timer is the primary signal. Build the timer first.

---

### JOB 3 — Find and Focus on a Specific Rider Fast

**Trigger:** Admin receives a call or sees something unusual; needs to locate one rider on the map.
**Motivation:** I want to jump to that rider's position without hunting.
**Outcome wanted:** Map centers on the rider in one click.

**What research says:**
> "A dispatcher's dashboard should prioritize the real-time map and route progress." — Hicron
> "One-click access to granular details without scrolling." — Dashboard UX Best Practices (dev.to)
> "Flexibility & efficiency of use: displaying important actions at first glance." — UX Mahi case study

**Features that address it:**

| Feature | Match | Why |
|---|---|---|
| One-Click Map Focus | ✅ Perfect | Leaflet `map.flyTo()` — literally one line of code, maximum admin impact |
| Idle Rider Dimming | ✅ Good | Passive visual separation — active riders pop, idle ones fade |
| Rider Search | ✅ Good | Essential as fleet grows beyond 8 riders (Hick's Law: scanning a list of 10+ is slow) |

**Research verdict:** One-Click Map Focus has the highest return per line of code of any feature in this list. It directly addresses the dispatcher's core job (map + route visibility). Build this in the same session as the Fleet Status Bar — they take similar effort but together make the panel feel like a real dispatch console.

---

### JOB 4 — Filter to Problem Cases When the Fleet Is Large

**Trigger:** Fleet has 10+ active riders; admin needs to see only the ones with issues.
**Motivation:** I don't want to scroll past 8 healthy riders to find the 2 who need attention.
**Outcome wanted:** One click to see only riders with alerts or only idle riders.

**What research says:**
> "To avoid overwhelming users, incorporate drill-downs and filters that allow exploring data at their own pace." — Dashboard UX Best Practices (UXPin/dev.to)
> "The problem of selecting filters is solved with multi-select chips — the selected filters are shown as chips which indicate visibility of system status." — UX Mahi (64% improvement study)

**Features that address it:**

| Feature | Match | Why |
|---|---|---|
| Filter Tabs (All / Active / Idle / Alerts) | ✅ Perfect | Matches exactly what the UX study identified as fix #2 |
| Urgency Auto-Sort | ✅ Good | Complements Filter Tabs — even without filtering, problems rise to top |

**Research verdict:** Filter Tabs are research-validated as a high-impact, low-complexity feature. They are more important for scale (10+ riders) than for the current fleet size (6–8). Build them in Phase 2, not Phase 1 — but plan the component to accept a `filter` prop from day one so adding the tabs later is a one-line change.

---

### JOB 5 — Understand Daily Performance Without Opening Reports

**Trigger:** Admin wants a quick check on how today is going — mid-day or end of day.
**Motivation:** I don't want to navigate to the Reports screen for a quick question.
**Outcome wanted:** See today's orders, kg, and earnings per rider on the card.

**What research says:**
> "Onfleet's tracking and analytics offer deep insights into driver performance." — Onfleet (2026)
> "KPI widgets are modules that display your most important metrics at a glance." — Hicron
> "Analytics are used post-shift by operations managers, not during live operations." — Onfleet research

**Features that address it:**

| Feature | Match | Why |
|---|---|---|
| Daily Mini-Stats | ✅ Good | "Today · 4 orders · 8.2 kg · JD 6.50" — answers the job without screen switch |
| Order Queue Badge | ✅ Good | Tells admin which riders are overloaded vs underloaded today |

**Research verdict:** These are JOB 5 features — valuable but not operational-critical. They answer a "how are we doing?" question rather than a "what's wrong right now?" question. Research confirms analytics are used post-shift, so these are **Tier 2** — important but build after the real-time alert features.

---

### JOB 6 — Take Action Directly From the Panel

**Trigger:** Admin identifies a problem and needs to intervene — contact a rider or reassign an order.
**Motivation:** I want to act from the same screen where I spotted the problem.
**Outcome wanted:** One-tap to call rider; reassign order without leaving the panel.

**What research says:**
> "Centralized management serves as a single point of contact for all order, driver, route, and customer communication management." — Mobility Infotech
> "Dispatcher needs communication tools as core components." — Hicron
> "Length of time for load assignment: 15 minutes per load in traditional dispatching — a key pain point." — Fleet Rabbit

**Features that address it:**

| Feature | Match | Why |
|---|---|---|
| One-Click Call | ✅ Good | `tel:` link — trivial to implement, high practical value |
| Pending Orders Tray | ✅ Good | Addresses assignment delay pain point |
| Reassign Order Button | ⚠️ Complex | Needs order state management — build after basic state is wired |

**Research verdict:** One-Click Call is a hidden gem — literally one `<a href="tel:...">` tag but it solves a real dispatcher pain point (calling a rider when they're late). Reassign Order is higher complexity and should wait until the dashboard has real order assignment logic.

---

## Final Priority Ranking

Combining JTBD strength + research validation + effort estimate:

### TIER 1 — Build First (Must Have)
These address Jobs 1, 2, 3 — the three jobs that occur every single shift.

| Rank | Feature | JOB | Research validation | Effort | Impact |
|---|---|---|---|---|---|
| **1** | **Delivery Timer Badge** | JOB 2 | 64% usability study: color-coded status = #1 fix | S (3h) | ⭐⭐⭐⭐⭐ |
| **2** | **Fleet Status Bar** | JOB 1 | All fleet UX research: top-level summary = rule #1 | S (2h) | ⭐⭐⭐⭐⭐ |
| **3** | **One-Click Map Focus** | JOB 3 | Dispatcher core need: map + route visibility | S (1h) | ⭐⭐⭐⭐⭐ |
| **4** | **Idle Warning** | JOB 1+2 | Proactive management: system surfaces problems | S (2h) | ⭐⭐⭐⭐ |
| **5** | **Alert Notification Dot** | JOB 1 | Cross-screen visibility — must be severity-gated | S (2h) | ⭐⭐⭐⭐ |

**Total Tier 1 effort:** ~10 hours. One focused day.

---

### TIER 2 — Build Next (Should Have)
These address Jobs 4 and 5 — important but not every-shift critical.

| Rank | Feature | JOB | Research validation | Effort | Impact |
|---|---|---|---|---|---|
| **6** | **Filter Tabs** | JOB 4 | UX study: filtering = fix #2, validated for scale | S (3h) | ⭐⭐⭐⭐ |
| **7** | **Urgency Auto-Sort** | JOB 4 | Exception management: problems rise to top | S (2h) | ⭐⭐⭐⭐ |
| **8** | **Overtime Alert (pulsing border)** | JOB 2 | Proactive alerting — MUST use severity tiers | M (4h) | ⭐⭐⭐⭐ |
| **9** | **Daily Mini-Stats** | JOB 5 | KPI widgets at glance — post-shift value | S (3h) | ⭐⭐⭐ |
| **10** | **One-Click Call** | JOB 6 | Dispatcher communication tool | XS (30min) | ⭐⭐⭐ |

**Total Tier 2 effort:** ~13 hours. Two focused days.

---

### TIER 3 — Plan But Don't Rush (Could Have)
These are good ideas but address less frequent or more complex jobs.

| Rank | Feature | JOB | Notes |
|---|---|---|---|
| **11** | Rider Search | JOB 3 | Critical at 10+ riders; low priority at 6–8 |
| **12** | Order Queue Badge | JOB 5 | Useful for load balancing — add with Daily Mini-Stats |
| **13** | Idle Rider Dimming | JOB 3 | Nice passive visual — 1 CSS opacity rule, low risk |
| **14** | Pending Orders Tray | JOB 6 | Needs order assignment logic — Phase 3 |
| **15** | Coverage Zone Rings | JOB 3 | Useful for fleet expansion analysis — not daily operations |

---

### TIER 4 — Defer (Nice But Complex)
Features that are genuinely useful but require backend/state logic not yet in the system.

| Feature | Why deferred |
|---|---|
| Reassign Order Button | Needs real order assignment state management |
| Quick Status Toggle | Same — needs orders to be mutable in state |
| Hub Route Lines | Adds visual complexity without clear daily admin job |
| Fleet Health Score | Composite metric — build when Reports screen exists |

---

## The Alert Design Rule (Critical)

Based on the alert fatigue research, the Overtime Alert system must follow this severity ladder or it will be ignored:

```
LEVEL 0 — Green timer chip         → No action needed
LEVEL 1 — Amber timer chip         → Admin awareness (0.8× estimate reached)
LEVEL 2 — Red timer chip           → Admin should check (1.0× estimate exceeded)
LEVEL 3 — Red card border (static) → Admin should act (1.2× exceeded)
LEVEL 4 — Red pulsing border + Alert Dot fires → Intervention required (1.5× exceeded)
```

**Rule:** Only Level 4 fires the Alert Notification Dot. Levels 1–3 are passive information. This prevents the dot from being always-on, which is the research-proven path to alert fatigue.

---

## Recommended 3-Day Build Plan

### Day 1 — Fleet Command Visibility (Tier 1, Part A)
```
Morning:  Fleet Status Bar (2h) + Alert Notification Dot (2h)
Afternoon: One-Click Map Focus (1h) + wire acceptedAt/idleSince to types.ts (1h)
Evening:  npm run build + git push
Commits:  3 commits (one per feature)
```

### Day 2 — Per-Card Intelligence (Tier 1, Part B)
```
Morning:  Delivery Timer Badge — green/amber/red chip (3h)
Afternoon: Idle Warning — amber/red elapsed time (2h)
Evening:  npm run build + git push + visual QA
Commits:  2 commits
```

### Day 3 — Proactive Alerts (Tier 2, Part A)
```
Morning:  Overtime Alert — severity-tiered (4h)
Afternoon: One-Click Call (30min) + Filter Tabs (3h)
Evening:  npm run build + git push
Commits:  3 commits
```

**Result after 3 days:** A rider panel that behaves like a dispatch console — admin sees fleet health at a glance, gets alerted on real problems (not noise), can instantly focus the map on any rider, and can call a rider in one tap.

---

## What NOT to build based on research

Research also identifies what fails in delivery dashboards:

1. **Too many alert levels** → alert fatigue, admins ignore everything. Cap at 2 alert states (amber + red).
2. **Stats everywhere without hierarchy** → cognitive overload. Stats go below the alert/timer information, never above.
3. **Cluttered card UI** → Hick's Law violation. Each rider card should have maximum 4 pieces of information visible at once: name, status+timer, vehicle, one action button.
4. **Animation that adds no information** → This is why the passive rider drift animation was the right decision to remove. Research confirms motion should only be used to indicate state change, not as decoration.

---

## Sources

- [UX Case Study: Improving Delivery Dashboard Usability by 64%](https://medium.com/design-bootcamp/unveiling-the-future-delivery-dashboard-revamp-6a5faf643b6c) — UX Mahi, 2024
- [Fleet Management Dashboard Design: A Complete Guide](https://hicronsoftware.com/blog/fleet-management-dashboard-design/) — Hicron Software, 2026
- [Real-Time Visibility in Fleet Dispatch](https://fareye.com/resources/blogs/real-time-visibility-in-fleet-dispatch) — FarEye
- [Alert Fatigue: The Silent Reliability Killer](https://www.signl4.com/blog/alert-fatigue-in-modern-it-operations/) — SIGNL4
- [Effects of Repeated Alerts on Alert Fatigue](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5387195/) — NIH/PMC
- [Onfleet Last Mile Delivery Software Features](https://onfleet.com/last-mile-delivery) — Onfleet, 2026
- [Dashboard UX Best Practices](https://dev.to/designmonks/dashboard-ux-best-practices-designing-dashboards-that-work-1769) — DEV Community
- [Last Mile Delivery Analytics: Key Metrics](https://locus.sh/blogs/last-mile-delivery-analytics/) — Locus, 2026

---

*Dawer — Rider Panel JTBD Priority Analysis*
*June 2026 — Research-validated feature ranking*
