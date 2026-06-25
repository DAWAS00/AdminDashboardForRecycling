import { useState } from "react";
import { Printer, Download, Share2 } from "lucide-react";
import type { ReportType } from "../../types";
import { REPORT_TEMPLATES } from "../../constants";
import { WeeklyOperationsReport }     from "./reports/WeeklyOperationsReport";
import { HubEfficiencyReport }        from "./reports/HubEfficiencyReport";
import { DistrictIntelligenceReport } from "./reports/DistrictIntelligenceReport";
import { MaterialMarketPulseReport }  from "./reports/MaterialMarketPulseReport";
import { ExpansionOpportunityReport } from "./reports/ExpansionOpportunityReport";
import { Co2CertificateReport }       from "./reports/Co2CertificateReport";

interface ReportPreviewPanelProps {
  reportId: ReportType;
}

const REPORT_COMPONENTS: Record<ReportType, React.ComponentType> = {
  "weekly-operations":     WeeklyOperationsReport,
  "hub-efficiency":        HubEfficiencyReport,
  "district-intelligence": DistrictIntelligenceReport,
  "material-pulse":        MaterialMarketPulseReport,
  "expansion-opportunity": ExpansionOpportunityReport,
  "co2-certificate":       Co2CertificateReport,
};

export function ReportPreviewPanel({ reportId }: ReportPreviewPanelProps) {
  const meta = REPORT_TEMPLATES.find(t => t.id === reportId)!;
  const Report = REPORT_COMPONENTS[reportId];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div
        style={{
          padding: "var(--space-3) var(--space-4)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
          {meta.title}
        </div>
        <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 10 }}>
          {meta.subtitle}
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <ToolbarButton icon={Printer}  label="Print" onClick={() => window.print()} />
          <ToolbarButton icon={Download} label="PDF"   onClick={() => alert("PDF export coming in Phase 2")} />
          <ToolbarButton icon={Share2}   label="Share" onClick={() => alert("Share link copied (Phase 2)")} />
        </div>
      </div>

      {/* Preview */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: "auto" }}>
        <Report />
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, onClick }: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        padding: "5px 0",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        background: "var(--color-surface-card)",
        cursor: "pointer",
        fontSize: 10, fontWeight: 600,
        color: "var(--color-text-secondary)",
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
