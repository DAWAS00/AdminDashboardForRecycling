import { Outlet, useLocation, useNavigate } from "react-router";
import { useMemo } from "react";
import { Plus } from "lucide-react";
import type { ViewId } from "./types";
import { useRiders } from "../hooks/useRiders";
import { useHubs } from "../hooks/useHubs";
import { computeTotals, useClock } from "./helpers";
import { useFleetStore } from "../stores/fleetStore";
import { useHubStore } from "../stores/hubStore";
import { useHeatmapStore } from "../stores/heatmapStore";
import { LeftSidebar } from "./components/LeftSidebar";
import { StatsBar } from "./components/StatsBar";
import { CommandPalette } from "./components/CommandPalette";

const PATH_TO_VIEW: Record<string, ViewId> = {
  "/":                 "map",
  "/heatmap":          "heatmap",
  "/hubs":             "hubs",
  "/partners":         "partners",
  "/reports":          "reports",
  "/report-requests":  "report-requests",
};

const VIEW_TITLE: Record<ViewId, string> = {
  map:              "Live Operations Map",
  heatmap:          "CO₂ Savings Heat Map",
  hubs:             "Collection Hub Management",
  partners:         "Partners & Rewards",
  reports:          "Reports",
  "report-requests": "Report Requests",
};

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeView = PATH_TO_VIEW[location.pathname] ?? "map";

  const {
    data: riders = [],
    isLoading: ridersLoading,
    isError: ridersError,
    error: ridersErr,
    refetch: refetchRiders
  } = useRiders();

  const {
    data: hubs = [],
    isLoading: hubsLoading,
    isError: hubsError,
    error: hubsErr,
    refetch: refetchHubs
  } = useHubs();

  const showFleetRadar   = useFleetStore((s) => s.showFleetRadar);
  const toggleFleetRadar = useFleetStore((s) => s.toggleFleetRadar);
  const placingHub       = useHubStore((s) => s.placingHub);
  const startPlacing     = useHubStore((s) => s.startPlacing);
  const cancelPlacing    = useHubStore((s) => s.cancelPlacing);

  const time   = useClock();
  const totals = computeTotals(riders);

  const subtitle = useMemo(() => {
    if (activeView === "map")     return `Amman, Jordan — tracking ${riders.filter(r => r.status !== "idle").length} active riders`;
    if (activeView === "heatmap") return "District-level CO₂ savings potential across Amman";
    if (activeView === "hubs")    return `${hubs.filter(h => h.active).length} active hubs · ${hubs.filter(h => h.status === "ready").length} ready to ship`;
    if (activeView === "partners") return "Manage partner tiers, contracts, and rewards";
    if (activeView === "report-requests") return "Review, fulfill, and track client report requests";
    return "";
  }, [activeView, riders, hubs]);

  const handleNav = (v: ViewId) => {
    const paths: Record<ViewId, string> = {
      map: "/", heatmap: "/heatmap", hubs: "/hubs", partners: "/partners", reports: "/reports",
      "report-requests": "/report-requests",
    };
    useFleetStore.getState().reset();
    useHubStore.getState().reset();
    useHeatmapStore.getState().selectDistrict(null);
    navigate(paths[v]);
  };

  const handleRetry = () => {
    refetchRiders().catch(() => {});
    refetchHubs().catch(() => {});
  };

  if (ridersError || hubsError) {
    const errMsg = (ridersErr as Error)?.message || (hubsErr as Error)?.message || "Failed to establish a secure database connection.";
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--color-surface)", fontFamily: "var(--font-sans)", padding: 24 }}>
        <div style={{ background: "white", padding: "32px 40px", borderRadius: 16, boxShadow: "var(--shadow-md)", textAlign: "center", maxWidth: 440, border: "1px solid var(--color-border)" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--color-danger-100)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ fontSize: 24, color: "var(--color-danger-600)", fontWeight: "bold" }}>!</span>
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 8 }}>Database Connection Failed</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.5, marginBottom: 20 }}>{errMsg}</p>
          <button
            onClick={handleRetry}
            style={{
              background: "var(--color-brand-600)",
              color: "white",
              fontWeight: 600,
              fontSize: 13,
              padding: "10px 24px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = "var(--color-brand-700)")}
            onMouseOut={(e) => (e.currentTarget.style.background = "var(--color-brand-600)")}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (ridersLoading || hubsLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--color-neutral-950)", color: "var(--color-neutral-400)", fontFamily: "var(--font-sans)", fontSize: 15, gap: 12 }}>
        <div style={{ width: 20, height: 20, border: "2px solid var(--color-brand-600)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Connecting to Supabase…
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="size-full flex" style={{ fontFamily: "var(--font-sans)", background: "var(--color-neutral-50)" }}>
      <LeftSidebar activeNav={activeView} onNav={handleNav} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b flex items-center justify-between px-5 py-3 flex-shrink-0" style={{ borderColor: "var(--color-border)" }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-neutral-900)" }}>{VIEW_TITLE[activeView]}</h1>
            {subtitle && (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-brand-600)", animation: "pulse 2s ease-in-out infinite" }} />
                <span style={{ fontSize: 11, color: "var(--color-neutral-400)" }}>{subtitle}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {activeView === "map" && (
              <button
                aria-label={showFleetRadar ? "Disable fleet radar" : "Enable fleet radar"}
                aria-pressed={showFleetRadar}
                onClick={toggleFleetRadar}
                className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border"
                style={{
                  background:  showFleetRadar ? "var(--color-brand-600)" : "white",
                  color:       showFleetRadar ? "white" : "var(--color-neutral-500)",
                  borderColor: "var(--color-border)",
                  cursor:      "pointer",
                }}
              >
                Fleet Radar
              </button>
            )}
            {activeView === "hubs" && (
              <button
                onClick={() => (placingHub ? cancelPlacing() : startPlacing())}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                style={{
                  background: placingHub ? "var(--color-amber-50)" : "var(--color-brand-600)",
                  color:      placingHub ? "var(--color-amber-700)" : "white",
                  border:     "none",
                  cursor:     "pointer",
                }}
              >
                <Plus size={14} />
                {placingHub ? "Click map to place…" : "Add Hub"}
              </button>
            )}
            <div className="text-right">
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-neutral-400)", letterSpacing: "0.08em" }}>LOCAL TIME</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 500, color: "var(--color-neutral-900)" }}>
                {time.toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: "var(--color-brand-50)" }}>
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--color-brand-600)", animation: "pulse 2s ease-in-out infinite" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--color-brand-600)" }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* Route content */}
        <div className="flex flex-1 min-h-0">
          <Outlet />
        </div>

        <StatsBar co2={totals.co2} earnings={totals.earnings} byMaterial={totals.byMaterial} riders={riders} />
      </div>

      <CommandPalette onNav={handleNav} />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .rider-tip { background:white; border:1px solid var(--color-border); border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.12); padding:5px 10px; font-family:var(--font-sans); font-size:12px; color:var(--color-neutral-900); white-space:nowrap; }
        .rider-tip::before { display:none; }
        .leaflet-attribution-flag { display:none !important; }
      `}</style>
    </div>
  );
}
