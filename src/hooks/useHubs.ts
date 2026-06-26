import { useState, useEffect, useCallback } from "react";
import { supabase, SupabaseHub } from "../lib/supabase";
import { adaptHub } from "../lib/adapters";
import { Hub } from "../app/types";

export function useHubs() {
  const [hubs, setHubs]       = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  async function fetchHubs() {
    const { data, error: err } = await supabase
      .from("hubs")
      .select("*")
      .order("created_at", { ascending: true });

    if (err) { setError(err.message); return; }
    setHubs((data as SupabaseHub[]).map(adaptHub));
    setLoading(false);
  }

  useEffect(() => { fetchHubs(); }, []);

  /** Add a new hub. Accepts the same shape as Omit<Hub, "id"> from AddHubModal. */
  const addHub = useCallback(async (data: Omit<Hub, "id">) => {
    const { error: err } = await supabase.from("hubs").insert({
      name:               data.name,
      address:            data.address,
      lat:                data.lat,
      lng:                data.lng,
      active:             data.active,
      capacity_kg:        data.capacityKg,
      current_load:       data.currentLoad,
      schedule:           data.schedule,
      next_shipment_date: data.nextShipmentDate || null,
      last_shipment_date: data.lastShipmentDate || null,
      status:             data.status,
    });
    if (err) throw new Error(err.message);
    await fetchHubs();
  }, []);

  const toggleHubActive = useCallback(async (hubId: string, active: boolean) => {
    const { error: err } = await supabase
      .from("hubs")
      .update({ active })
      .eq("id", hubId);
    if (err) throw new Error(err.message);
    await fetchHubs();
  }, []);

  const updateHubStatus = useCallback(async (hubId: string, status: Hub["status"]) => {
    const { error: err } = await supabase
      .from("hubs")
      .update({ status })
      .eq("id", hubId);
    if (err) throw new Error(err.message);
    await fetchHubs();
  }, []);

  return { hubs, loading, error, addHub, toggleHubActive, updateHubStatus };
}
