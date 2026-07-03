# Phase 3 — Dashboard Improvements Implementation Plan

> **For agentic workers:** Implement this plan task-by-task using the executing-plans pattern. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Dawer Operations Dashboard with real PDF export, a polished Export Wizard Drawer, an Area Audit document from the Heat Map, share-link generation, and report-request fulfillment — turning every "Phase 2 coming soon" placeholder into a working feature.

**Architecture:** Four independent subsystems built in dependency order: (1) the `@react-pdf/renderer` foundation shared by all export flows, (2) the Export Wizard Drawer wired into the existing `ReportPreviewPanel`, (3) the CO₂ Certificate real download (wired to the already-built `Co2CertificateReport`), (4) the Area Audit PDF from `DistrictReportCard`, and (5) Share Link generation + Report Request fulfillment. Each phase is independently shippable — complete Task 1 and the app still builds; complete Task 5 and every "Phase 2" placeholder is gone.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind v4 + shadcn/ui + Framer Motion (`motion`) + Zustand + `@react-pdf/renderer` (new dependency) + `sonner` (toast, already installed) + `vaul` (drawer, already installed)

**No test framework is configured** — verification for each task is: `npm run build` passes (TypeScript + Vite) + visual check in `npm run dev`.

---

## Current State Snapshot

Before writing any code, confirm this is what exists:

| File | Current Behaviour |
|---|---|
| `ReportPreviewPanel.tsx` | "PDF" button calls `toast("PDF export coming in Phase 2")` |
| `Co2CertificateReport.tsx` | Beautiful certificate exists in-browser; no download |
| `DistrictReportCard.tsx` | "Share Report (Phase 2)" button is `disabled` |
| `TopBar.tsx` | "Export Report" button calls `alert("Generating CSV Export...")` |
| `ReportRequestsView.tsx` | Shows requests; "Generate & Send" not wired |

---

## File Map — What Gets Created or Changed

### New files
| File | Responsibility |
|---|---|
| `src/app/components/reports/ExportWizardDrawer.tsx` | 3-step wizard: Configure → Preview → Export. Wraps `vaul` Drawer. |
| `src/app/components/reports/pdf/DawerReportDocument.tsx` | `@react-pdf/renderer` root Document component shared by all templates |
| `src/app/components/reports/pdf/Co2CertificatePdf.tsx` | PDF version of the CO₂ certificate card |
| `src/app/components/reports/pdf/WeeklyOpsPdf.tsx` | PDF version of weekly operations KPIs |
| `src/app/components/reports/pdf/AreaAuditPdf.tsx` | PDF version of a district area audit |
| `src/app/lib/pdfExport.ts` | `downloadPdf(doc, filename)` — single function that generates + triggers download |
| `src/app/lib/shareLink.ts` | `generateShareLink(reportId, config)` — encodes config to URL hash |

### Modified files
| File | Change |
|---|---|
| `src/app/components/reports/ReportPreviewPanel.tsx` | Wire "PDF" button to open `ExportWizardDrawer` |
| `src/app/components/reports/reports/Co2CertificateReport.tsx` | Add "Download PDF" button that calls `downloadPdf` with `Co2CertificatePdf` |
| `src/app/components/heatmap/DistrictReportCard.tsx` | Enable "Share" button + add "Export Area Audit" button |
| `src/app/components/TopBar.tsx` | Wire "Export Report" button to open `ExportWizardDrawer` with current view context |
| `src/app/types.ts` | Add `ExportConfig` type |
| `package.json` | Add `@react-pdf/renderer` dependency |

---

## Phase 1 — Install & Foundation

### Task 1: Install @react-pdf/renderer

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the library**

```bash
cd "E:/Dawer DashBorad/AdminDashboardForRecycling"
npm install @react-pdf/renderer
```

Expected output: `added 1 package` (or similar). No errors.

- [ ] **Step 2: Verify TypeScript types are bundled**

```bash
node -e "require('@react-pdf/renderer'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Run build to confirm zero regressions**

```bash
npm run build
```

Expected: clean build, zero TypeScript or Vite errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @react-pdf/renderer"
```

---

### Task 2: Add ExportConfig Type

**Files:**
- Modify: `src/app/types.ts`

- [ ] **Step 1: Add `ExportConfig` to the bottom of `types.ts`**

Open `src/app/types.ts` and append:

```typescript
/** Configuration object passed to the Export Wizard */
export interface ExportConfig {
  /** Which report template to render */
  reportId: ReportType;
  /** ISO date range start — e.g. "2026-06-01" */
  dateFrom: string;
  /** ISO date range end — e.g. "2026-06-29" */
  dateTo: string;
  /** Which sections to include */
  sections: {
    kpis: boolean;
    charts: boolean;
    materialBreakdown: boolean;
    riderList: boolean;
  };
  /** Output format */
  format: "pdf" | "csv";
  /** Optional: partner/client ID this report is for */
  clientId?: string;
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/types.ts
git commit -m "feat: add ExportConfig type"
```

---

### Task 3: Build pdfExport utility

**Files:**
- Create: `src/app/lib/pdfExport.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/app/lib/pdfExport.ts
import { pdf } from "@react-pdf/renderer";
import type { ReactElement } from "react";

/**
 * Renders a @react-pdf/renderer Document element to a Blob
 * and triggers a browser file download.
 *
 * @param document - A <Document> element from @react-pdf/renderer
 * @param filename - Download filename, e.g. "weekly-ops-2026-06-29.pdf"
 */
export async function downloadPdf(
  document: ReactElement,
  filename: string
): Promise<void> {
  const blob = await pdf(document).toBlob();
  const url  = URL.createObjectURL(blob);
  const a    = window.document.createElement("a");
  a.href     = url;
  a.download = filename;
  window.document.body.appendChild(a);
  a.click();
  window.document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Returns a sanitized filename for a report.
 * e.g. reportFilename("co2-certificate", "Al-Baraka Restaurant") →
 *      "co2-certificate-al-baraka-restaurant-2026-06-29.pdf"
 */
export function reportFilename(reportId: string, suffix?: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const slug = suffix
    ? suffix.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
    : "";
  return [reportId, slug, date].filter(Boolean).join("-") + ".pdf";
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/pdfExport.ts
git commit -m "feat: add downloadPdf utility using @react-pdf/renderer"
```

---

### Task 4: Build shareLink utility

**Files:**
- Create: `src/app/lib/shareLink.ts`

- [ ] **Step 1: Create the file**

```typescript
// src/app/lib/shareLink.ts
import type { ExportConfig } from "../types";

/**
 * Encodes an ExportConfig into a URL hash so the report can be
 * shared without a backend. The recipient opens the URL and sees
 * a read-only HTML rendering of the report.
 *
 * Example output:
 *   https://dawer.app/reports#share=eyJyZXBvcnRJZCI6ImNvMi1jZXJ0aWZpY2F0ZSIsImRhdGVGcm9tIjoiMjAyNi0wNi0wMSIsImRhdGVUbyI6IjIwMjYtMDYtMjkiLCJzZWN0aW9ucyI6eyJrcGlzIjp0cnVlLCJjaGFydHMiOnRydWUsIm1hdGVyaWFsQnJlYWtkb3duIjp0cnVlLCJyaWRlckxpc3QiOnRydWV9LCJmb3JtYXQiOiJwZGYifQ==
 */
export function generateShareLink(config: ExportConfig): string {
  const encoded = btoa(JSON.stringify(config));
  const base    = window.location.origin + "/reports";
  return `${base}#share=${encoded}`;
}

/**
 * Reads a share config from the current URL hash, if present.
 * Returns null if the hash does not contain a valid share param.
 */
export function readShareLinkConfig(): ExportConfig | null {
  try {
    const hash = window.location.hash;
    const match = hash.match(/[#&]share=([^&]+)/);
    if (!match) return null;
    return JSON.parse(atob(match[1])) as ExportConfig;
  } catch {
    return null;
  }
}

/** Copies a string to the clipboard and returns a promise. */
export async function copyToClipboard(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/lib/shareLink.ts
git commit -m "feat: add share link generation via URL hash encoding"
```

---

## Phase 2 — PDF Templates

### Task 5: CO₂ Certificate PDF Template

**Files:**
- Create: `src/app/components/reports/pdf/Co2CertificatePdf.tsx`

This is a `@react-pdf/renderer` component — it uses `Document`, `Page`, `View`, `Text`, `StyleSheet` from the library, NOT regular HTML or React DOM elements.

- [ ] **Step 1: Create the file**

```tsx
// src/app/components/reports/pdf/Co2CertificatePdf.tsx
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { Client } from "../../../types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    padding: 48,
  },
  header: {
    marginBottom: 24,
    alignItems: "center",
  },
  badge: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 2,
    color: "#1E5C35",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginVertical: 20,
  },
  co2Box: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#DCFCE7",
  },
  co2Label: {
    fontSize: 10,
    color: "#1E5C35",
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  co2Number: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1E5C35",
    lineHeight: 1,
  },
  co2Unit: {
    fontSize: 14,
    color: "#1E5C35",
    marginTop: 4,
  },
  equivGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  equivCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  equivLabel: {
    fontSize: 8,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  equivValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#1E5C35",
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
  },
  certId: {
    fontSize: 7,
    color: "#CBD5E1",
    fontFamily: "Courier",
  },
});

interface Co2CertificatePdfProps {
  client: Client;
  equiv: { trees: number; carKm: number; flights: number; phones: number };
  generatedDate: string; // "June 29, 2026"
}

export function Co2CertificatePdf({ client, equiv, generatedDate }: Co2CertificatePdfProps) {
  const certId = `CERT-${client.id.toUpperCase()}-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}`;

  return (
    <Document
      title={`CO₂ Certificate — ${client.name}`}
      author="Dawer Operations"
      subject="Environmental Impact Certificate"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>Certificate of Environmental Impact</Text>
          <Text style={styles.title}>{client.name}</Text>
          <Text style={styles.subtitle}>
            {client.type.charAt(0).toUpperCase() + client.type.slice(1)} · {client.address}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* CO₂ hero */}
        <View style={styles.co2Box}>
          <Text style={styles.co2Label}>Total CO₂ Saved</Text>
          <Text style={styles.co2Number}>{client.totalCo2Saved.toFixed(1)}</Text>
          <Text style={styles.co2Unit}>kg of CO₂</Text>
        </View>

        {/* Equivalents grid */}
        <View style={styles.equivGrid}>
          <View style={styles.equivCard}>
            <Text style={styles.equivLabel}>Trees Planted (1 yr)</Text>
            <Text style={styles.equivValue}>≈ {equiv.trees}</Text>
          </View>
          <View style={styles.equivCard}>
            <Text style={styles.equivLabel}>Car-km Avoided</Text>
            <Text style={styles.equivValue}>≈ {equiv.carKm.toLocaleString()} km</Text>
          </View>
          <View style={styles.equivCard}>
            <Text style={styles.equivLabel}>Flights Offset</Text>
            <Text style={styles.equivValue}>≈ {equiv.flights}</Text>
          </View>
          <View style={styles.equivCard}>
            <Text style={styles.equivLabel}>Phone Charges</Text>
            <Text style={styles.equivValue}>≈ {equiv.phones.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.footerText}>Verified by Dawer Operations Platform</Text>
            <Text style={styles.footerText}>Generated: {generatedDate}</Text>
          </View>
          <Text style={styles.certId}>{certId}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: clean build. `@react-pdf/renderer` components do not touch the DOM so Vite compiles them fine.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/reports/pdf/Co2CertificatePdf.tsx
git commit -m "feat: add Co2CertificatePdf renderer component"
```

---

### Task 6: Weekly Operations PDF Template

**Files:**
- Create: `src/app/components/reports/pdf/WeeklyOpsPdf.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/app/components/reports/pdf/WeeklyOpsPdf.tsx
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    padding: 48,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  date: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginVertical: 16,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#9CA3AF",
    marginBottom: 10,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  kpiLabel: {
    fontSize: 8,
    color: "#6B7280",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
  },
  kpiUnit: {
    fontSize: 9,
    color: "#9CA3AF",
  },
  materialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  materialName: {
    fontSize: 10,
    color: "#374151",
  },
  materialValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E5C35",
    fontFamily: "Courier",
  },
  footer: {
    marginTop: 32,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
  },
});

interface WeeklyOpsPdfProps {
  co2: number;
  earnings: number;
  completedOrders: number;
  activeRiders: number;
  materialTotals: { name: string; value: number; unit: string }[];
  generatedDate: string;
  dateRange: string; // e.g. "Jun 1 – Jun 29, 2026"
}

export function WeeklyOpsPdf({
  co2,
  earnings,
  completedOrders,
  activeRiders,
  materialTotals,
  generatedDate,
  dateRange,
}: WeeklyOpsPdfProps) {
  return (
    <Document
      title="Weekly Operations Report — Dawer"
      author="Dawer Operations"
      subject="Weekly Operations Summary"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Weekly Operations Summary</Text>
          <Text style={styles.date}>{dateRange}</Text>
        </View>

        <View style={styles.divider} />

        {/* KPIs */}
        <Text style={styles.sectionLabel}>Key Performance Indicators</Text>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>CO₂ Saved</Text>
            <Text style={styles.kpiValue}>{co2.toFixed(1)}</Text>
            <Text style={styles.kpiUnit}>kg</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Earnings</Text>
            <Text style={styles.kpiValue}>{earnings.toFixed(2)}</Text>
            <Text style={styles.kpiUnit}>JD</Text>
          </View>
        </View>
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Completed Orders</Text>
            <Text style={styles.kpiValue}>{completedOrders}</Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Active Riders</Text>
            <Text style={styles.kpiValue}>{activeRiders}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Material breakdown */}
        <Text style={styles.sectionLabel}>Material Collection</Text>
        {materialTotals.map(m => (
          <View key={m.name} style={styles.materialRow}>
            <Text style={styles.materialName}>{m.name}</Text>
            <Text style={styles.materialValue}>{m.value} {m.unit}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Dawer Operations Platform</Text>
          <Text style={styles.footerText}>Generated: {generatedDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/reports/pdf/WeeklyOpsPdf.tsx
git commit -m "feat: add WeeklyOpsPdf renderer component"
```

---

### Task 7: Area Audit PDF Template

**Files:**
- Create: `src/app/components/reports/pdf/AreaAuditPdf.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/app/components/reports/pdf/AreaAuditPdf.tsx
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type { District } from "../../../types";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    padding: 48,
  },
  badge: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1.5,
    color: "#1E5C35",
    textTransform: "uppercase",
    marginBottom: 6,
    backgroundColor: "#F0FDF4",
    padding: "4 10",
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    marginVertical: 14,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#9CA3AF",
    marginBottom: 10,
  },
  co2Row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  co2Block: {
    flex: 1,
  },
  co2Value: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1E5C35",
    fontFamily: "Courier",
  },
  co2Label: {
    fontSize: 9,
    color: "#6B7280",
    marginTop: 2,
  },
  gapValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#EF4444",
    fontFamily: "Courier",
    textAlign: "right",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#1E5C35",
  },
  materialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  materialName: {
    fontSize: 10,
    color: "#374151",
    flex: 1,
  },
  materialNumbers: {
    flexDirection: "row",
    gap: 8,
  },
  materialAchieved: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#1E5C35",
    fontFamily: "Courier",
  },
  materialPotential: {
    fontSize: 10,
    color: "#CBD5E1",
    fontFamily: "Courier",
  },
  equivRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  equivLabel: {
    fontSize: 9,
    color: "#6B7280",
  },
  equivValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#1E5C35",
    fontFamily: "Courier",
  },
  actionBox: {
    backgroundColor: "#FEF3C7",
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  actionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#92400E",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  actionText: {
    fontSize: 10,
    color: "#92400E",
    lineHeight: 1.5,
  },
  footer: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 8,
    color: "#9CA3AF",
  },
});

interface AreaAuditPdfProps {
  district: District;
  equiv: { trees: number; carKm: number; flights: number; phones: number };
  idleRiderNames: string[];
  generatedDate: string;
}

const MATERIAL_LABELS: Record<string, string> = {
  cookingOil:  "Cooking Oil",
  plastic:     "Plastic Bottles",
  paper:       "Paper & Cardboard",
  electronics: "Electronics",
};

export function AreaAuditPdf({ district, equiv, idleRiderNames, generatedDate }: AreaAuditPdfProps) {
  const achievedPct = Math.round((district.co2Achieved / district.co2Potential) * 100);
  const gap         = district.co2Potential - district.co2Achieved;
  const gapPct      = 100 - achievedPct;
  const isHighPriority = gapPct >= 50;

  return (
    <Document
      title={`Area Audit — ${district.name}`}
      author="Dawer Operations"
      subject="District Area Audit Report"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.badge}>Area Audit</Text>
        <Text style={styles.title}>{district.name}</Text>
        <Text style={styles.subtitle}>
          {district.orderCount} active orders · Generated {generatedDate}
        </Text>

        <View style={styles.divider} />

        {/* CO₂ progress */}
        <Text style={styles.sectionLabel}>CO₂ Savings Progress</Text>
        <View style={styles.co2Row}>
          <View style={styles.co2Block}>
            <Text style={styles.co2Value}>{district.co2Achieved.toLocaleString()} kg</Text>
            <Text style={styles.co2Label}>achieved this period</Text>
          </View>
          <View>
            <Text style={styles.gapValue}>{gap.toLocaleString()} kg</Text>
            <Text style={[styles.co2Label, { textAlign: "right" }]}>{gapPct}% unrealized</Text>
          </View>
        </View>
        {/* Progress bar drawn as two nested views — react-pdf doesn't support HTML */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${achievedPct}%` }]} />
        </View>

        {/* Material breakdown */}
        <Text style={styles.sectionLabel}>Material Breakdown</Text>
        {Object.entries(district.materialBreakdown).map(([key, val]) => (
          <View key={key} style={styles.materialRow}>
            <Text style={styles.materialName}>{MATERIAL_LABELS[key] ?? key}</Text>
            <View style={styles.materialNumbers}>
              <Text style={styles.materialAchieved}>{val.achieved} kg</Text>
              <Text style={styles.materialPotential}>/ {val.potential}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        {/* CO₂ equivalents */}
        <Text style={styles.sectionLabel}>Impact Equivalents</Text>
        <View style={styles.equivRow}>
          <Text style={styles.equivLabel}>Trees planted (1yr)</Text>
          <Text style={styles.equivValue}>≈ {equiv.trees}</Text>
        </View>
        <View style={styles.equivRow}>
          <Text style={styles.equivLabel}>Car-km avoided</Text>
          <Text style={styles.equivValue}>≈ {equiv.carKm.toLocaleString()} km</Text>
        </View>
        <View style={styles.equivRow}>
          <Text style={styles.equivLabel}>Flights offset</Text>
          <Text style={styles.equivValue}>≈ {equiv.flights}</Text>
        </View>

        {/* Action recommendation */}
        {isHighPriority && (
          <View style={styles.actionBox}>
            <Text style={styles.actionTitle}>⚡ Recommended Action</Text>
            <Text style={styles.actionText}>
              {idleRiderNames.length > 0
                ? `Dispatch ${idleRiderNames.slice(0, 2).join(" or ")} to ${district.name}. An estimated ${gap.toLocaleString()} kg CO₂ remains uncaptured this period.`
                : `${district.name} has ${gapPct}% unrealized CO₂ potential. Assign available riders to capture the remaining ${gap.toLocaleString()} kg.`}
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Dawer Operations Platform · Amman, Jordan</Text>
          <Text style={styles.footerText}>{generatedDate}</Text>
        </View>
      </Page>
    </Document>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/reports/pdf/AreaAuditPdf.tsx
git commit -m "feat: add AreaAuditPdf renderer component"
```

---

## Phase 3 — Wiring Export Into Existing UI

### Task 8: Build ExportWizardDrawer

**Files:**
- Create: `src/app/components/reports/ExportWizardDrawer.tsx`

This uses `vaul` (already installed) for the slide-up drawer and the `WeeklyOpsPdf` template. The 3 steps are: Configure → Generating → Done.

- [ ] **Step 1: Create the file**

```tsx
// src/app/components/reports/ExportWizardDrawer.tsx
import { useState } from "react";
import { Drawer } from "vaul";
import { Download, X, Check, Loader2, Calendar, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import type { ReportType, ExportConfig } from "../../types";
import { REPORT_TEMPLATES } from "../../constants";
import { downloadPdf, reportFilename } from "../../lib/pdfExport";
import { generateShareLink, copyToClipboard } from "../../lib/shareLink";
import { WeeklyOpsPdf } from "./pdf/WeeklyOpsPdf";
import { useRiders } from "../../../hooks/useRiders";
import { computeTotals } from "../../helpers";

type Step = "configure" | "generating" | "done";

interface ExportWizardDrawerProps {
  open: boolean;
  onClose: () => void;
  initialReportId?: ReportType;
}

const TODAY = new Date().toISOString().slice(0, 10);
const WEEK_AGO = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export function ExportWizardDrawer({ open, onClose, initialReportId = "weekly-operations" }: ExportWizardDrawerProps) {
  const { data: riders = [] } = useRiders();
  const totals = computeTotals(riders);

  const [step, setStep] = useState<Step>("configure");
  const [config, setConfig] = useState<ExportConfig>({
    reportId:  initialReportId,
    dateFrom:  WEEK_AGO,
    dateTo:    TODAY,
    sections:  { kpis: true, charts: true, materialBreakdown: true, riderList: false },
    format:    "pdf",
  });

  const handleClose = () => {
    setStep("configure");
    onClose();
  };

  const handleExport = async () => {
    setStep("generating");
    try {
      const allOrders       = riders.flatMap(r => r.orders);
      const completedOrders = allOrders.filter(o => o.status === "completed");
      const materialTotals  = Object.entries(
        allOrders.reduce<Record<string, number>>((acc, o) => {
          acc[o.material] = (acc[o.material] ?? 0) + o.quantity;
          return acc;
        }, {})
      ).map(([name, value]) => ({ name, value, unit: "kg" }));

      const generatedDate = new Date().toLocaleDateString("en-JO", {
        year: "numeric", month: "long", day: "numeric",
      });
      const dateRange = `${new Date(config.dateFrom).toLocaleDateString("en-JO", { month: "short", day: "numeric" })} – ${new Date(config.dateTo).toLocaleDateString("en-JO", { month: "short", day: "numeric", year: "numeric" })}`;

      // Only WeeklyOpsPdf wired for now — other templates reuse the same pattern
      await downloadPdf(
        <WeeklyOpsPdf
          co2={totals.co2}
          earnings={totals.earnings}
          completedOrders={completedOrders.length}
          activeRiders={riders.filter(r => r.status !== "idle").length}
          materialTotals={materialTotals}
          generatedDate={generatedDate}
          dateRange={dateRange}
        />,
        reportFilename(config.reportId)
      );
      setStep("done");
    } catch (err) {
      console.error("PDF export failed:", err);
      toast.error("Export failed", { description: "Please try again." });
      setStep("configure");
    }
  };

  const handleCopyShareLink = async () => {
    const link = generateShareLink(config);
    await copyToClipboard(link);
    toast.success("Share link copied!", { description: "Paste it anywhere to share this report." });
  };

  const meta = REPORT_TEMPLATES.find(t => t.id === config.reportId);

  return (
    <Drawer.Root open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <Drawer.Portal>
        <Drawer.Overlay style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 49 }} />
        <Drawer.Content
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: "white",
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          }}
          aria-label="Export Report Wizard"
        >
          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--color-border)" }} />
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid var(--color-border)" }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>
                {step === "configure" && "Export Report"}
                {step === "generating" && "Generating PDF…"}
                {step === "done" && "Export Complete"}
              </div>
              {meta && step === "configure" && (
                <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{meta.title}</div>
              )}
            </div>
            <button
              onClick={handleClose}
              aria-label="Close export wizard"
              style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "var(--color-surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={16} color="var(--color-text-secondary)" />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

            {/* Step 1: Configure */}
            {step === "configure" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Report selector */}
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Report Type
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {REPORT_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => setConfig(c => ({ ...c, reportId: t.id }))}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: `1px solid ${config.reportId === t.id ? "var(--color-brand-600)" : "var(--color-border)"}`,
                          background: config.reportId === t.id ? "var(--color-brand-50)" : "white",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        <t.icon size={14} color={config.reportId === t.id ? "var(--color-brand-600)" : "var(--color-text-tertiary)"} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: config.reportId === t.id ? "var(--color-brand-600)" : "var(--color-text-primary)" }}>
                          {t.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date range */}
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Date Range
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 4 }}>From</div>
                      <div style={{ position: "relative" }}>
                        <Calendar size={12} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <input
                          type="date"
                          value={config.dateFrom}
                          onChange={e => setConfig(c => ({ ...c, dateFrom: e.target.value }))}
                          style={{ width: "100%", padding: "8px 8px 8px 28px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12, color: "var(--color-text-primary)", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 4 }}>To</div>
                      <div style={{ position: "relative" }}>
                        <Calendar size={12} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                        <input
                          type="date"
                          value={config.dateTo}
                          onChange={e => setConfig(c => ({ ...c, dateTo: e.target.value }))}
                          style={{ width: "100%", padding: "8px 8px 8px 28px", borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12, color: "var(--color-text-primary)", boxSizing: "border-box" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section toggles */}
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                    Include Sections
                  </label>
                  {(Object.keys(config.sections) as Array<keyof typeof config.sections>).map(key => {
                    const labels: Record<keyof typeof config.sections, string> = {
                      kpis:              "KPI Summary",
                      charts:            "Charts & Trends",
                      materialBreakdown: "Material Breakdown",
                      riderList:         "Rider Performance",
                    };
                    const on = config.sections[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setConfig(c => ({ ...c, sections: { ...c.sections, [key]: !on } }))}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 0", background: "none", border: "none", cursor: "pointer", borderBottom: "1px solid var(--color-border)" }}
                      >
                        <span style={{ fontSize: 12, color: "var(--color-text-primary)" }}>{labels[key]}</span>
                        {on
                          ? <ToggleRight size={20} color="var(--color-brand-600)" />
                          : <ToggleLeft size={20} color="var(--color-text-disabled)" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Generating */}
            {step === "generating" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 16 }}>
                <Loader2 size={40} color="var(--color-brand-600)" style={{ animation: "spin 1s linear infinite" }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary)" }}>Building your PDF…</div>
                <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>This takes just a second</div>
              </div>
            )}

            {/* Step 3: Done */}
            {step === "done" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--color-brand-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={28} color="var(--color-brand-600)" />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>PDF Downloaded!</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>Check your Downloads folder.</div>
                </div>
                <button
                  onClick={handleCopyShareLink}
                  style={{ width: "100%", padding: "10px 0", borderRadius: 8, border: "1px solid var(--color-border)", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}
                >
                  Copy Share Link
                </button>
                <button
                  onClick={() => setStep("configure")}
                  style={{ fontSize: 12, color: "var(--color-text-tertiary)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Export another
                </button>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {step === "configure" && (
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--color-border)", display: "flex", gap: 8 }}>
              <button
                onClick={handleCopyShareLink}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid var(--color-border)", background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}
              >
                Copy Share Link
              </button>
              <button
                onClick={handleExport}
                style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: "var(--color-brand-600)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Download size={14} />
                Download PDF
              </button>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
```

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add src/app/components/reports/ExportWizardDrawer.tsx
git commit -m "feat: add ExportWizardDrawer (3-step configure/generate/done)"
```

---

### Task 9: Wire ExportWizardDrawer into ReportPreviewPanel

**Files:**
- Modify: `src/app/components/reports/ReportPreviewPanel.tsx`

- [ ] **Step 1: Add import and state at the top of `ReportPreviewPanel.tsx`**

Add after the existing imports:

```tsx
import { useState } from "react";
import { ExportWizardDrawer } from "./ExportWizardDrawer";
```

- [ ] **Step 2: Add `exportOpen` state inside the component**

Inside `ReportPreviewPanel`, after the existing destructuring, add:

```tsx
const [exportOpen, setExportOpen] = useState(false);
```

- [ ] **Step 3: Replace the PDF ToolbarButton `onClick`**

Find this block (line ~123):

```tsx
<ToolbarButton
  icon={Download}
  label="PDF"
  variant="primary"
  onClick={() => toast("PDF export coming in Phase 2", { description: meta.title })}
/>
```

Replace with:

```tsx
<ToolbarButton
  icon={Download}
  label="PDF"
  variant="primary"
  onClick={() => setExportOpen(true)}
/>
```

- [ ] **Step 4: Replace the Share ToolbarButton `onClick`**

Find (line ~129):
```tsx
<ToolbarButton
  icon={Share2}
  label="Share"
  onClick={() => toast.success("Share link copied (Phase 2)", { description: meta.title })}
/>
```

Replace with:
```tsx
<ToolbarButton
  icon={Share2}
  label="Share"
  onClick={async () => {
    const { generateShareLink, copyToClipboard } = await import("../../lib/shareLink");
    const link = generateShareLink({
      reportId: reportId,
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      dateTo: new Date().toISOString().slice(0, 10),
      sections: { kpis: true, charts: true, materialBreakdown: true, riderList: false },
      format: "pdf",
    });
    await copyToClipboard(link);
    toast.success("Share link copied!", { description: meta.title });
  }}
/>
```

- [ ] **Step 5: Add the drawer at the bottom of the returned JSX**

Just before the closing `</div>` of the component's root, add:

```tsx
<ExportWizardDrawer
  open={exportOpen}
  onClose={() => setExportOpen(false)}
  initialReportId={reportId}
/>
```

- [ ] **Step 6: Run build and visually verify**

```bash
npm run build && npm run dev
```

Open the Reports view. Click the green "PDF" button. The `ExportWizardDrawer` should slide up from the bottom. Configure a report, click "Download PDF" — the PDF should download. Click "Copy Share Link" — a sonner toast should confirm.

- [ ] **Step 7: Commit**

```bash
git add src/app/components/reports/ReportPreviewPanel.tsx
git commit -m "feat: wire ExportWizardDrawer into ReportPreviewPanel PDF + Share buttons"
```

---

### Task 10: Wire TopBar "Export Report" button

**Files:**
- Modify: `src/app/components/TopBar.tsx`
- Modify: `src/app/AppShell.tsx`

The TopBar button needs to open the export wizard. The drawer state lives in AppShell (which owns TopBar).

- [ ] **Step 1: Update `TopBarProps` interface in `TopBar.tsx`**

Change:
```tsx
interface TopBarProps {
  activeView: ViewId;
  onSearchClick: () => void;
}
```
To:
```tsx
interface TopBarProps {
  activeView: ViewId;
  onSearchClick: () => void;
  onExportClick: () => void;
}
```

- [ ] **Step 2: Wire the prop in `TopBar.tsx`**

Change:
```tsx
export function TopBar({ activeView, onSearchClick }: TopBarProps) {
```
To:
```tsx
export function TopBar({ activeView, onSearchClick, onExportClick }: TopBarProps) {
```

Find the Export Report button (line ~59):
```tsx
onClick={() => alert("Generating CSV Export...")}
```
Change to:
```tsx
onClick={onExportClick}
```

- [ ] **Step 3: Update `AppShell.tsx` to manage drawer state and pass prop**

In `AppShell.tsx`, add import at top:
```tsx
import { ExportWizardDrawer } from "./components/reports/ExportWizardDrawer";
```

Add state inside `AppShell` component, after `commandPaletteOpen` state:
```tsx
const [exportWizardOpen, setExportWizardOpen] = useState(false);
```

Find the `<TopBar>` usage (line ~149):
```tsx
<TopBar activeView={activeView} onSearchClick={() => setCommandPaletteOpen(true)} />
```
Change to:
```tsx
<TopBar
  activeView={activeView}
  onSearchClick={() => setCommandPaletteOpen(true)}
  onExportClick={() => setExportWizardOpen(true)}
/>
```

Add the drawer at the very end of the main return's `<div>`, just before the closing `</div>`:
```tsx
<ExportWizardDrawer
  open={exportWizardOpen}
  onClose={() => setExportWizardOpen(false)}
/>
```

- [ ] **Step 4: Run build and verify**

```bash
npm run build && npm run dev
```

Click "Export Report" in the top bar (the coral button). The wizard drawer should slide up. Verify it opens from any view — Map, Heat Map, Hubs, etc.

- [ ] **Step 5: Commit**

```bash
git add src/app/components/TopBar.tsx src/app/AppShell.tsx
git commit -m "feat: wire TopBar Export Report button to ExportWizardDrawer"
```

---

### Task 11: Wire CO₂ Certificate real download

**Files:**
- Modify: `src/app/components/reports/reports/Co2CertificateReport.tsx`

- [ ] **Step 1: Add import for `downloadPdf`, `reportFilename`, `Co2CertificatePdf`, `co2Equivalents` at top**

The file already imports `co2Equivalents` from `"../../../helpers"`. Add:

```tsx
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { downloadPdf, reportFilename } from "../../../lib/pdfExport";
import { Co2CertificatePdf } from "../pdf/Co2CertificatePdf";
```

(The file already has `useState` and most icons — only add what is actually missing.)

- [ ] **Step 2: Add `downloading` state inside `Co2CertificateReport`**

After `const activeId = ...` add:

```tsx
const [downloading, setDownloading] = useState(false);
```

- [ ] **Step 3: Add `handleDownload` function inside `Co2CertificateReport`**

After the `equiv` declaration, add:

```tsx
const handleDownload = async () => {
  if (!client) return;
  setDownloading(true);
  try {
    const generatedDate = new Date().toLocaleDateString("en-JO", {
      year: "numeric", month: "long", day: "numeric",
    });
    await downloadPdf(
      <Co2CertificatePdf client={client} equiv={equiv} generatedDate={generatedDate} />,
      reportFilename("co2-certificate", client.name)
    );
    toast.success("Certificate downloaded!", { description: client.name });
  } catch {
    toast.error("Download failed — please try again.");
  } finally {
    setDownloading(false);
  }
};
```

- [ ] **Step 4: Add Download button to the certificate card**

Inside `Co2CertificateReport`, find the `/* Order history summary */` block at the bottom. Add a download button ABOVE it:

```tsx
{/* Download PDF button */}
<div style={{ marginTop: 20, marginBottom: 8 }}>
  <button
    onClick={handleDownload}
    disabled={downloading}
    style={{
      width: "100%",
      padding: "10px 0",
      borderRadius: "var(--radius-md)",
      border: "none",
      background: downloading ? "var(--color-brand-100)" : "var(--color-brand-600)",
      color: downloading ? "var(--color-brand-600)" : "white",
      cursor: downloading ? "not-allowed" : "pointer",
      fontSize: 13,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      transition: "background 0.2s",
    }}
  >
    {downloading
      ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating PDF…</>
      : <><Download size={14} /> Download Certificate</>
    }
  </button>
</div>
```

- [ ] **Step 5: Run build and verify**

```bash
npm run build && npm run dev
```

Navigate to Reports → CO₂ Certificate. Select a client. Click "Download Certificate". The PDF should download with the client's CO₂ data rendered in `@react-pdf/renderer`. Sonner toast confirms success.

- [ ] **Step 6: Commit**

```bash
git add src/app/components/reports/reports/Co2CertificateReport.tsx
git commit -m "feat: wire real PDF download into CO2 Certificate report"
```

---

### Task 12: Enable Area Audit Export from DistrictReportCard

**Files:**
- Modify: `src/app/components/heatmap/DistrictReportCard.tsx`

- [ ] **Step 1: Add imports at the top of `DistrictReportCard.tsx`**

Add:
```tsx
import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { downloadPdf, reportFilename } from "../../lib/pdfExport";
import { AreaAuditPdf } from "../reports/pdf/AreaAuditPdf";
import { co2Equivalents } from "../../helpers";
import { generateShareLink, copyToClipboard } from "../../lib/shareLink";
```

(The file already imports `toast`, `Wind`, `Share2`, `ChevronLeft`, `District`, `Rider`, `co2Equivalents` — add only what is missing.)

- [ ] **Step 2: Add `downloading` state inside `DistrictReportCard`**

After the `equiv` declaration:
```tsx
const [downloading, setDownloading] = useState(false);
```

- [ ] **Step 3: Add `handleExportAudit` function**

After the `MATERIAL_KEYS` array:
```tsx
const handleExportAudit = async () => {
  setDownloading(true);
  try {
    const generatedDate = new Date().toLocaleDateString("en-JO", {
      year: "numeric", month: "long", day: "numeric",
    });
    await downloadPdf(
      <AreaAuditPdf
        district={district}
        equiv={equiv}
        idleRiderNames={idleRiders.map(r => r.name)}
        generatedDate={generatedDate}
      />,
      reportFilename("area-audit", district.name)
    );
    toast.success("Area audit downloaded!", { description: district.name });
  } catch {
    toast.error("Export failed — please try again.");
  } finally {
    setDownloading(false);
  }
};
```

- [ ] **Step 4: Add `handleShare` function**

```tsx
const handleShare = async () => {
  const link = generateShareLink({
    reportId: "district-intelligence",
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    dateTo: new Date().toISOString().slice(0, 10),
    sections: { kpis: true, charts: false, materialBreakdown: true, riderList: false },
    format: "pdf",
  });
  await copyToClipboard(link);
  toast.success("Share link copied!", { description: district.name });
};
```

- [ ] **Step 5: Replace the disabled "Share Report (Phase 2)" button at the bottom**

Find:
```tsx
{/* Share button (Phase 2 — disabled placeholder) */}
<div style={{ padding: "12px 16px" }}>
  <button
    disabled
    title="Share feature coming in Phase 2"
    style={{ ... }}
  >
    <Share2 size={12} />
    Share Report (Phase 2)
  </button>
</div>
```

Replace with:
```tsx
{/* Export + Share actions */}
<div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
  <button
    onClick={handleExportAudit}
    disabled={downloading}
    style={{
      width: "100%", padding: "9px 0",
      borderRadius: "var(--radius-md)",
      border: "none",
      background: downloading ? "var(--color-brand-100)" : "var(--color-brand-600)",
      color: downloading ? "var(--color-brand-600)" : "white",
      cursor: downloading ? "not-allowed" : "pointer",
      fontSize: 12, fontWeight: 700,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      transition: "background 0.2s",
    }}
  >
    {downloading
      ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Generating…</>
      : <><Download size={12} /> Export Area Audit</>
    }
  </button>
  <button
    onClick={handleShare}
    style={{
      width: "100%", padding: "8px 0",
      borderRadius: "var(--radius-md)",
      border: "1px solid var(--color-border)",
      background: "white",
      cursor: "pointer",
      fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    }}
  >
    <Share2 size={12} />
    Copy Share Link
  </button>
</div>
```

- [ ] **Step 6: Run build and verify**

```bash
npm run build && npm run dev
```

Navigate to Heat Map. Click any district. The report card should show two buttons at the bottom: "Export Area Audit" (green) and "Copy Share Link" (ghost). Click "Export Area Audit" — the PDF downloads with the district's material breakdown and action recommendation.

- [ ] **Step 7: Commit**

```bash
git add src/app/components/heatmap/DistrictReportCard.tsx
git commit -m "feat: enable Area Audit PDF export + share link from DistrictReportCard"
```

---

## Phase 4 — Report Request Fulfillment

### Task 13: Wire "Generate & Send" in ReportRequestsView

**Files:**
- Read: `src/features/report-requests/ReportRequestsView.tsx`
- Modify: `src/features/report-requests/ReportRequestRow.tsx`
- Modify: `src/features/report-requests/ReportRequestsView.tsx`

- [ ] **Step 1: Read the current file to understand prop shapes**

```bash
cat "E:/Dawer DashBorad/AdminDashboardForRecycling/src/features/report-requests/ReportRequestRow.tsx"
```

Look for the "Generate & Send" button's `onClick` handler and note what props `ReportRequestRow` receives.

- [ ] **Step 2: Add `onGenerate` prop to `ReportRequestRow`**

In `ReportRequestRow.tsx`, find the component props interface (likely `interface ReportRequestRowProps`) and add:

```tsx
onGenerate?: (requestId: string) => void;
```

Find the "Generate & Send" button and change its `onClick` to:

```tsx
onClick={() => onGenerate?.(request.id)}
```

- [ ] **Step 3: Add `ExportWizardDrawer` state to `ReportRequestsView.tsx`**

In `ReportRequestsView.tsx`, add at the top of the component:

```tsx
import { useState } from "react";
import { ExportWizardDrawer } from "../../app/components/reports/ExportWizardDrawer";
```

Inside the component function, add:

```tsx
const [exportOpen, setExportOpen] = useState(false);
const [activeRequestId, setActiveRequestId] = useState<string | null>(null);

const handleGenerate = (requestId: string) => {
  setActiveRequestId(requestId);
  setExportOpen(true);
};
```

- [ ] **Step 4: Pass `onGenerate` to each `ReportRequestRow`**

Find where `ReportRequestRow` is rendered in `ReportRequestsView` and add:

```tsx
onGenerate={handleGenerate}
```

- [ ] **Step 5: Add the wizard drawer at the bottom of `ReportRequestsView`'s return**

Before the closing tag of the root element:

```tsx
<ExportWizardDrawer
  open={exportOpen}
  onClose={() => { setExportOpen(false); setActiveRequestId(null); }}
/>
```

- [ ] **Step 6: Run build and verify**

```bash
npm run build && npm run dev
```

Navigate to Report Requests. Click "Generate & Send" on any request. The Export Wizard should open. Complete the export. The PDF downloads.

- [ ] **Step 7: Commit**

```bash
git add src/features/report-requests/
git commit -m "feat: wire Generate & Send in ReportRequestsView to ExportWizardDrawer"
```

---

## Phase 5 — Final Verification Pass

### Task 14: Full QA Checklist

- [ ] **Step 1: Run build**

```bash
cd "E:/Dawer DashBorad/AdminDashboardForRecycling"
npm run build
```

Expected: zero TypeScript errors, zero Vite warnings.

- [ ] **Step 2: Run dev server and verify all flows**

```bash
npm run dev
```

Check each flow in order:

**Reports Screen:**
- [ ] Click "PDF" button → `ExportWizardDrawer` opens
- [ ] Select "CO₂ Certificate" report type → date pickers work
- [ ] Click "Download PDF" → PDF downloads, "Export Complete" step shows
- [ ] Click "Copy Share Link" (both in done step and configure step) → sonner toast "Share link copied!"
- [ ] Click "Share" icon in toolbar → sonner toast confirms copy

**CO₂ Certificate:**
- [ ] Go to Reports → CO₂ Certificate
- [ ] Select a client from dropdown
- [ ] Click "Download Certificate" → spinner shows → PDF downloads → success toast

**Heat Map:**
- [ ] Go to Heat Map → click any district
- [ ] District Report Card shows two buttons at bottom (green "Export Area Audit" + ghost "Copy Share Link")
- [ ] Click "Export Area Audit" → spinner → PDF downloads with correct district name
- [ ] Click "Copy Share Link" → toast

**TopBar:**
- [ ] From any view, click coral "Export Report" button in top bar → wizard opens

**Report Requests:**
- [ ] Go to Report Requests
- [ ] Click "Generate & Send" on any row → wizard opens

- [ ] **Step 3: No "Phase 2" placeholders remain**

Search for remaining placeholder calls:

```bash
grep -r "Phase 2" "E:/Dawer DashBorad/AdminDashboardForRecycling/src" --include="*.tsx" --include="*.ts"
```

Expected: zero results (or only comments that are informational, not button labels/toasts).

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: Phase 3 complete — real PDF export, share links, report request fulfillment"
```

---

## What This Plan Does NOT Include

Intentionally out of scope to keep this plan independently shippable:

- **Server-side PDF generation** (no backend exists yet)
- **Email delivery of reports** (requires SMTP integration)
- **PDF for all 6 templates** — only WeeklyOps, CO₂ Certificate, and Area Audit are wired. The other 3 templates (`HubEfficiencyReport`, `DistrictIntelligenceReport`, `MaterialMarketPulseReport`, `ExpansionOpportunityReport`) reuse the same pattern — copy `WeeklyOpsPdf.tsx` and adapt the props.
- **Scheduled report emails** — the `schedule` skill can add this as a standalone feature
- **Share link server-side rendering** — the hash-encoded link opens the reports screen; a true read-only public page requires a backend route

---

## Dependency Order

```
Task 1 (install library)
  └─▶ Task 2 (ExportConfig type)
       └─▶ Task 3 (pdfExport utility)
            ├─▶ Task 4 (shareLink utility)
            └─▶ Tasks 5–7 (PDF templates)
                 └─▶ Task 8 (ExportWizardDrawer)
                      ├─▶ Task 9 (wire ReportPreviewPanel)
                      ├─▶ Task 10 (wire TopBar)
                      ├─▶ Task 11 (wire CO₂ Certificate)
                      ├─▶ Task 12 (wire DistrictReportCard)
                      └─▶ Task 13 (wire ReportRequestsView)
                           └─▶ Task 14 (QA checklist)
```

Never start a task before all its upstream tasks are committed. `npm run build` between tasks is a hard gate.

---

*Plan authored: 2026-06-29 · Dawer Operations Dashboard · Phase 3 — Export & Documents*
