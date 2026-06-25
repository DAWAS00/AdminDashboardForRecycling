import { useEffect, useState } from "react";
import { formatEta, formatArrivalTime, etaColor, kmRemaining } from "../../lib/eta";
import type { ActiveRoute } from "../../types";

export function RouteProgressBar({ activeRoute }: { activeRoute: ActiveRoute }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const { route, startedAt, progressPct, currentCoordIndex } = activeRoute;
  const { adjustedDurationSeconds, distanceKm, coords, isFallback } = route;
  const remaining = adjustedDurationSeconds - (Date.now() - startedAt) / 1000;
  const color     = etaColor(remaining, adjustedDurationSeconds);
  const kmLeft    = kmRemaining(currentCoordIndex, coords.length, distanceKm);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--color-brand-600)", flexShrink:0 }} />
        <div style={{ flex:1, height:6, borderRadius:"var(--radius-full)", background:"var(--color-border)", overflow:"hidden", position:"relative" }}>
          <div style={{ position:"absolute", top:0, left:0, height:"100%", width:`${progressPct}%`, borderRadius:"var(--radius-full)", background:color, transition:"width 0.25s ease" }} />
          <div style={{ position:"absolute", top:"50%", left:`${progressPct}%`, transform:"translate(-50%,-50%)", width:10, height:10, borderRadius:"50%", background:color, border:"2px solid white", boxShadow:`0 0 0 2px ${color}`, transition:"left 0.25s ease" }} className="animate-pulse-soft" />
        </div>
        <div style={{ width:8, height:8, borderRadius:2, background:"var(--color-amber-600)", flexShrink:0 }} />
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-text-tertiary)" }}>
          {kmLeft > 0 ? `${kmLeft} km left` : "Arrived"}
          {isFallback && <span style={{ marginLeft:4, color:"var(--color-text-disabled)" }}>(est.)</span>}
        </span>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:11, color, fontWeight:700 }}>{formatEta(remaining)}</span>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"var(--color-text-tertiary)" }}>
            · arrives {formatArrivalTime(adjustedDurationSeconds, startedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
