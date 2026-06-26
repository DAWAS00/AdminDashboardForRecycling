import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://bbpleeddaquwwvexzmdc.supabase.co";

const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY ?? "";

if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === "PASTE_YOUR_SERVICE_ROLE_KEY_HERE") {
  console.warn(
    "[Dwaar Dashboard] VITE_SUPABASE_SERVICE_KEY is not set. " +
    "Add your service_role key to .env.local — get it from Supabase dashboard → Settings → API."
  );
}

/**
 * Service-role Supabase client — bypasses RLS.
 * Internal admin tool only — never expose to end users.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ─── Raw Supabase row types (snake_case, mirrors the DB schema) ───────────────

export interface SupabaseProfile {
  auth_id: string;          // PK — UUID, FK to auth.users
  name: string;
  phone: string;
  email: string | null;
  role: "driver" | "supplier" | "recyclingCo";
  supplier_type: "individual" | "storeBusiness" | null;
  rating: number;
  total_orders: number;
  is_verified: boolean;
  is_available: boolean;
  points: number;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_plate: string | null;
  vehicle_type: "motorcycle" | "car" | "pickup" | "van" | "truck" | "heavyTruck" | null;
  has_chemical_permit: boolean;
  address: string | null;
  profile_photo_url: string | null;
  categories: string[];
  contract_tier: "free" | "basic" | "pro" | "enterprise";
  renewal_date: string | null;
  billing_cycle: "monthly" | "annual" | null;
  green_points: number;
  custom_price_jd: number | null;
  contract_notes: string | null;
  last_certificate_download: string | null;
  referred_by: string | null;
  created_at: string;
}

export interface SupabaseOrder {
  id: string;
  type: "pickup" | "collection" | "collectionSale";
  status: "pending" | "accepted" | "inTransit" | "completed" | "cancelled";
  supplier_id: string | null;
  driver_id: string | null;
  company_id: string | null;
  waste_types: string[];
  estimated_weight_kg: number;
  actual_weight_kg: number | null;
  reward_jd: number;
  is_urgent: boolean;
  notes: string | null;
  created_at: string;
  accepted_at: string | null;
  in_transit_at: string | null;
  completed_at: string | null;
}

export interface SupabaseDriverLocation {
  driver_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

export interface SupabaseHub {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  active: boolean;
  capacity_kg: number;
  current_load: {
    cookingOil: number;
    plastic: number;
    paper: number;
    electronics: number;
  };
  schedule: "weekly" | "monthly";
  next_shipment_date: string | null;
  last_shipment_date: string | null;
  status: "collecting" | "ready" | "shipped";
  created_at: string;
}
