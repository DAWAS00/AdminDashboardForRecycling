import { useState, useEffect, useCallback } from "react";
import { supabase, SupabaseProfile } from "../lib/supabase";
import { adaptClient } from "../lib/adapters";
import { Client, ContractTier } from "../app/types";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function fetchClients() {
    const { data, error: err } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "recyclingCo")
      .order("created_at", { ascending: false });

    if (err) { setError(err.message); return; }
    setClients((data as SupabaseProfile[]).map(adaptClient));
    setLoading(false);
  }

  useEffect(() => { fetchClients(); }, []);

  const updateTier = useCallback(async (clientId: string, tier: ContractTier) => {
    const { error: err } = await supabase
      .from("profiles")
      .update({ contract_tier: tier })
      .eq("auth_id", clientId);
    if (err) throw new Error(err.message);
    await fetchClients();
  }, []);

  const updateNotes = useCallback(async (clientId: string, notes: string) => {
    const { error: err } = await supabase
      .from("profiles")
      .update({ contract_notes: notes })
      .eq("auth_id", clientId);
    if (err) throw new Error(err.message);
    await fetchClients();
  }, []);

  const awardPoints = useCallback(async (clientId: string, points: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const { error: err } = await supabase
      .from("profiles")
      .update({ green_points: client.greenPoints + points })
      .eq("auth_id", clientId);
    if (err) throw new Error(err.message);
    await fetchClients();
  }, [clients]);

  return { clients, loading, error, updateTier, updateNotes, awardPoints };
}
