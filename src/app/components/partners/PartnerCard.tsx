import {
  AlertTriangle, Leaf, Lock, Utensils, Hotel, Building2, ShoppingBag, Hospital, Package,
} from "lucide-react";
import { Client, ClientType } from "../../types";
import { TIER_CONFIG } from "../../constants";
import { computePartnerHealth, getEffectivePriceJD, isChurnRisk } from "../../helpers";

const CLIENT_TYPE: Record<ClientType, { label: string; Icon: React.ComponentType<{ size: number }> }> = {
  restaurant: { label: "Restaurant", Icon: Utensils    },
  hotel:      { label: "Hotel",      Icon: Hotel       },
  office:     { label: "Office",     Icon: Building2   },
  retail:     { label: "Retail",     Icon: ShoppingBag },
  hospital:   { label: "Hospital",   Icon: Hospital    },
  other:      { label: "Other",      Icon: Package     },
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
  const typeCfg = CLIENT_TYPE[client.type];

  const TODAY         = new Date("2026-06-24");
  const renewal       = new Date(client.renewalDate);
  const daysToRenewal = Math.floor((renewal.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  const renewalLabel  =
    daysToRenewal < 0 ? `${Math.abs(daysToRenewal)}d overdue`
    : daysToRenewal === 0 ? "Renews today"
    : `Renews in ${daysToRenewal}d`;

  const healthColor = health >= 70 ? "var(--color-brand-600)" : health >= 50 ? "var(--color-amber-600)" : "var(--color-danger-600)";
  const healthBg    = health >= 70 ? "var(--color-brand-100)" : health >= 50 ? "var(--color-amber-100)" : "var(--color-danger-100)";

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl border p-4 transition-all hover:shadow-md focus-ring"
      style={{
        background:  "var(--color-surface-card)",
        borderColor: atRisk ? "var(--color-amber-400)" : "var(--color-border)",
        boxShadow:   "var(--shadow-xs)",
      }}
    >
      {/* Header: type + tier badges, lock indicator */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{
              background: "var(--color-neutral-100)",
              color: "var(--color-text-secondary)",
              fontSize: 10,
            }}
          >
            <typeCfg.Icon size={10} />
            {typeCfg.label}
          </span>
          <span
            className="px-2 py-0.5 rounded-full font-bold"
            style={{
              background: tierCfg.bg,
              color: tierCfg.color,
              fontSize: 10,
            }}
          >
            {tierCfg.label}
          </span>
        </div>
        {client.customPriceJD !== undefined && (
          <Lock size={11} style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }} />
        )}
      </div>

      {/* Name + address */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--color-text-primary)",
          lineHeight: 1.3,
        }}
      >
        {client.name}
      </div>
      <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
        {client.address}
      </div>

      {/* Divider */}
      <div className="my-3 h-px" style={{ background: "var(--color-neutral-100)" }} />

      {/* Health bar + MRR */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="font-bold px-1.5 py-0.5 rounded"
            style={{
              background: healthBg,
              color: healthColor,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
            }}
          >
            {health}%
          </span>
          <div
            className="rounded-full overflow-hidden"
            style={{ width: 80, height: 6, background: "var(--color-neutral-100)" }}
          >
            <div className="h-full rounded-full" style={{ width: `${health}%`, background: healthColor }} />
          </div>
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {mrr > 0 ? `${mrr} JD/mo` : "Free"}
        </span>
      </div>

      {/* Orders + points + renewal */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1" style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
            <Package size={10} />
            {client.orders.length} order{client.orders.length !== 1 ? "s" : ""}
          </span>
          <span
            className="inline-flex items-center gap-1"
            style={{ fontSize: 11, color: "var(--color-brand-600)" }}
          >
            <Leaf size={10} /> {client.greenPoints.toLocaleString()} pts
          </span>
        </div>
        <div className="flex items-center gap-1">
          {atRisk && <AlertTriangle size={10} style={{ color: "var(--color-amber-600)" }} />}
          <span
            style={{
              fontSize: 10,
              color: atRisk ? "var(--color-amber-600)" : "var(--color-text-tertiary)",
            }}
          >
            {renewalLabel}
          </span>
        </div>
      </div>
    </button>
  );
}
