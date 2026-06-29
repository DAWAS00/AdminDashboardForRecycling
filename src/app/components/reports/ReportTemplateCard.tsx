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
  executive:  { text: "Executive", color: "var(--color-amber-600)", bg: "var(--color-amber-50)" },
  client:     { text: "Client",    color: "var(--color-oil)",       bg: "var(--color-oil-bg)"   },
};

/** Compact sidebar row — icon left, title + subtitle stacked, audience pill right. */
export function ReportTemplateCard({ template, selected, onClick }: ReportTemplateCardProps) {
  const Icon = template.icon;
  const badge = AUDIENCE_LABEL[template.audience];

  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className="w-full text-left transition-colors focus-ring"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-3)",
        padding: "var(--space-3)",
        borderRadius: "var(--radius-md)",
        border: "none",
        background: selected ? "var(--color-brand-50)" : "transparent",
        boxShadow: selected ? "inset 2px 0 0 var(--color-brand-600)" : "none",
        cursor: "pointer",
        marginBottom: 2,
      }}
    >
      {/* Icon tile — Lucide icons inherit color via currentColor */}
      <div
        className="flex-shrink-0"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--radius-md)",
          background: selected ? "var(--color-brand-100)" : "var(--color-surface)",
          color: selected ? "var(--color-brand-600)" : "var(--color-text-secondary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={16} />
      </div>

      {/* Title + subtitle */}
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 13,
            fontWeight: selected ? 600 : 500,
            color: selected ? "var(--color-brand-600)" : "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {template.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginTop: 1,
          }}
        >
          {template.subtitle}
        </div>
      </div>

      {/* Audience pill */}
      <span
        className="flex-shrink-0"
        style={{
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          padding: "2px 6px",
          borderRadius: "var(--radius-full)",
          color: badge.color,
          background: badge.bg,
        }}
      >
        {badge.text}
      </span>
    </button>
  );
}
