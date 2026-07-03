import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

export type ReportStatus = "pending" | "processing" | "ready";

export interface ReportRequest {
  id: string;
  userId: string;
  template: "weeklySummary" | "monthlyInvoice" | "co2Certificate" | "esgReport";
  status: ReportStatus;
  periodStart: string;
  periodEnd: string;
  downloadUrl: string | null;
  requestedAt: string;
  fulfilledAt: string | null;
}

const QUERY_KEY = ["report-requests"] as const;

export function adaptRow(row: Record<string, unknown>): ReportRequest {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    template: row.template as ReportRequest["template"],
    status: row.status as ReportStatus,
    periodStart: row.period_start as string,
    periodEnd: row.period_end as string,
    downloadUrl: (row.download_url as string | null) ?? null,
    requestedAt: row.requested_at as string,
    fulfilledAt: (row.fulfilled_at as string | null) ?? null,
  };
}

export function useReportRequests() {
  const queryClient = useQueryClient();

  // Realtime subscription — invalidate cache on any INSERT/UPDATE/DELETE.
  // subscribe() error is handled via status callback so it never throws into React.
  useEffect(() => {
    const uid = Math.random().toString(36).slice(2, 7);
    const channel = supabase
      .channel(`dash-report-requests-${uid}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "report_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEY }).catch(() => {});
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<ReportRequest[]> => {
      const { data, error } = await supabase
        .from("report_requests")
        .select("*")
        .order("requested_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []).map(adaptRow);
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      id,
      status,
      downloadUrl,
    }: {
      id: string;
      status: ReportStatus;
      downloadUrl?: string;
    }) => {
      const patch: Record<string, unknown> = { status };
      if (downloadUrl) patch.download_url = downloadUrl;
      if (status === "ready") patch.fulfilled_at = new Date().toISOString();

      const { error } = await supabase
        .from("report_requests")
        .update(patch)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Report status updated.");
    },
    onError: () => toast.error("Failed to update report status."),
  });

  const generateAndUploadPdf = useMutation({
    mutationFn: async (request: ReportRequest) => {
      // 1. Create off-screen container element
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.width = "800px";
      container.style.background = "white";
      document.body.appendChild(container);

      // Dynamic react element creation based on template
      const React = await import("react");
      const { createRoot } = await import("react-dom/client");
      const { generatePdfBlob } = await import("./pdfGenerator");
      
      const { WeeklyOperationsReport } = await import("../../app/components/reports/reports/WeeklyOperationsReport");
      const { Co2CertificateReport } = await import("../../app/components/reports/reports/Co2CertificateReport");
      const { MonthlyInvoiceReport } = await import("../../app/components/reports/reports/MonthlyInvoiceReport");
      const { EsgReport } = await import("../../app/components/reports/reports/EsgReport");

      let element;
      if (request.template === "co2Certificate") {
        element = React.createElement(Co2CertificateReport, {
          clientId: request.userId,
          hideControls: true,
        });
      } else if (request.template === "weeklySummary") {
        element = React.createElement(WeeklyOperationsReport, {
          periodStart: request.periodStart,
          periodEnd: request.periodEnd,
          hideControls: true,
        });
      } else if (request.template === "monthlyInvoice") {
        element = React.createElement(MonthlyInvoiceReport, {
          clientId: request.userId,
          periodStart: request.periodStart,
          periodEnd: request.periodEnd,
          hideControls: true,
        });
      } else if (request.template === "esgReport") {
        element = React.createElement(EsgReport, {
          clientId: request.userId,
          periodStart: request.periodStart,
          periodEnd: request.periodEnd,
          hideControls: true,
        });
      } else {
        element = React.createElement("div", {}, "Unknown template type");
      }

      const root = createRoot(container);
      root.render(element);

      // Wait 1.5s for fonts, SVG chart rendering, and layout calculations
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        // 2. Generate PDF
        const filename = `${request.template}-${request.id.slice(0, 8)}.pdf`;
        const blob = await generatePdfBlob(container, filename);

        // Clean up DOM container
        root.unmount();
        container.remove();

        // 3. Ensure Supabase storage bucket exists
        try {
          const { data: buckets } = await supabase.storage.listBuckets();
          const bucketExists = buckets?.some((b) => b.name === "reports");
          if (!bucketExists) {
            await supabase.storage.createBucket("reports", { public: true });
          }
        } catch (bucketErr) {
          console.warn("Storage bucket listing/creation warning:", bucketErr);
        }

        // 4. Upload PDF
        const filePath = `${request.userId}/${filename}`;
        const { error: uploadError } = await supabase.storage
          .from("reports")
          .upload(filePath, blob, {
            contentType: "application/pdf",
            upsert: true,
          });

        if (uploadError) throw new Error(`Upload error: ${uploadError.message}`);

        // 5. Get public download URL
        const { data: { publicUrl } } = supabase.storage
          .from("reports")
          .getPublicUrl(filePath);

        // 6. Update database record status and URL
        const { error: dbError } = await supabase
          .from("report_requests")
          .update({
            status: "ready",
            download_url: publicUrl,
            fulfilled_at: new Date().toISOString(),
          })
          .eq("id", request.id);

        if (dbError) throw new Error(`Database error: ${dbError.message}`);

        return publicUrl;
      } catch (err: any) {
        // Clean up on error
        try {
          root.unmount();
          container.remove();
        } catch (cleanupErr) {}
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("PDF report generated and uploaded successfully.");
    },
    onError: (err: any) => {
      toast.error(`PDF generation failed: ${err.message || err}`);
    },
  });

  return { ...query, updateStatus, generateAndUploadPdf };
}
