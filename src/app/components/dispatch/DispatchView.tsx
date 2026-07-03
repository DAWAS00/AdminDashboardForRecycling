import { useState, useMemo } from "react";
import { RefreshCw, MapPin, Truck, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { useOrders, OrderRow } from "../../../hooks/useOrders";
import { Rider } from "../../types";
import { ORDER_STATUS } from "../../constants";
import { haversineKm } from "../../helpers";
import type { SupabaseOrder } from "../../../lib/supabase";

import { useRiders } from "../../../hooks/useRiders";

const STATUS_TABS: { id: string; label: string; statuses: SupabaseOrder["status"][] }[] = [
  { id: "pending",   label: "Unassigned",  statuses: ["pending"] },
  { id: "active",    label: "Active Operations", statuses: ["accepted", "arrivedAtPickup", "inTransit", "arrivedAtDropoff"] },
  { id: "completed", label: "Completed",   statuses: ["completed"] },
  { id: "cancelled", label: "Cancelled",   statuses: ["cancelled"] },
];

export function DispatchView() {
  const { data: riders = [] } = useRiders();
  const [tab, setTab]                = useState("pending");
  const [selectedOrder, setSelected] = useState<OrderRow | null>(null);
  const [assigning, setAssigning]    = useState(false);
  const [error, setError]            = useState<string | null>(null);

  const activeTab = STATUS_TABS.find(t => t.id === tab)!;
  const { orders, loading, dispatchOrder, cancelOrder } = useOrders(activeTab.statuses);

  // Filters only idle riders
  const idleRiders = useMemo(() => riders.filter(r => r.status === "idle"), [riders]);

  // Matching Score Algorithm
  const calculateMatchScore = (order: OrderRow, rider: Rider) => {
    // 1. Proximity Score (Max 40 points)
    const dist = haversineKm(rider.lat, rider.lng, order.deliveryLat, order.deliveryLng);
    const distScore = Math.max(0, 40 - dist * 5); // 0km = 40 pts, 8km+ = 0 pts

    // 2. Payload & Material Type Match (Max 40 points)
    let capacityScore = 20;
    const isBulky = order.material === "Paper & Cardboard" || order.material === "Electronics" || order.quantity > 25;
    const isOil = order.material === "Cooking Oil";

    if (rider.vehicle === "Van") {
      if (isBulky) {
        capacityScore = 40; // Vans preferred for heavy/bulky waste
      } else if (isOil) {
        capacityScore = 25; // Vans are okay, but less agile for quick liquid pickup
      } else {
        capacityScore = 30;
      }
    } else { // Motorcycle
      if (isBulky) {
        capacityScore = 5; // Motorcycle is unsuitable for bulk/cardboard
      } else if (isOil) {
        capacityScore = 40; // Motorcycles are perfect for quick oil containers
      } else {
        capacityScore = 35;
      }
    }

    // 3. Urgency & Idle State Boost (Max 20 points)
    let urgencyScore = 15;
    if (order.isUrgent) {
      const idleTime = rider.idleSince ? Date.now() - rider.idleSince : 0;
      const idleMins = idleTime / (60 * 1000);
      urgencyScore = Math.min(20, 10 + idleMins); // long-waiting idle drivers get priority
    }

    return Math.round(distScore + capacityScore + urgencyScore);
  };

  // Rank riders based on score
  const rankedDrivers = useMemo(() => {
    if (!selectedOrder) return [];
    return idleRiders
      .map(r => {
        const score = calculateMatchScore(selectedOrder, r);
        const dist = haversineKm(r.lat, r.lng, selectedOrder.deliveryLat, selectedOrder.deliveryLng);
        return { rider: r, score, dist };
      })
      .sort((a, b) => b.score - a.score);
  }, [selectedOrder, idleRiders]);

  async function handleAssign(driverId: string) {
    if (!selectedOrder) return;
    setAssigning(true);
    setError(null);
    try {
      await dispatchOrder(selectedOrder.id, driverId, !!selectedOrder.driverId);
      setSelected(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Assignment failed.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleCancel(orderId: string) {
    setError(null);
    try {
      await cancelOrder(orderId);
      if (selectedOrder?.id === orderId) setSelected(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Cancel failed.");
    }
  }

  const statusCfg = (s: string) =>
    ORDER_STATUS[s as keyof typeof ORDER_STATUS] ?? { label: s, color: "#64748B", bg: "#F1F5F9" };

  return (
    <div className="flex h-full" style={{ background: "var(--color-surface)", fontFamily: "var(--font-sans)" }}>
      {/* Order list */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tab bar */}
        <div
          className="flex gap-1 px-5 pt-4 pb-3 border-b flex-shrink-0"
          style={{ background: "white", borderColor: "var(--color-border)" }}
        >
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setSelected(null); }}
              className="focus-ring transition-colors"
              style={{
                padding: "6px 16px",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                background: tab === t.id ? "var(--color-brand-600)" : "transparent",
                color: tab === t.id ? "white" : "var(--color-text-secondary)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ background: "var(--color-danger-100)", color: "var(--color-danger-600)", padding: "10px 16px", fontSize: 12, fontWeight: 500 }}>
            {error}
          </div>
        )}

        {/* Order cards */}
        <div className="flex-1 overflow-y-auto" style={{ padding: 16 }}>
          {loading ? (
            <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, padding: 32, textAlign: "center" }}>
              <div className="animate-pulse-soft">Loading operations orders…</div>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, padding: 32, textAlign: "center" }}>
              No orders in this category.
            </div>
          ) : orders.map(order => {
            const cfg = statusCfg(order.status);
            const isSelected = selectedOrder?.id === order.id;
            return (
              <div
                key={order.id}
                onClick={() => setSelected(s => s?.id === order.id ? null : order)}
                className="transition-all"
                style={{
                  background: isSelected ? "var(--color-brand-50)" : "var(--color-surface-card)",
                  border: `1.5px solid ${isSelected ? "var(--color-brand-600)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-lg)",
                  padding: "14px",
                  marginBottom: 10,
                  cursor: "pointer",
                  boxShadow: isSelected ? "var(--shadow-sm)" : "var(--shadow-xs)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {order.isUrgent && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                        background: "var(--color-amber-100)", color: "var(--color-amber-700)",
                        display: "flex", alignItems: "center", gap: 2
                      }}>
                        <Zap size={10} /> URGENT
                      </span>
                    )}
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: "var(--radius-full)",
                      background: cfg.bg, color: cfg.color,
                    }}>
                      {cfg.label}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "var(--color-text-primary)", fontWeight: 600, marginTop: 6 }}>
                  {order.material} &bull; {order.quantity} {order.unit}
                </div>

                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={11} color="var(--color-text-tertiary)" />
                  {order.address}
                </div>

                {tab === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(order); }}
                      style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--color-brand-600)", color: "white", cursor: "pointer" }}
                    >
                      Assign Driver
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleCancel(order.id); }}
                      style={{ fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "white", color: "var(--color-danger-600)", cursor: "pointer" }}
                    >
                      Cancel Order
                    </button>
                  </div>
                )}

                {tab === "active" && order.driverId && (
                  <button
                    onClick={e => { e.stopPropagation(); setSelected(order); }}
                    style={{ marginTop: 8, fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "white", color: "var(--color-brand-600)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <RefreshCw size={11} /> Reassign Rider
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign panel */}
      {selectedOrder && (tab === "pending" || tab === "active") && (
        <div style={{ width: 290, flexShrink: 0, background: "white", borderLeft: "1px solid var(--color-border)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--color-border)", background: "var(--color-neutral-50)" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "var(--color-brand-600)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {selectedOrder.driverId ? "Reassign Dispatch" : "Logistics Dispatch Helper"}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--color-text-primary)", marginTop: 6 }}>
              {selectedOrder.material}
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2 }}>
              Payload: <span style={{ fontWeight: 600 }}>{selectedOrder.quantity} {selectedOrder.unit}</span>
            </div>
          </div>

          {/* Drivers List sorted by Smart Score */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", marginBottom: 8, textTransform: "uppercase" }}>
              Available Idle Drivers ({rankedDrivers.length})
            </div>
            
            {rankedDrivers.length === 0 ? (
              <div style={{ fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center", padding: 24, fontStyle: "italic" }}>
                No idle drivers available in this area.
              </div>
            ) : rankedDrivers.map(({ rider, score, dist }) => {
              const isBest = score === rankedDrivers[0].score;
              const isBulky = selectedOrder.material === "Paper & Cardboard" || selectedOrder.material === "Electronics" || selectedOrder.quantity > 25;
              const capacityWarn = isBulky && rider.vehicle === "Motorcycle";
              
              // Color map for scores
              let scoreColor = "var(--color-text-secondary)";
              let scoreBg = "var(--color-neutral-100)";
              if (score >= 80) {
                scoreColor = "var(--color-brand-600)";
                scoreBg = "var(--color-brand-50)";
              } else if (score >= 50) {
                scoreColor = "var(--color-amber-700)";
                scoreBg = "var(--color-amber-50)";
              }

              return (
                <div
                  key={rider.id}
                  style={{
                    position: "relative",
                    borderRadius: "var(--radius-lg)",
                    border: `1.5px solid ${isBest ? "var(--color-brand-600)" : "var(--color-border)"}`,
                    background: "white",
                    padding: "12px",
                    marginBottom: 8,
                    boxShadow: isBest ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {isBest && (
                    <span style={{
                      position: "absolute", top: -8, right: 10,
                      background: "var(--color-brand-600)", color: "white",
                      fontSize: 8, fontWeight: 800, padding: "2px 6px",
                      borderRadius: 4, letterSpacing: "0.06em", border: "1px solid white"
                    }}>
                      BEST MATCH
                    </span>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-primary)" }}>{rider.name}</div>
                      <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        {rider.vehicle === "Van" ? <Truck size={11} /> : <span style={{ fontSize: 10 }}>🏍️</span>}
                        {rider.vehicle} &bull; {dist.toFixed(1)} km
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: 11, fontWeight: 800, padding: "4px 8px", borderRadius: 6,
                      background: scoreBg, color: scoreColor, fontFamily: "var(--font-mono)"
                    }}>
                      {score}%
                    </div>
                  </div>

                  {capacityWarn && (
                    <div style={{
                      marginTop: 8, padding: "6px 8px", borderRadius: "var(--radius-sm)",
                      background: "var(--color-danger-100)", color: "var(--color-danger-600)",
                      fontSize: 9, fontWeight: 600, display: "flex", alignItems: "center", gap: 4
                    }}>
                      <AlertTriangle size={11} /> Cargo limit: Van recommended
                    </div>
                  )}

                  <button
                    disabled={assigning}
                    onClick={() => handleAssign(String(rider.id))}
                    className="focus-ring"
                    style={{
                      width: "100%", marginTop: 10, padding: "6px", borderRadius: "var(--radius-sm)",
                      border: "none", background: isBest ? "var(--color-brand-600)" : "var(--color-neutral-900)",
                      color: "white", fontSize: 11, fontWeight: 700, cursor: assigning ? "not-allowed" : "pointer"
                    }}
                  >
                    Confirm Assign
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ padding: 12, borderTop: "1px solid var(--color-border)" }}>
            <button
              onClick={() => setSelected(null)}
              className="focus-ring"
              style={{ width: "100%", padding: "7px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "white", fontSize: 12, color: "var(--color-text-secondary)", cursor: "pointer", fontWeight: 600 }}
            >
              Cancel Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
