import { AlertTriangle } from "lucide-react";
import { Client } from "../../types";
import { computePartnerHealth, isChurnRisk } from "../../helpers";

interface ChurnAlertPanelProps {
  clients: Client[];
  onSelectClient: (clientId: string) => void;
}

export function ChurnAlertPanel({ clients, onSelectClient }: ChurnAlertPanelProps) {
  const atRisk = clients.filter(isChurnRisk);
  if (atRisk.length === 0) return null;

  return (
    <div
      className="mx-4 mt-3 rounded-xl border p-3 flex-shrink-0"
      style={{
        background: "var(--color-amber-50)",
        borderColor: "var(--color-amber-400)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={13} style={{ color: "var(--color-amber-600)" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-amber-700)" }}>
          {atRisk.length} partner{atRisk.length > 1 ? "s" : ""} need attention
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {atRisk.map(c => {
          const health     = computePartnerHealth(c);
          const isCritical = health < 40;
          return (
            <button
              key={c.id}
              onClick={() => onSelectClient(c.id)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all hover:shadow-sm focus-ring"
              style={{
                background: "var(--color-surface-card)",
                borderColor: "var(--color-border)",
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-primary)" }}>
                {c.name}
              </span>
              <span
                className="px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: isCritical ? "var(--color-danger-100)" : "var(--color-amber-100)",
                  color:      isCritical ? "var(--color-danger-600)" : "var(--color-amber-700)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                }}
              >
                {health}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
