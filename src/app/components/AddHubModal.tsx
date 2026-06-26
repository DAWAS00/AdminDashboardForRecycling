import { useState } from "react";
import { X } from "lucide-react";
import { Hub } from "../types";

interface AddHubModalProps {
  lat: number;
  lng: number;
  onConfirm: (hub: Omit<Hub, "id">) => Promise<void>;
  onCancel: () => void;
}

export function AddHubModal({ lat, lng, onConfirm, onCancel }: AddHubModalProps) {
  const [name, setName]         = useState("");
  const [address, setAddress]   = useState(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  const [schedule, setSchedule] = useState<"weekly" | "monthly">("weekly");
  const [capacity, setCapacity] = useState(400);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || submitting) return;
    const today = new Date();
    const next = new Date(today);
    next.setDate(today.getDate() + (schedule === "weekly" ? 7 : 30));
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirm({
        name,
        address,
        lat,
        lng,
        active: true,
        capacityKg: capacity,
        currentLoad: { cookingOil: 0, plastic: 0, paper: 0, electronics: 0 },
        schedule,
        nextShipmentDate: next.toISOString().slice(0, 10),
        lastShipmentDate: "",
        status: "collecting",
      });
    } catch {
      setSubmitError("Failed to save hub. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.35)" }}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-80" style={{ fontFamily: "'DM Sans',sans-serif" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color: "#1a1a1a" }}>New Collection Hub</h3>
          <button onClick={onCancel}><X size={16} color="#94A3B8" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748B" }}>Hub Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hub Mecca Mall"
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "#E2E8F0", fontFamily: "'DM Sans',sans-serif", color: "#1a1a1a" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748B" }}>Address / Description</label>
            <input value={address} onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "#E2E8F0", fontFamily: "'DM Sans',sans-serif", color: "#1a1a1a" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748B" }}>Shipment Schedule</label>
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "#E2E8F0" }}>
              {(["weekly", "monthly"] as const).map(s => (
                <button key={s} onClick={() => setSchedule(s)}
                  className="flex-1 py-2 text-sm font-semibold transition-colors"
                  style={{ background: schedule === s ? "#1E5C35" : "white", color: schedule === s ? "white" : "#64748B" }}>
                  {s === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "#64748B" }}>Capacity (kg equiv.)</label>
            <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} min={50} max={2000} step={50}
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ borderColor: "#E2E8F0", fontFamily: "'DM Mono',monospace", color: "#1a1a1a" }} />
          </div>
        </div>
        {submitError && (
          <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "#C8280A", marginTop: 8 }}>{submitError}</p>
        )}
        <div className="flex gap-2 mt-5">
          <button onClick={onCancel} disabled={submitting} className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors" style={{ background: "#F4F6F5", color: "#64748B" }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!name.trim() || submitting}
            className="flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: name.trim() && !submitting ? "#1E5C35" : "#94A3B8" }}>
            {submitting ? "Saving…" : "Add Hub"}
          </button>
        </div>
      </div>
    </div>
  );
}
