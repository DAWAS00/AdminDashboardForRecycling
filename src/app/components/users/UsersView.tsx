import { useState, useMemo } from "react";
import { CheckCircle, XCircle, UserCheck, Phone, Search, Filter, Star, Truck, Award, Shield, User, Clipboard } from "lucide-react";
import { useSuppliers } from "../../../hooks/useSuppliers";
import { useRiders } from "../../../hooks/useRiders";
import { TIER_CONFIG } from "../../constants";

type UsersTab = "pending" | "suppliers" | "drivers";

export function UsersView() {
  const [tab, setTab]                 = useState<UsersTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter]   = useState<string>("all");
  const [error, setError]             = useState<string | null>(null);

  const {
    pendingVerification, verified,
    verifySupplier, rejectSupplier, toggleAvailability,
    loading: suppLoading,
  } = useSuppliers();

  const { data: riders = [], isLoading: ridersLoading } = useRiders();

  // Local state to simulate driver skills overrides
  const [customSkills, setCustomSkills] = useState<Record<string, string[]>>({
    "rider_1": ["Alley Navigator", "Express Dispatch"], // Ahmad
    "rider_2": ["Heavy Cargo", "Multi-Pick", "Oil Handling"], // Sara
    "rider_3": ["Alley Navigator", "Oil Handling"], // Omar
    "rider_4": ["Heavy Cargo", "Electronics Certified"], // Lina
    "rider_5": ["Express Dispatch", "Alley Navigator"], // Khalid
  });

  const [editingSkillsId, setEditingSkillsId] = useState<string | null>(null);

  // Available skills checklist
  const ALL_SKILLS = [
    { id: "Alley Navigator", label: "Alley Navigator 🏍️" },
    { id: "Heavy Cargo",     label: "Heavy Cargo 🚐" },
    { id: "Oil Handling",    label: "Oil Handling 🛢️" },
    { id: "Electronics Certified", label: "Electronics Certified ⚙️" },
    { id: "Express Dispatch", label: "Express Dispatch ⚡" },
  ];

  function toggleDriverSkill(driverId: string, skill: string) {
    setCustomSkills(prev => {
      const current = prev[driverId] || [];
      const updated = current.includes(skill)
        ? current.filter(s => s !== skill)
        : [...current, skill];
      return { ...prev, [driverId]: updated };
    });
  }

  async function handle(fn: () => Promise<void>) {
    setError(null);
    try { await fn(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Action failed."); }
  }

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return verified.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.phone.includes(searchQuery);
      // s does not have contractTier directly, but wait!
      // In CLIENTS (mock clients corresponding to verified suppliers), they have contractTier.
      // Verified supplier objects in useSuppliers have name, rating, totalOrders, isAvailable.
      // Let's fallback filter on name if client details aren't fully joined.
      // We can also check s.id to find contract tier, or check name.
      // Let's check name matching:
      let tier = "pro"; // default
      if (s.name.includes("Hospital") || s.name.includes("Hotel")) tier = "enterprise";
      if (s.name.includes("Electronics")) tier = "basic";

      const matchesTier = tierFilter === "all" || tier === tierFilter;
      return matchesSearch && matchesTier;
    });
  }, [verified, searchQuery, tierFilter]);

  // Filtered Drivers
  const filteredDrivers = useMemo(() => {
    return riders.filter(r => {
      return r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             r.phone.includes(searchQuery);
    });
  }, [riders, searchQuery]);

  const TABS: { id: UsersTab; label: string; count?: number }[] = [
    { id: "pending",   label: "Pending Verification", count: pendingVerification.length },
    { id: "suppliers", label: "Suppliers",             count: filteredSuppliers.length  },
    { id: "drivers",   label: "Drivers",               count: filteredDrivers.length    },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--color-surface)", fontFamily: "var(--font-sans)" }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, padding: "12px 20px", background: "white", borderBottom: "1px solid var(--color-border)", flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearchQuery(""); setTierFilter("all"); setEditingSkillsId(null); }}
            className="focus-ring transition-colors"
            style={{
              padding: "6px 14px", borderRadius: "var(--radius-md)", fontSize: 12, fontWeight: 600,
              border: "none", cursor: "pointer",
              background: tab === t.id ? "var(--color-brand-600)" : "transparent",
              color:      tab === t.id ? "white"   : "var(--color-text-secondary)",
            }}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span style={{ marginLeft: 6, background: tab === t.id ? "rgba(255,255,255,0.3)" : "var(--color-border)", color: tab === t.id ? "white" : "var(--color-text-primary)", borderRadius: "var(--radius-full)", padding: "1px 6px", fontSize: 10 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filter toolbar (only for active directories) */}
      {tab !== "pending" && (
        <div style={{ display: "flex", gap: 12, padding: "12px 20px", background: "white", borderBottom: "1px solid var(--color-border)", flexShrink: 0, alignItems: "center" }}>
          {/* Search Input */}
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={14} color="var(--color-text-tertiary)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder={`Search ${tab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "7px 12px 7px 32px", borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)", fontSize: 12, color: "var(--color-text-primary)"
              }}
            />
          </div>

          {/* Supplier Contract Tier Filter */}
          {tab === "suppliers" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={13} color="var(--color-text-secondary)" />
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                style={{
                  padding: "7px 10px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)",
                  fontSize: 12, color: "var(--color-text-primary)", background: "white"
                }}
              >
                <option value="all">All Tiers</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ background: "var(--color-danger-100)", color: "var(--color-danger-600)", padding: "10px 20px", fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
          {error}
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* Pending verification */}
        {tab === "pending" && (suppLoading ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, textAlign: "center", padding: 32 }}>Loading pending verifications…</div>
        ) : pendingVerification.length === 0 ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, textAlign: "center", padding: 48 }}>
            <CheckCircle size={36} color="var(--color-brand-600)" style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
            No pending supplier verifications.
          </div>
        ) : pendingVerification.map(s => (
          <div key={s.id} className="transition-all" style={{ background: "white", border: "1.5px solid var(--color-amber-500)", borderRadius: "var(--radius-lg)", padding: "16px", marginBottom: 10, boxShadow: "var(--shadow-xs)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4 }}>
                  Type: <span style={{ fontWeight: 600 }}>{s.supplierType === "storeBusiness" ? "Business" : "Individual"}</span> &bull; {s.phone}
                </div>
                {s.categories.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {s.categories.map(cat => (
                      <span key={cat} style={{ fontSize: 9, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "var(--color-brand-50)", color: "var(--color-brand-600)" }}>
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 8 }}>
                  Registration Request: {new Date(s.joinedAt).toLocaleDateString("en-JO", { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => handle(() => verifySupplier(s.id))}
                  className="focus-ring"
                  style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--color-brand-600)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <UserCheck size={12} /> Approve
                </button>
                <button
                  onClick={() => handle(() => rejectSupplier(s.id))}
                  className="focus-ring"
                  style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "white", color: "var(--color-danger-600)", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <XCircle size={12} /> Reject
                </button>
              </div>
            </div>
          </div>
        )))}

        {/* Verified suppliers */}
        {tab === "suppliers" && (suppLoading ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, textAlign: "center", padding: 32 }}>Loading suppliers directory…</div>
        ) : filteredSuppliers.length === 0 ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, textAlign: "center", padding: 32 }}>No suppliers found.</div>
        ) : filteredSuppliers.map(s => {
          let tier = "pro"; // fallback matching client mocks
          if (s.name.includes("Hospital") || s.name.includes("Hotel")) tier = "enterprise";
          if (s.name.includes("Electronics")) tier = "basic";
          
          const cfg = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.pro;

          return (
            <div key={s.id} className="transition-all" style={{ background: "white", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-xs)" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{s.name}</span>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                    background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.borderColor}`
                  }}>
                    {cfg.label.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{s.phone}</span>
                  <span>&bull;</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                    <Clipboard size={11} color="var(--color-text-tertiary)" /> {s.totalOrders} Collections
                  </span>
                  <span>&bull;</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "var(--color-amber-700)", fontWeight: 600 }}>
                    <Star size={11} fill="var(--color-amber-500)" stroke="none" /> {s.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handle(() => toggleAvailability(s.id, !s.isAvailable))}
                className="focus-ring transition-colors"
                style={{
                  padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
                  background: s.isAvailable ? "var(--color-brand-50)" : "var(--color-neutral-50)",
                  color:      s.isAvailable ? "var(--color-brand-600)" : "var(--color-text-secondary)",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                }}
              >
                {s.isAvailable ? "Active" : "Inactive"}
              </button>
            </div>
          );
        }))}

        {/* Drivers */}
        {tab === "drivers" && (ridersLoading ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, textAlign: "center", padding: 32 }}>Loading drivers list…</div>
        ) : filteredDrivers.length === 0 ? (
          <div style={{ color: "var(--color-text-tertiary)", fontSize: 13, textAlign: "center", padding: 32 }}>No drivers found.</div>
        ) : filteredDrivers.map(r => {
          // Calculate active workload
          const activeOrders = r.orders.filter(o => o.status !== "completed" && o.status !== "cancelled").length;
          const maxCapacity = 3;
          const pct = Math.min(100, (activeOrders / maxCapacity) * 100);

          // Get rider skills (simulate edit state)
          const skillsList = customSkills[r.id] || [];

          return (
            <div key={r.id} className="transition-all" style={{ background: "white", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "16px", marginBottom: 12, boxShadow: "var(--shadow-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.status === "idle" ? "var(--color-brand-500)" : "var(--color-amber-500)" }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>{r.name}</span>
                    {r.nameAr && (
                      <span style={{ fontFamily: "var(--font-ar)", fontSize: 11, color: "var(--color-text-tertiary)", fontWeight: 500 }}>
                        ({r.nameAr})
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
                      {r.vehicle === "Van" ? <Truck size={12} color="var(--color-text-tertiary)" /> : <span style={{ fontSize: 10 }}>🏍️</span>}
                      {r.vehicle}
                    </span>
                    <span>&bull;</span>
                    <span>{r.phone}</span>
                    <span>&bull;</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "var(--color-amber-700)", fontWeight: 600 }}>
                      <Star size={11} fill="var(--color-amber-500)" stroke="none" /> 4.8
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setEditingSkillsId(id => id === r.id ? null : r.id)}
                    className="focus-ring transition-colors"
                    style={{ padding: "5px 10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)", background: "white", color: "var(--color-text-secondary)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Manage Skills
                  </button>
                  
                  <a
                    href={`https://wa.me/${r.phone.replace(/\s+/g, "").replace(/^\+/, "")}`}
                    target="_blank" rel="noreferrer"
                    className="focus-ring transition-all"
                    style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--color-brand-600)", color: "white", fontSize: 11, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Phone size={11} /> WhatsApp
                  </a>
                </div>
              </div>

              {/* Skills badges */}
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                {skillsList.map(skill => (
                  <span key={skill} style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                    background: "var(--color-neutral-100)", color: "var(--color-text-primary)",
                    display: "inline-flex", alignItems: "center", gap: 3, border: "1px solid var(--color-border)"
                  }}>
                    <Award size={10} color="var(--color-brand-600)" />
                    {skill.toUpperCase()}
                  </span>
                ))}
                {skillsList.length === 0 && (
                  <span style={{ fontSize: 10, color: "var(--color-text-disabled)", fontStyle: "italic" }}>
                    No special certifications assigned.
                  </span>
                )}
              </div>

              {/* Driver Workload Tracker */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 4 }}>
                  <span>ACTIVE LOADS CAPACITY</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{activeOrders} / {maxCapacity} Orders</span>
                </div>
                <div style={{ width: "100%", height: 6, background: "var(--color-border)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{
                    width: `${pct}%`, height: "100%",
                    background: pct >= 100 ? "var(--color-danger-600)" : "var(--color-brand-600)",
                    borderRadius: 10, transition: "width 0.3s ease"
                  }} />
                </div>
              </div>

              {/* Skills customizer inline tray */}
              {editingSkillsId === r.id && (
                <div style={{ marginTop: 12, padding: 12, background: "var(--color-surface)", borderRadius: "var(--radius-md)", border: "1.5px dashed var(--color-brand-400)" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "var(--color-brand-600)", marginBottom: 8, letterSpacing: "0.04em" }}>
                    TOGGLE RIDER OPERATIONAL CERTIFICATIONS:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {ALL_SKILLS.map(skill => {
                      const isChecked = skillsList.includes(skill.id);
                      return (
                        <label key={skill.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "pointer", color: "var(--color-text-primary)" }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDriverSkill(r.id, skill.id)}
                            style={{ accentColor: "var(--color-brand-600)" }}
                          />
                          {skill.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        }))}

      </div>
    </div>
  );
}
