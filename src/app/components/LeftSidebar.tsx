import { ViewId } from "../types";
import { NAV_ITEMS } from "../constants";
import dawarLogo from "../../imports/logo_2-removebg-preview__1_.png";

export function LeftSidebar({ activeNav, onNav }: { activeNav: ViewId; onNav: (id: ViewId) => void }) {
  return (
    <aside className="flex flex-col flex-shrink-0" style={{ width: 200, background: "linear-gradient(180deg,#06402B 0%,#0A5E3E 100%)" }}>
      <div className="px-4 pt-5 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
        <img src={dawarLogo} alt="Dawer" style={{ width: 110, height: "auto", objectFit: "contain" }} />
        <div className="mt-2 flex items-center gap-1.5" style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: "#4ADE80", animation: "pulse 2s ease-in-out infinite" }} />
          OPERATIONS CENTER
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = activeNav === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left"
              style={{ background: active ? "rgba(255,255,255,0.15)" : "transparent", color: active ? "white" : "rgba(255,255,255,0.5)" }}
            >
              <item.icon size={16} />
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: active ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.1)", fontFamily: "'DM Mono',monospace" }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>BUILD 1.0.0</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>AMMAN · JO</div>
      </div>
    </aside>
  );
}
