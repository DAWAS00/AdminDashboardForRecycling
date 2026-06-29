import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  "https://bbpleeddaquwwvexzmdc.supabase.co";

const SUPABASE_SERVICE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_KEY ?? "";
const SUPABASE_ANON_KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const isServiceKeyValid =
  SUPABASE_SERVICE_KEY &&
  SUPABASE_SERVICE_KEY !== "PASTE_YOUR_SERVICE_ROLE_KEY_HERE";

// Prefer service_role (bypasses RLS). Fall back to anon key with RLS policies.
const ACTIVE_KEY = isServiceKeyValid ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;

if (!ACTIVE_KEY) {
  console.error(
    "[Dawer Dashboard] No Supabase key found. " +
    "Add VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_SERVICE_KEY to .env.local"
  );
} else if (!isServiceKeyValid) {
  console.info(
    "[Dawer Dashboard] Running with anon key + RLS policies. " +
    "Add VITE_SUPABASE_SERVICE_KEY for full service-role access."
  );
}

/**
 * Supabase client for the admin dashboard.
 * Uses service_role key when available (bypasses RLS),
 * otherwise anon key with dashboard-specific RLS read/write policies.
 * Never expose service_role to end users.
 */
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  ACTIVE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ─── Raw Supabase row types (snake_case, mirrors the DB schema) ───────────────

export interface SupabaseProfile {
  auth_id: string;
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
  status:
    | "pending"
    | "accepted"
    | "arrivedAtPickup"
    | "inTransit"
    | "arrivedAtDropoff"
    | "completed"
    | "cancelled";
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
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
}

export interface SupabaseDriverLocation {
  driver_id: string;
  order_id: string;
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
