#!/usr/bin/env node
/**
 * Seed script for Dawer Admin Dashboard.
 * Populates Supabase with realistic mock data for all 5 tables.
 *
 * Usage:  node scripts/seed-supabase.mjs
 *
 * Idempotent — safe to re-run. Uses upsert / delete-then-insert patterns.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Load .env.local ──────────────────────────────────────────────────────────
const envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
const env = {};
for (const line of envContent.split("\n")) {
  const idx = line.indexOf("=");
  if (idx > 0) env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("🌱 Dawer Dashboard — Seeding Supabase...\n");

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: create or get an auth user by email (idempotent)
// ═══════════════════════════════════════════════════════════════════════════════
async function ensureAuthUser(email, name) {
  // 1. Check if profile already exists with this email (most reliable)
  const { data: existing } = await supabase
    .from("profiles")
    .select("auth_id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();
  if (existing?.auth_id) return existing.auth_id;

  // 2. Try creating a new auth user
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: "DawerSeed2026!",
    email_confirm: true,
    user_metadata: { name },
  });

  if (!error) return data.user.id;

  // 3. User registered but not in profiles (edge case) — search auth
  if (error.message?.includes("already been registered")) {
    // Auth user exists but profile doesn't — try getUserById won't work without ID.
    // Use raw API to find user by email
    const res = await fetch(
      `${env.VITE_SUPABASE_URL}/auth/v1/admin/users?filter=email:${encodeURIComponent(email)}`,
      { headers: { Authorization: `Bearer ${env.VITE_SUPABASE_SERVICE_KEY}`, apikey: env.VITE_SUPABASE_SERVICE_KEY } }
    );
    if (res.ok) {
      const body = await res.json();
      const users = body.users ?? body;
      const found = (Array.isArray(users) ? users : []).find((u) => u.email === email);
      if (found) return found.id;
    }
  }

  throw new Error(`Failed to create/find auth user ${email}: ${error.message}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. DRIVERS — 5 riders with realistic Amman data
// ═══════════════════════════════════════════════════════════════════════════════
const DRIVERS = [
  {
    email: "ahmad.khalil@dawer-seed.test",
    name: "Ahmad Khalil",
    phone: "+962791234501",
    vehicle_type: "motorcycle",
    vehicle_model: "Honda CG 125",
    vehicle_color: "Black",
    vehicle_plate: "12-34567",
    lat: 31.954,
    lng: 35.932,
  },
  {
    email: "sara.nassar@dawer-seed.test",
    name: "Sara Nassar",
    phone: "+962791234502",
    vehicle_type: "van",
    vehicle_model: "Kia K2700",
    vehicle_color: "White",
    vehicle_plate: "23-45678",
    lat: 31.977,
    lng: 35.886,
  },
  {
    email: "omar.zaid@dawer-seed.test",
    name: "Omar Zaid",
    phone: "+962791234503",
    vehicle_type: "motorcycle",
    vehicle_model: "Yamaha YBR 125",
    vehicle_color: "Red",
    vehicle_plate: "34-56789",
    lat: 31.946,
    lng: 35.868,
  },
  {
    email: "lina.haddad@dawer-seed.test",
    name: "Lina Haddad",
    phone: "+962791234504",
    vehicle_type: "motorcycle",
    vehicle_model: "Honda Wave 110",
    vehicle_color: "Blue",
    vehicle_plate: "45-67890",
    lat: 31.942,
    lng: 35.888,
  },
  {
    email: "khalid.mansour@dawer-seed.test",
    name: "Khalid Mansour",
    phone: "+962791234505",
    vehicle_type: "van",
    vehicle_model: "Hyundai H-100",
    vehicle_color: "Silver",
    vehicle_plate: "56-78901",
    lat: 32.012,
    lng: 35.925,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 2. CLIENTS — 5 B2B recycling companies
// ═══════════════════════════════════════════════════════════════════════════════
const CLIENTS = [
  {
    email: "ops@fakhreddine.dawer-seed.test",
    name: "Fakhreddine Restaurant",
    phone: "+962790123456",
    contract_tier: "pro",
    renewal_date: "2026-08-14",
    billing_cycle: "monthly",
    green_points: 450,
    address: "Downtown, Rainbow St",
    contract_notes: "High volume cooking oil. Weekly pickup preferred.",
  },
  {
    email: "gm@alquds.dawer-seed.test",
    name: "Al-Quds Hotel",
    phone: "+962781234567",
    contract_tier: "enterprise",
    renewal_date: "2026-09-03",
    billing_cycle: "annual",
    green_points: 1240,
    custom_price_jd: 180,
    address: "Abdoun, Shmesani Bridge",
    contract_notes:
      "Preferred partner — custom SLA includes monthly CO₂ reporting. Key contact: GM Samer Khoury.",
  },
  {
    email: "logistics@ojeh.dawer-seed.test",
    name: "Ojeh Electronics",
    phone: "+962772345678",
    contract_tier: "basic",
    renewal_date: "2026-06-20",
    billing_cycle: "monthly",
    green_points: 45,
    address: "Sweifieh, Orchid St",
  },
  {
    email: "store@zara.dawer-seed.test",
    name: "Zara Jordan",
    phone: "+962763456789",
    contract_tier: "pro",
    renewal_date: "2026-07-12",
    billing_cycle: "annual",
    green_points: 320,
    address: "Sweifieh, Wakalat St",
    referred_by: "Fakhreddine Restaurant",
  },
  {
    email: "waste@istishari.dawer-seed.test",
    name: "Istishari Hospital",
    phone: "+962754567890",
    contract_tier: "enterprise",
    renewal_date: "2026-07-08",
    billing_cycle: "annual",
    green_points: 2100,
    custom_price_jd: 195,
    address: "Abdoun, Kullieh Circle",
    contract_notes:
      "CSRD compliance reporting required quarterly. Key contact: Dr. Nidal Mansour, Waste Mgmt Dept.",
    last_certificate_download: "2026-06-20",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Seed functions
// ═══════════════════════════════════════════════════════════════════════════════

async function seedProfiles() {
  console.log("👤 Creating auth users & profiles...");

  const driverIds = [];
  const clientIds = [];

  // ── Drivers ──
  for (const d of DRIVERS) {
    const authId = await ensureAuthUser(d.email, d.name);
    driverIds.push(authId);

    const { error } = await supabase.from("profiles").upsert(
      {
        auth_id: authId,
        name: d.name,
        phone: d.phone,
        role: "driver",
        email: d.email,
        supplier_type: null,
        rating: 4 + Math.random(),
        total_orders: Math.floor(30 + Math.random() * 120),
        is_verified: true,
        is_available: true,
        points: Math.floor(100 + Math.random() * 500),
        vehicle_model: d.vehicle_model,
        vehicle_color: d.vehicle_color,
        vehicle_plate: d.vehicle_plate,
        vehicle_type: d.vehicle_type,
        has_chemical_permit: d.vehicle_type === "van",
        address: null,
        profile_photo_url: null,
        categories: ["oil", "plastic", "paper", "electronics"],
        contract_tier: "free",
        green_points: 0,
      },
      { onConflict: "auth_id" }
    );
    if (error) throw new Error(`Profile ${d.name}: ${error.message}`);
    console.log(`   ✓ Driver: ${d.name} (${authId.slice(0, 8)}…)`);
  }

  // ── Clients ──
  for (const c of CLIENTS) {
    const authId = await ensureAuthUser(c.email, c.name);
    clientIds.push(authId);

    const { error } = await supabase.from("profiles").upsert(
      {
        auth_id: authId,
        name: c.name,
        phone: c.phone,
        role: "recyclingCo",
        email: c.email,
        supplier_type: null,
        rating: 5,
        total_orders: Math.floor(10 + Math.random() * 60),
        is_verified: true,
        is_available: true,
        points: 0,
        vehicle_model: null,
        vehicle_color: null,
        vehicle_plate: null,
        vehicle_type: null,
        has_chemical_permit: false,
        address: c.address ?? null,
        profile_photo_url: null,
        categories: [],
        contract_tier: c.contract_tier,
        renewal_date: c.renewal_date ?? null,
        billing_cycle: c.billing_cycle ?? null,
        green_points: c.green_points ?? 0,
        custom_price_jd: c.custom_price_jd ?? null,
        contract_notes: c.contract_notes ?? null,
        last_certificate_download: c.last_certificate_download ?? null,
        referred_by: c.referred_by ?? null,
      },
      { onConflict: "auth_id" }
    );
    if (error) throw new Error(`Profile ${c.name}: ${error.message}`);
    console.log(`   ✓ Client: ${c.name} (${authId.slice(0, 8)}…)`);
  }

  return { driverIds, clientIds };
}

async function seedOrders(driverIds, clientIds) {
  console.log("\n📦 Seeding orders...");

  // Amman coordinates for realistic pickup/dropoff locations
  const LOCATIONS = [
    { name: "Downtown, Rainbow St", lat: 31.953, lng: 35.933 },
    { name: "Shmeisani, Al-Sharif Naser", lat: 31.978, lng: 35.884 },
    { name: "Sweifieh, Orchid St", lat: 31.945, lng: 35.869 },
    { name: "Abdoun, Paris Circle", lat: 31.940, lng: 35.887 },
    { name: "Tabarbour, Main Road", lat: 32.016, lng: 35.923 },
    { name: "8th Circle, Zahran St", lat: 31.960, lng: 35.855 },
    { name: "Jubaiha, University St", lat: 32.002, lng: 35.871 },
    { name: "Tlaa Al-Ali, Gardens St", lat: 31.950, lng: 35.858 },
    { name: "Airport Road, Customs", lat: 31.910, lng: 35.950 },
    { name: "Abdoun, Kullieh Circle", lat: 31.938, lng: 35.892 },
  ];

  const WASTE_TYPES = [
    ["oil"],
    ["plastic"],
    ["paper"],
    ["electronics"],
    ["oil", "organic"],
    ["plastic", "paper"],
    ["metal", "electronics"],
    ["glass", "plastic"],
  ];

  // Hub locations for dropoffs
  const HUB_DROPOFFS = [
    { lat: 31.941, lng: 35.890 },   // Abdoun Hub
    { lat: 31.943, lng: 35.866 },   // Sweifieh Hub
    { lat: 31.955, lng: 35.936 },   // Downtown Hub
    { lat: 32.005, lng: 35.875 },   // University Hub
  ];

  const now = new Date("2026-06-28T21:00:00+03:00");

  const orders = [];
  const statuses = [
    // 3 pending, 4 accepted, 5 inTransit, 8 completed
    "pending", "pending", "pending",
    "accepted", "accepted", "accepted", "accepted",
    "inTransit", "inTransit", "inTransit", "inTransit", "inTransit",
    "completed", "completed", "completed", "completed",
    "completed", "completed", "completed", "completed",
  ];

  for (let i = 0; i < 20; i++) {
    const status = statuses[i];
    const driverIdx = i % driverIds.length;
    const clientIdx = i % clientIds.length;
    const pickup = LOCATIONS[i % LOCATIONS.length];
    const dropoff = HUB_DROPOFFS[i % HUB_DROPOFFS.length];
    const waste = WASTE_TYPES[i % WASTE_TYPES.length];
    const weight = Math.round(5 + Math.random() * 75);
    const reward = Math.round((weight * (0.3 + Math.random() * 0.4)) * 100) / 100;

    // Stagger creation dates over the last 14 days
    const createdAt = new Date(now);
    createdAt.setDate(createdAt.getDate() - Math.floor(i * 0.7));
    createdAt.setHours(8 + Math.floor(Math.random() * 10));

    const acceptedAt =
      status !== "pending"
        ? new Date(createdAt.getTime() + 10 * 60000 + Math.random() * 30 * 60000)
        : null;
    const inTransitAt =
      status === "inTransit" || status === "completed"
        ? new Date((acceptedAt?.getTime() ?? createdAt.getTime()) + 15 * 60000)
        : null;
    const completedAt =
      status === "completed"
        ? new Date((inTransitAt?.getTime() ?? createdAt.getTime()) + 25 * 60000 + Math.random() * 20 * 60000)
        : null;

    orders.push({
      type: "pickup",
      status,
      supplier_id: clientIds[clientIdx],
      driver_id: status === "pending" ? null : driverIds[driverIdx],
      company_id: null,
      waste_types: waste,
      estimated_weight_kg: weight,
      actual_weight_kg: status === "completed" ? weight + Math.round((Math.random() - 0.5) * 6) : null,
      reward_jd: reward,
      is_urgent: i < 3,
      notes: pickup.name,
      pickup_lat: pickup.lat + (Math.random() - 0.5) * 0.004,
      pickup_lng: pickup.lng + (Math.random() - 0.5) * 0.004,
      dropoff_lat: dropoff.lat,
      dropoff_lng: dropoff.lng,
      created_at: createdAt.toISOString(),
      accepted_at: acceptedAt?.toISOString() ?? null,
      in_transit_at: inTransitAt?.toISOString() ?? null,
      completed_at: completedAt?.toISOString() ?? null,
    });
  }

  // Delete old seed orders (by seed driver/client IDs), then insert fresh
  for (const dId of driverIds) {
    await supabase.from("orders").delete().eq("driver_id", dId);
  }
  for (const cId of clientIds) {
    await supabase.from("orders").delete().eq("supplier_id", cId);
  }

  const { data: inserted, error } = await supabase.from("orders").insert(orders).select("id");
  if (error) throw new Error(`Orders: ${error.message}`);
  console.log(`   ✓ Inserted ${inserted.length} orders`);
  return inserted.map((o) => o.id);
}

async function seedDriverLocations(driverIds) {
  console.log("\n📍 Seeding driver locations...");

  // Delete existing locations for our seed drivers
  for (const dId of driverIds) {
    await supabase.from("driver_locations").delete().eq("driver_id", dId);
  }

  const locations = DRIVERS.map((d, i) => ({
    driver_id: driverIds[i],
    order_id: "",
    lat: d.lat + (Math.random() - 0.5) * 0.002,
    lng: d.lng + (Math.random() - 0.5) * 0.002,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("driver_locations").insert(locations);
  if (error) throw new Error(`Driver locations: ${error.message}`);
  console.log(`   ✓ Inserted ${locations.length} driver locations`);
}

async function seedHubs() {
  console.log("\n🏭 Seeding hubs...");

  const hubs = [
    {
      name: "Abdoun Collection Hub",
      address: "Abdoun, near Paris Circle, Amman",
      lat: 31.941,
      lng: 35.890,
      active: true,
      capacity_kg: 2000,
      current_load: { cookingOil: 180, plastic: 95, paper: 120, electronics: 35 },
      schedule: "weekly",
      next_shipment_date: "2026-07-01",
      last_shipment_date: "2026-06-24",
      status: "collecting",
    },
    {
      name: "Sweifieh Sorting Hub",
      address: "Sweifieh, behind Wakalat St, Amman",
      lat: 31.943,
      lng: 35.866,
      active: true,
      capacity_kg: 3000,
      current_load: { cookingOil: 420, plastic: 280, paper: 350, electronics: 90 },
      schedule: "weekly",
      next_shipment_date: "2026-06-29",
      last_shipment_date: "2026-06-22",
      status: "ready",
    },
    {
      name: "Downtown Transfer Station",
      address: "Al-Balad, near Hashmiyeh Square, Amman",
      lat: 31.955,
      lng: 35.936,
      active: true,
      capacity_kg: 1500,
      current_load: { cookingOil: 65, plastic: 40, paper: 55, electronics: 10 },
      schedule: "monthly",
      next_shipment_date: "2026-07-15",
      last_shipment_date: "2026-06-15",
      status: "collecting",
    },
    {
      name: "University Green Hub",
      address: "Jubaiha, near University of Jordan, Amman",
      lat: 32.005,
      lng: 35.875,
      active: false,
      capacity_kg: 2500,
      current_load: { cookingOil: 510, plastic: 320, paper: 410, electronics: 180 },
      schedule: "monthly",
      next_shipment_date: "2026-07-10",
      last_shipment_date: "2026-06-10",
      status: "shipped",
    },
  ];

  // Delete existing seed hubs by name, then insert fresh
  for (const h of hubs) {
    await supabase.from("hubs").delete().eq("name", h.name);
  }

  const { data, error } = await supabase.from("hubs").insert(hubs).select("id, name");
  if (error) throw new Error(`Hubs: ${error.message}`);
  for (const h of data) {
    console.log(`   ✓ Hub: ${h.name}`);
  }
}

async function seedReportRequests(clientIds) {
  console.log("\n📋 Seeding report requests...");

  const now = new Date("2026-06-28T21:00:00+03:00");
  const templates = ["weeklySummary", "monthlyInvoice", "co2Certificate", "esgReport"];

  const requests = [
    // 3 pending
    {
      user_id: clientIds[0],
      template: "weeklySummary",
      status: "pending",
      period_start: "2026-06-17",
      period_end: "2026-06-23",
      download_url: null,
      requested_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
      fulfilled_at: null,
    },
    {
      user_id: clientIds[1],
      template: "esgReport",
      status: "pending",
      period_start: "2026-01-01",
      period_end: "2026-06-28",
      download_url: null,
      requested_at: new Date(now.getTime() - 1 * 3600000).toISOString(),
      fulfilled_at: null,
    },
    {
      user_id: clientIds[3],
      template: "co2Certificate",
      status: "pending",
      period_start: "2026-06-01",
      period_end: "2026-06-28",
      download_url: null,
      requested_at: new Date(now.getTime() - 30 * 60000).toISOString(),
      fulfilled_at: null,
    },
    // 2 processing
    {
      user_id: clientIds[2],
      template: "monthlyInvoice",
      status: "processing",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      download_url: null,
      requested_at: new Date(now.getTime() - 6 * 3600000).toISOString(),
      fulfilled_at: null,
    },
    {
      user_id: clientIds[4],
      template: "weeklySummary",
      status: "processing",
      period_start: "2026-06-10",
      period_end: "2026-06-16",
      download_url: null,
      requested_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
      fulfilled_at: null,
    },
    // 3 ready (fulfilled)
    {
      user_id: clientIds[0],
      template: "monthlyInvoice",
      status: "ready",
      period_start: "2026-05-01",
      period_end: "2026-05-31",
      download_url: "https://storage.dawer.jo/reports/invoice-may-2026.pdf",
      requested_at: new Date(now.getTime() - 48 * 3600000).toISOString(),
      fulfilled_at: new Date(now.getTime() - 46 * 3600000).toISOString(),
    },
    {
      user_id: clientIds[1],
      template: "co2Certificate",
      status: "ready",
      period_start: "2026-04-01",
      period_end: "2026-06-30",
      download_url: "https://storage.dawer.jo/reports/co2-cert-q2-2026.pdf",
      requested_at: new Date(now.getTime() - 72 * 3600000).toISOString(),
      fulfilled_at: new Date(now.getTime() - 68 * 3600000).toISOString(),
    },
    {
      user_id: clientIds[4],
      template: "esgReport",
      status: "ready",
      period_start: "2026-01-01",
      period_end: "2026-06-30",
      download_url: "https://storage.dawer.jo/reports/esg-h1-2026.pdf",
      requested_at: new Date(now.getTime() - 120 * 3600000).toISOString(),
      fulfilled_at: new Date(now.getTime() - 96 * 3600000).toISOString(),
    },
  ];

  // Delete existing seed report requests for our client IDs
  for (const cId of clientIds) {
    await supabase.from("report_requests").delete().eq("user_id", cId);
  }

  const { data, error } = await supabase.from("report_requests").insert(requests).select("id");
  if (error) throw new Error(`Report requests: ${error.message}`);
  console.log(`   ✓ Inserted ${data.length} report requests`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  try {
    // Step 1: Profiles (drivers + clients)
    const { driverIds, clientIds } = await seedProfiles();

    // Step 2: Orders
    const orderIds = await seedOrders(driverIds, clientIds);

    // Step 3: Driver locations
    await seedDriverLocations(driverIds);

    // Step 4: Hubs
    await seedHubs();

    // Step 5: Report requests
    await seedReportRequests(clientIds);

    console.log("\n═══════════════════════════════════════════");
    console.log("✅ Seeding complete! Your dashboard now has:");
    console.log("   • 5 drivers with GPS locations");
    console.log("   • 5 B2B clients (recyclingCo)");
    console.log("   • 20 orders (pending/accepted/inTransit/completed)");
    console.log("   • 4 collection hubs across Amman");
    console.log("   • 8 report requests (pending/processing/ready)");
    console.log("═══════════════════════════════════════════");
    console.log("\n🔄 Refresh http://localhost:5173 to see the data!\n");
  } catch (err) {
    console.error("\n❌ Seed failed:", err.message);
    process.exit(1);
  }
}

main();
