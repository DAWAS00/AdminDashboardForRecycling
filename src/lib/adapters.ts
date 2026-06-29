import { Rider, Order, Hub, Client, ClientType, ContractTier, HubMaterials } from "../app/types";
import {
  SupabaseProfile,
  SupabaseOrder,
  SupabaseDriverLocation,
  SupabaseHub,
} from "./supabase";

// ─── Waste type mapping ────────────────────────────────────────────────────────
const WASTE_TO_MATERIAL: Record<string, Order["material"]> = {
  oil:             "Cooking Oil",
  cookingOil:      "Cooking Oil",
  plastic:         "Plastic Bottles",
  electronics:     "Electronics",
  batteries:       "Electronics",
  copperAluminium: "Electronics",
  paper:           "Paper & Cardboard",
  cardboard:       "Paper & Cardboard",
  glass:           "Plastic Bottles",
  metal:           "Plastic Bottles",
};

function mapWasteTypes(wasteTypes: string[]): Order["material"] {
  for (const wt of wasteTypes) {
    const mapped = WASTE_TO_MATERIAL[wt];
    if (mapped) return mapped;
  }
  return "Plastic Bottles";
}

// ─── CO₂ estimate ─────────────────────────────────────────────────────────────
const CO2_PER_KG: Partial<Record<Order["material"], number>> = {
  "Cooking Oil":       2.7,
  "Plastic Bottles":   1.8,
  "Paper & Cardboard": 1.1,
  "Electronics":       8.0,
};

function estimateCo2(material: Order["material"], weightKg: number): number {
  return Math.round((CO2_PER_KG[material] ?? 1.5) * weightKg * 10) / 10;
}

function mapOrderStatus(status: SupabaseOrder["status"]): Order["status"] {
  switch (status) {
    case "inTransit":
    case "arrivedAtDropoff": return "inTransit";
    case "completed":        return "completed";
    case "accepted":
    case "arrivedAtPickup":  return "accepted";
    case "cancelled":        return "completed"; // treat as done in dashboard
    default:                 return "pending";
  }
}

function deriveRiderStatus(orders: Order[]): Rider["status"] {
  const active = orders.find(o => o.status === "inTransit" || o.status === "accepted");
  if (!active) return "idle";
  return active.status === "inTransit" ? "delivering" : "picking_up";
}

function mapVehicleType(vt: SupabaseProfile["vehicle_type"]): Rider["vehicle"] {
  if (vt === "van" || vt === "truck" || vt === "heavyTruck") return "Van";
  return "Motorcycle";
}

// ─── Public adapters ──────────────────────────────────────────────────────────

export function adaptOrder(row: SupabaseOrder): Order {
  const material = mapWasteTypes(row.waste_types);
  const weightKg = row.actual_weight_kg ?? row.estimated_weight_kg;
  return {
    id:          row.id,
    material,
    quantity:    weightKg,
    unit:        "kg",
    address:     row.notes ?? "Amman, Jordan",
    deliveryLat: row.dropoff_lat ?? row.pickup_lat ?? 31.963,
    deliveryLng: row.dropoff_lng ?? row.pickup_lng ?? 35.910,
    status:      mapOrderStatus(row.status),
    co2Saved:    estimateCo2(material, weightKg),
    earnings:    Number(row.reward_jd),
    createdAt:   row.created_at.split("T")[0],
    completedAt: row.completed_at?.split("T")[0],
    acceptedAt:  row.accepted_at ? new Date(row.accepted_at).getTime() : undefined,
  };
}

export function adaptRider(
  profile: SupabaseProfile,
  location: SupabaseDriverLocation | null,
  orders: SupabaseOrder[]
): Rider {
  const adaptedOrders = orders.map(adaptOrder);
  const status = deriveRiderStatus(adaptedOrders);
  return {
    id:        profile.auth_id,
    name:      profile.name,
    nameAr:    profile.name,
    phone:     profile.phone,
    lat:       location?.lat ?? 31.963,
    lng:       location?.lng ?? 35.910,
    status,
    vehicle:   mapVehicleType(profile.vehicle_type),
    orders:    adaptedOrders,
    idleSince: status === "idle" ? Date.now() - 5 * 60 * 1000 : undefined,
  };
}

export function adaptHub(row: SupabaseHub): Hub {
  const load = (row.current_load ?? {}) as Partial<HubMaterials>;
  return {
    id:               row.id,
    name:             row.name,
    address:          row.address,
    lat:              Number(row.lat),
    lng:              Number(row.lng),
    active:           row.active,
    capacityKg:       Number(row.capacity_kg),
    currentLoad: {
      cookingOil:  Number(load.cookingOil  ?? 0),
      plastic:     Number(load.plastic     ?? 0),
      paper:       Number(load.paper       ?? 0),
      electronics: Number(load.electronics ?? 0),
    },
    schedule:         row.schedule,
    nextShipmentDate: row.next_shipment_date ?? "",
    lastShipmentDate: row.last_shipment_date ?? "",
    status:           row.status,
  };
}

export function adaptClient(profile: SupabaseProfile): Client {
  return {
    id:            profile.auth_id,
    name:          profile.name,
    type:          "other" as ClientType,
    address:       profile.address ?? "",
    phone:         profile.phone,
    email:         profile.email ?? "",
    contractTier:  (profile.contract_tier ?? "free") as ContractTier,
    joinedDate:    profile.created_at.split("T")[0],
    orders:        [],
    totalCo2Saved: 0,
    totalEarnings: 0,
    renewalDate:   profile.renewal_date ?? "",
    billingCycle:  (profile.billing_cycle ?? "monthly") as "monthly" | "annual",
    greenPoints:   profile.green_points ?? 0,
    customPriceJD: profile.custom_price_jd ?? undefined,
    contractNotes: profile.contract_notes ?? undefined,
    lastCertificateDownload: profile.last_certificate_download ?? undefined,
    referredBy:    profile.referred_by ?? undefined,
  };
}
