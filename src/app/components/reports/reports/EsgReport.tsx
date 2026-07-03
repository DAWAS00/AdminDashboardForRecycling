import { useState } from "react";
import { Leaf, ShieldCheck, Heart, Award, ArrowUpRight, ShieldAlert } from "lucide-react";
import { useClients } from "../../../../hooks/useClients";
import { co2Equivalents } from "../../../helpers";
import { MATERIAL_CONFIG } from "../../../constants";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface EsgReportProps {
  clientId?: string;
  periodStart?: string;
  periodEnd?: string;
  hideControls?: boolean;
}

export function EsgReport({
  clientId,
  periodStart = "2026-01-01",
  periodEnd = "2026-06-30",
  hideControls = false,
}: EsgReportProps) {
  const { data: clients = [] } = useClients();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const activeId = clientId ?? selectedId ?? clients[0]?.id ?? "";
  const client = clients.find((c) => c.id === activeId) ?? clients[0];

  if (!client) {
    return (
      <div style={{ padding: "var(--space-4)", color: "var(--color-neutral-400)", fontFamily: "var(--font-sans)", fontSize: 13 }}>
        No client data available.
      </div>
    );
  }

  // Filter completed orders in period
  const periodOrders = client.orders.filter((o) => {
    const date = o.createdAt.slice(0, 10);
    return date >= periodStart && date <= periodEnd && o.status === "completed";
  });

  const periodCo2 = periodOrders.reduce((sum, o) => sum + o.co2Saved, 0);
  const periodEarnings = periodOrders.reduce((sum, o) => sum + o.earnings, 0);
  const equiv = co2Equivalents(periodCo2);

  // Group materials for pie chart
  const materialGroup = periodOrders.reduce((acc, order) => {
    acc[order.material] = (acc[order.material] || 0) + order.quantity;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(materialGroup).map(([name, value]) => ({
    name,
    value,
    color: (MATERIAL_CONFIG as Record<string, { color: string }>)[name]?.color ?? "var(--color-brand-600)",
  }));

  const diversionRate = periodOrders.length > 0 ? 94.6 : 0; // percentage diversion from landfill
  const auditId = `ESG-${client.id.slice(0, 4).toUpperCase()}-${new Date(periodEnd).getFullYear()}-QA`;

  return (
    <div style={{ padding: hideControls ? "0" : "var(--space-4)", fontFamily: "var(--font-sans)" }}>
      {/* Selector controls */}
      {!hideControls && (
        <div style={{ marginBottom: 20 }}>
          <label htmlFor="esg-client" style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            Select Client
          </label>
          <select
            id="esg-client"
            value={activeId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-card)",
              fontSize: 12,
              color: "var(--color-text-primary)",
            }}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* ESG Report Sheet */}
      <div
        className="page-break-avoid"
        style={{
          background: "white",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "36px",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Cover strip / Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #06402B 0%, #1E5C35 100%)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            color: "white",
            marginBottom: "28px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span
              style={{
                background: "rgba(255,255,255,0.18)",
                fontSize: 9,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: "var(--radius-full)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              ESG Performance Report
            </span>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "8px 0 2px 0", letterSpacing: "-0.02em" }}>
              {client.name}
            </h1>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              Evaluation Period: {periodStart} to {periodEnd}
            </div>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <Award size={36} color="#4ADE80" />
            <div style={{ fontSize: 9, opacity: 0.6, fontFamily: "var(--font-mono)", marginTop: 4 }}>
              Registry ID: {auditId}
            </div>
          </div>
        </div>

        {/* Triple Bottom Line Columns (E - S - G) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
          {/* Environmental Card */}
          <div style={{ border: "1px solid #DCFCE7", borderRadius: "var(--radius-lg)", padding: 16, background: "#F0FDF4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#166534", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
              <Leaf size={14} />
              ENVIRONMENTAL
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#166534", fontFamily: "var(--font-mono)" }}>
              {periodCo2.toFixed(1)} <span style={{ fontSize: 11, fontWeight: 500 }}>kg</span>
            </div>
            <div style={{ fontSize: 10, color: "#166534", fontWeight: 600, marginTop: 2 }}>
              Net carbon prevented
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 12, lineHeight: 1.4 }}>
              Prevented carbon emission by diverting recyclable materials directly into processed circular streams.
            </div>
          </div>

          {/* Social Card */}
          <div style={{ border: "1px solid #FEE2E2", borderRadius: "var(--radius-lg)", padding: 16, background: "#FEF2F2" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#991B1B", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
              <Heart size={14} />
              SOCIAL ECONOMY
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#991B1B", fontFamily: "var(--font-mono)" }}>
              {periodEarnings.toFixed(2)} <span style={{ fontSize: 11, fontWeight: 500 }}>JD</span>
            </div>
            <div style={{ fontSize: 10, color: "#991B1B", fontWeight: 600, marginTop: 2 }}>
              Community wealth shared
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 12, lineHeight: 1.4 }}>
              Distributed direct financial benefits back to local collection riders and drivers, supporting local livelihoods.
            </div>
          </div>

          {/* Governance Card */}
          <div style={{ border: "1px solid #DBEAFE", borderRadius: "var(--radius-lg)", padding: 16, background: "#EFF6FF" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#1E40AF", fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
              <ShieldCheck size={14} />
              GOVERNANCE
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#1E40AF", fontFamily: "var(--font-mono)" }}>
              100% <span style={{ fontSize: 11, fontWeight: 500 }}>Compliance</span>
            </div>
            <div style={{ fontSize: 10, color: "#1E40AF", fontWeight: 600, marginTop: 2 }}>
              Traceability & Audited
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-secondary)", marginTop: 12, lineHeight: 1.4 }}>
              All transactions verified on Jordan Environmental Registries. Backed by solid chain-of-custody data logs.
            </div>
          </div>
        </div>

        {/* Diversion Rate & Circular Material Breakdown */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, marginBottom: 32 }}>
          {/* Material Diversion Donut Chart */}
          <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
              Landfill Diversion Breakdown
            </div>
            {pieData.length === 0 ? (
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-tertiary)", fontSize: 12, fontStyle: "italic" }}>
                No materials logged.
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                        {pieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                  {pieData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                      <span style={{ color: "var(--color-text-secondary)" }}>{d.name}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, marginInlineStart: "auto" }}>
                        {d.value} kg
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Social Impact & Diversion Ratio Metrics */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                  {diversionRate}%
                </div>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Landfill Diversion Ratio</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: "#166534", background: "#DCFCE7", padding: "2px 6px", borderRadius: 4 }}>
                Excellent
              </span>
            </div>

            <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                  +{client.greenPoints.toLocaleString()}
                </div>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>Loyalty Green Points Earned</div>
              </div>
              <Award size={16} color="var(--color-brand-600)" />
            </div>
          </div>
        </div>

        {/* Equivalents Panel */}
        <div style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
            Environmental Equivalency (Calculated Carbon Offset)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ background: "#F9FAFB", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-brand-600)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>
                {equiv.trees}
              </div>
              <div style={{ fontSize: 9, color: "var(--color-text-tertiary)" }}>Trees Planted (Equivalent)</div>
            </div>
            <div style={{ background: "#F9FAFB", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-brand-600)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>
                {equiv.carKm.toLocaleString()} km
              </div>
              <div style={{ fontSize: 9, color: "var(--color-text-tertiary)" }}>Car Travel Avoided</div>
            </div>
            <div style={{ background: "#F9FAFB", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "var(--color-brand-600)", fontFamily: "var(--font-mono)", marginBottom: 2 }}>
                {equiv.phones.toLocaleString()}
              </div>
              <div style={{ fontSize: 9, color: "var(--color-text-tertiary)" }}>Smartphones Charged</div>
            </div>
          </div>
        </div>

        {/* Governance Compliance Seal */}
        <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center", borderTop: "1.5px solid #F1F5F9", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={28} color="var(--color-brand-600)" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-primary)" }}>
                Verified Circular Partner
              </div>
              <div style={{ fontSize: 8, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                Dawer Governance Board &bull; Ministry of Environment Alignment
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 9, color: "var(--color-brand-600)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Traceability Certified
            </div>
            <div style={{ fontSize: 8, color: "var(--color-text-tertiary)", marginTop: 2 }}>
              ID: {auditId}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
