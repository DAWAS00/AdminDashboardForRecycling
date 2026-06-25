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
      style={{ background: "#FFFBEB", borderColor: "#FCD34D" }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={13} style={{ color: "#C8860A" }} />
        <span
          style={{
            fontSize: 12, fontWeight: 600, color: "#92400E",
            fontFamily: "'DM Sans',sans-serif",
          }}
        >
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
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all hover:shadow-sm"
              style={{ background: "white", borderColor: "#E2E8F0" }}
            >
              <span
                style={{
                  fontSize: 11, fontWeight: 600, color: "#1a1a1a",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                {c.name}
              </span>
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{
                  background: isCritical ? "#FEE2E2" : "#FEF3C7",
                  color:      isCritical ? "#DC2626" : "#92400E",
                  fontFamily: "'DM Mono',monospace",
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
