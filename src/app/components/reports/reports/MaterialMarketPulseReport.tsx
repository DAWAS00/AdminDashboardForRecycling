import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { DISTRICTS, MATERIAL_CONFIG, METRIC_HISTORY } from "../../../constants";
import { MetricSparkline } from "../../MetricSparkline";

const MATERIAL_KEYS = [
  { key: "cookingOil" as const,  label: "Cooking Oil"       },
  { key: "plastic"    as const,  label: "Plastic Bottles"   },
  { key: "paper"      as const,  label: "Paper & Cardboard" },
  { key: "electronics"as const,  label: "Electronics"       },
];

export function MaterialMarketPulseReport() {
  // Aggregate potential and achieved across districts
  const totals = MATERIAL_KEYS.map(({ key, label }) => {
    const potential = DISTRICTS.reduce((s, d) => s + d.materialBreakdown[key].potential, 0);
    const achieved  = DISTRICTS.reduce((s, d) => s + d.materialBreakdown[key].achieved, 0);
    const topDistrict = [...DISTRICTS]
      .sort((a, b) => b.materialBreakdown[key].achieved - a.materialBreakdown[key].achieved)[0];
    const history = METRIC_HISTORY.daily[label as keyof typeof METRIC_HISTORY.daily]?.slice(-7).map(p => p.value) || [];
    return { key, label, potential, achieved, topDistrict, history };
  });

  const totalVolume = totals.reduce((s, t) => s + t.achieved, 0);

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
          Material Market Pulse
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          Weekly volume by material and top performing districts
        </div>
      </div>

      <div style={{ padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--color-surface-card)", border: "1px solid var(--color-border)", marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>Total Captured Volume</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 700, color: "var(--color-brand-600)" }}>
          {totalVolume.toLocaleString()} <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>kg / L equivalent</span>
        </div>
      </div>

      {/* Potential vs Achieved bar chart */}
      <Section title="Potential vs Captured">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={totals.map(t => ({ name: t.label.split(" ")[0], potential: t.potential, achieved: t.achieved, color: (MATERIAL_CONFIG as Record<string, { color: string }>)[t.label]?.color }))} margin={{ top: 4, right: 0, left: -24, bottom: 0 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--color-neutral-400)" }} />
            <YAxis tick={{ fontSize: 9, fill: "var(--color-neutral-400)" }} />
            <Tooltip
              contentStyle={{ fontFamily: "var(--font-sans)", fontSize: 11, border: "1px solid var(--color-border)", borderRadius: 6 }}
            />
            <Bar dataKey="potential" fill="var(--color-neutral-200)" name="Potential" radius={[2,2,0,0]} />
            <Bar dataKey="achieved"  name="Captured"  radius={[2,2,0,0]}>
              {totals.map((t, i) => (
                <Cell key={i} fill={(MATERIAL_CONFIG as Record<string, { color: string }>)[t.label]?.color ?? "var(--color-brand-600)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Section>

      <Section title="By Material">
        {totals.map(({ label, potential, achieved, topDistrict, history }) => {
          const mc = MATERIAL_CONFIG[label as keyof typeof MATERIAL_CONFIG];
          const pct = potential > 0 ? Math.round((achieved / potential) * 100) : 0;
          return (
            <div
              key={label}
              style={{
                padding: "var(--space-3)",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-card)",
                border: "1px solid var(--color-border)",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <mc.Icon size={16} color={mc.color} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{label}</span>
                <MetricSparkline data={history} color={mc.color} width={60} height={18} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                <span>Captured</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: mc.color }}>
                  {achieved} {mc.unit} ({pct}%)
                </span>
              </div>
              <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: "var(--radius-full)", background: mc.color }} />
              </div>

              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
                Top district: <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{topDistrict?.name ?? "—"}</span>
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}
