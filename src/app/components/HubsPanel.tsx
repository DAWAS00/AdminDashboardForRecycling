import { useState } from "react";
import { ChevronUp, ChevronDown, Calendar, Warehouse, PackagePlus } from "lucide-react";
import { Hub } from "../types";
import {
  HUB_STATUS_CONFIG,
  MATERIAL_CONFIG,
  PANEL_WIDTH,
} from "../constants";
import { hubCapacityPct, hubCapacityColor } from "../helpers";

interface HubsPanelProps {
  hubs: Hub[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleActive: (id: string, active: boolean) => Promise<void>;
  onUpdateStatus: (id: string, status: Hub["status"]) => Promise<void>;
}

/** Ordered material keys for chip rendering — short chip label + config key. */
const MATERIAL_KEYS: {
  key: keyof Hub["currentLoad"];
  chipLabel: string;
  configKey: keyof typeof MATERIAL_CONFIG;
}[] = [
  { key: "cookingOil",  chipLabel: "Oil",     configKey: "Cooking Oil" },
  { key: "plastic",     chipLabel: "Plastic", configKey: "Plastic Bottles" },
  { key: "paper",       chipLabel: "Paper",   configKey: "Paper & Cardboard" },
  { key: "electronics", chipLabel: "E-waste", configKey: "Electronics" },
];

/** Compact on/off switch — keyboard accessible, design-system compliant. */
function ActiveToggle({
  active,
  onChange,
  ariaLabel,
}: {
  active: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={ariaLabel}
      onClick={(e) => e.stopPropagation()}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange();
        }
      }}
      className="flex-shrink-0 flex items-center focus-ring"
      style={{
        width: 32,
        height: 18,
        borderRadius: "var(--radius-full)",
        background: active ? "var(--color-brand-600)" : "var(--color-border-strong)",
        border: "none",
        cursor: "pointer",
        padding: 2,
        transition: "background 0.18s ease",
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transform: active ? "translateX(14px)" : "translateX(0)",
          transition: "transform 0.18s ease",
        }}
      />
    </button>
  );
}

export function HubsPanel({
  hubs,
  selectedId,
  onSelect,
  onToggleActive,
  onUpdateStatus,
}: HubsPanelProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

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
      {/* Header */}
      <div
        className="px-4 py-3 bg-white border-b flex items-center justify-between"
        style={{ borderColor: "var(--color-border)" }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--color-text-tertiary)",
            letterSpacing: "0.1em",
          }}
        >
          COLLECTION HUBS
        </span>
        <span
          className="px-2.5 py-0.5 rounded-full text-white font-semibold"
          style={{
            background: "var(--color-brand-600)",
            fontSize: 11,
          }}
        >
          {hubs.filter((h) => h.active).length} active
        </span>
      </div>

      {hubs.length === 0 ? (
        /* Empty state — anti-pattern #10 fix */
        <div
          className="flex-1 flex flex-col items-center justify-center text-center px-8"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "var(--radius-lg)",
              background: "var(--color-brand-50)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "var(--space-3)",
            }}
          >
            <Warehouse size={20} style={{ color: "var(--color-brand-600)" }} />
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: 4,
            }}
          >
            No hubs yet
          </div>
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            Click <span style={{ fontWeight: 600 }}>Add Hub</span> in the header
            to place your first collection point on the map.
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {hubs.map((hub) => {
            const capPct = hubCapacityPct(hub);
            const capColor = hubCapacityColor(capPct);
            const sc = HUB_STATUS_CONFIG[hub.status];
            const isExp = expanded === hub.id;
            const isSelected = selectedId === hub.id;
            const totalLoad =
              hub.currentLoad.cookingOil +
              hub.currentLoad.plastic +
              hub.currentLoad.paper +
              hub.currentLoad.electronics;

            return (
              <div
                key={hub.id}
                className="border-b"
                style={{
                  borderColor: "var(--color-border)",
                  background: isSelected ? "var(--color-surface-card)" : "transparent",
                  boxShadow: isSelected
                    ? "inset 3px 0 0 var(--color-brand-600)"
                    : "none",
                }}
              >
                {/* Hub row */}
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="pt-0.5 flex-shrink-0">
                    <ActiveToggle
                      active={hub.active}
                      onChange={() => onToggleActive(hub.id, !hub.active)}
                      ariaLabel={`${hub.active ? "Deactivate" : "Activate"} ${hub.name}`}
                    />
                  </div>

                  {/* Content (selectable) */}
                  <button
                    type="button"
                    onClick={() => onSelect(hub.id)}
                    aria-label={`Select ${hub.name}`}
                    aria-pressed={isSelected}
                    className="flex-1 min-w-0 text-left focus-ring"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span
                        className="truncate"
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: hub.active
                            ? "var(--color-text-primary)"
                            : "var(--color-text-tertiary)",
                        }}
                      >
                        {hub.name}
                      </span>
                      <span
                        className="flex-shrink-0 px-1.5 py-0.5 rounded-full font-semibold"
                        style={{
                          color: sc.color,
                          background: sc.bg,
                          fontSize: 10,
                        }}
                      >
                        {sc.label}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--color-text-tertiary)",
                        marginBottom: 6,
                      }}
                    >
                      {hub.address}
                    </div>

                    {/* Capacity bar */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="flex-1 rounded-full"
                        style={{
                          height: 6,
                          background: "var(--color-border)",
                        }}
                      >
                        <div
                          className="rounded-full transition-all"
                          style={{
                            height: 6,
                            width: `${capPct}%`,
                            background: capColor,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color: capColor,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {capPct}%
                      </span>
                    </div>

                    {/* Material chips — driven by MATERIAL_CONFIG */}
                    {totalLoad === 0 ? (
                      <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>
                        Empty
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {MATERIAL_KEYS.map(({ key, chipLabel, configKey }) => {
                          const amount = hub.currentLoad[key];
                          if (amount <= 0) return null;
                          const mc = MATERIAL_CONFIG[configKey];
                          return (
                            <span
                              key={key}
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: mc.color,
                                background: mc.bg,
                                borderRadius: "var(--radius-sm)",
                                padding: "2px 6px",
                              }}
                            >
                              {chipLabel} {amount}
                              {mc.unit}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Schedule */}
                    <div className="flex items-center gap-1.5">
                      <Calendar size={10} style={{ color: "var(--color-text-tertiary)" }} />
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--color-text-tertiary)",
                        }}
                      >
                        {hub.schedule === "weekly" ? "Weekly" : "Monthly"} · Next:{" "}
                        {hub.nextShipmentDate}
                      </span>
                    </div>
                  </button>

                  {/* Expand toggle */}
                  <button
                    type="button"
                    aria-label={isExp ? "Collapse hub details" : "Expand hub details"}
                    aria-expanded={isExp}
                    onClick={() => setExpanded(isExp ? null : hub.id)}
                    className="flex-shrink-0 mt-0.5 p-1 focus-ring"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {isExp ? (
                      <ChevronUp size={14} style={{ color: "var(--color-text-tertiary)" }} />
                    ) : (
                      <ChevronDown size={14} style={{ color: "var(--color-text-tertiary)" }} />
                    )}
                  </button>
                </div>

                {/* Expanded detail — shipment workflow unchanged */}
                {isExp && (
                  <div
                    className="px-4 pb-3 space-y-2 border-t"
                    style={{ borderColor: "var(--color-neutral-100)" }}
                  >
                    <div className="pt-2 flex items-center gap-2">
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--color-text-secondary)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        LAST SHIPMENT
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {hub.lastShipmentDate}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {hub.status === "collecting" && hub.active && (
                        <button
                          onClick={() => onUpdateStatus(hub.id, "ready")}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-ring"
                          style={{
                            background: "var(--color-amber-100)",
                            color: "var(--color-amber-600)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Schedule Shipment
                        </button>
                      )}
                      {hub.status === "ready" && (
                        <button
                          onClick={() => onUpdateStatus(hub.id, "shipped")}
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors focus-ring"
                          style={{
                            background: "var(--color-brand-100)",
                            color: "var(--color-brand-600)",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Mark as Shipped
                        </button>
                      )}
                      {hub.status === "shipped" && (
                        <div
                          className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1"
                          style={{
                            background: "var(--color-plastic-bg)",
                            color: "var(--color-plastic)",
                          }}
                        >
                          <PackagePlus size={12} />
                          Shipped
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
