import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import type { Hub } from "../types";

const addHubSchema = z.object({
  name:     z.string().min(3, "Name must be at least 3 characters").max(60),
  address:  z.string().min(3, "Address is required"),
  schedule: z.enum(["weekly", "monthly"]),
  capacity: z.number({ invalid_type_error: "Enter a number" }).min(50, "Min 50 kg").max(5000, "Max 5000 kg"),
});

type AddHubForm = z.infer<typeof addHubSchema>;

interface AddHubModalProps {
  lat: number;
  lng: number;
  onConfirm: (hub: Omit<Hub, "id">) => Promise<void>;
  onCancel: () => void;
}

export function AddHubModal({ lat, lng, onConfirm, onCancel }: AddHubModalProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AddHubForm>({
    resolver: zodResolver(addHubSchema),
    defaultValues: {
      name:     "",
      address:  `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      schedule: "weekly",
      capacity: 400,
    },
  });

  const schedule = watch("schedule");

  const onSubmit = async (data: AddHubForm) => {
    const today = new Date();
    const next  = new Date(today);
    next.setDate(today.getDate() + (data.schedule === "weekly" ? 7 : 30));
    await onConfirm({
      name:             data.name,
      address:          data.address,
      lat,
      lng,
      active:           true,
      capacityKg:       data.capacity,
      currentLoad:      { cookingOil: 0, plastic: 0, paper: 0, electronics: 0 },
      schedule:         data.schedule,
      nextShipmentDate: next.toISOString().slice(0, 10),
      lastShipmentDate: "",
      status:           "collecting",
    });
  };

  return (
    <div
      className="absolute inset-0 z-[1000] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onCancel}
    >
      <div
        className="rounded-2xl shadow-2xl p-6 w-80"
        style={{ background: "white", fontFamily: "var(--font-sans)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-neutral-900)" }}>New Collection Hub</h3>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X size={16} style={{ color: "var(--color-neutral-400)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {/* Hub Name */}
          <Field label="Hub Name *" error={errors.name?.message}>
            <input
              {...register("name")}
              placeholder="e.g. Hub Mecca Mall"
              style={inputStyle(!!errors.name)}
            />
          </Field>

          {/* Address */}
          <Field label="Address / Description" error={errors.address?.message}>
            <input
              {...register("address")}
              style={inputStyle(!!errors.address)}
            />
          </Field>

          {/* Schedule toggle */}
          <Field label="Shipment Schedule" error={errors.schedule?.message}>
            <div
              className="flex rounded-lg overflow-hidden border"
              style={{ borderColor: "var(--color-border)" }}
            >
              {(["weekly", "monthly"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue("schedule", s)}
                  className="flex-1 py-2 text-sm font-semibold transition-colors"
                  style={{
                    background: schedule === s ? "var(--color-brand-600)" : "white",
                    color:      schedule === s ? "white" : "var(--color-neutral-500)",
                    border:     "none",
                    cursor:     "pointer",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {s === "weekly" ? "Weekly" : "Monthly"}
                </button>
              ))}
            </div>
          </Field>

          {/* Capacity */}
          <Field label="Capacity (kg equiv.)" error={errors.capacity?.message}>
            <input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              min={50}
              max={5000}
              step={50}
              style={{ ...inputStyle(!!errors.capacity), fontFamily: "var(--font-mono)" }}
            />
          </Field>

          <div className="flex gap-2 mt-5">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{ flex: 1, padding: "8px 0", borderRadius: "var(--radius-md)", background: "var(--color-neutral-100)", color: "var(--color-neutral-500)", border: "none", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{ flex: 1, padding: "8px 0", borderRadius: "var(--radius-md)", background: isSubmitting ? "var(--color-neutral-300)" : "var(--color-brand-600)", color: "white", border: "none", fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, cursor: isSubmitting ? "not-allowed" : "pointer" }}
            >
              {isSubmitting ? "Saving…" : "Add Hub"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "var(--radius-md)",
    border: `1px solid ${hasError ? "var(--color-red-400)" : "var(--color-border)"}`,
    background: "white",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    color: "var(--color-neutral-900)",
    outline: "none",
    boxSizing: "border-box",
  };
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "var(--color-neutral-500)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 5 }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--color-red-500)", marginTop: 3 }}>{error}</p>
      )}
    </div>
  );
}
