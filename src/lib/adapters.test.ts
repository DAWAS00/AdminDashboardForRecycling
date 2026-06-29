import { describe, it, expect } from "vitest";
import { adaptHub, adaptRider, adaptOrder } from "./adapters";
import type { SupabaseHub, SupabaseProfile, SupabaseDriverLocation } from "./supabase";

const minimalHub: SupabaseHub = {
  id: "hub-uuid",
  name: "Hub Al-Sweifieh",
  address: "Sweifieh Commercial District",
  lat: 31.944,
  lng: 35.871,
  active: true,
  capacity_kg: 1200,
  current_load: { cookingOil: 312, plastic: 156, paper: 94, electronics: 37 },
  schedule: "weekly",
  next_shipment_date: "2026-07-04",
  last_shipment_date: "2026-06-27",
  status: "collecting",
  created_at: "2026-06-01T00:00:00Z",
};

const minimalProfile: SupabaseProfile = {
  auth_id: "driver-uuid",
  name: "Ahmad Khalil",
  phone: "+96279000001",
  email: "ahmad@dawer.app",
  role: "driver",
  supplier_type: null,
  rating: 4.8,
  total_orders: 120,
  is_verified: true,
  is_available: true,
  points: 0,
  vehicle_model: null,
  vehicle_color: null,
  vehicle_plate: null,
  vehicle_type: "motorcycle",
  has_chemical_permit: false,
  address: null,
  profile_photo_url: null,
  categories: [],
  contract_tier: "free",
  contract_notes: null,
  renewal_date: null,
  billing_cycle: null,
  green_points: 0,
  custom_price_jd: null,
  last_certificate_download: null,
  referred_by: null,
  created_at: "2026-06-01T00:00:00Z",
};

const minimalLocation: SupabaseDriverLocation = {
  driver_id: "driver-uuid",
  lat: 31.963,
  lng: 35.910,
  updated_at: "2026-06-28T10:00:00Z",
};

describe("adaptHub", () => {
  it("converts snake_case Supabase row to camelCase Hub", () => {
    const hub = adaptHub(minimalHub);
    expect(hub.id).toBe("hub-uuid");
    expect(hub.name).toBe("Hub Al-Sweifieh");
    expect(hub.capacityKg).toBe(1200);
    expect(hub.currentLoad.cookingOil).toBe(312);
    expect(hub.nextShipmentDate).toBe("2026-07-04");
    expect(hub.status).toBe("collecting");
    expect(hub.active).toBe(true);
  });

  it("handles null date fields", () => {
    const hub = adaptHub({ ...minimalHub, next_shipment_date: null, last_shipment_date: null });
    expect(hub.nextShipmentDate).toBe("");
    expect(hub.lastShipmentDate).toBe("");
  });

  it("coerces numeric strings for lat/lng/capacity", () => {
    const hub = adaptHub({ ...minimalHub, lat: "31.944" as unknown as number, lng: "35.871" as unknown as number });
    expect(typeof hub.lat).toBe("number");
    expect(typeof hub.lng).toBe("number");
  });
});

describe("adaptRider", () => {
  it("maps profile + location + empty orders to idle Rider", () => {
    const rider = adaptRider(minimalProfile, minimalLocation, []);
    expect(rider.id).toBe("driver-uuid");
    expect(rider.name).toBe("Ahmad Khalil");
    expect(rider.lat).toBe(31.963);
    expect(rider.lng).toBe(35.910);
    expect(rider.status).toBe("idle");
    expect(rider.vehicle).toBe("Motorcycle");
    expect(rider.orders).toHaveLength(0);
  });

  it("falls back to default coords when location is null", () => {
    const rider = adaptRider(minimalProfile, null, []);
    expect(rider.lat).toBe(31.963);
    expect(rider.lng).toBe(35.910);
  });

  it("maps van/truck vehicle types to Van", () => {
    const rider = adaptRider({ ...minimalProfile, vehicle_type: "van" }, null, []);
    expect(rider.vehicle).toBe("Van");
  });
});

describe("adaptOrder", () => {
  it("maps oil waste_type to Cooking Oil material", () => {
    const order = adaptOrder({
      id: "ord-1",
      driver_id: "driver-uuid",
      waste_types: ["oil"],
      estimated_weight_kg: 10,
      actual_weight_kg: null,
      status: "inTransit",
      reward_jd: 4.5,
      notes: "Test address",
      created_at: "2026-06-28T09:00:00Z",
      completed_at: null,
      accepted_at: null,
    });
    expect(order.material).toBe("Cooking Oil");
    expect(order.co2Saved).toBe(27); // 2.7 * 10
    expect(order.status).toBe("inTransit");
  });
});
