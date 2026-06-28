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

  // Realtime subscription — invalidate on any INSERT/UPDATE/DELETE
  useEffect(() => {
    const channel = supabase
      .channel("dash-report-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "report_requests" },
        () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })
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

  return { ...query, updateStatus };
}
