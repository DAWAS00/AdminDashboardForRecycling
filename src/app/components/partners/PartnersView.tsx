import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { TIER_CONFIG, TIER_ORDER } from "../../constants";
import { Client, ContractTier, ClientType } from "../../types";
import { useClients } from "../../../hooks/useClients";
import { isChurnRisk } from "../../helpers";
import { MRRStrip }           from "./MRRStrip";
import { ChurnAlertPanel }    from "./ChurnAlertPanel";
import { PartnerCard }        from "./PartnerCard";
import { PartnerDetailDrawer } from "./PartnerDetailDrawer";

type TierFilter = ContractTier | "all";
type TypeFilter = ClientType  | "all";

const CLIENT_TYPE_OPTIONS: { id: TypeFilter; label: string }[] = [
  { id: "all",        label: "All Types"   },
  { id: "restaurant", label: "Restaurants" },
  { id: "hotel",      label: "Hotels"      },
  { id: "hospital",   label: "Hospitals"   },
  { id: "retail",     label: "Retail"      },
];

export function PartnersView() {
  const { clients, loading, updateTier, updateNotes } = useClients();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search,     setSearch]     = useState("");

  const selectedClient = selectedId
    ? clients.find(c => c.id === selectedId) ?? null
    : null;

  const filtered = useMemo(() =>
    clients.filter(c => {
      if (tierFilter !== "all" && c.contractTier !== tierFilter) return false;
      if (typeFilter !== "all" && c.type !== typeFilter)         return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.address.toLowerCase().includes(q)) return false;
      }
      return true;
    }),
    [clients, tierFilter, typeFilter, search]
  );

  async function handleUpdate(updated: Client) {
    const original = clients.find(c => c.id === updated.id);
    if (original) {
      const ops: Promise<void>[] = [];
      if (original.contractTier !== updated.contractTier) {
        ops.push(updateTier(updated.id, updated.contractTier));
      }
      if (original.contractNotes !== updated.contractNotes) {
        ops.push(updateNotes(updated.id, updated.contractNotes ?? ""));
      }
      await Promise.all(ops);
    }
    setSelectedId(null);
  }

  const TIER_FILTER_OPTIONS: { id: TierFilter; label: string }[] = [
    { id: "all", label: "All Tiers" },
    ...TIER_ORDER.filter(t => t !== "free").map(t => ({ id: t as TierFilter, label: TIER_CONFIG[t].label })),
    { id: "free", label: "Free" },
  ];

  const churnCount = filtered.filter(isChurnRisk).length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ color: "#64748B", fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>
        Loading partners…
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "#F4F6F5", fontFamily: "'DM Sans',sans-serif" }}
    >
      {/* MRR header */}
      <MRRStrip clients={clients} />

      {/* Churn alerts */}
      <ChurnAlertPanel clients={clients} onSelectClient={setSelectedId} />

      {/* Filter bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 flex-wrap"
        style={{ background: "white", borderColor: "#E2E8F0" }}
      >
        {/* Search */}
        <div className="relative" style={{ minWidth: 200 }}>
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "#94A3B8" }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search partners..."
            className="pl-8 pr-3 py-1.5 rounded-lg border w-full"
            style={{ borderColor: "#E2E8F0", fontFamily: "'DM Sans',sans-serif", fontSize: 12, outline: "none" }}
          />
        </div>

        {/* Tier chips */}
        <div className="flex gap-1.5 flex-wrap">
          {TIER_FILTER_OPTIONS.map(({ id, label }) => {
            const active = tierFilter === id;
            const cfg    = id !== "all" ? TIER_CONFIG[id as ContractTier] : null;
            return (
              <button
                key={id}
                onClick={() => setTierFilter(id)}
                className="text-[11px] px-3 py-1 rounded-full border transition-all"
                style={{
                  background:  active ? (cfg?.bg   ?? "#D1FAE5") : "white",
                  borderColor: active ? (cfg?.color ?? "#1E5C35") : "#E2E8F0",
                  color:       active ? (cfg?.color ?? "#1E5C35") : "#64748B",
                  fontWeight:  active ? 600 : 400,
                  fontFamily:  "'DM Sans',sans-serif",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Type chips */}
        <div className="flex gap-1.5 flex-wrap ml-auto">
          {CLIENT_TYPE_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTypeFilter(id)}
              className="text-[11px] px-3 py-1 rounded-full border transition-all"
              style={{
                background:  typeFilter === id ? "#1E5C35" : "white",
                borderColor: typeFilter === id ? "#1E5C35" : "#E2E8F0",
                color:       typeFilter === id ? "white"   : "#64748B",
                fontFamily:  "'DM Sans',sans-serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      <div className="px-4 py-2 flex items-center flex-shrink-0">
        <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "'DM Sans',sans-serif" }}>
          {filtered.length} partner{filtered.length !== 1 ? "s" : ""}
          {churnCount > 0 && (
            <span style={{ color: "#C8860A", marginLeft: 6 }}>· {churnCount} at risk</span>
          )}
        </span>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <div
            className="flex items-center justify-center h-48"
            style={{ color: "#94A3B8", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}
          >
            No partners match your filters
          </div>
        ) : (
          <div
            className="grid gap-3"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {filtered.map(c => (
              <PartnerCard key={c.id} client={c} onClick={() => setSelectedId(c.id)} />
            ))}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedClient && (
        <PartnerDetailDrawer
          client={selectedClient}
          onClose={() => setSelectedId(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}
