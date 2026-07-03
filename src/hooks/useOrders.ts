import { useState, useEffect, useCallback } from "react";
import { supabase, SupabaseOrder } from "../lib/supabase";
import { adaptOrder } from "../lib/adapters";
import { Order } from "../app/types";

export interface OrderRow extends Omit<Order, "status"> {
  status: SupabaseOrder["status"];
  driverId: string | null;
  supplierId: string | null;
  companyId: string | null;
  isUrgent: boolean;
  rawWasteTypes: string[];
}

function adaptFullOrder(row: SupabaseOrder): OrderRow {
  const base = adaptOrder(row);
  return {
    ...base,
    status:        row.status,
    driverId:      row.driver_id ?? null,
    supplierId:    row.supplier_id ?? null,
    companyId:     row.company_id ?? null,
    isUrgent:      row.is_urgent,
    rawWasteTypes: row.waste_types,
  };
}

export function useOrders(statusFilter?: SupabaseOrder["status"][]) {
  const [orders, setOrders]   = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const filterKey = statusFilter?.join(",") ?? "";

  const refetch = useCallback(async () => {
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter && statusFilter.length > 0) {
      query = query.in("status", statusFilter);
    }

    const { data, error: e } = await query;
    if (e) { setError(e.message); return; }
    setOrders((data as SupabaseOrder[]).map(adaptFullOrder));
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    refetch();

    const uid = Math.random().toString(36).slice(2, 7);
    const ch = supabase
      .channel(`dash-all-orders-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => refetch())
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const dispatchOrder = useCallback(async (orderId: string, driverId: string, reassign = false) => {
    const { error: e } = await supabase.functions.invoke("dispatch-order", {
      body: { order_id: orderId, driver_id: driverId, reassign },
    });
    if (e) throw new Error(e.message);
    await refetch();
  }, [refetch]);

  const cancelOrder = useCallback(async (orderId: string) => {
    const { error: e } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);
    if (e) throw new Error(e.message);
    await refetch();
  }, [refetch]);

  return { orders, loading, error, dispatchOrder, cancelOrder, refetch };
}
