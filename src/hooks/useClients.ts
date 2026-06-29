import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase, SupabaseProfile } from "../lib/supabase";
import { adaptClient } from "../lib/adapters";
import type { Client, ContractTier } from "../app/types";

export const CLIENTS_KEY = ["clients"] as const;

async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "recyclingCo")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as SupabaseProfile[]).map(adaptClient);
}

export function useClients() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const uid = Math.random().toString(36).slice(2, 7);
    const channel = supabase
      .channel(`dash-clients-live-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const query = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: fetchClients,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const updateTier = useMutation({
    mutationFn: async ({ clientId, tier }: { clientId: string; tier: ContractTier }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ contract_tier: tier })
        .eq("auth_id", clientId);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ clientId, tier }) => {
      await queryClient.cancelQueries({ queryKey: CLIENTS_KEY });
      const previous = queryClient.getQueryData<Client[]>(CLIENTS_KEY);
      queryClient.setQueryData<Client[]>(CLIENTS_KEY, (old = []) =>
        old.map((c) => (c.id === clientId ? { ...c, contractTier: tier } : c))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(CLIENTS_KEY, ctx?.previous);
      toast.error("Failed to update partner tier.");
    },
    onSuccess: (_, { tier }) => {
      toast.success(`Partner tier updated to ${tier}.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({ clientId, notes }: { clientId: string; notes: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ contract_notes: notes })
        .eq("auth_id", clientId);
      if (error) throw new Error(error.message);
    },
    onError: () => toast.error("Failed to save notes."),
    onSuccess: () => toast.success("Notes saved."),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });

  const awardPoints = useMutation({
    mutationFn: async ({ clientId, points }: { clientId: string; points: number }) => {
      const clients = queryClient.getQueryData<Client[]>(CLIENTS_KEY) ?? [];
      const client = clients.find((c) => c.id === clientId);
      if (!client) throw new Error("Client not found");
      const { error } = await supabase
        .from("profiles")
        .update({ green_points: client.greenPoints + points })
        .eq("auth_id", clientId);
      if (error) throw new Error(error.message);
    },
    onMutate: async ({ clientId, points }) => {
      await queryClient.cancelQueries({ queryKey: CLIENTS_KEY });
      const previous = queryClient.getQueryData<Client[]>(CLIENTS_KEY);
      queryClient.setQueryData<Client[]>(CLIENTS_KEY, (old = []) =>
        old.map((c) => (c.id === clientId ? { ...c, greenPoints: c.greenPoints + points } : c))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(CLIENTS_KEY, ctx?.previous);
      toast.error("Failed to award green points.");
    },
    onSuccess: (_, { points }) => {
      toast.success(`${points} green points awarded.`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_KEY });
    },
  });

  return {
    ...query,
    updateTier,
    updateNotes,
    awardPoints,
  };
}
