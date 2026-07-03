import { Wind, Share2, ChevronLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { District, Rider } from "../../types";
import { co2Equivalents } from "../../helpers";
import { useClients } from "../../../hooks/useClients";
import { TIER_CONFIG } from "../../constants";

interface DistrictReportCardProps {
  district: District;
  onBack: () => void;
  idleRiders: Rider[];
}

export function DistrictReportCard({ district, onBack, idleRiders }: DistrictReportCardProps) {
  const { data: clients = [] } = useClients();
  const gap        = district.co2Potential - district.co2Achieved;
  const achievedPct = Math.round((district.co2Achieved / district.co2Potential) * 100);
  const gapPct      = 100 - achievedPct;
  const equiv       = co2Equivalents(district.co2Achieved);

  // Filter B2B clients active in this specific district
  const cleanDistrict = district.name.toLowerCase();
  const districtClients = clients.filter(client => {
    const cleanAddr = client.address.toLowerCase();
    if (cleanDistrict.includes("downtown") && cleanAddr.includes("downtown")) return true;
    if (cleanDistrict.includes("shmeisani") && cleanAddr.includes("shmesani")) return true;
    if (cleanDistrict.includes("sweifieh") && cleanAddr.includes("sweifieh")) return true;
    if (cleanDistrict.includes("abdoun") && cleanAddr.includes("abdoun")) return true;
    if (cleanDistrict.includes("jubaiha") && cleanAddr.includes("jubaiha")) return true;
    if (cleanDistrict.includes("tabarbour") && cleanAddr.includes("tabarbour")) return true;
    if (cleanDistrict.includes("8th circle") && cleanAddr.includes("8th circle")) return true;
    if (cleanDistrict.includes("university") && cleanAddr.includes("university")) return true;
    if (cleanDistrict.includes("tlaa al-ali") && cleanAddr.includes("tlaa")) return true;
    if (cleanDistrict.includes("airport road") && cleanAddr.includes("airport")) return true;
    return false;
  });

  const MATERIAL_KEYS = [
    { key: "cookingOil" as const,  label: "Cooking Oil",       color: "var(--color-oil)",     bg: "var(--color-oil-bg)"     },
    { key: "plastic"    as const,  label: "Plastic Bottles",   color: "var(--color-plastic)", bg: "var(--color-plastic-bg)" },
    { key: "paper"      as const,  label: "Paper & Cardboard", color: "var(--color-paper)",   bg: "var(--color-paper-bg)"   },
    { key: "electronics"as const,  label: "Electronics",       color: "var(--color-ewaste)",  bg: "var(--color-ewaste-bg)"  },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          aria-label="Back to district list"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 11, color: "var(--color-text-tertiary)", marginBottom: 6,
            padding: 0,
          }}
        >
          <ChevronLeft size={12} />
          All Districts
        </button>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
          {district.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>
          {district.orderCount} active orders
        </div>
      </div>

      {/* CO₂ progress */}
      <div
        style={{
          padding: "12px 16px",
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          CO₂ Savings
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, fontWeight: 700, color: "var(--color-brand-600)" }}>
              {district.co2Achieved.toLocaleString()}
              <span style={{ fontSize: 11, fontWeight: 400, color: "var(--color-text-tertiary)", marginLeft: 3 }}>kg</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>achieved</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 600, color: "var(--color-text-secondary)" }}>
              {gap.toLocaleString()}
              <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 3 }}>kg</span>
            </div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{gapPct}% unrealized</div>
          </div>
        </div>
        <div style={{ height: 8, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${achievedPct}%`, borderRadius: "var(--radius-full)", background: "var(--color-brand-600)" }} />
        </div>
      </div>

      {/* Zone assignment — only show if there are idle riders */}
      {idleRiders.length > 0 && (
        <div
          style={{
            padding: "12px 16px",
            background: "var(--color-brand-50)",
            borderBottom: "1px solid var(--color-brand-100)",
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-brand-600)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Assign a Rider
          </div>
          {idleRiders.slice(0, 2).map(rider => (
            <div
              key={rider.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 0",
                borderBottom: "1px solid var(--color-brand-100)",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>{rider.name}</div>
                <div style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>{rider.vehicle} · Idle</div>
              </div>
              <button
                aria-label={`Assign ${rider.name} to ${district.name}`}
                onClick={() => {
                  // Phase 2: dispatch assignment to backend
                  toast.success(`${rider.name} assigned to ${district.name}`, {
                    description: "Rider dispatch — backend wiring coming in Phase 2.",
                  });
                }}
                className="focus-ring"
                style={{
                  padding: "5px 12px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  background: "var(--color-brand-600)",
                  color: "white",
                }}
              >
                Assign →
              </button>
            </div>
          ))}
          {idleRiders.length > 2 && (
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginTop: 4 }}>
              +{idleRiders.length - 2} more idle riders available
            </div>
          )}
        </div>
      )}

      {/* Material breakdown */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          By Material
        </div>
        {MATERIAL_KEYS.map(({ key, label, color, bg }) => {
          const mat = district.materialBreakdown[key];
          const pct = mat.potential > 0 ? Math.round((mat.achieved / mat.potential) * 100) : 0;
          return (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{label}</span>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color }}>
                    {mat.achieved} kg
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-disabled)" }}>
                    / {mat.potential}
                  </span>
                </div>
              </div>
              <div style={{ height: 5, borderRadius: "var(--radius-full)", background: "var(--color-border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, borderRadius: "var(--radius-full)", background: color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* CO₂ equivalents */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Impact Equivalents
        </div>
        {[
          { label: "Trees planted (1yr)", value: `≈ ${equiv.trees}` },
          { label: "Car-km avoided",     value: `≈ ${equiv.carKm.toLocaleString()} km` },
          { label: "Flights saved",      value: `≈ ${equiv.flights}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, color: "var(--color-brand-600)" }}>{value}</span>
          </div>
        ))}
      </div>

      {/* B2B Clients in District */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--color-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          <Users size={12} style={{ color: "var(--color-brand-600)" }} />
          B2B Partners ({districtClients.length})
        </div>
        {districtClients.length === 0 ? (
          <div style={{ fontSize: 11, color: "var(--color-text-disabled)", padding: "4px 0" }}>
            No active B2B partners registered in this district.
          </div>
        ) : (
          districtClients.map(client => {
            const tc = TIER_CONFIG[client.contractTier];
            return (
              <div
                key={client.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "8px 12px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--color-border)",
                  background: "var(--color-surface)",
                  marginBottom: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary)" }}>
                    {client.name}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "1px 6px",
                      borderRadius: "var(--radius-full)",
                      background: tc.bg,
                      color: tc.color,
                      border: `1px solid ${tc.borderColor}`,
                    }}
                  >
                    {client.contractTier}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--color-text-secondary)" }}>
                  <span>CO₂ Saved: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--color-brand-600)" }}>{Math.round(client.totalCo2Saved)} kg</span></span>
                  <span>Points: <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{client.greenPoints}</span></span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Share button (Phase 2 — disabled placeholder) */}
      <div style={{ padding: "12px 16px" }}>
        <button
          disabled
          title="Share feature coming in Phase 2"
          style={{
            width: "100%", padding: "8px 0",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "transparent", cursor: "not-allowed",
            fontSize: 12, fontWeight: 600, color: "var(--color-text-disabled)",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Share2 size={12} />
          Share Report (Phase 2)
        </button>
      </div>
    </div>
  );
}
