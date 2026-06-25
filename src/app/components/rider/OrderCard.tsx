import { MapPin, Leaf } from "lucide-react";
import { Order, ActiveRoute } from "../../types";
import { MATERIAL_CONFIG, ORDER_STATUS } from "../../constants";
import { ProgressTrail } from "./ProgressTrail";
import { RouteProgressBar } from "./RouteProgressBar";

interface OrderCardProps {
  order: Order;
  onOrderClick?: (orderId: string) => void;
  activeRoute?: ActiveRoute | null;
}

export function OrderCard({ order, onOrderClick, activeRoute }: OrderCardProps) {
  const mc = MATERIAL_CONFIG[order.material];
  const os = ORDER_STATUS[order.status];

  return (
    <div
      onClick={() => onOrderClick?.(order.id)}
      style={{
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-3)",
        border: `1px solid ${mc.color}25`,
        background: mc.bg,
        cursor: onOrderClick ? "pointer" : "default",
      }}
    >
      {/* Header: order ID + status badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 500, color: mc.color }}>
          {order.id}
        </span>
        <span
          style={{
            fontSize: 10, fontWeight: 600,
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            color: os.color,
            background: os.bg,
          }}
        >
          {os.label}
        </span>
      </div>

      {/* Material + quantity */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <mc.Icon size={13} color={mc.color} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)", flex: 1 }}>
          {order.material}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 700, color: mc.color, flexShrink: 0 }}>
          {order.quantity} {order.unit}
        </span>
      </div>

      {/* Address */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
        <MapPin size={10} color="var(--color-text-tertiary)" style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{order.address}</span>
      </div>

      {/* Progress trail */}
      {activeRoute && order.status === "inTransit" ? (
        <RouteProgressBar activeRoute={activeRoute} />
      ) : (
        <ProgressTrail status={order.status} accentColor={mc.color} />
      )}

      {/* Footer: CO₂ + earnings */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: 8, paddingTop: 8,
          borderTop: `1px solid ${mc.color}20`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Leaf size={10} color="var(--color-brand-600)" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-brand-600)", fontWeight: 500 }}>
            CO₂ {order.co2Saved.toFixed(1)} kg
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-amber-600)", fontWeight: 700 }}>
          {order.earnings.toFixed(2)} JD
        </span>
      </div>
    </div>
  );
}
