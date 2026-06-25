import { MapPin, Wind, TrendingUp } from "lucide-react";
import { DISTRICTS, MATERIAL_CONFIG } from "../../../constants";
import { districtPriorityScore, co2Equivalents } from "../../../helpers";

export function DistrictIntelligenceReport() {
  const ranked = [...DISTRICTS].sort((a, b) => districtPriorityScore(b) - districtPriorityScore(a));
  const totalPotential = DISTRICTS.reduce((s, d) => s + d.co2Potential, 0);
  const totalAchieved  = DISTRICTS.reduce((s, d) => s + d.co2Achieved,  0);

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
          District Intelligence Brief
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          Priority districts ranked by unrealized CO₂ potential
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: 16 }}>
        <StatCard label="Total Potential" value={`${totalPotential.toLocaleString()} kg`} color="var(--color-text-primary)" />
        <StatCard label="Achieved"        value={`${totalAchieved.toLocaleString()} kg`}  color="var(--color-brand-600)" />
      </div>

      <Section title="Priority Ranking">
        {ranked.map((d, i) => {
          const gapPct = Math.round(((d.co2Potential - d.co2Achieved) / d.co2Potential) * 100);
          const equiv = co2Equivalents(d.co2Achieved);
          return (
            <div
              key={d.id}
              style={{
                padding: "var(--space-3)",
                borderRadius: "var(--radius-lg)",
                background: "var(--color-surface-card)",
                border: "1px solid var(--color-border)",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)", width: 18 }}>#{i + 1}</span>
                <MapPin size={14} color="var(--color-brand-600)" />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{d.name}</span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                    color: gapPct >= 70 ? "var(--color-danger-600)" : "var(--color-text-secondary)",
                  }}
                >
                  {gapPct}% gap
                </span>
              </div>

              <div style={{ marginBottom: 8 }}>
                <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${100 - gapPct}%`, borderRadius: "var(--radius-full)", background: "var(--color-brand-600)" }} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 6 }}>
                <span><Wind size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />{d.co2Achieved} / {d.co2Potential} kg</span>
                <span><TrendingUp size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />≈ {equiv.trees} trees</span>
              </div>

              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
                Top material: <span style={{ fontWeight: 600, color: "var(--color-text-secondary)" }}>{d.topMaterial}</span> · {d.orderCount} orders
              </div>
            </div>
          );
        })}
      </Section>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--color-surface-card)", border: "1px solid var(--color-border)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color }}>{value}</div>
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
