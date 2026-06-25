import { useState } from "react";
import { CheckSquare, Square, ChevronUp, ChevronDown, Calendar } from "lucide-react";
import { Hub } from "../types";
import { HUB_STATUS_CONFIG, PANEL_WIDTH } from "../constants";
import { hubCapacityPct, hubCapacityColor } from "../helpers";

interface HubsPanelProps {
  hubs: Hub[];
  setHubs: React.Dispatch<React.SetStateAction<Hub[]>>;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function HubsPanel({ hubs, setHubs, selectedId, onSelect }: HubsPanelProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggleActive = (id: number) =>
    setHubs(prev => prev.map(h => h.id === id ? { ...h, active: !h.active } : h));

  const scheduleShipment = (id: number) =>
    setHubs(prev => prev.map(h => h.id === id ? { ...h, status: "ready" } : h));

  const markShipped = (id: number) =>
    setHubs(prev => prev.map(h => h.id === id
      ? { ...h, status: "shipped", currentLoad: { cookingOil: 0, plastic: 0, paper: 0, electronics: 0 }, lastShipmentDate: new Date().toISOString().slice(0, 10) }
      : h));

  return (
    <div className="flex flex-col h-full border-l" style={{ width: PANEL_WIDTH, flexShrink: 0, borderColor: "#E2E8F0", background: "#F4F6F5" }}>
      <div className="px-4 py-3 bg-white border-b flex items-center justify-between" style={{ borderColor: "#E2E8F0" }}>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.1em" }}>COLLECTION HUBS</span>
        <span className="px-2.5 py-0.5 rounded-full text-white font-semibold" style={{ background: "#1E5C35", fontFamily: "'DM Sans',sans-serif", fontSize: 11 }}>
          {hubs.filter(h => h.active).length} active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {hubs.map(hub => {
          const capPct = hubCapacityPct(hub);
          const capColor = hubCapacityColor(capPct);
          const sc = HUB_STATUS_CONFIG[hub.status];
          const isExp = expanded === hub.id;
          const totalLoad = hub.currentLoad.cookingOil + hub.currentLoad.plastic + hub.currentLoad.paper + hub.currentLoad.electronics;

          return (
            <div key={hub.id} className="border-b" style={{ borderColor: "#E2E8F0", background: selectedId === hub.id ? "#fff" : "transparent", boxShadow: selectedId === hub.id ? "inset 3px 0 0 #1E5C35" : "none" }}>
              {/* Hub row */}
              <div className="px-4 py-3 flex items-start gap-3">
                {/* Checkbox */}
                <button
                  aria-label={`${hub.active ? "Deactivate" : "Activate"} ${hub.name}`}
                  onClick={() => toggleActive(hub.id)}
                  className="mt-0.5 flex-shrink-0 transition-colors"
                >
                  {hub.active
                    ? <CheckSquare size={18} color="#1E5C35" />
                    : <Square size={18} color="#CBD5E1" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0" onClick={() => onSelect(hub.id)} style={{ cursor: "pointer" }}>
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="truncate" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: hub.active ? "#1a1a1a" : "#94A3B8" }}>{hub.name}</span>
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-semibold" style={{ color: sc.color, background: sc.bg, fontFamily: "'DM Sans',sans-serif", fontSize: 10 }}>{sc.label}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>{hub.address}</div>

                  {/* Capacity bar */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "#E2E8F0" }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${capPct}%`, background: capColor }} />
                    </div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: capColor, fontWeight: 600, flexShrink: 0 }}>{capPct}%</span>
                  </div>

                  {/* Material chips */}
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {hub.currentLoad.cookingOil > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: "#C8860A", background: "#FEF3C7", borderRadius: 4, padding: "1px 5px" }}>Oil {hub.currentLoad.cookingOil}L</span>}
                    {hub.currentLoad.plastic > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: "#1E40AF", background: "#DBEAFE", borderRadius: 4, padding: "1px 5px" }}>Plastic {hub.currentLoad.plastic}kg</span>}
                    {hub.currentLoad.paper > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: "#166534", background: "#DCFCE7", borderRadius: 4, padding: "1px 5px" }}>Paper {hub.currentLoad.paper}kg</span>}
                    {hub.currentLoad.electronics > 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, fontWeight: 600, color: "#6D28D9", background: "#EDE9FE", borderRadius: 4, padding: "1px 5px" }}>E-waste {hub.currentLoad.electronics}kg</span>}
                    {totalLoad === 0 && <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "#94A3B8" }}>Empty</span>}
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-1.5">
                    <Calendar size={10} color="#94A3B8" />
                    <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, color: "#94A3B8" }}>
                      {hub.schedule === "weekly" ? "Weekly" : "Monthly"} · Next: {hub.nextShipmentDate}
                    </span>
                  </div>
                </div>

                {/* Expand toggle */}
                <button
                  aria-label={isExp ? "Collapse hub details" : "Expand hub details"}
                  onClick={() => setExpanded(isExp ? null : hub.id)}
                  className="flex-shrink-0 mt-0.5 p-0.5"
                >
                  {isExp ? <ChevronUp size={14} color="#94A3B8" /> : <ChevronDown size={14} color="#94A3B8" />}
                </button>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div className="px-4 pb-3 space-y-2 border-t" style={{ borderColor: "#F1F5F9" }}>
                  <div className="pt-2 flex items-center gap-2">
                    <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10, fontWeight: 700, color: "#64748B", letterSpacing: "0.08em" }}>LAST SHIPMENT</div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#64748B" }}>{hub.lastShipmentDate}</span>
                  </div>
                  <div className="flex gap-2">
                    {hub.status === "collecting" && hub.active && (
                      <button onClick={() => scheduleShipment(hub.id)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: "#FEF3C7", color: "#C8860A", fontFamily: "'DM Sans',sans-serif" }}>
                        Schedule Shipment
                      </button>
                    )}
                    {hub.status === "ready" && (
                      <button onClick={() => markShipped(hub.id)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                        style={{ background: "#D1FAE5", color: "#1E5C35", fontFamily: "'DM Sans',sans-serif" }}>
                        ✓ Mark as Shipped
                      </button>
                    )}
                    {hub.status === "shipped" && (
                      <div className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-center" style={{ background: "#DBEAFE", color: "#1E40AF", fontFamily: "'DM Sans',sans-serif" }}>
                        Shipped ✓
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
