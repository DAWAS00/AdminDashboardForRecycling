import { AlertTriangle, Leaf, Lock } from "lucide-react";
import { Client, ClientType } from "../../types";
import { TIER_CONFIG } from "../../constants";
import { computePartnerHealth, getEffectivePriceJD, isChurnRisk } from "../../helpers";

const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  restaurant: "🍽 Restaurant",
  hotel:      "🏨 Hotel",
  office:     "🏢 Office",
  retail:     "🛍 Retail",
  hospital:   "🏥 Hospital",
  other:      "📦 Other",
};

interface PartnerCardProps {
  client: Client;
  onClick: () => void;
}

export function PartnerCard({ client, onClick }: PartnerCardProps) {
  const health  = computePartnerHealth(client);
  const mrr     = getEffectivePriceJD(client);
  const atRisk  = isChurnRisk(client);
  const tierCfg = TIER_CONFIG[client.contractTier];

  const TODAY         = new Date("2026-06-24");
  const renewal       = new Date(client.renewalDate);
  const daysToRenewal = Math.floor((renewal.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  const renewalLabel  =
    daysToRenewal < 0 ? `${Math.abs(daysToRenewal)}d overdue`
    : daysToRenewal === 0 ? "Renews today"
    : `Renews in ${daysToRenewal}d`;

  const healthColor = health >= 70 ? "#1E5C35" : health >= 50 ? "#C8860A" : "#DC2626";
  const healthBg    = health >= 70 ? "#D1FAE5" : health >= 50 ? "#FEF3C7" : "#FEE2E2";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border p-4 transition-all hover:shadow-md"
      style={{
        background:  "white",
        borderColor: atRisk ? "#FCD34D" : "#E2E8F0",
        boxShadow:   "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header: badges + lock */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: "#F1F5F9", color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}
          >
            {CLIENT_TYPE_LABELS[client.type]}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: tierCfg.bg, color: tierCfg.color, fontFamily: "'DM Sans',sans-serif" }}
          >
            {tierCfg.label}
          </span>
        </div>
        {client.customPriceJD !== undefined && (
          <Lock size={11} style={{ color: "#94A3B8", flexShrink: 0 }} />
        )}
      </div>

      {/* Name + address */}
      <div
        style={{
          fontSize: 15, fontWeight: 700, color: "#1a1a1a",
          fontFamily: "'DM Sans',sans-serif", lineHeight: 1.3,
        }}
      >
        {client.name}
      </div>
      <div
        style={{
          fontSize: 11, color: "#94A3B8",
          fontFamily: "'DM Sans',sans-serif", marginTop: 2,
        }}
      >
        {client.address}
      </div>

      {/* Divider */}
      <div className="my-3 h-px" style={{ background: "#F1F5F9" }} />

      {/* Health bar + MRR */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: healthBg, color: healthColor, fontFamily: "'DM Mono',monospace" }}
          >
            {health}%
          </span>
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${health}%`, background: healthColor }}
            />
          </div>
        </div>
        <span
          style={{
            fontSize: 13, fontWeight: 700, color: "#1a1a1a",
            fontFamily: "'DM Mono',monospace",
          }}
        >
          {mrr > 0 ? `${mrr} JD/mo` : "Free"}
        </span>
      </div>

      {/* Orders + points + renewal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
            📦 {client.orders.length} order{client.orders.length !== 1 ? "s" : ""}
          </span>
          <span
            className="flex items-center gap-0.5"
            style={{ fontSize: 11, color: "#1E5C35", fontFamily: "'DM Sans',sans-serif" }}
          >
            <Leaf size={10} /> {client.greenPoints.toLocaleString()} pts
          </span>
        </div>
        <div className="flex items-center gap-1">
          {atRisk && <AlertTriangle size={10} style={{ color: "#C8860A" }} />}
          <span
            style={{
              fontSize: 10,
              color: atRisk ? "#C8860A" : "#94A3B8",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            {renewalLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
