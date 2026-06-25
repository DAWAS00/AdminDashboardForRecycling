import { Rider } from "../../types";
import { STATUS_CONFIG } from "../../constants";
import { computeTotals, hasFleetAlerts } from "../../helpers";

interface FleetSummaryHeaderProps {
  riders: Rider[];
  time: Date;
}

export function FleetSummaryHeader({ riders, time }: FleetSummaryHeaderProps) {
  const { co2, earnings } = computeTotals(riders);
  const alertActive = hasFleetAlerts(riders);

  const counts = {
    delivering: riders.filter(r => r.status === "delivering").length,
    picking_up: riders.filter(r => r.status === "picking_up").length,
    idle:       riders.filter(r => r.status === "idle").length,
  };

  const timeStr = time.toLocaleTimeString("en-JO", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });

  return (
    <div className="px-4 py-3 bg-white border-b flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>

      {/* Row 1: "Fleet Status" label + alert dot + clock */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: "var(--color-text-tertiary)",
            letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Fleet Status
          </span>
          {/* Alert Dot — only renders when any rider has a critical issue */}
          {alertActive && (
            <span
              aria-label="Fleet has critical alerts — check Alerts tab"
              title="One or more riders need immediate attention"
              style={{
                display:     "inline-block",
                width:       8,
                height:      8,
                borderRadius: "50%",
                background:  "var(--color-danger-600)",
                animation:   "pulse-danger 1.2s ease-in-out infinite",
                flexShrink:  0,
              }}
            />
          )}
        </div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-tertiary)" }}>
          {timeStr}
        </span>
      </div>

      {/* Row 2: status dots with counts */}
      <div className="flex items-center gap-3 mb-2">
        {(["delivering", "picking_up", "idle"] as const).map(status => {
          const cfg   = STATUS_CONFIG[status];
          const count = counts[status];
          if (count === 0) return null;
          return (
            <div key={status} className="flex items-center gap-1.5">
              <span
                className={status !== "idle" ? "animate-pulse-soft" : undefined}
                style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }}
              />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-text-primary)", fontWeight: 600 }}>
                {count}
              </span>
              <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
                {cfg.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Row 3: CO₂ + Earnings */}
      <div className="flex items-center justify-between">
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>CO₂ Today</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--color-brand-600)", lineHeight: 1.2 }}>
            {co2.toFixed(1)}
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", marginLeft: 3 }}>kg</span>
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Earnings Today</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, fontWeight: 700, color: "var(--color-amber-600)", lineHeight: 1.2 }}>
            {earnings.toFixed(2)}
            <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", marginLeft: 3 }}>JD</span>
          </div>
        </div>
      </div>

    </div>
  );
}
