import { Wind, Banknote, Clock, Radio } from "lucide-react";
import { Rider } from "../../types";
import { co2Equivalents } from "../../helpers";

interface TodayStatsProps {
  rider: Rider;
  onlineTime: Date; // when this rider came online — for display
}

export function TodayStats({ rider, onlineTime }: TodayStatsProps) {
  const completedOrders  = rider.orders.filter(o => o.status === "completed");
  const activeOrders     = rider.orders.filter(o => o.status !== "completed");
  const totalEarnings    = rider.orders.reduce((s, o) => s + o.earnings, 0);
  const totalCo2         = rider.orders.reduce((s, o) => s + o.co2Saved, 0);
  const equiv            = co2Equivalents(totalCo2);

  const onlineSince = onlineTime.toLocaleTimeString("en-JO", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  });

  const lastPingTime = new Date().toLocaleTimeString("en-JO", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  const StatRow = ({ icon: Icon, label, value, color = "var(--color-text-primary)" }: {
    icon: React.ComponentType<{ size: number; color: string }>;
    label: string;
    value: string;
    color?: string;
  }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--color-border)" }}>
      <Icon size={14} color={color} />
      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", flex: 1 }}>{label}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, color }}>{value}</span>
    </div>
  );

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div
        style={{
          fontSize: 10, fontWeight: 700,
          color: "var(--color-text-tertiary)",
          letterSpacing: "0.1em", textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Shift Stats — Today
      </div>

      <StatRow icon={Wind}    label="CO₂ Saved"      value={`${totalCo2.toFixed(1)} kg`}          color="var(--color-brand-600)" />
      <StatRow icon={Banknote} label="Earnings"       value={`${totalEarnings.toFixed(2)} JD`}      color="var(--color-amber-600)" />
      <StatRow icon={Radio}   label="Orders"
        value={`${completedOrders.length} done · ${activeOrders.length} active`}
      />
      <StatRow icon={Clock}   label="Online since"   value={onlineSince} />

      {/* Last ping */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
        <span className="animate-pulse-soft" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--color-brand-600)", flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", flex: 1 }}>Last ping</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)" }}>{lastPingTime}</span>
      </div>

      {/* CO₂ equivalents */}
      {totalCo2 > 0 && (
        <div
          style={{
            marginTop: 12, padding: "var(--space-3)",
            borderRadius: "var(--radius-md)",
            background: "var(--color-brand-50)",
            border: "1px solid var(--color-brand-100)",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-brand-600)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            CO₂ Equivalents
          </div>
          {[
            { label: "Trees planted (1yr)",   value: `≈ ${equiv.trees}` },
            { label: "Car-km avoided",        value: `≈ ${equiv.carKm.toLocaleString()} km` },
            { label: "Smartphone charges",    value: `≈ ${equiv.phones.toLocaleString()}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: "var(--color-brand-500)" }}>{label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--color-brand-600)" }}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
