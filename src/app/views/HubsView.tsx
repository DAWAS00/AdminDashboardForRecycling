import { HUB_STATUS_CONFIG } from "../constants";
import { useHubs } from "../../hooks/useHubs";
import { useHubStore } from "../../stores/hubStore";
import { HubsMapLayer } from "../components/HubsMapLayer";
import { HubsPanel } from "../components/HubsPanel";
import { AddHubModal } from "../components/AddHubModal";
import type { Hub } from "../types";

export function HubsView() {
  const { data: hubs = [], toggleHubActive, updateHubStatus, addHub } = useHubs();

  const selectedHub  = useHubStore((s) => s.selectedHubId);
  const selectHub    = useHubStore((s) => s.selectHub);
  const placingHub   = useHubStore((s) => s.placingHub);
  const pendingCoords = useHubStore((s) => s.pendingCoords);
  const cancelPlacing = useHubStore((s) => s.cancelPlacing);
  const confirmCoords = useHubStore((s) => s.confirmCoords);

  const handleAddHub = async (data: Omit<Hub, "id">) => {
    await addHub.mutateAsync(data);
    cancelPlacing();
  };

  return (
    <>
      <div className="flex-1 relative min-w-0">
        <HubsMapLayer hubs={hubs} selectedId={selectedHub} onSelect={selectHub} placing={placingHub} onPlace={confirmCoords} />

        {placingHub && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] px-4 py-2 rounded-lg" style={{ background: "var(--color-amber-50)", border: "1.5px solid var(--color-amber-400)", boxShadow: "var(--shadow-md)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-amber-700)" }}>Click anywhere on the map to place the hub</span>
          </div>
        )}

        <div className="absolute top-3 left-3 z-[500] flex gap-2" style={{ display: placingHub ? "none" : "flex" }}>
          {Object.entries(HUB_STATUS_CONFIG).map(([key, cfg]) => {
            const count = hubs.filter((h) => h.status === key && h.active).length;
            const dimmed = count === 0;
            return (
              <div
                key={key}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-opacity"
                style={{
                  background: "white",
                  boxShadow: "var(--shadow-sm)",
                  opacity: dimmed ? 0.4 : 1,
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--color-neutral-900)",
                  }}
                >
                  {count}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--color-neutral-400)",
                  }}
                >
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>

        {pendingCoords && (
          <AddHubModal
            lat={pendingCoords.lat}
            lng={pendingCoords.lng}
            onConfirm={handleAddHub}
            onCancel={cancelPlacing}
          />
        )}
      </div>

      <HubsPanel
        hubs={hubs}
        selectedId={selectedHub}
        onSelect={selectHub}
        onToggleActive={(id, active) => toggleHubActive.mutate({ hubId: id, active })}
        onUpdateStatus={(id, status) => updateHubStatus.mutate({ hubId: id, status })}
      />
    </>
  );
}
