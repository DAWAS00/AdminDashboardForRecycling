import { Wind, Banknote, Zap, Clock } from "lucide-react";
import type { CompletedTrip } from "../../types";
import { computeRiderStats } from "../../lib/performance";

export function RiderPerformanceReport({ completedTrips, periodLabel }: { completedTrips: CompletedTrip[]; periodLabel: string }) {
  const stats = computeRiderStats(completedTrips);

  if (stats.length === 0) return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <Clock size={28} color="var(--color-text-disabled)" style={{ margin: "0 auto 8px" }} />
      <p style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>
        No completed trips yet.<br />Click an order on the Live Map to start tracking.
      </p>
    </div>
  );

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 16 }}>
        Rider Performance — {periodLabel}
      </div>
      <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-brand-50)", border: "1px solid var(--color-brand-100)", marginBottom: 16, fontSize: 11, color: "var(--color-brand-600)" }}>
        This data feeds client CO₂ certificates and B2B intelligence reports.
      </div>
      {stats.sort((a, b) => b.avgEfficiencyScore - a.avgEfficiencyScore).map(r => (
        <div key={r.riderId} style={{ marginBottom: 12, padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--color-surface-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xs)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{r.riderName}</div>
              <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{r.tripsCompleted} trip{r.tripsCompleted !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ padding: "4px 10px", borderRadius: "var(--radius-full)", background: r.avgEfficiencyScore >= 90 ? "var(--color-brand-100)" : "var(--color-amber-100)", color: r.avgEfficiencyScore >= 90 ? "var(--color-brand-600)" : "var(--color-amber-600)", fontSize: 11, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
              {r.avgEfficiencyScore}% efficiency
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            {[
              { Icon: Wind,    label: "CO₂ Saved",    value: `${r.totalCo2Saved.toFixed(1)} kg`,   color: "var(--color-brand-600)" },
              { Icon: Banknote, label: "Earnings",      value: `${r.totalEarnings.toFixed(2)} JD`,   color: "var(--color-amber-600)" },
              { Icon: Zap,     label: "Avg trip",      value: `${Math.round(r.avgActualSeconds / 60)} min`, color: "var(--color-text-secondary)" },
              { Icon: Clock,   label: "On-time rate",  value: `${r.onTimeRate}%`,                   color: "var(--color-text-secondary)" },
            ].map(({ Icon, label, value, color }) => (
              <div key={label} style={{ padding: "6px 8px", borderRadius: "var(--radius-sm)", background: "var(--color-surface)", display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Icon size={11} color={color} />
                  <span style={{ fontSize: 9, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color }}>{value}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>On-time rate</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: "var(--color-brand-600)" }}>{r.onTimeRate}%</span>
            </div>
            <div style={{ height: 5, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${r.onTimeRate}%`, borderRadius: "var(--radius-full)", background: r.onTimeRate >= 80 ? "var(--color-brand-600)" : "var(--color-amber-600)" }} />
            </div>
          </div>
        </div>
      ))}
      <p style={{ fontSize: 9, color: "var(--color-text-disabled)", marginTop: 8, textAlign: "center" }}>Simulated trip timing — replace with real GPS in Phase 2</p>
    </div>
  );
}
