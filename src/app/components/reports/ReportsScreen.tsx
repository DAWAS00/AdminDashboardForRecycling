import { useState } from "react";
import type { ReportType } from "../../types";
import { REPORT_TEMPLATES } from "../../constants";
import { ReportTemplateCard } from "./ReportTemplateCard";
import { ReportPreviewPanel } from "./ReportPreviewPanel";

/** Sidebar width — compact template gallery lives here. */
const GALLERY_WIDTH = 296;

export function ReportsScreen() {
  const [selected, setSelected] = useState<ReportType>("weekly-operations");

  return (
    <div
      className="flex h-full"
      style={{
        background: "var(--color-surface)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Gallery — compact vertical sidebar */}
      <aside
        className="flex flex-col min-h-0 border-r"
        style={{
          width: GALLERY_WIDTH,
          flexShrink: 0,
          background: "var(--color-surface-card)",
          borderColor: "var(--color-border)",
        }}
      >
        <div
          className="flex-shrink-0"
          style={{
            padding: "var(--space-4) var(--space-4) var(--space-3)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 2,
            }}
          >
            B2B Reports
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            {REPORT_TEMPLATES.length} templates
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto scrollbar-hide"
          style={{ padding: "var(--space-2)" }}
        >
          {REPORT_TEMPLATES.map((t) => (
            <ReportTemplateCard
              key={t.id}
              template={t}
              selected={selected === t.id}
              onClick={() => setSelected(t.id)}
            />
          ))}
        </div>
      </aside>

      {/* Preview — gets the full remaining width */}
      <div className="flex-1 min-w-0 flex">
        <ReportPreviewPanel reportId={selected} />
      </div>
    </div>
  );
}
