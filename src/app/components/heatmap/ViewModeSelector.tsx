import { Map, Activity, Warehouse } from "lucide-react";
import type { HeatMapViewMode } from "../../types";

const MODES: { id: HeatMapViewMode; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
  { id: "overview", label: "Overview",  Icon: Map       },
  { id: "demand",   label: "Demand",    Icon: Activity  },
  { id: "hubs",     label: "Hubs",      Icon: Warehouse },
];

interface ViewModeSelectorProps {
  value: HeatMapViewMode;
  onChange: (mode: HeatMapViewMode) => void;
}

export function ViewModeSelector({ value, onChange }: ViewModeSelectorProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        padding: "8px 16px",
        background: "var(--color-surface-card)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {MODES.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-pressed={active}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              padding: "6px 0",
              borderRadius: "var(--radius-sm)",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              background: active ? "var(--color-brand-600)" : "transparent",
              color: active ? "white" : "var(--color-text-secondary)",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
