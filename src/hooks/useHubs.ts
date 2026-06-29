import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase, SupabaseHub } from "../lib/supabase";
import { adaptHub } from "../lib/adapters";
import type { Hub } from "../app/types";

export const HUBS_KEY = ["hubs"] as const;

async function fetchHubs(): Promise<Hub[]> {
  const { data, error } = await supabase
    .from("hubs")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data as SupabaseHub[]).map(adaptHub);
}

export function useHubs() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const uid = Math.random().toString(36).slice(2, 7);
    const channel = supabase
      .channel(`dash-hubs-live-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "hubs" }, () => {
        queryClient.invalidateQueries({ queryKey: HUBS_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const query = useQuery({
    queryKey: HUBS_KEY,
    queryFn: fetchHubs,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const addHub = useMutation({
    mutationFn: async (data: Omit<Hub, "id">) => {
      const { error } = await supabase.from("hubs").insert({
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        active: data.active,
        capacity_kg: data.capacityKg,
        current_load: data.currentLoad,
        schedule: data.schedule,
        next_shipment_date: data.nextShipmentDate || null,
        last_shipment_date: data.lastShipmentDate || null,
        status: data.status,
      });
      if (error) throw new Error(error.message);
    },
    onMutate: async (newHub) => {
      await queryClient.cancelQueries({ queryKey: HUBS_KEY });
      const previous = queryClient.getQueryData<Hub[]>(HUBS_KEY);
      queryClient.setQueryData<Hub[]>(HUBS_KEY, (old = []) => [
        ...old,
        { id: crypto.randomUUID(), ...newHub },
      ]);
      return { previous };
    },
    onError: (_err, _hub, ctx) => {
      queryClient.setQueryData(HUBS_KEY, ctx?.previous);
      toast.error("Failed to add hub — changes rolled back.");
    },
    onSuccess: () => {
      toast.success("Hub added successfully.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HUBS_KEY });
    },
  });

  const toggleHubActive = useMutation({
    mutationFn: async ({ hubId, active }: { hubId: string; active: boolean }) => {
      const { error } = await supabase.from("hubs").update({ active }).eq("id", hubId);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ hubId, active }) => {
      await queryClient.cancelQueries({ queryKey: HUBS_KEY });
      const previous = queryClient.getQueryData<Hub[]>(HUBS_KEY);
      queryClient.setQueryData<Hub[]>(HUBS_KEY, (old = []) =>
        old.map((h) => (h.id === hubId ? { ...h, active } : h))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(HUBS_KEY, ctx?.previous);
      toast.error("Failed to update hub status.");
    },
    onSuccess: (_, { active }) => {
      toast.success(active ? "Hub activated." : "Hub deactivated.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HUBS_KEY });
    },
  });

  const updateHubStatus = useMutation({
    mutationFn: async ({ hubId, status }: { hubId: string; status: Hub["status"] }) => {
      const { error } = await supabase.from("hubs").update({ status }).eq("id", hubId);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ hubId, status }) => {
      await queryClient.cancelQueries({ queryKey: HUBS_KEY });
      const previous = queryClient.getQueryData<Hub[]>(HUBS_KEY);
      queryClient.setQueryData<Hub[]>(HUBS_KEY, (old = []) =>
        old.map((h) => (h.id === hubId ? { ...h, status } : h))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(HUBS_KEY, ctx?.previous);
      toast.error("Failed to update hub status.");
    },
    onSuccess: (_, { status }) => {
      const labels: Record<Hub["status"], string> = {
        collecting: "Hub marked as Collecting.",
        ready: "Hub marked as Ready to Ship.",
        shipped: "Hub marked as Shipped.",
      };
      toast.success(labels[status]);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: HUBS_KEY });
    },
  });

  return {
    ...query,
    addHub,
    toggleHubActive,
    updateHubStatus,
  };
}
