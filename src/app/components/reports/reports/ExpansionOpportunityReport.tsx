import { MapPin, Plus, AlertCircle, TrendingUp } from "lucide-react";
import { DISTRICTS, INITIAL_HUBS } from "../../../constants";
import { districtPriorityScore, isDistrictCovered } from "../../../helpers";

export function ExpansionOpportunityReport() {
  // Find uncovered / under-covered districts
  const uncovered = DISTRICTS
    .filter(d => !isDistrictCovered(d, INITIAL_HUBS, 5))
    .sort((a, b) => districtPriorityScore(b) - districtPriorityScore(a));

  const weaklyCovered = DISTRICTS
    .filter(d => isDistrictCovered(d, INITIAL_HUBS, 5) && !isDistrictCovered(d, INITIAL_HUBS, 3))
    .sort((a, b) => districtPriorityScore(b) - districtPriorityScore(a));

  const totalUntappedCo2 = uncovered.reduce((s, d) => s + (d.co2Potential - d.co2Achieved), 0);

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
          Expansion Opportunity Map
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          Districts outside 5km hub coverage ranked by opportunity
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: 16 }}>
        <StatCard label="Uncovered Districts" value={String(uncovered.length)} color="var(--color-danger-600)" />
        <StatCard label="Untapped CO₂"        value={`${totalUntappedCo2.toLocaleString()} kg`} color="var(--color-brand-600)" />
      </div>

      {uncovered.length > 0 && (
        <Section title="Recommended New Hub Zones">
          {uncovered.slice(0, 5).map((d, i) => {
            const opportunity = d.co2Potential - d.co2Achieved;
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
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)", width: 18 }}>#{i + 1}</span>
                  <MapPin size={14} color="var(--color-danger-600)" />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{d.name}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 8 }}>
                  Suggested hub near [{d.centroid[0].toFixed(3)}, {d.centroid[1].toFixed(3)}]
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
                    <TrendingUp size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: 3 }} />
                    {d.orderCount} orders
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--color-brand-600)" }}>
                    +{opportunity} kg potential
                  </span>
                </div>
              </div>
            );
          })}
        </Section>
      )}

      {weaklyCovered.length > 0 && (
        <Section title="Weak Coverage (3–5 km)">
          {weaklyCovered.slice(0, 4).map(d => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
              <AlertCircle size={12} color="var(--color-amber-600)" />
              <span style={{ flex: 1, fontSize: 11, color: "var(--color-text-primary)" }}>{d.name}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-tertiary)" }}>{d.co2Potential - d.co2Achieved} kg gap</span>
            </div>
          ))}
        </Section>
      )}

      <button
        disabled
        style={{
          width: "100%", marginTop: 8,
          padding: "8px 0",
          borderRadius: "var(--radius-md)",
          border: "1px dashed var(--color-border)",
          background: "transparent",
          cursor: "not-allowed",
          fontSize: 11, fontWeight: 600, color: "var(--color-text-disabled)",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}
      >
        <Plus size={12} />
        Add Recommended Hub (Phase 2)
      </button>
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
