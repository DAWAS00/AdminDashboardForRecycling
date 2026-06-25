import { useState } from "react";
import { X, AlertCircle, Wind } from "lucide-react";
import { Rider, ActiveRoute } from "../../types";
import { OrderCard } from "./OrderCard";
import { TodayStats } from "./TodayStats";

interface RiderDetailDrawerProps {
  rider: Rider;
  onClose: () => void;
  onOrderClick?: (riderId: number, orderId: string) => void;
  activeRoute?: ActiveRoute | null;
}

type Tab = "orders" | "today";

export function RiderDetailDrawer({ rider, onClose, onOrderClick, activeRoute }: RiderDetailDrawerProps) {
  // Tab state lives here — resets when rider changes
  const [tab, setTab] = useState<Tab>("orders");
  const totalCo2 = rider.orders.reduce((s, o) => s + o.co2Saved, 0);

  return (
    <div
      style={{
        background: "var(--color-surface-card)",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        maxHeight: 340,
        minHeight: 200,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "12px 16px 8px",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>
            {rider.name}
          </div>
          <div style={{ fontFamily: "var(--font-ar)", fontSize: 12, color: "var(--color-brand-600)", direction: "rtl" }}>
            {rider.nameAr}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
            {rider.phone} · {rider.vehicle}
          </div>
        </div>
        <button
          aria-label="Close rider detail"
          onClick={onClose}
          style={{
            width: 28, height: 28, border: "none", cursor: "pointer",
            background: "transparent", borderRadius: "var(--radius-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <X size={14} color="var(--color-text-tertiary)" />
        </button>
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        {(["orders", "today"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "8px 0",
              fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: "transparent",
              color: tab === t ? "var(--color-brand-600)" : "var(--color-text-tertiary)",
              borderBottom: tab === t ? "2px solid var(--color-brand-600)" : "2px solid transparent",
              textTransform: "capitalize",
            }}
          >
            {t === "orders"
              ? `Orders (${rider.orders.length})`
              : "Today"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: "auto" }}>
        {tab === "orders" && (
          <div style={{ padding: "var(--space-3)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {rider.orders.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center" }}>
                <AlertCircle size={22} color="var(--color-text-disabled)" style={{ margin: "0 auto 8px" }} />
                <p style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>No active orders</p>
              </div>
            ) : (
              rider.orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onOrderClick={(ordId) => onOrderClick?.(rider.id, ordId)}
                  activeRoute={activeRoute?.orderId === order.id ? activeRoute : null}
                />
              ))
            )}

            {/* Total CO₂ summary */}
            {rider.orders.length > 0 && totalCo2 > 0 && (
              <div
                style={{
                  borderRadius: "var(--radius-lg)",
                  padding: "10px 12px",
                  background: "var(--color-brand-100)",
                  border: "1px solid var(--color-brand-100)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Wind size={12} color="var(--color-brand-600)" />
                  <span style={{ fontSize: 11, color: "var(--color-brand-600)" }}>Total CO₂ saved</span>
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 700, color: "var(--color-brand-600)" }}>
                  {totalCo2.toFixed(1)} kg
                </span>
              </div>
            )}
          </div>
        )}

        {tab === "today" && (
          <TodayStats rider={rider} onlineTime={new Date(Date.now() - 5 * 60 * 60 * 1000)} />
        )}
      </div>
    </div>
  );
}
