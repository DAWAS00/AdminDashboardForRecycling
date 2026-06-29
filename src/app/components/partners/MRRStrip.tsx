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

  const healthColor = avgHealth >= 70 ? "var(--color-brand-600)" : avgHealth >= 50 ? "var(--color-amber-600)" : "var(--color-danger-600)";
  const churnColor  = churnCount > 0  ? "var(--color-danger-600)" : "var(--color-brand-600)";

  const tiles = [
    {
      Icon: DollarSign,
      label: "Monthly MRR",
      value: `${mrr.toFixed(0)} JD`,
      sub: `${paidCount} paid partner${paidCount !== 1 ? "s" : ""}`,
      color: "var(--color-brand-600)",
      iconBg: "var(--color-brand-50)",
    },
    {
      Icon: Users,
      label: "Total Partners",
      value: String(totalCount),
      sub: `${totalCount - paidCount} on free tier`,
      color: "var(--color-plastic)",
      iconBg: "var(--color-plastic-bg)",
    },
    {
      Icon: Heart,
      label: "Avg Health",
      value: `${avgHealth}%`,
      sub: avgHealth >= 70 ? "Fleet healthy" : "Review needed",
      color: healthColor,
      iconBg: avgHealth >= 70 ? "var(--color-brand-50)" : "var(--color-amber-50)",
    },
    {
      Icon: AlertTriangle,
      label: "Churn Risk",
      value: String(churnCount),
      sub: churnCount > 0 ? "Need attention" : "All clear",
      color: churnColor,
      iconBg: churnCount > 0 ? "var(--color-danger-100)" : "var(--color-brand-50)",
    },
  ] as const;

  return (
    <div
      className="flex gap-3 px-4 py-3 border-b flex-shrink-0"
      style={{ background: "var(--color-surface-card)", borderColor: "var(--color-border)" }}
    >
      {tiles.map(({ Icon, label, value, sub, color, iconBg }) => (
        <div
          key={label}
          className="flex items-center gap-3 flex-1 px-3 py-2 rounded-xl"
          style={{ background: "var(--color-surface)" }}
        >
          <div
            className="flex-shrink-0 flex items-center justify-center"
            style={{ width: 36, height: 36, borderRadius: "var(--radius-lg)", background: iconBg }}
          >
            <Icon size={16} style={{ color }} />
          </div>
          <div className="min-w-0">
            <div
              style={{
                fontSize: 10,
                color: "var(--color-text-tertiary)",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--color-text-primary)",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.2,
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
