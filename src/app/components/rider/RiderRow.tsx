import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Rider, ActiveRoute } from "../../types";
import { STATUS_CONFIG, MOTO_PATH, VAN_PATH } from "../../constants";
import { formatEta, etaColor, remainingSeconds } from "../../lib/eta";

interface RiderRowProps {
  rider: Rider;
  isSelected: boolean;
  maxEarnings: number;   // highest earnings among all riders today — for relative bar
  onSelect: (id: number) => void;
  activeRoute?: ActiveRoute | null;
}

export function RiderRow({ rider, isSelected, maxEarnings, onSelect, activeRoute }: RiderRowProps) {
  const sc = STATUS_CONFIG[rider.status];
  const totalEarnings = rider.orders.reduce((s, o) => s + o.earnings, 0);
  const barPct = maxEarnings > 0 ? Math.round((totalEarnings / maxEarnings) * 100) : 0;

  const [, tick] = useState(0);
  useEffect(() => {
    if (!activeRoute) return;
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [activeRoute]);

  const barColor =
    barPct >= 70 ? "var(--color-brand-600)" :
    barPct >= 30 ? "var(--color-amber-600)" :
    "var(--color-text-disabled)";

  const isActive = rider.status !== "idle";

  return (
    <button
      onClick={() => onSelect(rider.id)}
      aria-label={`Select rider ${rider.name}`}
      aria-pressed={isSelected}
      className="w-full text-left px-4 py-3 border-b transition-colors"
      style={{
        borderColor: "var(--color-border)",
        background: isSelected ? "var(--color-surface-card)" : "transparent",
        boxShadow: isSelected ? "inset 3px 0 0 var(--color-brand-600)" : "none",
        opacity: isActive ? 1 : 0.6,
        cursor: "pointer",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Vehicle icon */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 36, height: 36,
            borderRadius: "50%",
            background: sc.bg,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={sc.dot}>
            <path d={rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH} />
          </svg>
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span
              className="truncate"
              style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {rider.name}
            </span>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--color-text-tertiary)",
                flexShrink: 0,
              }}
            >
              {rider.vehicle}
            </span>
          </div>

          {/* Status + order count */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <span
                style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: sc.dot, flexShrink: 0 }}
              />
              <span style={{ fontSize: 11, color: sc.color }}>{sc.label}</span>
            </div>
            {rider.orders.length > 0 && (
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                · {rider.orders.length} order{rider.orders.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Earnings bar */}
          {isActive && (
            <>
              <div className="flex items-center gap-2">
                <div
                  style={{
                    flex: 1, height: 5,
                    borderRadius: "var(--radius-full)",
                    background: "var(--color-border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${barPct}%`,
                      borderRadius: "var(--radius-full)",
                      background: barColor,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: barColor,
                    fontWeight: 600,
                    flexShrink: 0,
                    minWidth: 42,
                    textAlign: "right",
                  }}
                >
                  {totalEarnings.toFixed(2)} JD
                </span>
              </div>

              {activeRoute && (() => {
                const rem = remainingSeconds(activeRoute.route.adjustedDurationSeconds, activeRoute.startedAt);
                const col = etaColor(rem, activeRoute.route.adjustedDurationSeconds);
                return (
                  <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:4 }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:col, flexShrink:0 }} className="animate-pulse-soft" />
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:col, fontWeight:600 }}>
                      {formatEta(rem)}
                    </span>
                  </div>
                );
              })()}
            </>
          )}

          {!isActive && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-disabled)" }}>—</span>
          )}
        </div>

        <ChevronRight size={14} color="var(--color-text-disabled)" className="flex-shrink-0" />
      </div>
    </button>
  );
}
