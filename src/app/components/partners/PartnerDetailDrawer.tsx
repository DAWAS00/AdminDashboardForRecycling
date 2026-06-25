import { useState } from "react";
import { X, TrendingUp, Lock, Unlock, FileText, Leaf, Download } from "lucide-react";
import { Client, ContractTier } from "../../types";
import {
  TIER_CONFIG, TIER_PRICES_JD, TIER_ORDER, TIER_BENEFITS, CO2_EQUIVALENTS,
} from "../../constants";
import {
  computePartnerHealth, computeTierProgress, getEffectivePriceJD, isChurnRisk,
} from "../../helpers";

type DrawerTab = "overview" | "pricing" | "orders" | "impact";

interface PartnerDetailDrawerProps {
  client: Client;
  onClose: () => void;
  onUpdate: (updated: Client) => void;
}

export function PartnerDetailDrawer({ client, onClose, onUpdate }: PartnerDetailDrawerProps) {
  const [activeTab,    setActiveTab]    = useState<DrawerTab>("overview");
  const [editPrice,    setEditPrice]    = useState(
    client.customPriceJD !== undefined
  );
  const [draftPrice,   setDraftPrice]   = useState(
    client.customPriceJD !== undefined ? String(client.customPriceJD) : ""
  );
  const [draftNotes,   setDraftNotes]   = useState(client.contractNotes ?? "");
  const [draftBilling, setDraftBilling] = useState<"monthly" | "annual">(client.billingCycle);
  const [draftTier,    setDraftTier]    = useState<ContractTier>(client.contractTier);

  const health    = computePartnerHealth(client);
  const progress  = computeTierProgress(client);
  const tierCfg   = TIER_CONFIG[client.contractTier];
  const atRisk    = isChurnRisk(client);
  const clientCo2 = client.orders.reduce((s, o) => s + o.co2Saved, 0);
  const trees     = Math.floor(clientCo2 / CO2_EQUIVALENTS.treeYear);
  const carKm     = Math.floor(clientCo2 / CO2_EQUIVALENTS.carKmPetrol);
  const charges   = Math.floor(clientCo2 / CO2_EQUIVALENTS.smartphoneCharge);

  const healthColor = health >= 70 ? "#1E5C35" : health >= 50 ? "#C8860A" : "#DC2626";

  function handleSavePricing() {
    const parsed = parseFloat(draftPrice);
    onUpdate({
      ...client,
      contractTier:  draftTier,
      billingCycle:  draftBilling,
      customPriceJD: editPrice && !isNaN(parsed) ? parsed : undefined,
      contractNotes: draftNotes.trim() || undefined,
    });
  }

  const TABS: { id: DrawerTab; label: string; Icon: React.ComponentType<{ size: number }> }[] = [
    { id: "overview", label: "Overview", Icon: TrendingUp },
    { id: "pricing",  label: "Pricing",  Icon: Lock       },
    { id: "orders",   label: "Orders",   Icon: FileText   },
    { id: "impact",   label: "Impact",   Icon: Leaf       },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.18)" }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full z-50 flex flex-col"
        style={{ width: 400, background: "white", boxShadow: "-6px 0 32px rgba(0,0,0,0.10)" }}
      >

        {/* ── Header ── */}
        <div
          className="flex items-start justify-between p-4 border-b flex-shrink-0"
          style={{ borderColor: "#E2E8F0" }}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: tierCfg.bg, color: tierCfg.color, fontFamily: "'DM Sans',sans-serif" }}
              >
                {tierCfg.label}
              </span>
              {atRisk && (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "#FEE2E2", color: "#DC2626", fontFamily: "'DM Sans',sans-serif" }}
                >
                  ⚠ At Risk
                </span>
              )}
              {client.customPriceJD !== undefined && (
                <span
                  className="text-[10px] flex items-center gap-0.5 px-2 py-0.5 rounded-full"
                  style={{ background: "#FEF3C7", color: "#92400E", fontFamily: "'DM Sans',sans-serif" }}
                >
                  <Lock size={9} /> Custom Price
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 16, fontWeight: 700, color: "#1a1a1a",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              {client.name}
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
              {client.address} · {client.phone}
            </div>
          </div>
          <button onClick={onClose} className="ml-3 p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0">
            <X size={16} style={{ color: "#64748B" }} />
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: "#E2E8F0" }}>
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors"
              style={{
                borderBottom: activeTab === id ? "2px solid #1E5C35" : "2px solid transparent",
                color: activeTab === id ? "#1E5C35" : "#94A3B8",
              }}
            >
              <Icon size={13} />
              <span
                style={{
                  fontSize: 10, fontFamily: "'DM Sans',sans-serif",
                  fontWeight: activeTab === id ? 600 : 400,
                }}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ──────────────────────────────── OVERVIEW ──── */}
          {activeTab === "overview" && (
            <>
              {/* Health score */}
              <div className="rounded-xl p-3 border" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                    Partner Health Score
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: healthColor, fontFamily: "'DM Mono',monospace" }}>
                    {health}/100
                  </span>
                </div>
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                  <div className="h-full rounded-full" style={{ width: `${health}%`, background: healthColor }} />
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6, fontFamily: "'DM Sans',sans-serif" }}>
                  {health >= 70
                    ? "Healthy relationship — keep it up"
                    : health >= 50
                    ? "Some signals need attention"
                    : "High churn risk — take action now"}
                </div>
              </div>

              {/* Tier progression (hidden when at enterprise) */}
              {progress.nextTier && (
                <div className="rounded-xl p-3 border" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                      Towards {TIER_CONFIG[progress.nextTier].label}
                    </span>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Mono',monospace" }}>
                      {progress.currentOrders}/{progress.nextTierThreshold} orders/30d
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "#E2E8F0" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${progress.pct}%`, background: TIER_CONFIG[progress.nextTier].color }}
                    />
                  </div>
                </div>
              )}

              {/* Green Points */}
              <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#D1FAE5" }}>
                  <Leaf size={18} style={{ color: "#1E5C35" }} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1E5C35", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                    {client.greenPoints.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: "#166534", fontFamily: "'DM Sans',sans-serif" }}>
                    Green Points earned
                  </div>
                </div>
                {client.referredBy && (
                  <div className="ml-auto text-right">
                    <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Referred by
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}>
                      {client.referredBy}
                    </div>
                  </div>
                )}
              </div>

              {/* Key metrics grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "CO₂ Saved",   value: `${client.totalCo2Saved.toFixed(1)} kg`, color: "#1E5C35" },
                  { label: "Revenue",      value: `${client.totalEarnings.toFixed(2)} JD`, color: "#1E40AF" },
                  { label: "Orders",       value: String(client.orders.length),             color: "#64748B" },
                  { label: "Member Since", value: new Date(client.joinedDate).toLocaleDateString("en-JO", { month: "short", year: "numeric" }), color: "#64748B" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg p-2.5" style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: "'DM Mono',monospace", marginTop: 1 }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tier benefits list */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif", marginBottom: 6 }}>
                  {tierCfg.label} Benefits
                </div>
                <ul className="space-y-1">
                  {TIER_BENEFITS[client.contractTier].map(b => (
                    <li key={b} className="flex items-center gap-2" style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                      <span style={{ color: "#1E5C35" }}>✓</span> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* ──────────────────────────────── PRICING ──── */}
          {activeTab === "pricing" && (
            <>
              {/* Effective price */}
              <div className="rounded-xl p-4" style={{ background: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                <div style={{ fontSize: 10, color: "#166534", fontFamily: "'DM Sans',sans-serif", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Effective Monthly Price
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span style={{ fontSize: 30, fontWeight: 800, color: "#1E5C35", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                    {getEffectivePriceJD(client) > 0 ? getEffectivePriceJD(client) : "0"}
                  </span>
                  <span style={{ fontSize: 14, color: "#166534", fontFamily: "'DM Sans',sans-serif" }}>JD / month</span>
                </div>
                {client.customPriceJD !== undefined && (
                  <div className="flex items-center gap-1 mt-1">
                    <Lock size={9} style={{ color: "#C8860A" }} />
                    <span style={{ fontSize: 10, color: "#92400E", fontFamily: "'DM Sans',sans-serif" }}>
                      Custom negotiated — overrides standard {TIER_PRICES_JD[client.contractTier].monthly} JD/mo
                    </span>
                  </div>
                )}
              </div>

              {/* Tier selector */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                  Contract Tier
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TIER_ORDER.map(tier => {
                    const cfg   = TIER_CONFIG[tier];
                    const price = TIER_PRICES_JD[tier];
                    const sel   = draftTier === tier;
                    return (
                      <button
                        key={tier}
                        onClick={() => setDraftTier(tier)}
                        className="rounded-xl p-2.5 text-left border-2 transition-all"
                        style={{ borderColor: sel ? cfg.color : "#E2E8F0", background: sel ? cfg.bg : "white" }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color, fontFamily: "'DM Sans',sans-serif" }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontSize: 10, color: "#64748B", fontFamily: "'DM Mono',monospace" }}>
                          {price.monthly > 0 ? `${price.monthly} JD/mo` : "Free"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Billing cycle */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                  Billing Cycle
                </div>
                <div className="flex gap-2">
                  {(["monthly", "annual"] as const).map(cycle => {
                    const prices = TIER_PRICES_JD[draftTier];
                    const saving = draftTier !== "free" && prices.monthly > 0
                      ? Math.round((1 - prices.annual / (prices.monthly * 12)) * 100)
                      : 0;
                    return (
                      <button
                        key={cycle}
                        onClick={() => setDraftBilling(cycle)}
                        className="flex-1 py-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all"
                        style={{
                          borderColor: draftBilling === cycle ? "#1E5C35" : "#E2E8F0",
                          background:  draftBilling === cycle ? "#D1FAE5" : "white",
                          color:       draftBilling === cycle ? "#1E5C35" : "#64748B",
                          fontFamily:  "'DM Sans',sans-serif",
                        }}
                      >
                        {cycle}
                        {cycle === "annual" && saving > 0 && (
                          <span className="ml-1 text-[9px]" style={{ color: "#166534" }}>({saving}% off)</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom price override */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                    Custom Price Override
                  </div>
                  <button
                    onClick={() => { setEditPrice(p => !p); setDraftPrice(""); }}
                    className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border"
                    style={{ borderColor: "#E2E8F0", color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}
                  >
                    {editPrice ? <Unlock size={9} /> : <Lock size={9} />}
                    {editPrice ? "Clear override" : "Set custom price"}
                  </button>
                </div>
                {editPrice && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={draftPrice}
                      onChange={e => setDraftPrice(e.target.value)}
                      placeholder="e.g. 180"
                      className="flex-1 px-3 py-2 rounded-lg border"
                      style={{ borderColor: "#E2E8F0", fontFamily: "'DM Mono',monospace", fontSize: 14, outline: "none" }}
                    />
                    <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>JD/mo</span>
                  </div>
                )}
              </div>

              {/* Contract notes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                  Contract Notes
                </div>
                <textarea
                  value={draftNotes}
                  onChange={e => setDraftNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. 3-year commitment, includes quarterly reporting..."
                  className="w-full px-3 py-2 rounded-xl border resize-none"
                  style={{ borderColor: "#E2E8F0", fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: "none" }}
                />
              </div>

              {/* Save button */}
              <button
                onClick={handleSavePricing}
                className="w-full py-3 rounded-xl font-semibold text-sm"
                style={{ background: "#1E5C35", color: "white", fontFamily: "'DM Sans',sans-serif" }}
              >
                Save Pricing Changes
              </button>
            </>
          )}

          {/* ─── ORDERS ──── */}
          {activeTab === "orders" && (
            <>
              <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
                {client.orders.length} order{client.orders.length !== 1 ? "s" : ""} on record
              </div>
              {client.orders.length === 0 ? (
                <div className="text-center py-12" style={{ color: "#94A3B8", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>
                  No orders yet
                </div>
              ) : client.orders.map(order => {
                const STATUS_STYLE: Record<typeof order.status, { bg: string; color: string; label: string }> = {
                  pending:   { bg: "#FEF3C7", color: "#92400E", label: "Pending"    },
                  accepted:  { bg: "#D1FAE5", color: "#1E5C35", label: "Accepted"   },
                  inTransit: { bg: "#DBEAFE", color: "#1E40AF", label: "In Transit" },
                  completed: { bg: "#DCFCE7", color: "#166534", label: "Completed"  },
                };
                const sc = STATUS_STYLE[order.status];
                return (
                  <div key={order.id} className="rounded-xl p-3 border" style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
                    <div className="flex items-start justify-between mb-1.5">
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Mono',monospace" }}>
                        {order.id}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                        style={{ background: sc.bg, color: sc.color, fontFamily: "'DM Sans',sans-serif" }}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 11, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                        {order.material} · {order.quantity} {order.unit}
                      </span>
                      <div className="text-right">
                        <div style={{ fontSize: 11, color: "#1E5C35", fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>
                          {order.co2Saved} kg CO₂
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'DM Mono',monospace" }}>
                          {order.earnings} JD
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#CBD5E1", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                      {new Date(order.createdAt).toLocaleDateString("en-JO", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ─── IMPACT ──── */}
          {activeTab === "impact" && (
            <>
              {/* CO2 headline */}
              <div
                className="rounded-xl p-4 text-center"
                style={{ background: "linear-gradient(135deg,#D1FAE5 0%,#A7F3D0 100%)", border: "1px solid #6EE7B7" }}
              >
                <div style={{ fontSize: 38, fontWeight: 800, color: "#1E5C35", fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>
                  {clientCo2.toFixed(1)} kg
                </div>
                <div style={{ fontSize: 12, color: "#166534", fontFamily: "'DM Sans',sans-serif", marginTop: 4 }}>
                  CO₂ prevented from the atmosphere
                </div>
              </div>

              {/* Human-readable equivalents */}
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                That's equivalent to…
              </div>
              {[
                { emoji: "🌳", label: `${trees} tree${trees !== 1 ? "s" : ""}`, sub: "absorbing CO₂ for a full year" },
                { emoji: "🚗", label: `${carKm.toLocaleString()} km`,           sub: "NOT driven in a petrol car"   },
                { emoji: "📱", label: `${charges.toLocaleString()} charges`,    sub: "of smartphone energy saved"   },
              ].map(({ emoji, label, sub }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background: "#F8FAFC", border: "1px solid #E2E8F0" }}
                >
                  <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif" }}>
                      {label}
                    </div>
                    <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
                      {sub}
                    </div>
                  </div>
                </div>
              ))}

              {/* Certificate download */}
              <div className="rounded-xl p-3 border" style={{ borderColor: "#E2E8F0", background: "white" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", fontFamily: "'DM Sans',sans-serif", marginBottom: 4 }}>
                  CO₂ Impact Certificate
                </div>
                {client.lastCertificateDownload && (
                  <div style={{ fontSize: 10, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif", marginBottom: 8 }}>
                    Last downloaded:{" "}
                    {new Date(client.lastCertificateDownload).toLocaleDateString("en-JO", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </div>
                )}
                <button
                  className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2"
                  style={{ background: "#1E5C35", color: "white", fontSize: 12, fontFamily: "'DM Sans',sans-serif", fontWeight: 600 }}
                  onClick={() => window.alert(`Wire to ReportsScreen co2-certificate template for: ${client.name}`)}
                >
                  <Download size={13} />
                  Download Certificate PDF
                </button>
              </div>
            </>
          )}

        </div>{/* end scroll area */}
      </div>
    </>
  );
}
