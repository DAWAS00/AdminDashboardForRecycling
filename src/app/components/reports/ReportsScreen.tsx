import { useState } from "react";
import type { ReportType } from "../../types";
import { REPORT_TEMPLATES, PANEL_WIDTH } from "../../constants";
import { ReportTemplateCard } from "./ReportTemplateCard";
import { ReportPreviewPanel } from "./ReportPreviewPanel";
import { WeeklyOperationsReport }     from "./reports/WeeklyOperationsReport";
import { HubEfficiencyReport }        from "./reports/HubEfficiencyReport";
import { DistrictIntelligenceReport } from "./reports/DistrictIntelligenceReport";
import { MaterialMarketPulseReport }  from "./reports/MaterialMarketPulseReport";
import { ExpansionOpportunityReport } from "./reports/ExpansionOpportunityReport";
import { Co2CertificateReport }       from "./reports/Co2CertificateReport";

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
      {/* Gallery */}
      <div
        className="flex-1 min-w-0 overflow-y-auto"
        style={{ padding: "var(--space-5)" }}
      >
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
            B2B Reports
          </h1>
          <p style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            Select a template to preview and export
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          {REPORT_TEMPLATES.map(t => (
            <ReportTemplateCard
              key={t.id}
              template={t}
              selected={selected === t.id}
              onClick={() => setSelected(t.id)}
            />
          ))}
        </div>
      </div>

      {/* Preview panel */}
      <div
        style={{
          width: PANEL_WIDTH,
          flexShrink: 0,
          borderLeft: "1px solid var(--color-border)",
          background: "var(--color-surface-card)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ReportPreviewPanel reportId={selected} />
      </div>
    </div>
  );
}
