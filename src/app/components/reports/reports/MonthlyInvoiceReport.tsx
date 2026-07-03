import { useState } from "react";
import { FileText, Building2, Calendar, Receipt, Download, TrendingUp } from "lucide-react";
import { useClients } from "../../../../hooks/useClients";
import { TIER_CONFIG, TIER_PRICES_JD } from "../../../constants";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MonthlyInvoiceReportProps {
  clientId?: string;
  periodStart?: string;
  periodEnd?: string;
  hideControls?: boolean;
}

export function MonthlyInvoiceReport({
  clientId,
  periodStart = "2026-06-01",
  periodEnd = "2026-06-30",
  hideControls = false,
}: MonthlyInvoiceReportProps) {
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

  // Filter orders by period
  const invoiceOrders = client.orders.filter((o) => {
    const date = o.createdAt.slice(0, 10);
    return date >= periodStart && date <= periodEnd && o.status === "completed";
  });

  // Calculate material totals
  const materialSummary = invoiceOrders.reduce((acc, order) => {
    if (!acc[order.material]) {
      acc[order.material] = { qty: 0, earnings: 0, unit: order.unit };
    }
    acc[order.material].qty += order.quantity;
    acc[order.material].earnings += order.earnings;
    return acc;
  }, {} as Record<string, { qty: number; earnings: number; unit: string }>);

  // Recharts chart data (grouped by date)
  const chartData = invoiceOrders.reduce((acc, order) => {
    const dateStr = new Date(order.createdAt).toLocaleDateString("en-JO", { day: "2-digit", month: "short" });
    const existing = acc.find((d) => d.date === dateStr);
    if (existing) {
      existing.weight += order.quantity;
    } else {
      acc.push({ date: dateStr, weight: order.quantity });
    }
    return acc;
  }, [] as { date: string; weight: number }[]).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Pricing configuration based on contract tier
  const tier = client.contractTier;
  const baseFee = client.customPriceJD ?? TIER_PRICES_JD[tier].monthly;
  const totalCredits = invoiceOrders.reduce((sum, o) => sum + o.earnings, 0);
  const netDue = Math.max(0, baseFee - totalCredits);

  const invoiceNumber = `INV-${client.id.slice(0, 5).toUpperCase()}-${new Date(periodEnd).getFullYear()}${String(new Date(periodEnd).getMonth() + 1).padStart(2, "0")}`;

  return (
    <div style={{ padding: hideControls ? "0" : "var(--space-4)", fontFamily: "var(--font-sans)" }}>
      {/* Selector controls */}
      {!hideControls && (
        <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="inv-client" style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
              Select Client
            </label>
            <select
              id="inv-client"
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
        </div>
      )}

      {/* Invoice Sheet */}
      <div
        className="page-break-avoid"
        style={{
          background: "white",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "32px",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {/* Header Block */}
        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #F1F5F9", paddingBottom: "20px", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-brand-600)", fontWeight: 800, fontSize: 20, marginBottom: 4 }}>
              <Receipt size={22} />
              DAWER RECYCLING
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              Environmental Operations Billing
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
              Amman, Jordan
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.02em" }}>
              INVOICE
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--color-brand-600)", fontWeight: 600, marginTop: 4 }}>
              {invoiceNumber}
            </div>
          </div>
        </div>

        {/* Client & Invoice Details */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24, marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Billed To:
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              {client.name}
              {client.nameAr && (
                <span style={{ fontFamily: "var(--font-ar)", fontSize: 11, color: "var(--color-brand-600)", fontWeight: 500 }}>
                  ({client.nameAr})
                </span>
              )}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <Building2 size={11} />
              {client.address}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
              Tier: <span style={{ fontWeight: 600, color: TIER_CONFIG[tier].color }}>{TIER_CONFIG[tier].label}</span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
              Invoice Details:
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
              Billing Period: <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{periodStart} to {periodEnd}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
              Invoice Date: <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>{new Date().toLocaleDateString("en-JO", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 4 }}>
              Payment Due: <span style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>Upon Receipt</span>
            </div>
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Billing Breakdown
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #E2E8F0", color: "var(--color-text-tertiary)", textAlign: "left" }}>
                <th style={{ padding: "8px 0", fontWeight: 600 }}>Description</th>
                <th style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>Quantity</th>
                <th style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>Credit Rate</th>
                <th style={{ padding: "8px 0", textAlign: "right", fontWeight: 600 }}>Total Credit</th>
              </tr>
            </thead>
            <tbody>
              {/* Monthly Subscription Fee */}
              <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                <td style={{ padding: "10px 0" }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                    Dawer Subscription Fee — {TIER_CONFIG[tier].label} Tier
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                    Monthly recurring service charges
                  </div>
                </td>
                <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>1 mo</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>{baseFee.toFixed(2)} JD</td>
                <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)", fontWeight: 600 }}>
                  +{baseFee.toFixed(2)} JD
                </td>
              </tr>

              {/* Recycled Materials Credits */}
              {Object.entries(materialSummary).map(([material, data]) => {
                const rate = data.qty > 0 ? data.earnings / data.qty : 0;
                return (
                  <tr key={material} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 0" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-text-primary)" }}>
                        Recycled: {material}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 2 }}>
                        Collected operational waste credits
                      </div>
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      {data.qty} {data.unit}
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>
                      {rate.toFixed(3)} JD/{data.unit}
                    </td>
                    <td style={{ padding: "10px 0", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-brand-600)", fontWeight: 600 }}>
                      -{data.earnings.toFixed(2)} JD
                    </td>
                  </tr>
                );
              })}

              {/* Empty state for orders */}
              {invoiceOrders.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "16px 0", textAlign: "center", color: "var(--color-text-tertiary)", fontStyle: "italic" }}>
                    No collections processed during this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Calculations & Net Totals */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, marginBottom: 24 }}>
          {/* Chart visual representation */}
          <div>
            {chartData.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <TrendingUp size={11} />
                  Collection Weight Trend (kg)
                </div>
                <div style={{ height: 85, width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" tick={{ fontSize: 8, fill: "var(--color-neutral-400)" }} />
                      <YAxis tick={{ fontSize: 8, fill: "var(--color-neutral-400)" }} />
                      <Bar dataKey="weight" fill="var(--color-brand-600)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* Totals computation */}
          <div style={{ background: "#F8FAFB", borderRadius: "var(--radius-lg)", padding: "16px", border: "1px solid var(--color-border)" }}>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-secondary)" }}>
              <span>Base Subscription Fee:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{baseFee.toFixed(2)} JD</span>
            </div>
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 11, color: "var(--color-brand-600)", marginTop: 8 }}>
              <span>Recycling Credit Earned:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>-{totalCredits.toFixed(2)} JD</span>
            </div>
            <div style={{ height: "1px", background: "var(--color-border)", margin: "12px 0" }} />
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: 14, fontWeight: 800 }}>
              <span style={{ color: "var(--color-text-primary)" }}>Net Amount Due:</span>
              <span style={{ fontFamily: "var(--font-mono)", color: netDue > 0 ? "var(--color-amber-600)" : "var(--color-brand-600)" }}>
                {netDue.toFixed(2)} JD
              </span>
            </div>
            {netDue === 0 && totalCredits > baseFee && (
              <div style={{ fontSize: 9, color: "var(--color-brand-600)", marginTop: 6, fontWeight: 600, textAlign: "right" }}>
                * Excess credit of {(totalCredits - baseFee).toFixed(2)} JD carried forward.
              </div>
            )}
          </div>
        </div>

        {/* Footer Notes */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #F1F5F9", paddingTop: "16px" }}>
          <div>
            <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", fontWeight: 600 }}>Terms & Info</div>
            <div style={{ fontSize: 8, color: "var(--color-text-tertiary)", width: "300px", lineHeight: 1.4, marginTop: 4 }}>
              Payment is settled monthly. Recycling credits are subtracted directly from your tier subscription fees. Green points are accumulated separately in your wallet.
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ width: 100, height: 1, background: "var(--color-text-tertiary)", marginInlineStart: "auto", marginBottom: 6 }} />
            <div style={{ fontSize: 9, color: "var(--color-text-secondary)", fontWeight: 700 }}>Dawer Finance Dept.</div>
            <div style={{ fontSize: 8, color: "var(--color-text-tertiary)" }}>Authorized Stamp & Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
}
