import { Order } from "../../types";

const STEPS: { key: Order["status"]; label: string }[] = [
  { key: "pending",   label: "Pending"   },
  { key: "accepted",  label: "Accepted"  },
  { key: "inTransit", label: "In Transit"},
  { key: "completed", label: "Completed" },
];

const STATUS_ORDER: Record<Order["status"], number> = {
  pending: 0, accepted: 1, inTransit: 2, completed: 3,
};

interface ProgressTrailProps {
  status: Order["status"];
  accentColor: string;
}

export function ProgressTrail({ status, accentColor }: ProgressTrailProps) {
  const currentIndex = STATUS_ORDER[status];

  return (
    <div
      aria-label={`Order status: ${STEPS[currentIndex].label} (step ${currentIndex + 1} of ${STEPS.length})`}
      style={{ display: "flex", alignItems: "center", gap: 0, paddingTop: 8, paddingBottom: 4 }}
    >
      {STEPS.map((step, i) => {
        const reached  = i <= currentIndex;
        const isActive = i === currentIndex;
        const isLast   = i === STEPS.length - 1;

        return (
          <div key={step.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              {/* Node */}
              <div
                className={isActive ? "animate-trail-pulse" : undefined}
                style={{
                  width: 10, height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: reached ? accentColor : "var(--color-border)",
                  border: `2px solid ${reached ? accentColor : "var(--color-border)"}`,
                  transition: "background 0.2s",
                }}
              />
              {/* Line to next node */}
              {!isLast && (
                <div
                  style={{
                    flex: 1, height: 2,
                    background: i < currentIndex ? accentColor : "var(--color-border)",
                    transition: "background 0.2s",
                  }}
                />
              )}
            </div>
            {/* Label */}
            <span
              style={{
                marginTop: 4,
                fontSize: 9,
                color: reached ? accentColor : "var(--color-text-disabled)",
                fontWeight: isActive ? 600 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
