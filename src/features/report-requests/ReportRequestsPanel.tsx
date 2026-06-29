import type { FC } from "react";
import { Inbox } from "lucide-react";
import { useReportRequests } from "./useReportRequests";
import { ReportRequestRow } from "./ReportRequestRow";

export const ReportRequestsPanel: FC = () => {
  const { data: requests = [], isLoading, error } = useReportRequests();
  const pending = requests.filter((r) => r.status !== "ready");

  return (
    <div
      style={{
        background: "var(--color-surface-card)",
        borderRadius: 12,
        padding: 20,
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--color-text-primary)" }}>
          Request Queue
        </h3>
        {pending.length > 0 && (
          <span
            style={{
              background: "var(--color-amber-600)",
              color: "white",
              borderRadius: "50%",
              width: 18,
              height: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {pending.length}
          </span>
        )}
      </div>

      {/* States */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-skeleton" style={{ height: 48, borderRadius: 8 }} />
          ))}
        </div>
      )}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-danger-600)", fontSize: 13, background: "var(--color-danger-100)", padding: "10px 16px", borderRadius: 8 }}>
          <span>Failed to load queue. Please try again.</span>
        </div>
      )}
      {!isLoading && !error && requests.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px", textAlign: "center" }}>
          <Inbox size={32} color="var(--color-text-tertiary)" style={{ marginBottom: 12 }} />
          <h4 style={{ margin: "0 0 4px 0", fontSize: 13, fontWeight: 600, color: "var(--color-text-primary)" }}>No Report Requests</h4>
          <p style={{ margin: 0, fontSize: 12, color: "var(--color-text-tertiary)" }}>New requests will appear in this queue in real-time.</p>
        </div>
      )}

      {/* Table */}
      {requests.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--color-neutral-200)",
                  textAlign: "left",
                  color: "var(--color-neutral-500)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                <th style={{ padding: "8px 12px" }}>Template</th>
                <th style={{ padding: "8px 12px" }}>User</th>
                <th style={{ padding: "8px 12px" }}>Status</th>
                <th style={{ padding: "8px 12px" }}>Requested</th>
                <th style={{ padding: "8px 12px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <ReportRequestRow key={r.id} request={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
