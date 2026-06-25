import { useState } from "react";
import type { CompletedTrip } from "../types";
import { RiderPerformanceReport } from "./reports/RiderPerformanceReport";
import { SlowestDistrictsReport } from "./reports/SlowestDistrictsReport";
import { PANEL_WIDTH } from "../constants";

type Tab = "rider-performance" | "slowest-districts";

export function ReportsView({ completedTrips }: { completedTrips: CompletedTrip[] }) {
  const [tab, setTab] = useState<Tab>("rider-performance");

  const TABS: { id: Tab; label: string; desc: string }[] = [
    { id: "rider-performance",  label: "Rider Performance",      desc: "Efficiency, on-time rate, CO₂, earnings" },
    { id: "slowest-districts",  label: "District Delivery Times", desc: "Where riders take longest → hub placement" },
  ];

  return (
    <div style={{ display:"flex", height:"100%", background:"var(--color-surface)" }}>
      <div style={{ width:PANEL_WIDTH, flexShrink:0, borderRight:"1px solid var(--color-border)", background:"var(--color-surface-card)", overflowY:"auto" }}>
        <div style={{ padding:"12px 16px 8px", fontSize:10, fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--color-text-tertiary)", borderBottom:"1px solid var(--color-border)" }}>
          Tracking Reports
        </div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} aria-pressed={tab === t.id}
            style={{ width:"100%", textAlign:"left", padding:"12px 16px", borderBottom:"1px solid var(--color-border)", background:"transparent", border:"none", cursor:"pointer", boxShadow: tab === t.id ? "inset 3px 0 0 var(--color-brand-600)" : "none" }}>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--color-text-primary)", marginBottom:3 }}>{t.label}</div>
            <div style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{t.desc}</div>
          </button>
        ))}
        {["Weekly Operations Summary","CO₂ Impact Certificate","Hub Efficiency Report"].map(name => (
          <div key={name} style={{ padding:"12px 16px", borderBottom:"1px solid var(--color-border)", opacity:0.4 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--color-text-primary)", marginBottom:3 }}>{name}</div>
            <div style={{ fontSize:10, color:"var(--color-text-disabled)" }}>Phase 2</div>
          </div>
        ))}
      </div>
      <div style={{ flex:1, overflowY:"auto" }}>
        {tab === "rider-performance" && <RiderPerformanceReport completedTrips={completedTrips} periodLabel="This Session" />}
        {tab === "slowest-districts" && <SlowestDistrictsReport completedTrips={completedTrips} periodLabel="This Session" />}
      </div>
    </div>
  );
}
