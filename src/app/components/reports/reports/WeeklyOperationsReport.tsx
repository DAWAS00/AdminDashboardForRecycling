import { Wind, Banknote, Package, Users } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { MATERIAL_CONFIG, METRIC_HISTORY } from "../../../constants";
import { computeTotals } from "../../../helpers";
import { MetricSparkline } from "../../MetricSparkline";
import { useRiders } from "../../../../hooks/useRiders";

export function WeeklyOperationsReport() {
  const { data: riders = [] } = useRiders();
  const totals = computeTotals(riders);
  const allOrders = riders.flatMap(r => r.orders);
  const completedOrders = allOrders.filter(o => o.status === "completed");
  const activeOrders = allOrders.filter(o => o.status !== "completed");

  // Material totals
  const materialTotals: Record<string, number> = {};
  allOrders.forEach(o => {
    materialTotals[o.material] = (materialTotals[o.material] || 0) + o.quantity;
  });
  const topMaterials = Object.entries(materialTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const co2History = METRIC_HISTORY.weekly.co2.slice(-4).map(p => p.value);
  const earningsHistory = METRIC_HISTORY.weekly.earnings.slice(-4).map(p => p.value);

  // recharts data
  const co2TrendData = METRIC_HISTORY.weekly.co2.slice(-8).map(p => ({ label: p.label, co2: p.value }));
  const materialPieData = topMaterials.map(([name, value]) => ({
    name,
    value,
    color: (MATERIAL_CONFIG as Record<string, { color: string }>)[name]?.color ?? "var(--color-neutral-400)",
  }));

  return (
    <div style={{ padding: "var(--space-4)" }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
          Weekly Operations Summary
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {new Date().toLocaleDateString("en-JO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: 16 }}>
        <KpiCard icon={Wind}    label="CO₂ Captured" value={`${totals.co2.toFixed(1)} kg`} color="var(--color-brand-600)" sparkline={co2History} />
        <KpiCard icon={Banknote} label="Earnings"     value={`${totals.earnings.toFixed(2)} JD`} color="var(--color-amber-600)" sparkline={earningsHistory} />
        <KpiCard icon={Package}  label="Completed Orders" value={String(completedOrders.length)} color="var(--color-text-primary)" />
        <KpiCard icon={Users}    label="Active Riders"    value={String(riders.filter(r => r.status !== "idle").length)} color="var(--color-text-primary)" />
      </div>

      {/* CO₂ trend area chart */}
      <Section title="CO₂ Trend — Last 8 Weeks">
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={co2TrendData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="co2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--color-brand-600)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--color-brand-600)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--color-neutral-400)" }} />
            <YAxis tick={{ fontSize: 9, fill: "var(--color-neutral-400)" }} />
            <Tooltip
              contentStyle={{ fontFamily: "var(--font-sans)", fontSize: 11, border: "1px solid var(--color-border)", borderRadius: 6 }}
              formatter={(v: number) => [`${v.toFixed(1)} kg`, "CO₂"]}
            />
            <Area type="monotone" dataKey="co2" stroke="var(--color-brand-600)" fill="url(#co2Grad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Section>

      {/* Material breakdown donut */}
      {materialPieData.length > 0 && (
        <Section title="Material Breakdown">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <ResponsiveContainer width={100} height={100}>
              <PieChart>
                <Pie data={materialPieData} cx="50%" cy="50%" innerRadius={28} outerRadius={46} dataKey="value" strokeWidth={0}>
                  {materialPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {materialPieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-neutral-600)" }}>{d.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--color-neutral-900)", marginInlineStart: "auto" }}>{d.value} kg</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Top materials */}
      <Section title="Top Materials This Week">
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {topMaterials.map(([material, qty]) => {
            const mc = MATERIAL_CONFIG[material as keyof typeof MATERIAL_CONFIG];
            return (
              <div key={material} style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", padding: "var(--space-2)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
                <mc.Icon size={16} color={mc.color} />
                <span style={{ flex: 1, fontSize: 12, color: "var(--color-text-primary)" }}>{material}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600, color: mc.color }}>
                  {qty} {mc.unit}
                </span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Active orders */}
      <Section title={`Active Orders (${activeOrders.length})`}>
        {activeOrders.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>No active orders at the moment.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {activeOrders.slice(0, 6).map(o => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{o.id}</span>
                <span style={{ color: "var(--color-text-primary)", flex: 1, marginLeft: 8 }}>{o.material}</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}>{o.quantity} {o.unit}</span>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Rider table */}
      <Section title="Rider Performance">
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-tertiary)", textAlign: "left" }}>
              <th style={{ padding: "6px 0" }}>Rider</th>
              <th style={{ padding: "6px 0" }}>Status</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>Orders</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>CO₂</th>
              <th style={{ padding: "6px 0", textAlign: "right" }}>Earnings</th>
            </tr>
          </thead>
          <tbody>
            {riders.map(r => {
              const co2 = r.orders.reduce((s, o) => s + o.co2Saved, 0);
              const earnings = r.orders.reduce((s, o) => s + o.earnings, 0);
              return (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "6px 0", color: "var(--color-text-primary)", fontWeight: 500 }}>{r.name}</td>
                  <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>{r.status.replace("_", " ")}</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontFamily: "var(--font-mono)" }}>{r.orders.length}</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-brand-600)" }}>{co2.toFixed(1)}</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-amber-600)" }}>{earnings.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color, sparkline }: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  color: string;
  sparkline?: number[];
}) {
  return (
    <div style={{ padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--color-surface-card)", border: "1px solid var(--color-border)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={color} />
        <span style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color }}>{value}</span>
        {sparkline && <MetricSparkline data={sparkline} color={color} width={50} height={16} />}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
        {title}
      </div>
      {children}
    </div>
  );
}
