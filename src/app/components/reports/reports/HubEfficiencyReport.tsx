import { Warehouse, Calendar, AlertTriangle } from "lucide-react";
import { INITIAL_HUBS, MATERIAL_CONFIG } from "../../../constants";
import { hubCapacityPct } from "../../../helpers";

export function HubEfficiencyReport() {
  const activeHubs = INITIAL_HUBS.filter(h => h.active);
  const inactiveHubs = INITIAL_HUBS.filter(h => !h.active);

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
          Hub Efficiency Report
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          Capacity, collection cycles, and coverage status
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: 16 }}>
        <StatCard label="Active Hubs" value={String(activeHubs.length)} />
        <StatCard label="Avg. Capacity" value={`${Math.round(activeHubs.reduce((s, h) => s + hubCapacityPct(h), 0) / (activeHubs.length || 1))}%`} />
      </div>

      {activeHubs.map(hub => {
        const pct = hubCapacityPct(hub);
        const isFull = pct >= 85;
        return (
          <div
            key={hub.id}
            style={{
              padding: "var(--space-3)",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-surface-card)",
              border: `1px solid ${isFull ? "var(--color-amber-600)" : "var(--color-border)"}`,
              marginBottom: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Warehouse size={16} color="var(--color-brand-600)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{hub.name}</span>
              </div>
              {isFull && <AlertTriangle size={14} color="var(--color-amber-600)" />}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                <span>Capacity</span>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{pct}%</span>
              </div>
              <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    borderRadius: "var(--radius-full)",
                    background: pct >= 85 ? "var(--color-amber-600)" : pct >= 60 ? "var(--color-oil)" : "var(--color-brand-600)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              {Object.entries(hub.currentLoad).map(([key, amount]) => {
                const label = key === "cookingOil" ? "Cooking Oil" : key === "plastic" ? "Plastic Bottles" : key === "paper" ? "Paper & Cardboard" : "Electronics";
                const mc = MATERIAL_CONFIG[label as keyof typeof MATERIAL_CONFIG];
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <mc.Icon size={12} color={mc.color} />
                    <span style={{ fontSize: 10, color: "var(--color-text-secondary)", flex: 1 }}>{label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: mc.color, fontWeight: 600 }}>{amount} {mc.unit}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--color-text-tertiary)" }}>
              <Calendar size={12} />
              Next shipment: <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{hub.nextShipmentDate}</span>
            </div>
          </div>
        );
      })}

      {inactiveHubs.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
            Inactive Hubs
          </div>
          {inactiveHubs.map(h => (
            <div key={h.id} style={{ padding: "var(--space-2) 0", fontSize: 11, color: "var(--color-text-disabled)", borderBottom: "1px solid var(--color-border)" }}>
              {h.name} — {h.address}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--color-surface-card)", border: "1px solid var(--color-border)" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)" }}>{value}</div>
    </div>
  );
}
