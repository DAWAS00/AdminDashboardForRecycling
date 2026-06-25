import { useEffect, useState } from "react";
import { ChevronRight, Phone } from "lucide-react";
import { Rider, ActiveRoute } from "../../types";
import {
  STATUS_CONFIG,
  MOTO_PATH,
  VAN_PATH,
  IDLE_WARNING_MS,
  IDLE_CRITICAL_MS,
} from "../../constants";
import { formatEta, etaColor, remainingSeconds } from "../../lib/eta";
import { deliveryElapsedMs, deliveryUrgencyLevel, idleElapsedMs } from "../../helpers";

interface RiderRowProps {
  rider: Rider;
  isSelected: boolean;
  maxEarnings: number;
  onSelect: (id: number) => void;
  activeRoute?: ActiveRoute | null;
}

/** Formats elapsed ms as "18 min" or "1h 3 min" */
function formatElapsed(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m} min` : `${h}h`;
}

export function RiderRow({ rider, isSelected, maxEarnings, onSelect, activeRoute }: RiderRowProps) {
  const sc            = STATUS_CONFIG[rider.status];
  const totalEarnings = rider.orders.reduce((s, o) => s + o.earnings, 0);
  const barPct        = maxEarnings > 0 ? Math.round((totalEarnings / maxEarnings) * 100) : 0;
  const isActive      = rider.status !== "idle";

  // Ticker for delivery timer — runs every second when rider is active
  const [, tick] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  // Slower ticker for idle warning — every 10 seconds is enough
  useEffect(() => {
    if (isActive) return;
    const id = setInterval(() => tick(n => n + 1), 10_000);
    return () => clearInterval(id);
  }, [isActive]);

  // ── Delivery timer ─────────────────────────────────────────────────────────
  const urgencyLevel = deliveryUrgencyLevel(rider);
  const activeOrder  = rider.orders.find(o => o.status === "inTransit" || o.status === "accepted");
  const elapsedMs    = activeOrder ? deliveryElapsedMs(activeOrder) : 0;

  const timerColor: string =
    urgencyLevel >= 3 ? "var(--color-danger-600)" :
    urgencyLevel === 2 ? "var(--color-amber-600)"  :
    urgencyLevel === 1 ? "var(--color-brand-600)"  :
    "transparent";

  // ── Idle warning ────────────────────────────────────────────────────────────
  const idleMs: number    = idleElapsedMs(rider);
  const idleColor: string | null =
    idleMs >= IDLE_CRITICAL_MS ? "var(--color-danger-600)" :
    idleMs >= IDLE_WARNING_MS  ? "var(--color-amber-600)"  :
    null; // null = don't show badge

  // ── Overtime / idle critical → pulsing red left border ────────────────────
  const showAlertBorder = urgencyLevel >= 4 || idleMs >= IDLE_CRITICAL_MS;

  // ── Earnings bar color ─────────────────────────────────────────────────────
  const barColor =
    barPct >= 70 ? "var(--color-brand-600)" :
    barPct >= 30 ? "var(--color-amber-600)" :
    "var(--color-text-disabled)";

  return (
    <button
      onClick={() => onSelect(rider.id)}
      aria-label={`Select rider ${rider.name}`}
      aria-pressed={isSelected}
      className="w-full text-left px-4 py-3 border-b transition-colors"
      style={{
        borderColor:  "var(--color-border)",
        background:   isSelected ? "var(--color-surface-card)" : "transparent",
        opacity:      isActive ? 1 : 0.7,
        cursor:       "pointer",
        position:     "relative",
        // Selected brand border — overridden by alert border div below when alert is active
        boxShadow: !showAlertBorder && isSelected
          ? "inset 3px 0 0 var(--color-brand-600)"
          : "none",
      }}
    >
      {/* Pulsing danger left border — only renders at level 4 or critical idle */}
      {showAlertBorder && (
        <div
          aria-hidden="true"
          style={{
            position:   "absolute",
            left: 0, top: 0, bottom: 0,
            width:      3,
            background: "var(--color-danger-600)",
            animation:  "pulse-danger 1.2s ease-in-out infinite",
          }}
        />
      )}

      <div className="flex items-center gap-3">
        {/* Vehicle icon circle */}
        <div
          className="flex-shrink-0 flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: "50%", background: sc.bg }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={sc.dot}>
            <path d={rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH} />
          </svg>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">

          {/* Row 1: name + phone icon + vehicle label */}
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="truncate" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {rider.name}
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* One-Click Call — stopPropagation so it doesn't trigger onSelect */}
              <a
                href={`tel:${rider.phone.replace(/\s/g, "")}`}
                aria-label={`Call ${rider.name} at ${rider.phone}`}
                onClick={e => e.stopPropagation()}
                style={{
                  display: "flex", alignItems: "center",
                  color: "var(--color-text-tertiary)",
                  padding: "2px 4px",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                <Phone size={11} />
              </a>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-tertiary)" }}>
                {rider.vehicle}
              </span>
            </div>
          </div>

          {/* Row 2: status dot + label + timer chip OR idle warning */}
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <span style={{
                display: "inline-block", width: 6, height: 6,
                borderRadius: "50%", background: sc.dot, flexShrink: 0,
              }} />
              <span style={{ fontSize: 11, color: sc.color }}>{sc.label}</span>
            </div>

            {/* Delivery Timer Chip */}
            {isActive && urgencyLevel > 0 && elapsedMs > 0 && (
              <span style={{
                fontFamily:     "var(--font-mono)",
                fontSize:       10,
                fontWeight:     600,
                color:          timerColor,
                background:     timerColor + "1A", // 10% opacity
                borderRadius:   "var(--radius-full)",
                padding:        "1px 6px",
              }}>
                {formatElapsed(elapsedMs)}
              </span>
            )}

            {/* Idle Warning Chip */}
            {!isActive && idleColor !== null && idleMs > 0 && (
              <span style={{
                fontFamily:   "var(--font-mono)",
                fontSize:     10,
                fontWeight:   600,
                color:        idleColor,
                background:   idleColor + "1A",
                borderRadius: "var(--radius-full)",
                padding:      "1px 6px",
              }}>
                Idle {formatElapsed(idleMs)}
              </span>
            )}
          </div>

          {/* Active riders: earnings bar + optional ETA from active route */}
          {isActive && (
            <>
              <div className="flex items-center gap-2">
                <div style={{ flex: 1, height: 5, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barPct}%`, borderRadius: "var(--radius-full)", background: barColor, transition: "width 0.3s ease" }} />
                </div>
                <span style={{
                  fontFamily: "var(--font-mono)", fontSize: 10, color: barColor,
                  fontWeight: 600, flexShrink: 0, minWidth: 42, textAlign: "right",
                }}>
                  {totalEarnings.toFixed(2)} JD
                </span>
              </div>

              {activeRoute && (() => {
                const rem = remainingSeconds(activeRoute.route.adjustedDurationSeconds, activeRoute.startedAt);
                const col = etaColor(rem, activeRoute.route.adjustedDurationSeconds);
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: col, flexShrink: 0 }} className="animate-pulse-soft" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: col, fontWeight: 600 }}>
                      {formatEta(rem)}
                    </span>
                  </div>
                );
              })()}
            </>
          )}

          {/* Idle riders with no warning: dash fallback */}
          {!isActive && idleColor === null && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-disabled)" }}>—</span>
          )}

        </div>

        <ChevronRight size={14} color="var(--color-text-disabled)" className="flex-shrink-0" />
      </div>
    </button>
  );
}
