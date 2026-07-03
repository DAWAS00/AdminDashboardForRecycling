import { ViewId } from "../types";
import { NAV_SECTIONS } from "../constants";
import dawarLogo from "../../imports/logo_2-removebg-preview__1_.png";

export function LeftSidebar({ activeNav, onNav }: { activeNav: ViewId; onNav: (id: ViewId) => void }) {
  return (
    <aside 
      className="flex flex-col flex-shrink-0 bg-white border-r border-border h-full relative" 
      style={{ width: "var(--sidebar-width)" }}
    >
      {/* Sidebar Header / Logo */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <img 
          src={dawarLogo} 
          alt="Dawer Operations" 
          style={{ width: 110, height: "auto", objectFit: "contain" }} 
        />
        <div 
          className="mt-2 flex items-center gap-1.5" 
          style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 9, color: "var(--color-text-secondary)", letterSpacing: "0.1em" }}
        >
          <span 
            className="inline-block w-1.5 h-1.5 rounded-full" 
            style={{ background: "var(--color-brand-600)", animation: "pulse 2s ease-in-out infinite" }} 
          />
          OPERATIONS CENTER
        </div>
      </div>

      {/* Grouped Navigation */}
      <nav 
        role="navigation" 
        aria-label="Main navigation" 
        className="flex-1 px-3 py-5 space-y-6 overflow-y-auto"
      >
        {NAV_SECTIONS.map(section => (
          <div key={section.label} role="group" aria-label={section.label} className="space-y-1">
            {/* Section Header */}
            <div 
              className="text-[10px] font-bold tracking-wider text-muted-foreground px-3 py-1"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {section.label}
            </div>

            {/* Section Items */}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = activeNav === item.id;
                return (
                  <button 
                    key={item.id} 
                    onClick={() => onNav(item.id)}
                    aria-current={active ? "page" : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left relative focus-visible:outline-2 focus-visible:outline-accent-coral"
                    style={{ 
                      background: active ? "var(--color-accent-coral-light)" : "transparent", 
                      color: active ? "var(--color-accent-coral)" : "var(--color-text-secondary)",
                      cursor: "pointer"
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--color-surface-hover)"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* Active strip indicator */}
                    {active && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-accent-coral rounded-r-md" />
                    )}
                    <item.icon size={16} className={active ? "text-accent-coral animate-pulse-soft" : "text-muted-foreground"} />
                    <span 
                      style={{ 
                        fontFamily: "'DM Sans',sans-serif", 
                        fontSize: 13, 
                        fontWeight: active ? 600 : 400 
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div 
        className="px-5 py-4 border-t border-border" 
        style={{ fontFamily: "'DM Mono',monospace" }}
      >
        <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", letterSpacing: "0.08em" }}>
          BUILD 1.0.0
        </div>
        <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginTop: 2 }}>
          AMMAN · JO
        </div>
      </div>
    </aside>
  );
}
