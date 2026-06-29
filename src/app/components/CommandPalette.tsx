import { useEffect, useState, type FC } from "react";
import { Command } from "cmdk";
import { Search, MapPin, Package, Users, BarChart2, Truck, X } from "lucide-react";
import type { ViewId } from "../types";

interface CommandPaletteProps {
  onNav: (view: ViewId) => void;
}

interface CommandItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: FC<{ size?: number }>;
  action: () => void;
}

export function CommandPalette({ onNav }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigate = (view: ViewId) => {
    onNav(view);
    setOpen(false);
    setQuery("");
  };

  const items: CommandItem[] = [
    { id: "map",      label: "Live Operations Map",      sublabel: "Track riders in real time",   icon: MapPin,   action: () => navigate("map") },
    { id: "heatmap",  label: "CO₂ Savings Heat Map",    sublabel: "District-level analysis",      icon: BarChart2, action: () => navigate("heatmap") },
    { id: "hubs",     label: "Collection Hub Management", sublabel: "Add, monitor, and ship hubs", icon: Package,  action: () => navigate("hubs") },
    { id: "partners", label: "Partners & Rewards",        sublabel: "Tier management and green points", icon: Users, action: () => navigate("partners") },
    { id: "reports",  label: "Reports",                   sublabel: "CO₂ certificates and analytics", icon: BarChart2, action: () => navigate("reports") },
  ];

  const filtered = query
    ? items.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.sublabel?.toLowerCase().includes(query.toLowerCase())
      )
    : items;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-start justify-center pt-[20vh]"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: 560,
          background: "white",
          borderRadius: "var(--radius-lg)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          {/* Search input */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <Search size={16} style={{ color: "var(--color-neutral-400)", flexShrink: 0 }} />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search views, hubs, riders…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--color-neutral-900)",
                background: "transparent",
              }}
              autoFocus
            />
            <button onClick={() => setOpen(false)} style={{ color: "var(--color-neutral-400)", cursor: "pointer", background: "none", border: "none" }}>
              <X size={14} />
            </button>
          </div>

          <Command.List style={{ maxHeight: 320, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "24px 16px", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--color-neutral-400)" }}>
                No results for "{query}"
              </div>
            )}

            {filtered.length > 0 && (
              <Command.Group
                heading="Navigation"
                style={{ padding: "8px 0" }}
              >
                {filtered.map((item) => (
                  <Command.Item
                    key={item.id}
                    value={item.label}
                    onSelect={item.action}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      cursor: "pointer",
                    }}
                    className="command-item"
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "var(--radius-md)",
                        background: "var(--color-brand-50)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <item.icon size={15} style={{ color: "var(--color-brand-600)" }} />
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--color-neutral-900)" }}>
                        {item.label}
                      </div>
                      {item.sublabel && (
                        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-neutral-400)", marginTop: 1 }}>
                          {item.sublabel}
                        </div>
                      )}
                    </div>
                    <div style={{ marginInlineStart: "auto", display: "flex", gap: 4 }}>
                      <kbd style={{ fontFamily: "var(--font-mono)", fontSize: 10, background: "var(--color-neutral-100)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "2px 6px", color: "var(--color-neutral-500)" }}>↵</kbd>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer */}
          <div
            className="flex items-center gap-4 px-4 py-2 border-t"
            style={{ borderColor: "var(--color-border)", background: "var(--color-neutral-50)" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-neutral-400)" }}>
              <kbd style={{ background: "var(--color-neutral-100)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "1px 5px" }}>↑↓</kbd> navigate
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-neutral-400)" }}>
              <kbd style={{ background: "var(--color-neutral-100)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "1px 5px" }}>↵</kbd> select
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-neutral-400)" }}>
              <kbd style={{ background: "var(--color-neutral-100)", border: "1px solid var(--color-border)", borderRadius: 4, padding: "1px 5px" }}>Esc</kbd> close
            </span>
          </div>
        </Command>
      </div>

      <style>{`
        .command-item[data-selected="true"] {
          background: var(--color-brand-50);
        }
        [cmdk-group-heading] {
          font-family: var(--font-sans);
          font-size: 10px;
          font-weight: 700;
          color: var(--color-neutral-400);
          letter-spacing: 0.08em;
          padding: 6px 16px 2px;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
