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
  const { updateStatus, generateAndUploadPdf } = useReportRequests();

  const next = NEXT_STATUS[request.status];
  const canAdvance = next !== null;

  const isGenerating = generateAndUploadPdf.isPending && generateAndUploadPdf.variables?.id === request.id;
  const isPendingAny = updateStatus.isPending || generateAndUploadPdf.isPending;

  function handleAdvance() {
    if (!next) return;
    updateStatus.mutate({
      id: request.id,
      status: next,
    });
  }

  function handleGeneratePdf() {
    generateAndUploadPdf.mutate(request);
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
            background: isGenerating ? "rgba(29, 78, 216, 0.1)" : `${STATUS_COLORS[request.status]}20`,
            color: isGenerating ? "var(--color-blue-600)" : STATUS_COLORS[request.status],
          }}
        >
          {isGenerating ? "Generating..." : STATUS_LABELS[request.status]}
        </span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 12 }}>
        {new Date(request.requestedAt).toLocaleDateString()}
      </td>
      <td style={{ padding: "10px 12px" }}>
        {request.status === "pending" && (
          <button
            onClick={handleAdvance}
            disabled={isPendingAny}
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 6,
              background: "var(--color-brand-600)",
              color: "white",
              border: "none",
              cursor: isPendingAny ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: isPendingAny ? 0.6 : 1,
            }}
          >
            Mark Processing
          </button>
        )}
        {request.status === "processing" && (
          <button
            onClick={handleGeneratePdf}
            disabled={isPendingAny}
            style={{
              fontSize: 11,
              padding: "4px 12px",
              borderRadius: 6,
              background: "var(--color-brand-600)",
              color: "white",
              border: "none",
              cursor: isPendingAny ? "not-allowed" : "pointer",
              fontWeight: 600,
              opacity: isPendingAny ? 0.6 : 1,
            }}
          >
            {isGenerating ? "Generating & Uploading..." : "Generate & Upload PDF"}
          </button>
        )}
        {request.status === "ready" && request.downloadUrl && (
          <a
            href={request.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: "var(--color-brand-600)",
              textDecoration: "underline",
            }}
          >
            Download PDF
          </a>
        )}
      </td>
    </tr>
  );
};
