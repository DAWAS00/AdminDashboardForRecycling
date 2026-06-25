import { Rider, ActiveRoute, CompletedTrip } from "../types";
import { PANEL_WIDTH } from "../constants";
import { FleetSummaryHeader } from "./rider/FleetSummaryHeader";
import { RiderRow }           from "./rider/RiderRow";
import { RiderDetailDrawer }  from "./rider/RiderDetailDrawer";

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
  onOrderClick, activeRoute, completedTrips
}: RiderPanelProps) {
  const selected = riders.find(r => r.id === selectedId) ?? null;

  const maxEarnings = Math.max(
    ...riders.map(r => r.orders.reduce((s, o) => s + o.earnings, 0)),
    0,
  );

  return (
    <div
      className="flex flex-col h-full border-l"
      style={{
        width: PANEL_WIDTH,
        flexShrink: 0,
        borderColor: "var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      {/* Zone 1 — Fleet Summary */}
      <FleetSummaryHeader riders={riders} time={time} />

      {/* Zone 2 — Rider List (scrollable, shrinks when drawer is open) */}
      <div className="scrollbar-hide" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {riders.map(rider => (
          <RiderRow
            key={rider.id}
            rider={rider}
            isSelected={rider.id === selectedId}
            maxEarnings={maxEarnings}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* Zone 3 — Detail Drawer (shown when a rider is selected) */}
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
