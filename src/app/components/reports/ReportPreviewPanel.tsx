import { Printer, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
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

const AUDIENCE_BADGE: Record<string, { text: string; color: string; bg: string }> = {
  internal:   { text: "Internal",  color: "var(--color-brand-600)", bg: "var(--color-brand-50)"  },
  executive:  { text: "Executive", color: "var(--color-amber-600)", bg: "var(--color-amber-50)" },
  client:     { text: "Client",    color: "var(--color-oil)",       bg: "var(--color-oil-bg)"   },
};

export function ReportPreviewPanel({ reportId }: ReportPreviewPanelProps) {
  const meta = REPORT_TEMPLATES.find(t => t.id === reportId)!;
  const Report = REPORT_COMPONENTS[reportId];
  const audience = AUDIENCE_BADGE[meta.audience];

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full"
      style={{ background: "var(--color-surface-card)" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-4 flex-shrink-0"
        style={{
          padding: "var(--space-4) var(--space-5)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                padding: "2px 6px",
                borderRadius: "var(--radius-full)",
                color: audience.color,
                background: audience.bg,
              }}
            >
              {audience.text}
            </span>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {meta.title}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
            {meta.subtitle}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <ToolbarButton
            icon={Printer}
            label="Print"
            onClick={() => window.print()}
          />
          <ToolbarButton
            icon={Download}
            label="PDF"
            variant="primary"
            onClick={() => toast("PDF export coming in Phase 2", { description: meta.title })}
          />
          <ToolbarButton
            icon={Share2}
            label="Share"
            onClick={() => toast.success("Share link copied (Phase 2)", { description: meta.title })}
          />
        </div>
      </div>

      {/* Preview — full width, scrollable */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          padding: "var(--space-5)",
          background: "var(--color-surface)",
        }}
      >
        {/* Centered sheet so reports don't stretch absurdly wide on huge screens,
            while still using far more width than the old 288px panel. */}
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <Report />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
}: {
  icon: React.ComponentType<{ size: number }>;
  label: string;
  onClick: () => void;
  variant?: "ghost" | "primary";
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center gap-1.5 focus-ring transition-colors"
      style={{
        padding: "7px 14px",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${isPrimary ? "var(--color-brand-600)" : "var(--color-border)"}`,
        background: isPrimary ? "var(--color-brand-600)" : "var(--color-surface-card)",
        color: isPrimary ? "white" : "var(--color-text-secondary)",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
