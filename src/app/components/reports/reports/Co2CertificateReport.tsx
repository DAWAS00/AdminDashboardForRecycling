import { useState } from "react";
import { Wind, Leaf, QrCode, Calendar, Building2 } from "lucide-react";
import { useClients } from "../../../../hooks/useClients";
import { co2Equivalents } from "../../../helpers";

export function Co2CertificateReport() {
  const { data: clients = [] } = useClients();
  const [clientId, setClientId] = useState<string | null>(null);
  const activeId = clientId ?? clients[0]?.id ?? "";
  const client = clients.find(c => c.id === activeId) ?? clients[0];
  if (!client) return <div style={{ padding: "var(--space-4)", color: "var(--color-neutral-400)", fontFamily: "var(--font-sans)", fontSize: 13 }}>No partners loaded.</div>;
  const equiv = co2Equivalents(client.totalCo2Saved);

  return (
    <div style={{ padding: "var(--space-4)" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
          CO₂ Impact Certificate
        </div>
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>
          Client-branded proof of environmental impact
        </div>
      </div>

      {/* Client selector */}
      <div style={{ marginBottom: 16 }}>
        <label htmlFor="cert-client" style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
          Select Client
        </label>
        <select
          id="cert-client"
          value={activeId}
          onChange={e => setClientId(e.target.value)}
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

      {/* Certificate card */}
      <div
        style={{
          borderRadius: "var(--radius-xl)",
          padding: "var(--space-6)",
          background: "linear-gradient(135deg, #FFFFFF 0%, #F4F6F5 100%)",
          border: "1px solid var(--color-brand-100)",
          boxShadow: "var(--shadow-md)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 56, height: 56,
            borderRadius: "50%",
            background: "var(--color-brand-50)",
            marginBottom: 14,
          }}
        >
          <Leaf size={26} color="var(--color-brand-600)" />
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-brand-600)", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>
          Certificate of Environmental Impact
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-primary)", marginBottom: 2 }}>
          {client.name}
        </div>
        {client.nameAr && (
          <div style={{ fontFamily: "var(--font-ar)", fontSize: 13, color: "var(--color-brand-600)", direction: "rtl", marginBottom: 12 }}>
            {client.nameAr}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 20 }}>
          <Building2 size={12} />
          {client.type.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())} · {client.address}
        </div>

        <div
          style={{
            padding: "var(--space-4)",
            borderRadius: "var(--radius-lg)",
            background: "var(--color-brand-50)",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--color-brand-700)", marginBottom: 6 }}>Total CO₂ Saved</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 700, color: "var(--color-brand-600)", lineHeight: 1 }}>
            {client.totalCo2Saved.toFixed(1)}
          </div>
          <div style={{ fontSize: 13, color: "var(--color-brand-600)", marginTop: 4 }}>kg</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: 20, textAlign: "left" }}>
          <Equiv label="Trees (1yr)"     value={`≈ ${equiv.trees}`} />
          <Equiv label="Car-km avoided"  value={`≈ ${equiv.carKm.toLocaleString()} km`} />
          <Equiv label="Flights saved"   value={`≈ ${equiv.flights}`} />
          <Equiv label="Phone charges"   value={`≈ ${equiv.phones.toLocaleString()}`} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 10, color: "var(--color-text-tertiary)", marginBottom: 16 }}>
          <Calendar size={12} />
          Generated {new Date().toLocaleDateString("en-JO", { year: "numeric", month: "long", day: "numeric" })}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div
            style={{
              width: 64, height: 64,
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "white",
            }}
          >
            <QrCode size={36} color="var(--color-text-tertiary)" />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: "var(--color-text-tertiary)", wordBreak: "break-all" }}>
              ID: CERT-{client.id.toUpperCase()}-{new Date().toISOString().slice(0,10).replace(/-/g,"")}
            </div>
            <div style={{ fontSize: 9, color: "var(--color-text-disabled)", marginTop: 2 }}>
              Scan to verify on Dawer registry
            </div>
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
