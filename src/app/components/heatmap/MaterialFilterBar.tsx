import type { MaterialFilter } from "../../types";
import { MATERIAL_CONFIG } from "../../constants";

interface MaterialFilterBarProps {
  value: MaterialFilter;
  onChange: (f: MaterialFilter) => void;
}

const FILTERS: MaterialFilter[] = [
  "all",
  "Cooking Oil",
  "Plastic Bottles",
  "Paper & Cardboard",
  "Electronics",
];

export function MaterialFilterBar({ value, onChange }: MaterialFilterBarProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "8px 16px",
        overflowX: "auto",
        background: "var(--color-surface-card)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {FILTERS.map(f => {
        const active = value === f;
        const mc = f !== "all" ? MATERIAL_CONFIG[f as keyof typeof MATERIAL_CONFIG] : null;
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            aria-pressed={active}
            style={{
              padding: "3px 10px",
              borderRadius: "var(--radius-full)",
              border: "none",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 600,
              whiteSpace: "nowrap",
              background: active
                ? (mc ? mc.bg    : "var(--color-brand-100)")
                : "var(--color-surface)",
              color: active
                ? (mc ? mc.color : "var(--color-brand-600)")
                : "var(--color-text-tertiary)",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {f === "all" ? "All Materials" : f}
          </button>
        );
      })}
    </div>
  );
}
