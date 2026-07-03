import { useState, useEffect, useCallback } from "react";
import { supabase, SupabaseProfile } from "../lib/supabase";

export interface SupplierRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  supplierType: "individual" | "storeBusiness" | null;
  isVerified: boolean;
  isAvailable: boolean;
  address: string | null;
  categories: string[];
  rating: number;
  totalOrders: number;
  joinedAt: string;
}

function adaptSupplier(u: SupabaseProfile): SupplierRow {
  return {
    id:           u.auth_id,
    name:         u.name,
    phone:        u.phone,
    email:        u.email,
    supplierType: u.supplier_type,
    isVerified:   u.is_verified,
    isAvailable:  u.is_available,
    address:      u.address,
    categories:   u.categories,
    rating:       u.rating,
    totalOrders:  u.total_orders,
    joinedAt:     u.created_at,
  };
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const { data, error: e } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "supplier")
      .order("created_at", { ascending: false });
    if (e) { setError(e.message); return; }
    setSuppliers((data as SupabaseProfile[]).map(adaptSupplier));
    setLoading(false);
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  const verifySupplier = useCallback(async (id: string) => {
    const { error: e } = await supabase
      .from("profiles").update({ is_verified: true }).eq("auth_id", id);
    if (e) throw new Error(e.message);
    await supabase.functions.invoke("send-push", {
      body: {
        user_ids: [id],
        title: "Account Verified ✓",
        body: "Your Dwaar supplier account has been approved. You can now post pickup requests.",
        type: "accountVerified",
      },
    });
    await refetch();
  }, [refetch]);

  const rejectSupplier = useCallback(async (id: string, reason?: string) => {
    const { error: e } = await supabase
      .from("profiles").update({ is_verified: false }).eq("auth_id", id);
    if (e) throw new Error(e.message);
    await supabase.functions.invoke("send-push", {
      body: {
        user_ids: [id],
        title: "Account Verification Required",
        body: reason ?? "Please contact support to complete your account setup.",
        type: "accountRejected",
      },
    });
    await refetch();
  }, [refetch]);

  const toggleAvailability = useCallback(async (id: string, available: boolean) => {
    const { error: e } = await supabase
      .from("profiles").update({ is_available: available }).eq("auth_id", id);
    if (e) throw new Error(e.message);
    await refetch();
  }, [refetch]);

  const pendingVerification = suppliers.filter(s => !s.isVerified);
  const verified            = suppliers.filter(s => s.isVerified);

  return {
    suppliers, pendingVerification, verified,
    loading, error,
    verifySupplier, rejectSupplier, toggleAvailability,
    refetch,
  };
}
