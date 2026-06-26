import { useState, useEffect } from "react";
import { supabase, SupabaseProfile, SupabaseDriverLocation, SupabaseOrder } from "../lib/supabase";
import { adaptRider } from "../lib/adapters";
import { Rider } from "../app/types";

export function useRiders() {
  const [riders, setRiders]   = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    setError(null);

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "driver");

    if (pErr) { setError(pErr.message); setLoading(false); return; }
    if (!profiles || profiles.length === 0) { setRiders([]); setLoading(false); return; }

    const driverIds = (profiles as SupabaseProfile[]).map(p => p.auth_id);

    const [{ data: locations }, { data: orders }] = await Promise.all([
      supabase.from("driver_locations").select("*").in("driver_id", driverIds),
      supabase
        .from("orders")
        .select("*")
        .in("driver_id", driverIds)
        .in("status", ["pending", "accepted", "inTransit"]),
    ]);

    const locationMap: Record<string, SupabaseDriverLocation> = {};
    for (const loc of (locations ?? []) as SupabaseDriverLocation[]) {
      locationMap[loc.driver_id] = loc;
    }

    const ordersByDriver: Record<string, SupabaseOrder[]> = {};
    for (const order of (orders ?? []) as SupabaseOrder[]) {
      if (order.driver_id) {
        (ordersByDriver[order.driver_id] ??= []).push(order);
      }
    }

    const adapted = (profiles as SupabaseProfile[]).map(p =>
      adaptRider(p, locationMap[p.auth_id] ?? null, ordersByDriver[p.auth_id] ?? [])
    );

    setRiders(adapted);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    const run = async () => { if (!cancelled) await fetchAll(); };
    run();

    const locationChannel = supabase
      .channel("dashboard-driver-locations")
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations" }, () => {
        if (!cancelled) fetchAll();
      })
      .subscribe();

    const ordersChannel = supabase
      .channel("dashboard-driver-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        if (!cancelled) fetchAll();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(locationChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  return { riders, loading, error, refetch: fetchAll };
}
