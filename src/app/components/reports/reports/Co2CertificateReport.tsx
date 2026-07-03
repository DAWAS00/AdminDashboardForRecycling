import { useState } from "react";
import { Wind, Leaf, QrCode, Calendar, Building2 } from "lucide-react";
import { useClients } from "../../../../hooks/useClients";
import { co2Equivalents } from "../../../helpers";

export interface Co2CertificateReportProps {
  clientId?: string;
  hideControls?: boolean;
}

export function Co2CertificateReport({ clientId, hideControls = false }: Co2CertificateReportProps) {
  const { data: clients = [] } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const activeId = clientId ?? selectedClientId ?? clients[0]?.id ?? "";
  const client = clients.find(c => c.id === activeId) ?? clients[0];
  if (!client) return <div style={{ padding: "var(--space-4)", color: "var(--color-neutral-400)", fontFamily: "var(--font-sans)", fontSize: 13 }}>No partners loaded.</div>;
  const equiv = co2Equivalents(client.totalCo2Saved);

  return (
    <div style={{ padding: hideControls ? "0" : "var(--space-4)" }}>
      {!hideControls && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
            CO₂ Impact Certificate
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
            Client-branded proof of environmental impact
          </div>
        </div>
      )}

      {/* Client selector */}
      {!hideControls && (
        <div style={{ marginBottom: 16 }}>
          <label htmlFor="cert-client" style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
            Select Client
          </label>
          <select
            id="cert-client"
            value={activeId}
            onChange={e => setSelectedClientId(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-card)",
              fontSize: 12,
              color: "var(--color-text-primary)",
            }}
          >
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Certificate card */}
      <div
        className="print-container"
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "48px 40px",
          background: "radial-gradient(circle, #FFFFFF 60%, #F1F6F3 100%)",
          border: "8px double var(--color-brand-600)",
          boxShadow: "var(--shadow-md)",
          textAlign: "center",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        {/* Fine gold inner line */}
        <div style={{ position: "absolute", top: 8, left: 8, right: 8, bottom: 8, border: "1px solid var(--color-amber-600)", pointerEvents: "none", borderRadius: "calc(var(--radius-xl) - 4px)" }} />

        {/* Certificate Seal Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72, height: 72,
            borderRadius: "50%",
            background: "var(--color-brand-600)",
            border: "4px solid var(--color-amber-600)",
            boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
            marginBottom: 16,
          }}
        >
          <Leaf size={32} color="var(--color-amber-100)" />
        </div>

        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--color-amber-600)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
          Certificate of Environmental Impact
        </div>
        
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
          This certifies that B2B recycling partner
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text-primary)", letterSpacing: "-0.01em", marginBottom: 2 }}>
          {client.name}
        </div>
        {client.nameAr && (
          <div style={{ fontFamily: "var(--font-ar)", fontSize: 18, color: "var(--color-brand-600)", direction: "rtl", fontWeight: 700, marginBottom: 16 }}>
            {client.nameAr}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 24 }}>
          <Building2 size={12} color="var(--color-brand-600)" />
          {client.type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())} &bull; {client.address}
        </div>

        <div style={{ width: "80px", height: "1px", background: "var(--color-border)", margin: "0 auto 24px auto" }} />

        <div style={{ fontSize: 11, color: "var(--color-text-secondary)", lineHeight: 1.6, maxWidth: "480px", margin: "0 auto 24px auto" }}>
          has diverted substantial solid wastes from landfills, achieving high-fidelity carbon offsets by returning active recyclable materials back into circular production streams.
        </div>

        {/* Big Impact Number Box */}
        <div
          style={{
            padding: "20px 24px",
            borderRadius: "var(--radius-lg)",
            background: "rgba(30, 92, 53, 0.05)",
            border: "1px dashed var(--color-brand-400)",
            display: "inline-block",
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-brand-600)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
            Total Carbon Prevented
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 800, color: "var(--color-brand-600)", lineHeight: 1.1 }}>
            {client.totalCo2Saved.toFixed(1)} <span style={{ fontSize: 16, fontWeight: 500 }}>kg CO₂</span>
          </div>
        </div>

        {/* Equivalents grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 28, textAlign: "left" }}>
          <Equiv label="Trees (1yr)"     value={`≈ ${equiv.trees}`} />
          <Equiv label="Car-km saved"   value={`≈ ${equiv.carKm.toLocaleString()}`} />
          <Equiv label="Flights saved"   value={`≈ ${equiv.flights}`} />
          <Equiv label="Phone charges"   value={`≈ ${equiv.phones.toLocaleString()}`} />
        </div>

        {/* Signatures & Stamps */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 24, borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 64, height: 64,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "white",
                padding: 4,
              }}
            >
              <QrCode size={56} color="var(--color-text-secondary)" />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 8, color: "var(--color-text-tertiary)", wordBreak: "break-all" }}>
                ID: CERT-{client.id.toUpperCase()}-{new Date().toISOString().slice(0,10).replace(/-/g,"")}
              </div>
              <div style={{ fontSize: 8, color: "var(--color-text-disabled)", marginTop: 2 }}>
                Scan to verify on Dawer Registry
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-secondary)", fontWeight: 600 }}>
              {new Date().toLocaleDateString("en-JO", { year: "numeric", month: "short", day: "numeric" })}
            </div>
            <div style={{ width: 120, height: 1, background: "var(--color-text-tertiary)", margin: "8px 0 4px auto" }} />
            <div style={{ fontSize: 9, color: "var(--color-brand-600)", fontWeight: 700 }}>Dawer Certification Office</div>
          </div>
        </div>
      </div>

      {/* Order history summary */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
          Contribution Summary
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", background: "var(--color-surface-card)", border: "1px solid var(--color-border)" }}>
          <div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Orders</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)" }}>{client.orders.length}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Earnings</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--color-amber-600)" }}>{client.totalEarnings.toFixed(2)} JD</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 2 }}>Member Since</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: "var(--color-text-secondary)" }}>{client.joinedDate}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Equiv({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: "var(--space-2)", borderRadius: "var(--radius-md)", background: "white", border: "1px solid var(--color-border)" }}>
      <div style={{ fontSize: 9, color: "var(--color-text-tertiary)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-brand-600)" }}>{value}</div>
    </div>
  );
}
