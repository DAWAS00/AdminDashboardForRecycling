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
  const { data: clients = [], isLoading: loading, updateTier, updateNotes } = useClients();
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
        ops.push(updateTier.mutateAsync({ clientId: updated.id, tier: updated.contractTier }));
      }
      if (original.contractNotes !== updated.contractNotes) {
        ops.push(updateNotes.mutateAsync({ clientId: updated.id, notes: updated.contractNotes ?? "" }));
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
      <div
        className="h-full flex items-center justify-center"
        style={{ color: "var(--color-text-secondary)", fontSize: 13 }}
      >
        Loading partners…
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "var(--color-surface)" }}
    >
      {/* MRR header */}
      <MRRStrip clients={clients} />

      {/* Churn alerts */}
      <ChurnAlertPanel clients={clients} onSelectClient={setSelectedId} />

      {/* Filter bar — unified with result count (reclaims a row) */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 border-b flex-shrink-0 flex-wrap"
        style={{ background: "var(--color-surface-card)", borderColor: "var(--color-border)" }}
      >
        {/* Search */}
        <div className="relative" style={{ minWidth: 200 }}>
          <Search
            size={12}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--color-text-tertiary)" }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search partners..."
            className="pl-8 pr-3 py-1.5 rounded-lg border w-full focus-ring"
            style={{
              borderColor: "var(--color-border)",
              fontSize: 12,
              background: "var(--color-surface-card)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
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
                aria-pressed={active}
                className="px-3 py-1 rounded-full border transition-all focus-ring"
                style={{
                  background:  active ? (cfg?.bg   ?? "var(--color-brand-100)") : "var(--color-surface-card)",
                  borderColor: active ? (cfg?.color ?? "var(--color-brand-600)") : "var(--color-border)",
                  color:       active ? (cfg?.color ?? "var(--color-brand-600)") : "var(--color-text-secondary)",
                  fontWeight:  active ? 600 : 400,
                  fontSize: 11,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Type chips */}
        <div className="flex gap-1.5 flex-wrap ml-auto">
          {CLIENT_TYPE_OPTIONS.map(({ id, label }) => {
            const active = typeFilter === id;
            return (
              <button
                key={id}
                onClick={() => setTypeFilter(id)}
                aria-pressed={active}
                className="px-3 py-1 rounded-full border transition-all focus-ring"
                style={{
                  background:  active ? "var(--color-brand-600)" : "var(--color-surface-card)",
                  borderColor: active ? "var(--color-brand-600)" : "var(--color-border)",
                  color:       active ? "white" : "var(--color-text-secondary)",
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Inline result count — replaces the separate row */}
        <div
          className="flex-shrink-0 flex items-center"
          style={{
            paddingLeft: "var(--space-3)",
            borderLeft: "1px solid var(--color-border)",
            fontSize: 11,
            color: "var(--color-text-tertiary)",
          }}
        >
          {filtered.length} partner{filtered.length !== 1 ? "s" : ""}
          {churnCount > 0 && (
            <span style={{ color: "var(--color-amber-600)", marginLeft: 6, fontWeight: 600 }}>
              · {churnCount} at risk
            </span>
          )}
        </div>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {filtered.length === 0 ? (
          <div
            className="flex items-center justify-center h-48"
            style={{ color: "var(--color-text-tertiary)", fontSize: 13 }}
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
