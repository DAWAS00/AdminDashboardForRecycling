import type { FC } from "react";
import { useState } from "react";
import type { ReportRequest, ReportStatus } from "./useReportRequests";
import { useReportRequests } from "./useReportRequests";

const STATUS_COLORS: Record<ReportStatus, string> = {
  pending: "var(--color-amber-600)",
  processing: "var(--color-brand-600)",
  ready: "var(--color-status-delivering)",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
};

const TEMPLATE_LABELS: Record<ReportRequest["template"], string> = {
  weeklySummary: "Weekly Summary",
  monthlyInvoice: "Monthly Invoice",
  co2Certificate: "CO₂ Certificate",
  esgReport: "ESG Report",
};

const NEXT_STATUS: Record<ReportStatus, ReportStatus | null> = {
  pending: "processing",
  processing: "ready",
  ready: null,
};

export const ReportRequestRow: FC<{ request: ReportRequest }> = ({ request }) => {
  const { updateStatus } = useReportRequests();
  const [downloadInput, setDownloadInput] = useState("");

  const next = NEXT_STATUS[request.status];
  const canAdvance = next !== null;

  function handleAdvance() {
    if (!next) return;
    updateStatus.mutate({
      id: request.id,
      status: next,
      downloadUrl: next === "ready" ? downloadInput || undefined : undefined,
    });
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--color-neutral-200)" }}>
      <td style={{ padding: "10px 12px" }}>
        <span style={{ fontWeight: 600 }}>
          {TEMPLATE_LABELS[request.template]}
        </span>
        <div style={{ fontSize: 11, color: "var(--color-neutral-500)" }}>
          {request.periodStart} → {request.periodEnd}
        </div>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--color-neutral-500)" }}>
        {request.userId.slice(0, 12)}…
      </td>
      <td style={{ padding: "10px 12px" }}>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            background: `${STATUS_COLORS[request.status]}20`,
            color: STATUS_COLORS[request.status],
          }}
        >
          {STATUS_LABELS[request.status]}
        </span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12 }}>
        {new Date(request.requestedAt).toLocaleDateString()}
      </td>
      <td style={{ padding: "10px 12px" }}>
        {request.status === "processing" && (
          <input
            placeholder="Download URL (optional)"
            value={downloadInput}
            onChange={(e) => setDownloadInput(e.target.value)}
            style={{
              fontSize: 11,
              border: "1px solid var(--color-neutral-200)",
              borderRadius: 6,
              padding: "4px 8px",
              marginRight: 8,
              width: 200,
            }}
          />
        )}
        {canAdvance && (
          <button
            onClick={handleAdvance}
            disabled={updateStatus.isPending}
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 6,
              background: "var(--color-brand-600)",
              color: "white",
              border: "none",
              cursor: updateStatus.isPending ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: updateStatus.isPending ? 0.6 : 1,
            }}
          >
            {request.status === "pending" ? "Mark Processing" : "Mark Ready"}
          </button>
        )}
        {request.status === "ready" && request.downloadUrl && (
          <a
            href={request.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--color-brand-600)" }}
          >
            Download
          </a>
        )}
      </td>
    </tr>
  );
};
