Dawer Design System — v1.0
A token-first design system for the Dawer recycling operations platform. Every value defined here is the single source of truth — no magic numbers, no raw hex, no guessing.
Location	Amman Operations Center
Stack	React + Vite + Tailwind v4
Fonts	DM Sans · DM Mono · Cairo
________________________________________
Table of Contents
1.	Color Tokens
2.	Typography
3.	Spacing
4.	Components
5.	Anti-Patterns
6.	Feature Ideas
7.	Do / Don’t Rules
________________________________________
1. Color Tokens
Every color in the UI must come from a CSS variable. Never write a raw hex value in a component.
The brand palette is deep forest green + warm amber — anchored in the environmental mission of the platform.
Brand Green — Primary
Token	Hex	Usage
--color-brand-900	#032B17	Deepest green, rarely used
--color-brand-800	#06402B	Sidebar background
--color-brand-700	#0A5E3E	Gradients, hover states
--color-brand-600 ⭐	#1E5C35	Primary action, links, focus rings
--color-brand-500	#166534	Secondary green
--color-brand-100	#D1FAE5	Light backgrounds, badges
--color-brand-50	#ECFDF5	Subtle fills, secondary buttons
Amber — Earnings & Warnings
Token	Hex	Usage
--color-amber-700	#A16207	Dark amber text
--color-amber-600 ⭐	#C8860A	Earnings, warnings, progress fills
--color-amber-100	#FEF3C7	Light amber backgrounds
--color-amber-50	#FFFBEB	Subtle amber fills
Material Type Colors — Fixed semantic meanings
Material	Token	Hex	Background Token
Cooking Oil	--color-oil	#C8860A	--color-oil-bg → #FEF3C7
Plastic	--color-plastic	#1E40AF	--color-plastic-bg → #DBEAFE
Paper	--color-paper	#166534	--color-paper-bg → #DCFCE7
E-Waste	--color-ewaste	#6D28D9	--color-ewaste-bg → #EDE9FE
Neutrals — Text, surfaces, borders
Token	Hex	Usage
--color-text-primary	#111827	Headings, primary text
--color-text-secondary	#4B5563	Body text, descriptions
--color-text-tertiary	#94A3B8	Meta text, timestamps, labels
--color-text-disabled	#CBD5E1	Disabled text, placeholders
--color-border	#E2E8F0	Default borders, dividers
--color-border-strong	#CBD5E1	Stronger borders, toggle tracks
--color-surface	#F4F6F5	Page background
--color-surface-card	#FFFFFF	Card backgrounds
--color-surface-hover	#F8FAFB	Hover states
Other
Token	Hex	Usage
--color-danger-600	#DC2626	Error states, critical alerts
--color-danger-100	#FEE2E2	Error backgrounds
--color-status-live	#4ADE80	Live indicator dot
________________________________________
2. Typography
Three fonts. One role each. Never mix these roles.
Font	Token	Role
DM Sans	--font-sans	All UI text, headings, body, labels
DM Mono	--font-mono	Numbers, IDs, data, timestamps, percentages
Cairo	--font-ar	Arabic names and labels only
The smallest visible text in the UI is 10px — only for uppercase badge labels.
Type Scale
Token	Size	Weight	Usage
--text-2xl	28px	Bold (700)	Page headings
--text-xl	22px	Bold (700)	Section titles
--text-lg	18px	Semibold (600)	Panel headers
--text-md	16px	Medium (500)	Subheadings, inputs
--text-base	14px	Regular (400)	Body, list items
--text-sm	13px	Medium (500)	Secondary text, nav items
--text-xs	11px	Regular (400)	Meta, timestamps
--text-2xs	10px	Bold (700) + CAPS	Badge labels, section eyebrows ONLY
Line Heights
Token	Value	Usage
--leading-tight	1.25	Headings, stats
--leading-normal	1.5	Body text
--leading-loose	1.75	Descriptions, helper text
Font Weights
Token	Value
--weight-regular	400
--weight-medium	500
--weight-semibold	600
--weight-bold	700
________________________________________
3. Spacing
Every margin, padding, and gap is a multiple of 4px. This creates visual rhythm without thought.
If you find yourself writing py-2.5 or px-3.5, that’s a red flag — use the nearest token instead.
Spacing Scale
Token	Value	Usage
--space-1	4px	Icon gaps, micro spacing
--space-2	8px	Badge padding, tight rows
--space-3	12px	Card padding (compact), chip padding
--space-4 ⭐	16px	Card padding, section gaps — most used
--space-5	20px	Header horizontal padding
--space-6	24px	Between sections
--space-8	32px	Page margins, major sections
--space-10	40px	Large section gaps
--space-12	48px	Top-level section separation
Layout Dimensions
Element	Token	Value
Sidebar width	--sidebar-width	200px
Right panel width	--panel-width	288px
Header height	--header-height	52px
Stats bar height	--statsbar-height	60px
________________________________________
4. Components
Badges & Status Pills
<span class="badge badge--brand">
  <span class="badge-dot"></span>Collecting
</span>
Variant	Background	Text	Dot
badge--brand	--color-brand-100	--color-brand-600	--color-brand-600
badge--amber	--color-amber-100	--color-amber-600	--color-amber-600
badge--neutral	#F1F5F9	--color-text-secondary	--color-text-tertiary
badge--danger	--color-danger-100	--color-danger-600	--color-danger-600
badge--live	--color-brand-800	#4ADE80	#4ADE80 (animated pulse)
•	All pills use border-radius: --radius-full (9999px)
•	All chips use border-radius: --radius-sm (6px)
Chips (Material Tags)
<span class="chip" style="background:var(--color-oil-bg);color:var(--color-oil);">
  Oil 120L
</span>
Buttons
Variant	Background	Text	Border	Hover
btn--primary	--color-brand-600	white	none	--color-brand-500 + shadow
btn--secondary	--color-brand-50	--color-brand-600	1px --color-brand-100	--color-brand-100
btn--ghost	transparent	--color-text-secondary	none	--color-surface
btn--danger	--color-danger-100	--color-danger-600	none	#FECACA
•	Min height: 36px (full) / 28px (sm)
•	Focus ring: 2px solid --color-brand-600, offset 2px
•	Always has aria-label if icon-only
Form Inputs
<div class="input-wrap">
  <label class="input-label" for="field">Label <span style="color:var(--color-danger-600);">*</span></label>
  <input class="input" id="field" type="text" placeholder="..." />
  <span class="input-helper">Helper text</span>
</div>
•	Always use a visible <label>. Never placeholder-only.
•	Error message goes below the field, not at the top.
•	Error state: border-color: --color-danger-600, focus shadow: rgba(220,38,38,0.12)
•	Focus: border-color: --color-brand-600, shadow: rgba(30,92,53,0.12)
Toggle Switches
<label class="toggle" aria-label="Toggle description">
  <input type="checkbox" checked />
  <div class="toggle-slider"></div>
</label>
•	Off: background: --color-border-strong
•	On: background: --color-brand-600
•	Knob: white, 16px diameter
•	Focus ring: 2px solid --color-brand-600, offset 2px
•	No emoji in labels — use text-only or SVG icons
Progress Bars
<div class="progress-bar">
  <div class="progress-fill" style="width:34%;background:var(--color-brand-600);"></div>
</div>
•	Height: 6px
•	Background track: --color-border
•	Fill colors by threshold:
–	< 50%: --color-brand-600
–	50-80%: --color-amber-600
–	80%: --color-danger-600
Sidebar Navigation Items
<button class="nav-item active">
  <svg><!-- icon --></svg>
  Live Map
</button>
•	Default: color: rgba(255,255,255,0.55), transparent bg
•	Hover: background: rgba(255,255,255,0.08), color: rgba(255,255,255,0.85)
•	Active: background: rgba(255,255,255,0.15), color: white, font-weight: 600
•	Focus ring: 2px solid rgba(255,255,255,0.4) inset
Stat Cards
<div class="stat-card">
  <div class="stat-icon" style="background:var(--color-brand-100);">
    <svg><!-- icon --></svg>
  </div>
  <div class="stat-value" style="color:var(--color-brand-600);">1,247<span>kg</span></div>
  <div class="stat-label">CO₂ Saved</div>
  <div class="stat-delta" style="color:var(--color-brand-600);">↑ 12% vs yesterday</div>
</div>
•	Icon container: 36×36px, rounded --radius-md
•	Value: font-family: var(--font-mono), --text-xl (22px), Bold
•	Label: --text-2xs, uppercase, --color-text-tertiary
•	Delta: --text-xs, color matches value
Order Card (Rider Panel)
•	Border and background tinted by material type
•	Order ID: font-family: var(--font-mono), --text-xs
•	Material name: --text-sm (13px), Semibold
•	Quantity: font-family: var(--font-mono), 14px, Bold, material color
•	Location: --text-xs, --color-text-secondary
•	CO₂ + Earnings in footer row, separated by border-top
________________________________________
5. Anti-Patterns
These are the 10 specific patterns found in the current codebase that make the UI feel machine-generated. Fix these first before adding new features.
🚫 #1 — Raw hex colors inline on every element
Found: 60+ instances of color: "#1E5C35", background: "#FEF3C7" inline. Three different “black” values: #1a1a1a, #1A1A1A, "black".
Fix: Move all colors to CSS variables in :root or Tailwind tokens, then reference via var(--color-brand-600) or a Tailwind class. All blacks → --color-text-primary: #111827.
🚫 #2 — Font family repeated on every element
Found: fontFamily: "'DM Sans',sans-serif" appears on ~60 individual elements.
Fix: Set font-family: var(--font-sans) once on body in globals.css. Only override with --font-mono or --font-ar where needed.
🚫 #3 — Emoji used as a UI icon
Found: In HeatMapPanel: "🔥 Rider hotspots" — emoji as a label prefix.
Fix: Replace with a Lucide SVG icon (e.g. <Flame size={12} />) or remove entirely and use text only. Emojis are platform-dependent, unstyled, and inaccessible.
🚫 #4 — Eyeballed font size scale
Found: 9px → 10px → 11px → 12px → 13px with no system. 9px text (BUILD 1.0.0) is below any accessibility floor.
Fix: Use only the 7 sizes in this design system: 10, 11, 13, 14, 16, 18, 22, 28px. The 9px sidebar footer text should be removed or raised to 10px.
🚫 #5 — Inconsistent border-radius across similar elements
Found: Badges use rounded-full, cards use rounded-xl (16px), some divs use rounded-lg (12px), inputs use rounded-lg but checkboxes are unstyled.
Fix: Enforce the radius system: - Pills → --radius-full - Chips → --radius-sm (6px) - Cards → --radius-lg (12px) - Buttons/Inputs → --radius-md (8px)
🚫 #6 — No focus states on interactive elements
Found: All buttons/nav-items have transition-colors but zero focus styles. Tab-navigating the dashboard is invisible.
Fix: Add :focus-visible { outline: 2px solid var(--color-brand-600); outline-offset: 2px; } globally. Use rgba(255,255,255,0.4) version for the dark sidebar.
🚫 #7 — No aria-labels on icon-only and non-obvious buttons
Found: The X close button, chevron expand/collapse buttons, and checkbox toggles in HubsPanel have no accessible label.
Fix: Add aria-label="Close rider detail", aria-label="Expand hub details", aria-label="Toggle hub active state".
🚫 #8 — Half-pixel spacing values
Found: py-2.5, gap-1.5, mb-0.5, gap-0.5, mt-0.5 throughout. These 2px/6px values break the 4pt grid.
Fix: Round to nearest 4pt token: - 2px → 0 - 6px → 8px - 10px → 8px or 12px
🚫 #9 — Right panel widths are different
Found: RiderPanel is 284px, HubsPanel is 300px, HeatMapPanel is 300px — they all occupy the same layout slot.
Fix: Unify to --panel-width: 288px so the layout doesn’t shift when switching views.
🚫 #10 — CO₂ & Reports views are blank placeholders
Found: Two of the five nav items lead to a <PlaceholderView>. This makes the nav feel broken.
Fix: Either hide these nav items until ready (and add them progressively), or build them — see Feature Ideas below.
________________________________________
6. Feature Ideas
Ideas that fit the product’s mission and fill the current gaps — ordered by impact and effort.
01 — CO₂ Analytics View
High Impact · Medium Effort
The CO₂ Stats placeholder should become a real analytics panel. Show: - Daily/weekly CO₂ trend (area chart) - Breakdown by material type (donut chart) - District contribution bar chart - “CO₂ equivalent” counter (trees saved, car-km offset)
Use DM Mono for all numbers. Color per material type already defined.
02 — Reports Export Panel
High Impact · Medium Effort
The Reports view should let admins export: - Rider performance table (orders, earnings, CO₂ per rider) - Hub shipment history - Material collection summary by date range
Filters: date range picker, material type, district. Exports to CSV. Table has sortable columns with proper aria-sort.
03 — Rider Assignment Flow
Medium Impact · High Effort
Currently, orders are pre-assigned. Add a drag-to-assign interface in the Live Map view: - New orders appear in a queue on the right panel - Admin drags them onto a rider card or clicks “Assign” - Idle riders should pulse on the map as an affordance
04 — Hub Shipment Scheduler
Medium Impact · Low Effort
The hubs panel has a “Schedule Shipment” button but no calendar. Add an inline mini-calendar (already imported with react-day-picker) to pick a date. Show upcoming shipments as a timeline strip below the hub list. Color-code: amber = scheduled, green = shipped, red = overdue.
05 — District Detail Drawer
Medium Impact · Medium Effort
When a district is selected on the Heat Map, slide in a drawer (not a panel) with: - CO₂ potential vs achieved chart - Top materials - Recent orders in that district - “Boost Coverage” button that assigns an idle rider to the district
Drawer slides in from right over the map (uses react-resizable-panels already installed).
06 — Global Search (⌘K)
High Impact · Low Effort
A command palette that lets the admin search riders by name, order by ID, hub by district. cmdk is already installed. Press ⌘K or Ctrl+K to open. Results grouped by type. Selecting a rider opens their panel; selecting an order centers the map on it.
07 — Notifications / Alert Feed
High Impact · Low Effort
A bell icon in the header with a dropdown feed. Alerts: - Hub at 90% capacity - Rider idle for 30min - Order pending for 15min - Shipment due today
Each alert has a 1-click action. Use sonner (already installed) for live toast alerts. Badge count on bell clears when opened.
08 — Dark Mode
Medium Impact · Medium Effort
next-themes is already installed. The sidebar’s dark green (#06402B) becomes the base surface color. The main content area uses #0F1A14. Cards use #152219. This is a natural dark mode because the brand color IS dark. All token values need a dark-mode override — do not invert, use tonal variants.
________________________________________
7. Do / Don’t Rules
Colors
✅ Do	❌ Don’t
Use var(--color-brand-600) everywhere you need the primary green	Write color: "#1E5C35" or color: "#166534" or color: "green" directly in a component
Use the MATERIAL_CONFIG object for all material colors	Hardcode #1E40AF for plastic in a new component — use MATERIAL_CONFIG["Plastic Bottles"].color
Icons
✅ Do	❌ Don’t
Use Lucide icons (<Flame />, <Warehouse />) consistently at 14px or 16px	Use 🔥 or any emoji as a structural or navigation icon
Accessibility
✅ Do	❌ Don’t
Label every icon-only button: aria-label="Close panel"	Render a bare <X size={14} /> button with no accessible label
Typography
✅ Do	❌ Don’t
All numbers, IDs, times, and monetary values use font-family: var(--font-mono)	Mix DM Sans and DM Mono within the same stat or data field
Layout
✅ Do	❌ Don’t
The right panel is always exactly --panel-width: 288px regardless of which view is active	Set RiderPanel to 284px and HubsPanel to 300px — the layout shift between views is jarring
Empty States
✅ Do	❌ Don’t
Empty/placeholder views show a meaningful state: icon + title + what’s coming + ETA	Show “Charts and analytics coming soon” in the nav as a dead end with no context
________________________________________
DAWER DESIGN SYSTEM · v1.0 · AMMAN · JO
