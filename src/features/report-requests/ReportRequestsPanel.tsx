import type { FC } from "react";
import { useReportRequests } from "./useReportRequests";
import { ReportRequestRow } from "./ReportRequestRow";

export const ReportRequestsPanel: FC = () => {
  const { data: requests = [], isLoading, error } = useReportRequests();
  const pending = requests.filter((r) => r.status !== "ready");

  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: 12,
        padding: 20,
        border: "1px solid var(--color-neutral-200)",
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
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
          Report Requests
        </h3>
        {pending.length > 0 && (
          <span
            style={{
              background: "var(--color-amber-600)",
              color: "white",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {pending.length}
          </span>
        )}
      </div>

      {/* States */}
      {isLoading && (
        <p style={{ color: "var(--color-neutral-400)", fontSize: 13 }}>
          Loading requests…
        </p>
      )}
      {error && (
        <p style={{ color: "var(--color-red-600)", fontSize: 13 }}>
          Failed to load requests.
        </p>
      )}
      {!isLoading && !error && requests.length === 0 && (
        <p style={{ color: "var(--color-neutral-400)", fontSize: 13 }}>
          No report requests yet.
        </p>
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
