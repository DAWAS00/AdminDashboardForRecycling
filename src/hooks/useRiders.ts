import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, SupabaseProfile, SupabaseDriverLocation, SupabaseOrder } from "../lib/supabase";
import { adaptRider } from "../lib/adapters";
import type { Rider } from "../app/types";

export const RIDERS_KEY = ["riders"] as const;

async function fetchRiders(): Promise<Rider[]> {
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "driver");

  if (pErr) throw new Error(pErr.message);
  if (!profiles || profiles.length === 0) return [];

  const driverIds = (profiles as SupabaseProfile[]).map((p) => p.auth_id);

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

  return (profiles as SupabaseProfile[]).map((p) =>
    adaptRider(p, locationMap[p.auth_id] ?? null, ordersByDriver[p.auth_id] ?? [])
  );
}

export function useRiders() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const uid = Math.random().toString(36).slice(2, 7);

    const locationChannel = supabase
      .channel(`dash-driver-locations-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "driver_locations" }, () => {
        queryClient.invalidateQueries({ queryKey: RIDERS_KEY });
      })
      .subscribe();

    const ordersChannel = supabase
      .channel(`dash-driver-orders-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: RIDERS_KEY });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(locationChannel);
      supabase.removeChannel(ordersChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: RIDERS_KEY,
    queryFn: fetchRiders,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
