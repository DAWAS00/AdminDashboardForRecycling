import type { ReportType } from "../../types";

interface ReportTemplateCardProps {
  template: {
    id: ReportType;
    title: string;
    subtitle: string;
    audience: "internal" | "client" | "executive";
    icon: React.ComponentType<{ size: number }>;
  };
  selected: boolean;
  onClick: () => void;
}

const AUDIENCE_LABEL = {
  internal:   { text: "Internal",  color: "var(--color-brand-600)", bg: "var(--color-brand-50)"  },
  executive:  { text: "Executive", color: "var(--color-amber-600)",  bg: "var(--color-amber-50)" },
  client:     { text: "Client",    color: "var(--color-oil)",       bg: "var(--color-oil-bg)"   },
};

export function ReportTemplateCard({ template, selected, onClick }: ReportTemplateCardProps) {
  const Icon = template.icon;
  const badge = AUDIENCE_LABEL[template.audience];

  return (
    <button
      onClick={onClick}
      className="text-left transition-all"
      style={{
        padding: "var(--space-4)",
        borderRadius: "var(--radius-lg)",
        border: `1px solid ${selected ? "var(--color-brand-600)" : "var(--color-border)"}`,
        background: selected ? "var(--color-brand-50)" : "var(--color-surface-card)",
        boxShadow: selected ? "var(--shadow-sm)" : "none",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
        <div
          style={{
            width: 36, height: 36,
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-50)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon size={18} color="var(--color-brand-600)" />
        </div>
        <span
          style={{
            fontSize: 9, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.06em",
            padding: "2px 6px",
            borderRadius: "var(--radius-full)",
            color: badge.color,
            background: badge.bg,
          }}
        >
          {badge.text}
        </span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 4 }}>
        {template.title}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.35 }}>
        {template.subtitle}
      </div>
    </button>
  );
}
