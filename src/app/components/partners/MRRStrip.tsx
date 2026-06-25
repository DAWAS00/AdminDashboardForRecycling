import { DollarSign, Users, Heart, AlertTriangle } from "lucide-react";
import { Client } from "../../types";
import { computePartnerHealth, computePartnerMRR, isChurnRisk } from "../../helpers";

interface MRRStripProps {
  clients: Client[];
}

export function MRRStrip({ clients }: MRRStripProps) {
  const mrr        = computePartnerMRR(clients);
  const paidCount  = clients.filter(c => c.contractTier !== "free").length;
  const totalCount = clients.length;
  const avgHealth  = totalCount
    ? Math.round(clients.reduce((s, c) => s + computePartnerHealth(c), 0) / totalCount)
    : 0;
  const churnCount = clients.filter(isChurnRisk).length;

  const healthColor = avgHealth >= 70 ? "#1E5C35" : avgHealth >= 50 ? "#C8860A" : "#DC2626";
  const churnColor  = churnCount > 0  ? "#DC2626" : "#1E5C35";

  const tiles = [
    {
      Icon: DollarSign,
      label: "Monthly MRR",
      value: `${mrr.toFixed(0)} JD`,
      sub: `${paidCount} paid partner${paidCount !== 1 ? "s" : ""}`,
      color: "#1E5C35",
    },
    {
      Icon: Users,
      label: "Total Partners",
      value: String(totalCount),
      sub: `${totalCount - paidCount} on free tier`,
      color: "#1E40AF",
    },
    {
      Icon: Heart,
      label: "Avg Health",
      value: `${avgHealth}%`,
      sub: avgHealth >= 70 ? "Fleet healthy" : "Review needed",
      color: healthColor,
    },
    {
      Icon: AlertTriangle,
      label: "Churn Risk",
      value: String(churnCount),
      sub: churnCount > 0 ? "Need attention" : "All clear",
      color: churnColor,
    },
  ] as const;

  return (
    <div
      className="flex gap-3 px-4 py-3 border-b flex-shrink-0"
      style={{ background: "white", borderColor: "#E2E8F0" }}
    >
      {tiles.map(({ Icon, label, value, sub, color }) => (
        <div
          key={label}
          className="flex items-center gap-3 flex-1 px-3 py-2 rounded-xl"
          style={{ background: "#F8FAFC" }}
        >
          <div
            className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: `${color}18` }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 10, color: "#94A3B8",
                fontFamily: "'DM Sans',sans-serif",
                letterSpacing: "0.04em", textTransform: "uppercase",
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 18, fontWeight: 700, color: "#1a1a1a",
                fontFamily: "'DM Mono',monospace", lineHeight: 1.2,
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
              {sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
