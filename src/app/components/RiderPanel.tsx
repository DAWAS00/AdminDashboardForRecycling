import { useState } from "react";
import { Rider, ActiveRoute, CompletedTrip } from "../types";
import { PANEL_WIDTH, IDLE_WARNING_MS, IDLE_CRITICAL_MS } from "../constants";
import { deliveryUrgencyLevel, idleElapsedMs } from "../helpers";
import { FleetSummaryHeader } from "./rider/FleetSummaryHeader";
import { RiderRow }           from "./rider/RiderRow";
import { RiderDetailDrawer }  from "./rider/RiderDetailDrawer";

type FilterTab = "all" | "active" | "idle" | "alerts";

interface RiderPanelProps {
  riders: Rider[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onClose: () => void;
  time: Date;
  onOrderClick: (riderId: number, orderId: string) => void;
  activeRoute: ActiveRoute | null;
  completedTrips: CompletedTrip[];
}

export function RiderPanel({
  riders, selectedId, onSelect, onClose, time,
  onOrderClick, activeRoute, completedTrips,
}: RiderPanelProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const selected = riders.find(r => r.id === selectedId) ?? null;

  const maxEarnings = Math.max(
    ...riders.map(r => r.orders.reduce((s, o) => s + o.earnings, 0)),
    0,
  );

  // Count critical alerts for the Alerts tab badge
  const alertCount = riders.filter(r =>
    deliveryUrgencyLevel(r) >= 4 || idleElapsedMs(r) >= IDLE_CRITICAL_MS
  ).length;

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = riders.filter(r => {
    if (filter === "active")  return r.status !== "idle";
    if (filter === "idle")    return r.status === "idle";
    if (filter === "alerts")  return deliveryUrgencyLevel(r) >= 4 || idleElapsedMs(r) >= IDLE_CRITICAL_MS;
    return true; // "all"
  });

  // ── Urgency Sort — highest urgency floats to top ───────────────────────────
  function priority(r: Rider): number {
    const urg  = deliveryUrgencyLevel(r);
    const idle = idleElapsedMs(r);
    if (urg >= 4)                  return 100; // critically overdue delivery
    if (idle >= IDLE_CRITICAL_MS)  return  90; // critically idle
    if (urg === 3)                 return  70; // late delivery
    if (idle >= IDLE_WARNING_MS)   return  60; // idle warning
    if (urg >= 1)                  return  40; // active, on track
    return 10;                                  // idle, no warning
  }

  const sorted = [...filtered].sort((a, b) => priority(b) - priority(a));

  // ── Tab style helper ─────────────────────────────────────────────────────────
  function tabStyle(tab: FilterTab): React.CSSProperties {
    const isAlert   = tab === "alerts";
    const isActive  = filter === tab;
    const activeClr = isAlert ? "var(--color-danger-600)" : "var(--color-brand-600)";
    return {
      flex: 1,
      padding: "5px 4px",
      fontSize: 10,
      fontWeight: 600,
      fontFamily: "var(--font-sans)",
      letterSpacing: "0.04em",
      cursor: "pointer",
      border: "none",
      borderBottom: isActive ? `2px solid ${activeClr}` : "2px solid transparent",
      background: "transparent",
      color: isActive ? activeClr : "var(--color-text-tertiary)",
      transition: "color 0.15s, border-color 0.15s",
    };
  }

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{ width: PANEL_WIDTH, flexShrink: 0, borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* Zone 1 — Fleet Summary */}
      <FleetSummaryHeader riders={riders} time={time} />

      {/* Zone 1b — Filter Tabs */}
      <div className="flex border-b flex-shrink-0" style={{ background: "white", borderColor: "var(--color-border)" }}>
        <button style={tabStyle("all")}    onClick={() => setFilter("all")}>All</button>
        <button style={tabStyle("active")} onClick={() => setFilter("active")}>Active</button>
        <button style={tabStyle("idle")}   onClick={() => setFilter("idle")}>Idle</button>
        <button
          style={tabStyle("alerts")}
          onClick={() => setFilter("alerts")}
          aria-label={`Alerts — ${alertCount} rider${alertCount !== 1 ? "s" : ""} need attention`}
        >
          Alerts
          {alertCount > 0 && (
            <span style={{
              marginLeft: 4,
              background: "var(--color-danger-600)",
              color: "white",
              borderRadius: "var(--radius-full)",
              padding: "0 4px",
              fontSize: 9,
              fontWeight: 700,
              lineHeight: "14px",
              display: "inline-block",
              verticalAlign: "middle",
            }}>
              {alertCount}
            </span>
          )}
        </button>
      </div>

      {/* Zone 2 — Rider List (sorted, filtered) */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {sorted.length === 0 && (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: 12 }}>
            No riders match this filter
          </div>
        )}
        {sorted.map(rider => (
          <RiderRow
            key={rider.id}
            rider={rider}
            isSelected={rider.id === selectedId}
            maxEarnings={maxEarnings}
            onSelect={onSelect}
            activeRoute={activeRoute?.riderId === rider.id ? activeRoute : null}
          />
        ))}
      </div>

      {/* Zone 3 — Detail Drawer */}
      {selected && (
        <RiderDetailDrawer
          rider={selected}
          onClose={onClose}
          onOrderClick={onOrderClick}
          activeRoute={activeRoute}
        />
      )}
    </div>
  );
}
