import { Search } from "lucide-react";
import { ViewId } from "../types";

const VIEW_BREADCRUMB: Record<ViewId, string> = {
  map:              "Live Operations Map",
  heatmap:          "CO₂ Savings Heat Map",
  hubs:             "Collection Hub Management",
  partners:         "Partners & Rewards",
  reports:          "Reports Center",
  "report-requests": "Report Requests",
};

interface TopBarProps {
  activeView: ViewId;
  onSearchClick: () => void;
}

export function TopBar({ activeView, onSearchClick }: TopBarProps) {
  const currentCrumb = VIEW_BREADCRUMB[activeView] || "Operations";

  return (
    <header 
      className="bg-white border-b border-border flex items-center justify-between px-6 py-3 flex-shrink-0 relative"
      style={{ height: 60 }}
    >
      {/* Left: Breadcrumbs */}
      <div 
        className="flex items-center gap-1.5 text-xs text-muted-foreground select-none"
        style={{ fontFamily: "var(--font-sans)" }}
      >
        <span>All Accounts</span>
        <span className="text-neutral-300">/</span>
        <span>Dawer</span>
        <span className="text-neutral-300">/</span>
        <span className="text-foreground font-medium">{currentCrumb}</span>
      </div>

      {/* Center: Search Button (opens Command Palette) */}
      <button
        onClick={onSearchClick}
        className="flex items-center justify-between bg-neutral-50 hover:bg-neutral-100/80 border border-border rounded-full px-4 py-1.5 transition-colors cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral"
        style={{ width: 280 }}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <Search size={14} className="text-neutral-400" />
          <span style={{ fontSize: 12 }}>Search dashboard...</span>
        </div>
        <kbd 
          className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-white px-1.5 font-mono text-[9px] font-medium text-neutral-400 shadow-sm"
        >
          <span className="text-[10px]">⌘</span>K
        </kbd>
      </button>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-4">
        {/* Export Report Action */}
        <button
          onClick={() => alert("Generating CSV Export...")}
          className="bg-accent-coral hover:bg-accent-coral/95 active:scale-[0.98] text-white px-4.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral focus-visible:ring-offset-2"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          Export Report
        </button>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <div 
            className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-xs font-bold text-brand-600 select-none shadow-xs"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            DW
          </div>
        </div>
      </div>
    </header>
  );
}
