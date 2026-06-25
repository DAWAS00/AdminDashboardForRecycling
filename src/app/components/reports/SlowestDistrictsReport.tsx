import { MapPin, TrendingDown } from "lucide-react";
import type { CompletedTrip } from "../../types";
import { computeDistrictStats } from "../../lib/performance";

export function SlowestDistrictsReport({ completedTrips, periodLabel }: { completedTrips: CompletedTrip[]; periodLabel: string }) {
  const stats = computeDistrictStats(completedTrips);

  if (stats.length === 0) return (
    <div style={{ padding: 32, textAlign: "center" }}>
      <MapPin size={28} color="var(--color-text-disabled)" style={{ margin: "0 auto 8px" }} />
      <p style={{ fontSize: 13, color: "var(--color-text-tertiary)" }}>No trip data yet.</p>
    </div>
  );

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-text-tertiary)", marginBottom: 8 }}>
        District Delivery Times — {periodLabel}
      </div>
      <div style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--color-amber-50)", border: "1px solid var(--color-amber-100)", marginBottom: 16, fontSize: 11, color: "var(--color-amber-600)" }}>
        Slowest districts = hub placement candidates. Share with municipality contacts.
      </div>
      {stats.map((d, i) => {
        const isSlow = d.avgActualMinutes - d.avgOsrmMinutes > 3;
        return (
          <div key={d.district} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--color-border)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-disabled)", width: 16 }}>#{i+1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: 5 }}>
                {d.district}
                {isSlow && <TrendingDown size={11} color="#DC2626" />}
              </div>
              <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{d.tripsCompleted} trip{d.tripsCompleted !== 1 ? "s" : ""} · {d.totalCo2Saved.toFixed(1)} kg CO₂</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: isSlow ? "#DC2626" : "var(--color-brand-600)" }}>{d.avgActualMinutes} min</div>
              <div style={{ fontSize: 9, color: "var(--color-text-disabled)" }}>est. {d.avgOsrmMinutes} min</div>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--color-surface)", border: "1px dashed var(--color-border)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 4 }}>Hub Placement Insight</div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Districts averaging &gt;20 min are under-served. Cross-reference with the Heat Map.</div>
      </div>
      <p style={{ fontSize: 9, color: "var(--color-text-disabled)", marginTop: 8, textAlign: "center" }}>Simulated — replace with real GPS in Phase 2</p>
    </div>
  );
}
