# Dawer Dashboard — PDF Export Implementation Plan

> **Goal:** Implement a high-fidelity PDF export feature for recycling dashboard reports and certificates. This enables administrators to automatically generate client-branded PDF reports in the browser (handling custom Tailwind v4 themes, Recharts graphs, and Arabic/RTL text), upload them to Supabase Storage, and update the request status automatically.

---

## Technical Architecture & Decision Matrix

Generating PDFs from React/TypeScript components with SVG charts and Arabic (cursive, RTL) text has notable platform constraints. Here is the evaluation of available methods:

1. **Option A: Client-side HTML-to-PDF (`html2pdf.js` / `html2canvas` + `jsPDF`)** — *Recommended*
   * **Why:** By rendering the target report offscreen in the browser DOM, the browser handles Arabic text shaping, bidirectional layouts (RTL), and SVG charts perfectly. `html2canvas` takes a high-res (2x Retina) snapshot, and `jsPDF` places it into a PDF file.
   * **Cons:** Text is not selectable, and the resulting file size is larger (~1–2 MB).
2. **Option B: Client-side component-driven (`@react-pdf/renderer` + `react-pdf-rtl`)**
   * **Why not:** Requires converting all CSS/Tailwind rules into react-pdf layout primitives and rendering Recharts charts to base64 images first. Arabic text requires manual character shaping utilities. Extremely high implementation cost.
3. **Option C: Server-side rendering (Puppeteer in Supabase Edge Functions)**
   * **Why not:** Added infrastructure and network latency, unnecessary cost and complexity for client-side administration workflows.
4. **Option D: Native Browser Printing (`window.print()` with custom print CSS)**
   * **Why:** Excellent secondary option. We will implement print CSS support so users can also print screens directly or save via browser print dialog.

---

## File map — what gets created or changed

| Action | File | Responsibility |
|---|---|---|
| **Create** | `src/features/report-requests/pdfGenerator.ts` | PDF configuration and Canvas-to-PDF generator using `html2pdf.js` |
| **Create** | `src/features/report-requests/OffscreenReportRenderer.tsx` | Offscreen mounting portal for rendering reports before capture |
| **Modify** | `src/features/report-requests/useReportRequests.ts` | Add mutation for automatic PDF generation and Supabase upload |
| **Modify** | `src/features/report-requests/ReportRequestRow.tsx` | Add "Generate & Upload" action, disable inputs, and display progress |
| **Modify** | `src/app/components/reports/ReportPreviewPanel.tsx` | Integrate PDF download button for active dashboard report previews |
| **Modify** | `src/app/components/reports/reports/Co2CertificateReport.tsx` | Support custom props (`clientId`, `hideControls`) to enable automated filtering |
| **Modify** | `src/app/components/reports/reports/WeeklyOperationsReport.tsx` | Accept optional date filters (`periodStart`, `periodEnd`) |

---

## Step-by-Step Implementation

### Step 1: Install Dependencies

We need `html2pdf.js` (or `html2pdf.js-fix` for modern ESM builds) and `@types/html2pdf.js` (or custom type declarations).

```bash
pnpm add html2pdf.js
```

Create a declaration file if type definitions are missing:
`src/imports/html2pdf.d.ts`
```typescript
declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type: string; quality: number };
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      onclone?: (doc: Document) => void;
    };
    jsPDF?: {
      unit?: string;
      format?: string | [number, number];
      orientation?: 'portrait' | 'landscape';
    };
    pagebreak?: {
      mode?: ('css' | 'legacy' | 'avoid-all')[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  interface Html2PdfInstance {
    set: (options: Html2PdfOptions) => Html2PdfInstance;
    from: (element: HTMLElement) => Html2PdfInstance;
    toContainer: () => Html2PdfInstance;
    toCanvas: () => Html2PdfInstance;
    toImg: () => Html2PdfInstance;
    toPdf: () => Html2PdfInstance;
    save: () => Promise<void>;
    output: (type: 'blob' | 'arraybuffer' | 'datauristring' | 'dataurlnewwindow') => Promise<any>;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement, options?: Html2PdfOptions): Promise<void>;

  export default html2pdf;
}
```

---

### Step 2: Implement the PDF Export Utility

Create the file `src/features/report-requests/pdfGenerator.ts`.
This utility configures high-DPI scaling, CSS custom variable rendering, and SVG scaling fixes (so Recharts charts do not get clipped).

```typescript
import html2pdf from "html2pdf.js";

export async function generatePdfBlob(element: HTMLElement, filename = "report.pdf"): Promise<Blob> {
  const options = {
    margin: [0.4, 0.4, 0.4, 0.4] as [number, number, number, number],
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2, // 2x DPI for Retina-sharp output
      useCORS: true,
      logging: false,
      onclone: (clonedDoc: Document) => {
        // Fix for Recharts SVG scaling in html2canvas
        const svgs = clonedDoc.querySelectorAll("svg");
        svgs.forEach((svg) => {
          try {
            const bBox = svg.getBBox();
            if (bBox.width > 0 && bBox.height > 0) {
              svg.setAttribute("width", String(bBox.width));
              svg.setAttribute("height", String(bBox.height));
            }
          } catch (e) {
            // fallback if getBBox is not available in test context
            if (!svg.getAttribute("width")) {
              svg.setAttribute("width", "100%");
            }
          }
        });
      },
    },
    jsPDF: { unit: "in", format: "letter", orientation: "portrait" as const },
    pagebreak: { mode: ["css", "legacy"] as ("css" | "legacy")[], avoid: [".page-break-avoid"] },
  };

  return html2pdf()
    .set(options)
    .from(element)
    .toPdf()
    .output("blob");
}
```

---

### Step 3: Implement Offscreen mounting portal

Create the file `src/features/report-requests/OffscreenReportRenderer.tsx`.
This component mounts report templates offscreen so they can be captured to canvas without visual glitches or disrupting the active user interface.

```tsx
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface OffscreenReportRendererProps {
  children: ReactNode;
}

export function OffscreenReportRenderer({ children }: OffscreenReportRendererProps) {
  // Mount off-screen (-9999px left) with fixed A4/Letter print width
  return createPortal(
    <div
      style={{
        position: "absolute",
        left: "-9999px",
        top: 0,
        width: "800px", // standard letter printable width
        background: "white",
        color: "#1a1a1a",
        padding: "24px",
      }}
    >
      <div className="print-container">
        {children}
      </div>
    </div>,
    document.body
  );
}
```

---

### Step 4: Refactor Report Templates to Accept Props

To support generating a report for a specific user and date range, we must refactor our report components in `src/app/components/reports/reports/`.

#### Example: Refactoring `Co2CertificateReport.tsx`
* Accept `clientId` and `hideControls` props.
* Bypass `useClients()` dynamic select menu when generating automatically.

```tsx
// src/app/components/reports/reports/Co2CertificateReport.tsx
interface Co2CertificateReportProps {
  clientId?: string;
  hideControls?: boolean;
}

export function Co2CertificateReport({ clientId, hideControls = false }: Co2CertificateReportProps) {
  const { data: clients = [] } = useClients();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const activeId = clientId ?? selectedId ?? clients[0]?.id ?? "";
  const client = clients.find(c => c.id === activeId) ?? clients[0];
  
  if (!client) return <div>No partners loaded.</div>;
  const equiv = co2Equivalents(client.totalCo2Saved);

  return (
    <div>
      {/* Conditionally hide controls during PDF generation */}
      {!hideControls && (
        <div className="controls">
           {/* dropdown selector here */}
        </div>
      )}
      
      {/* Certificate Card layout */}
      <div className="cert-card page-break-avoid">
        {/* Arabic Name Cairo script, RTL */}
        <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 20 }}>{client.name}</h2>
        {client.nameAr && (
          <h2 style={{ fontFamily: "var(--font-ar)", direction: "rtl" }}>{client.nameAr}</h2>
        )}
        
        {/* Certificate metadata */}
        <div>CO₂ Prevented: {client.totalCo2Saved.toFixed(1)} kg</div>
      </div>
    </div>
  );
}
```

---

### Step 5: Implement Automated PDF Generation & Storage Mutation

Update `src/features/report-requests/useReportRequests.ts`.
Add a React Query mutation to:
1. Query client metrics/orders.
2. Mount the offscreen component.
3. Call `generatePdfBlob`.
4. Upload PDF to Supabase Storage bucket (`reports`).
5. Update `report_requests` table with URL and transition status to `ready`.

```typescript
// useReportRequests.ts snippet
const generateAndUploadPdf = useMutation({
  mutationFn: async (request: ReportRequest) => {
    // 1. Fetch relevant report data dynamically (e.g. Profile + Orders)
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_id", request.userId)
      .single();

    // 2. Render report template into offscreen mount
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    document.body.appendChild(container);

    // Dynamic import to avoid bundle pollution
    const { createRoot } = await import("react-dom/client");
    const { Co2CertificateReport } = await import("../../app/components/reports/reports/Co2CertificateReport");
    // (Load other report components dynamically based on request.template)

    const root = createRoot(container);
    root.render(
      <Co2CertificateReport clientId={request.userId} hideControls={true} />
    );

    // Wait short duration for rendering, charts layout, and fonts loading
    await new Promise((r) => setTimeout(r, 800));

    // 3. Generate PDF Blob
    const filename = `${request.template}-${request.id}.pdf`;
    const blob = await generatePdfBlob(container, filename);

    // Clean up offscreen DOM
    root.unmount();
    container.remove();

    // 4. Upload to Supabase Storage
    const filePath = `reports/${request.userId}/${filename}`;
    const { error: uploadError } = await supabase.storage
      .from("reports")
      .upload(filePath, blob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("reports")
      .getPublicUrl(filePath);

    // 5. Update Status in DB
    const { error: dbError } = await supabase
      .from("report_requests")
      .update({
        status: "ready",
        download_url: publicUrl,
        fulfilled_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (dbError) throw dbError;
    return publicUrl;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    toast.success("PDF report generated and uploaded successfully.");
  },
  onError: (err) => {
    toast.error(`Generation failed: ${err.message}`);
  }
});
```

---

### Step 6: Update Admin UI

In `ReportRequestRow.tsx`:
Replace the manual input field and "Mark Ready" button with an automated generation action:

```tsx
// ReportRequestRow.tsx snippet
{request.status === "processing" && (
  <button
    onClick={() => generateAndUploadPdf.mutate(request)}
    disabled={generateAndUploadPdf.isPending}
    className="btn-primary"
  >
    {generateAndUploadPdf.isPending ? "Generating PDF..." : "Generate & Upload PDF"}
  </button>
)}
```

---

## Verification & Testing Guide

### Print Layout Customization
To support manual print/save operations directly, add media print directives to `src/styles/globals.css`:
```css
@media print {
  body {
    background: white;
    color: black;
  }
  /* Hide sidebar, headers, navigation widgets, and control panels */
  .sidebar, .navbar, .controls, button {
    display: none !important;
  }
  .print-container {
    width: 100%;
    margin: 0;
    padding: 0;
    box-shadow: none;
    border: none;
  }
  .page-break-avoid {
    page-break-inside: avoid;
    break-inside: avoid;
  }
}
```

### Verification Checklist
1. **Type Safety:** Run `npm run typecheck` and verify no TypeScript compiler errors.
2. **Bundle Verification:** Run `npm run build` and ensure the output sizes are reasonable.
3. **Dynamic Render:** Request a PDF export. Verify that the correct client name and data coordinates are pulled dynamically from Supabase database tables.
4. **Visual Quality:** Verify downloaded PDF charts. Ensure SVGs are scaled nicely and Arabic text is readable without disconnected letters or reverse letter sorting.
