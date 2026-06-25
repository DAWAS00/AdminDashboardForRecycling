import {
  Droplets, Package, Zap,
  MapPin, Layers, Warehouse, BarChart2, FileText,
  Activity, TrendingUp, Wind, Users,
} from "lucide-react";
import { District, Hub, Order, Rider, ViewId, Client, ClientType, ContractTier, ReportType } from "./types";

export const MATERIAL_CONFIG = {
  "Cooking Oil":       { color: "#C8860A", bg: "#FEF3C7", Icon: Droplets, unit: "L"  },
  "Plastic Bottles":   { color: "#1E40AF", bg: "#DBEAFE", Icon: Package,  unit: "kg" },
  "Paper & Cardboard": { color: "#166534", bg: "#DCFCE7", Icon: Package,  unit: "kg" },
  "Electronics":       { color: "#6D28D9", bg: "#EDE9FE", Icon: Zap,      unit: "kg" },
} as const;

export const STATUS_CONFIG = {
  delivering: { label: "In Transit", color: "#1E5C35", bg: "#D1FAE5", dot: "#1E5C35" },
  picking_up: { label: "Picking Up", color: "#C8860A", bg: "#FEF3C7", dot: "#C8860A" },
  idle:       { label: "Idle",       color: "#64748B", bg: "#F1F5F9", dot: "#94A3B8" },
};

export const ORDER_STATUS = {
  pending:   { label: "Pending",    color: "#C8860A", bg: "#FEF3C7" },
  accepted:  { label: "Accepted",   color: "#1E5C35", bg: "#D1FAE5" },
  inTransit: { label: "In Transit", color: "#1E40AF", bg: "#DBEAFE" },
  completed: { label: "Completed",  color: "#166534", bg: "#DCFCE7" },
};

export const ORDER_STATUS_ORDER: Order["status"][] = ["pending", "accepted", "inTransit", "completed"];

// ── Partner tier display config ───────────────────────────────────────────────
export const TIER_CONFIG: Record<ContractTier, {
  label: string; color: string; bg: string; borderColor: string;
}> = {
  free:       { label: "Free",       color: "#64748B", bg: "#F1F5F9", borderColor: "#CBD5E1" },
  basic:      { label: "Basic",      color: "#1E40AF", bg: "#DBEAFE", borderColor: "#BFDBFE" },
  pro:        { label: "Pro",        color: "#1E5C35", bg: "#D1FAE5", borderColor: "#A7F3D0" },
  enterprise: { label: "Enterprise", color: "#92400E", bg: "#FEF3C7", borderColor: "#FCD34D" },
};

// ── Partner pricing constants (Jordanian Dinar) ───────────────────────────────
export const TIER_PRICES_JD: Record<ContractTier, { monthly: number; annual: number }> = {
  free:       { monthly: 0,   annual: 0    },
  basic:      { monthly: 30,  annual: 300  },
  pro:        { monthly: 80,  annual: 800  },
  enterprise: { monthly: 200, annual: 2000 },
};

// Ordered lowest → highest — used for tier progression UI
export const TIER_ORDER: ContractTier[] = ["free", "basic", "pro", "enterprise"];

// Minimum completed orders in last 30 days to qualify for each tier
export const TIER_MONTHLY_THRESHOLDS: Record<ContractTier, number> = {
  free: 0, basic: 3, pro: 10, enterprise: 25,
};

// 1 green point awarded per kg of material collected
export const GREEN_POINTS_PER_KG = 1;

// Perks displayed in the drawer Impact tab per tier
export const TIER_BENEFITS: Record<ContractTier, string[]> = {
  free:       ["Basic pickup scheduling", "Email support"],
  basic:      ["Priority pickup", "Monthly CO₂ report", "Email + WhatsApp support"],
  pro:        ["Same-day pickup", "Weekly CO₂ reports", "Certificate PDF", "Dedicated account manager"],
  enterprise: ["On-demand pickup", "Custom reporting cadence", "CSRD-ready certificates", "Quarterly business review", "API access"],
};

export const HUB_STATUS_CONFIG = {
  collecting: { label: "Collecting",    color: "#1E5C35", bg: "#D1FAE5" },
  ready:      { label: "Ready to Ship", color: "#C8860A", bg: "#FEF3C7" },
  shipped:    { label: "Shipped",       color: "#1E40AF", bg: "#DBEAFE" },
};

// ── Delivery alert thresholds ─────────────────────────────────────────────────
export const MATERIAL_DELIVERY_ESTIMATE_MS: Record<string, number> = {
  "Cooking Oil":       20 * 60 * 1000,  // 20 min
  "Plastic Bottles":   15 * 60 * 1000,  // 15 min
  "Paper & Cardboard": 15 * 60 * 1000,  // 15 min
  "Electronics":       25 * 60 * 1000,  // 25 min
};
export const IDLE_WARNING_MS  = 10 * 60 * 1000;  // 10 min → amber idle badge
export const IDLE_CRITICAL_MS = 20 * 60 * 1000;  // 20 min → red idle badge + Alert Dot

export const DISTRICTS: District[] = [
  {
    id: "downtown", name: "Downtown (Al-Balad)",
    polygon: [[31.943,35.924],[31.943,35.946],[31.960,35.946],[31.960,35.924]],
    centroid: [31.952, 35.934], co2Potential: 1240, co2Achieved: 1018,
    topMaterial: "Cooking Oil", orderCount: 14,
    materialBreakdown: {
      cookingOil:  { potential: 680, achieved: 612 },
      plastic:     { potential: 280, achieved: 224 },
      paper:       { potential: 200, achieved: 156 },
      electronics: { potential:  80, achieved:  26 },
    },
  },
  {
    id: "shmeisani", name: "Shmeisani",
    polygon: [[31.970,35.870],[31.970,35.895],[31.988,35.895],[31.988,35.870]],
    centroid: [31.979, 35.882], co2Potential: 890, co2Achieved: 534,
    topMaterial: "Plastic Bottles", orderCount: 8,
    materialBreakdown: {
      cookingOil:  { potential: 180, achieved:  90 },
      plastic:     { potential: 420, achieved: 294 },
      paper:       { potential: 200, achieved: 110 },
      electronics: { potential:  90, achieved:  40 },
    },
  },
  {
    id: "sweifieh", name: "Sweifieh",
    polygon: [[31.935,35.858],[31.935,35.882],[31.952,35.882],[31.952,35.858]],
    centroid: [31.944, 35.870], co2Potential: 1050, co2Achieved: 630,
    topMaterial: "Cooking Oil", orderCount: 11,
    materialBreakdown: {
      cookingOil:  { potential: 600, achieved: 390 },
      plastic:     { potential: 240, achieved: 144 },
      paper:       { potential: 140, achieved:  70 },
      electronics: { potential:  70, achieved:  26 },
    },
  },
  {
    id: "abdoun", name: "Abdoun",
    polygon: [[31.930,35.872],[31.930,35.900],[31.947,35.900],[31.947,35.872]],
    centroid: [31.940, 35.885], co2Potential: 760, co2Achieved: 608,
    topMaterial: "Cooking Oil", orderCount: 9,
    materialBreakdown: {
      cookingOil:  { potential: 420, achieved: 378 },
      plastic:     { potential: 180, achieved: 126 },
      paper:       { potential: 120, achieved:  84 },
      electronics: { potential:  40, achieved:  20 },
    },
  },
  {
    id: "jubaiha", name: "Jubaiha",
    polygon: [[31.992,35.858],[31.992,35.882],[32.012,35.882],[32.012,35.858]],
    centroid: [32.001, 35.869], co2Potential: 580, co2Achieved: 116,
    topMaterial: "Electronics", orderCount: 4,
    materialBreakdown: {
      cookingOil:  { potential:  60, achieved:  10 },
      plastic:     { potential: 120, achieved:  24 },
      paper:       { potential: 100, achieved:  18 },
      electronics: { potential: 300, achieved:  64 },
    },
  },
  {
    id: "tabarbour", name: "Tabarbour",
    polygon: [[32.005,35.908],[32.005,35.938],[32.025,35.938],[32.025,35.908]],
    centroid: [32.015, 35.922], co2Potential: 670, co2Achieved: 469,
    topMaterial: "Plastic Bottles", orderCount: 6,
    materialBreakdown: {
      cookingOil:  { potential: 130, achieved:  91 },
      plastic:     { potential: 320, achieved: 256 },
      paper:       { potential: 160, achieved: 102 },
      electronics: { potential:  60, achieved:  20 },
    },
  },
  {
    id: "eighth_circle", name: "8th Circle Area",
    polygon: [[31.950,35.842],[31.950,35.865],[31.968,35.865],[31.968,35.842]],
    centroid: [31.959, 35.853], co2Potential: 940, co2Achieved: 282,
    topMaterial: "Paper & Cardboard", orderCount: 7,
    materialBreakdown: {
      cookingOil:  { potential: 200, achieved:  60 },
      plastic:     { potential: 220, achieved:  66 },
      paper:       { potential: 400, achieved: 120 },
      electronics: { potential: 120, achieved:  36 },
    },
  },
  {
    id: "university", name: "University District",
    polygon: [[31.998,35.866],[31.998,35.892],[32.018,35.892],[32.018,35.866]],
    centroid: [32.008, 35.879], co2Potential: 440, co2Achieved: 396,
    topMaterial: "Electronics", orderCount: 3,
    materialBreakdown: {
      cookingOil:  { potential:  60, achieved:  54 },
      plastic:     { potential:  80, achieved:  72 },
      paper:       { potential: 100, achieved:  90 },
      electronics: { potential: 200, achieved: 180 },
    },
  },
  {
    id: "tlaa_ali", name: "Tlaa Al-Ali",
    polygon: [[31.940,35.845],[31.940,35.870],[31.958,35.870],[31.958,35.845]],
    centroid: [31.950, 35.857], co2Potential: 520, co2Achieved: 260,
    topMaterial: "Plastic Bottles", orderCount: 5,
    materialBreakdown: {
      cookingOil:  { potential: 100, achieved:  50 },
      plastic:     { potential: 240, achieved: 120 },
      paper:       { potential: 120, achieved:  60 },
      electronics: { potential:  60, achieved:  30 },
    },
  },
  {
    id: "airport_road", name: "Airport Road Corridor",
    polygon: [[31.895,35.930],[31.895,35.965],[31.925,35.965],[31.925,35.930]],
    centroid: [31.912, 35.947], co2Potential: 380, co2Achieved: 76,
    topMaterial: "Cooking Oil", orderCount: 3,
    materialBreakdown: {
      cookingOil:  { potential: 200, achieved:  40 },
      plastic:     { potential:  80, achieved:  16 },
      paper:       { potential:  60, achieved:  12 },
      electronics: { potential:  40, achieved:   8 },
    },
  },
];

export const INITIAL_HUBS: Hub[] = [
  {
    id: 1, name: "Hub Al-Sweifieh", address: "Sweifieh Commercial District",
    lat: 31.9460, lng: 35.8650, active: true, capacityKg: 500,
    currentLoad: { cookingOil: 120, plastic: 34, paper: 18, electronics: 0 },
    schedule: "weekly", nextShipmentDate: "2026-06-26", lastShipmentDate: "2026-06-19",
    status: "collecting",
  },
  {
    id: 2, name: "Hub Downtown", address: "Al-Balad, 1st Circle area",
    lat: 31.9535, lng: 35.9290, active: true, capacityKg: 400,
    currentLoad: { cookingOil: 80, plastic: 15, paper: 42, electronics: 5 },
    schedule: "weekly", nextShipmentDate: "2026-06-27", lastShipmentDate: "2026-06-20",
    status: "collecting",
  },
  {
    id: 3, name: "Hub Jubaiha", address: "Jubaiha North, near University",
    lat: 32.0020, lng: 35.8700, active: true, capacityKg: 300,
    currentLoad: { cookingOil: 0, plastic: 20, paper: 8, electronics: 60 },
    schedule: "monthly", nextShipmentDate: "2026-07-01", lastShipmentDate: "2026-06-01",
    status: "ready",
  },
  {
    id: 4, name: "Hub Abdoun", address: "Abdoun Circle, South Amman",
    lat: 31.9415, lng: 35.8870, active: false, capacityKg: 350,
    currentLoad: { cookingOil: 0, plastic: 0, paper: 0, electronics: 0 },
    schedule: "weekly", nextShipmentDate: "—", lastShipmentDate: "2026-06-10",
    status: "collecting",
  },
  {
    id: 5, name: "Hub Tabarbour", address: "Tabarbour Industrial Zone",
    lat: 32.0155, lng: 35.9150, active: true, capacityKg: 600,
    currentLoad: { cookingOil: 40, plastic: 55, paper: 80, electronics: 10 },
    schedule: "monthly", nextShipmentDate: "2026-07-05", lastShipmentDate: "2026-06-05",
    status: "collecting",
  },
];

const rawRiders: Rider[] = [
  {
    id: 1, name: "Ahmad Khalil", nameAr: "أحمد خليل",
    phone: "+962 79 123 4567", lat: 31.9520, lng: 35.9239,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2841", material: "Cooking Oil",      quantity: 45, unit: "L",  address: "Al-Balad, Downtown", deliveryLat: 31.953, deliveryLng: 35.934, status: "inTransit", co2Saved: 112.5, earnings: 18.5 },
      { id: "ORD-2842", material: "Plastic Bottles",  quantity: 12, unit: "kg", address: "Al-Hashmi St",       deliveryLat: 31.963, deliveryLng: 35.905, status: "accepted",  co2Saved: 72,    earnings: 6.0  },
    ],
  },
  {
    id: 2, name: "Omar Hassan", nameAr: "عمر حسن",
    phone: "+962 77 234 5678", lat: 31.9570, lng: 35.8850,
    status: "picking_up", vehicle: "Van",
    orders: [
      { id: "ORD-2838", material: "Cooking Oil", quantity: 80, unit: "L", address: "4th Circle, Amman", deliveryLat: 31.963, deliveryLng: 35.905, status: "pending", co2Saved: 200, earnings: 32.0 },
    ],
  },
  {
    id: 3, name: "Tariq Mansour", nameAr: "طارق منصور",
    phone: "+962 78 345 6789", lat: 31.9440, lng: 35.8710,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2835", material: "Paper & Cardboard", quantity: 34, unit: "kg", address: "Sweifieh",     deliveryLat: 31.944, deliveryLng: 35.871, status: "inTransit", co2Saved: 61.2, earnings: 8.5  },
      { id: "ORD-2836", material: "Plastic Bottles",   quantity:  8, unit: "kg", address: "Tlaa Al-Ali",  deliveryLat: 31.950, deliveryLng: 35.857, status: "accepted",  co2Saved: 48,   earnings: 4.0  },
    ],
  },
  {
    id: 4, name: "Khalid Nasser", nameAr: "خالد ناصر",
    phone: "+962 79 456 7890", lat: 31.9780, lng: 35.8820,
    status: "idle", vehicle: "Van", orders: [],
    idleSince: Date.now() - (23 * 60 * 1000),
  },
  {
    id: 5, name: "Yousef Rami", nameAr: "يوسف رامي",
    phone: "+962 77 567 8901", lat: 32.0010, lng: 35.8680,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2830", material: "Electronics", quantity: 15, unit: "kg", address: "Jubaiha", deliveryLat: 32.001, deliveryLng: 35.869, status: "inTransit", co2Saved: 225, earnings: 22.5 },
    ],
  },
  {
    id: 6, name: "Faisal Amin", nameAr: "فيصل أمين",
    phone: "+962 78 678 9012", lat: 31.9400, lng: 35.8850,
    status: "picking_up", vehicle: "Van",
    orders: [
      { id: "ORD-2845", material: "Cooking Oil", quantity: 60, unit: "L", address: "Abdoun",      deliveryLat: 31.940, deliveryLng: 35.884, status: "pending", co2Saved: 150,  earnings: 24.0 },
      { id: "ORD-2846", material: "Cooking Oil", quantity: 25, unit: "L", address: "3rd Circle",  deliveryLat: 31.963, deliveryLng: 35.905, status: "pending", co2Saved: 62.5, earnings: 10.0 },
    ],
  },
  {
    id: 7, name: "Rami Diab", nameAr: "رامي دياب",
    phone: "+962 79 789 0123", lat: 32.0150, lng: 35.9220,
    status: "delivering", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2828", material: "Plastic Bottles", quantity: 20, unit: "kg", address: "Tabarbour", deliveryLat: 32.014, deliveryLng: 35.921, status: "inTransit", co2Saved: 120, earnings: 10.0 },
    ],
  },
  {
    id: 8, name: "Nidal Saad", nameAr: "نضال سعد",
    phone: "+962 77 890 1234", lat: 31.9590, lng: 35.8550,
    status: "delivering", vehicle: "Van",
    orders: [
      { id: "ORD-2820", material: "Paper & Cardboard", quantity: 55, unit: "kg", address: "8th Circle",   deliveryLat: 31.959, deliveryLng: 35.853, status: "inTransit", co2Saved: 99,  earnings: 13.75 },
      { id: "ORD-2821", material: "Electronics",        quantity:  8, unit: "kg", address: "Mecca Mall",   deliveryLat: 31.963, deliveryLng: 35.905, status: "accepted",  co2Saved: 120, earnings: 12.0  },
    ],
  },
  {
    id: 9, name: "Bassam Qasim", nameAr: "بسام قاسم",
    phone: "+962 78 901 2345", lat: 31.9120, lng: 35.9500,
    status: "picking_up", vehicle: "Motorcycle",
    orders: [
      { id: "ORD-2848", material: "Cooking Oil", quantity: 30, unit: "L", address: "Airport Road", deliveryLat: 31.912, deliveryLng: 35.946, status: "pending", co2Saved: 75, earnings: 12.0 },
    ],
  },
  {
    id: 10, name: "Imad Saleh", nameAr: "عماد صالح",
    phone: "+962 79 012 3456", lat: 32.0080, lng: 35.8780,
    status: "idle", vehicle: "Van", orders: [],
    idleSince: Date.now() - (8 * 60 * 1000),
  },
];

function seedOrderDates(riders: Rider[], date: string): Rider[] {
  // Simulate orders accepted at specific times in the past.
  // This makes timer badges meaningful on first load.
  // Rami (ORD-2828) is seeded as critically overdue so the Alert Dot fires immediately.
  const acceptedOffsets: Record<string, number> = {
    "ORD-2841": 28 * 60 * 1000,  // Ahmad — Cooking Oil (20-min est.) → 1.4× → RED level 3
    "ORD-2842":  5 * 60 * 1000,  // Ahmad — Plastic accepted → GREEN
    "ORD-2835": 12 * 60 * 1000,  // Tariq — Paper (15-min est.) → 0.8× → AMBER level 2
    "ORD-2836":  3 * 60 * 1000,  // Tariq — Plastic accepted → GREEN
    "ORD-2830":  8 * 60 * 1000,  // Yousef — Electronics (25-min est.) → 0.32× → GREEN
    "ORD-2828": 37 * 60 * 1000,  // Rami — Plastic (15-min est.) → 2.5× → CRITICAL level 4 ⚠️
    "ORD-2820": 18 * 60 * 1000,  // Nidal — Paper (15-min est.) → 1.2× → RED level 3
    "ORD-2821":  7 * 60 * 1000,  // Nidal — Electronics accepted → GREEN
  };

  return riders.map(r => ({
    ...r,
    orders: r.orders.map(o => ({
      ...o,
      createdAt:   date,
      completedAt: o.status === "completed" ? date : undefined,
      acceptedAt:
        (o.status === "inTransit" || o.status === "accepted") && acceptedOffsets[o.id]
          ? Date.now() - acceptedOffsets[o.id]
          : undefined,
    })),
  }));
}

export const RIDERS: Rider[] = seedOrderDates(rawRiders, "2026-06-24");

export type HistoryMetricKey = "co2" | "earnings" | "Cooking Oil" | "Plastic Bottles" | "Paper & Cardboard" | "Electronics";

export interface MetricHistoryPoint {
  date: string;      // ISO date (daily) or period-start ISO (weekly/monthly)
  label: string;     // Display label, e.g. "Tue 24 Jun"
  value: number;
  delta: number;     // vs previous period
  topRider?: string;
  topMaterial?: string;
}

const MATERIAL_RANGES: Record<string, { min: number; max: number; unit: string }> = {
  "Cooking Oil":       { min: 15, max: 80, unit: "L" },
  "Plastic Bottles":   { min: 5,  max: 35, unit: "kg" },
  "Paper & Cardboard": { min: 4,  max: 30, unit: "kg" },
  "Electronics":       { min: 2,  max: 18, unit: "kg" },
};

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateMetricHistory(): Record<"daily" | "weekly" | "monthly", Record<HistoryMetricKey, MetricHistoryPoint[]>> {
  const riderNames = rawRiders.map(r => r.name);
  const materialNames = Object.keys(MATERIAL_RANGES);
  const today = new Date("2026-06-24");

  const daily: Record<HistoryMetricKey, MetricHistoryPoint[]> = {
    co2: [], earnings: [],
    "Cooking Oil": [], "Plastic Bottles": [], "Paper & Cardboard": [], "Electronics": [],
  };

  // Daily: last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-JO", { weekday: "short", day: "numeric", month: "short" });
    const seedBase = d.getTime();

    const co2 = Math.round((50 + seededRandom(seedBase) * 100) * 10) / 10;
    const earnings = Math.round((20 + seededRandom(seedBase + 1) * 60) * 100) / 100;

    (Object.keys(daily) as HistoryMetricKey[]).forEach(key => {
      if (key === "co2") {
        const prev = daily.co2[daily.co2.length - 1]?.value ?? co2;
        daily.co2.push({ date, label, value: co2, delta: co2 - prev, topRider: riderNames[Math.floor(seededRandom(seedBase + 2) * riderNames.length)], topMaterial: materialNames[Math.floor(seededRandom(seedBase + 3) * materialNames.length)] });
      } else if (key === "earnings") {
        const prev = daily.earnings[daily.earnings.length - 1]?.value ?? earnings;
        daily.earnings.push({ date, label, value: earnings, delta: earnings - prev, topRider: riderNames[Math.floor(seededRandom(seedBase + 4) * riderNames.length)], topMaterial: materialNames[Math.floor(seededRandom(seedBase + 5) * materialNames.length)] });
      } else {
        const range = MATERIAL_RANGES[key];
        const value = Math.round(range.min + seededRandom(seedBase + key.length) * (range.max - range.min));
        const prev = daily[key][daily[key].length - 1]?.value ?? value;
        daily[key].push({ date, label, value, delta: value - prev, topRider: riderNames[Math.floor(seededRandom(seedBase + 6) * riderNames.length)] });
      }
    });
  }

  // Weekly: last 12 weeks (aggregate from daily)
  const weekly: Record<HistoryMetricKey, MetricHistoryPoint[]> = {
    co2: [], earnings: [],
    "Cooking Oil": [], "Plastic Bottles": [], "Paper & Cardboard": [], "Electronics": [],
  };
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - w * 7);
    const date = weekStart.toISOString().slice(0, 10);
    const label = `Wk ${weekStart.toLocaleDateString("en-JO", { day: "numeric", month: "short" })}`;
    (Object.keys(weekly) as HistoryMetricKey[]).forEach(key => {
      const days = daily[key].slice(daily[key].length - (w + 1) * 7, daily[key].length - w * 7);
      const value = Math.round(days.reduce((s, p) => s + p.value, 0) * 10) / 10;
      const prev = weekly[key][weekly[key].length - 1]?.value ?? value;
      weekly[key].push({ date, label, value, delta: value - prev });
    });
  }

  // Monthly: last 12 months (aggregate from daily)
  const monthly: Record<HistoryMetricKey, MetricHistoryPoint[]> = {
    co2: [], earnings: [],
    "Cooking Oil": [], "Plastic Bottles": [], "Paper & Cardboard": [], "Electronics": [],
  };
  for (let m = 11; m >= 0; m--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - m, 1);
    const date = monthStart.toISOString().slice(0, 10);
    const label = monthStart.toLocaleDateString("en-JO", { month: "short", year: "numeric" });
    const startIdx = Math.max(0, daily.co2.findIndex(p => p.date >= date));
    const endIdx = m === 0 ? daily.co2.length : daily.co2.findIndex(p => p.date >= new Date(today.getFullYear(), today.getMonth() - m + 1, 1).toISOString().slice(0, 10));
    (Object.keys(monthly) as HistoryMetricKey[]).forEach(key => {
      const days = daily[key].slice(startIdx, endIdx === -1 ? undefined : endIdx);
      const value = Math.round(days.reduce((s, p) => s + p.value, 0) * 10) / 10;
      const prev = monthly[key][monthly[key].length - 1]?.value ?? value;
      monthly[key].push({ date, label, value, delta: value - prev });
    });
  }

  return { daily, weekly, monthly };
}

export const METRIC_HISTORY = generateMetricHistory();

// ── B2B Mock Clients ─────────────────────────────────────────────────────────

const baseClientOrders: Record<string, Order[]> = {
  "fakhreddine": [
    { id: "CLI-1001", material: "Cooking Oil",       quantity: 45, unit: "L",  address: "Downtown, Rainbow St", status: "completed", co2Saved: 38.5, earnings: 12.50, createdAt: "2026-06-22" },
    { id: "CLI-1002", material: "Paper & Cardboard", quantity: 18, unit: "kg", address: "Downtown, Rainbow St", status: "completed", co2Saved: 22.0, earnings: 5.20,  createdAt: "2026-06-23" },
  ],
  "al-quds-hotel": [
    { id: "CLI-2001", material: "Plastic Bottles", quantity: 32, unit: "kg", address: "Abdoun, Shmesani Bridge", status: "completed", co2Saved: 28.4, earnings: 9.60, createdAt: "2026-06-21" },
    { id: "CLI-2002", material: "Cooking Oil",     quantity: 60, unit: "L",  address: "Abdoun, Shmesani Bridge", status: "inTransit", co2Saved: 48.0, earnings: 15.00, createdAt: "2026-06-24" },
  ],
  "ojeh": [
    { id: "CLI-3001", material: "Electronics",      quantity: 8,  unit: "kg", address: "Sweifieh, Orchid St", status: "completed", co2Saved: 35.2, earnings: 18.00, createdAt: "2026-06-20" },
    { id: "CLI-3002", material: "Plastic Bottles",  quantity: 25, unit: "kg", address: "Sweifieh, Orchid St", status: "completed", co2Saved: 21.5, earnings: 7.50, createdAt: "2026-06-22" },
  ],
  "zara-jo": [
    { id: "CLI-4001", material: "Paper & Cardboard", quantity: 40, unit: "kg", address: "Sweifieh, Wakalat St", status: "completed", co2Saved: 34.0, earnings: 10.40, createdAt: "2026-06-23" },
  ],
  "istishari": [
    { id: "CLI-5001", material: "Cooking Oil", quantity: 70, unit: "L", address: "Abdoun, Kullieh Circle", status: "completed", co2Saved: 58.0, earnings: 18.50, createdAt: "2026-06-21" },
    { id: "CLI-5002", material: "Electronics", quantity: 12, unit: "kg", address: "Abdoun, Kullieh Circle", status: "completed", co2Saved: 48.0, earnings: 24.00, createdAt: "2026-06-24" },
  ],
};

function buildClient(
  id: string,
  name: string,
  nameAr: string,
  type: ClientType,
  address: string,
  phone: string,
  email: string,
  tier: ContractTier,
  joined: string,
  extras: {
    renewalDate: string;
    billingCycle: "monthly" | "annual";
    greenPoints: number;
    customPriceJD?: number;
    contractNotes?: string;
    lastCertificateDownload?: string;
    referredBy?: string;
  }
): Client {
  const orders = baseClientOrders[id] ?? [];
  return {
    id, name, nameAr, type, address, phone, email,
    contractTier: tier,
    joinedDate: joined,
    orders,
    totalCo2Saved: orders.reduce((s, o) => s + o.co2Saved, 0),
    totalEarnings: orders.reduce((s, o) => s + o.earnings, 0),
    ...extras,
  };
}

export const CLIENTS: Client[] = [
  buildClient(
    "fakhreddine", "Fakhreddine Restaurant", "مطعم فخر الدين",
    "restaurant", "Downtown, Rainbow St", "+962 7 9012 3456", "ops@fakhreddine.jo",
    "pro", "2025-02-14",
    { renewalDate: "2026-08-14", billingCycle: "monthly", greenPoints: 450 }
  ),
  buildClient(
    "al-quds-hotel", "Al-Quds Hotel", "فندق القدس",
    "hotel", "Abdoun, Shmesani Bridge", "+962 7 8123 4567", "gm@alquds.com",
    "enterprise", "2024-09-03",
    {
      renewalDate: "2026-09-03", billingCycle: "annual", greenPoints: 1240,
      customPriceJD: 180,
      contractNotes: "Preferred partner — custom SLA includes monthly CO₂ reporting. Key contact: GM Samer Khoury.",
    }
  ),
  buildClient(
    "ojeh", "Ojeh Electronics", "أوجيه للإلكترونيات",
    "retail", "Sweifieh, Orchid St", "+962 7 7234 5678", "logistics@ojeh.jo",
    "basic", "2025-05-20",
    { renewalDate: "2026-06-20", billingCycle: "monthly", greenPoints: 45 }
  ),
  buildClient(
    "zara-jo", "Zara Jordan", "زارا الأردن",
    "retail", "Sweifieh, Wakalat St", "+962 7 6345 6789", "store@zara.jo",
    "pro", "2024-11-12",
    { renewalDate: "2026-07-12", billingCycle: "annual", greenPoints: 320, referredBy: "Fakhreddine Restaurant" }
  ),
  buildClient(
    "istishari", "Istishari Hospital", "مستشفى استشاري",
    "hospital", "Abdoun, Kullieh Circle", "+962 7 5456 7890", "waste@istishari.jo",
    "enterprise", "2023-07-08",
    {
      renewalDate: "2026-07-08", billingCycle: "annual", greenPoints: 2100,
      customPriceJD: 195,
      lastCertificateDownload: "2026-06-20",
      contractNotes: "CSRD compliance reporting required quarterly. Key contact: Dr. Nidal Mansour, Waste Mgmt Dept.",
    }
  ),
];

// ── B2B Report Templates ─────────────────────────────────────────────────────

export const REPORT_TEMPLATES: {
  id: ReportType;
  title: string;
  subtitle: string;
  audience: "internal" | "client" | "executive";
  icon: React.ComponentType<{ size: number }>;
}[] = [
  { id: "weekly-operations",     title: "Weekly Operations Summary", subtitle: "Riders, orders & CO₂ captured",       audience: "internal",   icon: BarChart2  },
  { id: "hub-efficiency",        title: "Hub Efficiency Report",     subtitle: "Capacity, loads & collection cycles", audience: "internal",   icon: Warehouse  },
  { id: "district-intelligence", title: "District Intelligence Brief", subtitle: "Priority areas & material gaps",    audience: "executive",  icon: MapPin     },
  { id: "material-pulse",        title: "Material Market Pulse",     subtitle: "Volume trends by material type",      audience: "executive",  icon: Activity   },
  { id: "expansion-opportunity", title: "Expansion Opportunity Map", subtitle: "Uncovered districts & hub gaps",      audience: "executive",  icon: TrendingUp },
  { id: "co2-certificate",       title: "CO₂ Impact Certificate",    subtitle: "Client-branded impact proof",         audience: "client",     icon: Wind       },
];

export const ONLINE_COUNT = RIDERS.filter(r => r.status !== "idle").length;
export const AMMAN_CENTER: [number, number] = [31.963, 35.905];

export const MOTO_PATH = "M5 11l1.5-4.5h6L14 9h5v2h-1.27c.17.31.27.66.27 1 0 1.1-.9 2-2 2s-2-.9-2-2c0-.34.1-.69.27-1h-4.54c.17.31.27.66.27 1 0 1.1-.9 2-2 2s-2-.9-2-2c0-.34.1-.69.27-1H3V9h2zm6-3H8l-.75 2H11V8zm2 0v2h2.25L18 8h-3z";
export const VAN_PATH  = "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM11 10V6h5l2.25 4H11zm7 8.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z";
export const HUB_PATH  = "M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35z";

export const NAV_ITEMS: { icon: React.ComponentType<{ size: number }>; label: string; id: ViewId }[] = [
  { icon: MapPin,    label: "Live Map",  id: "map"      },
  { icon: Layers,    label: "Heat Map",  id: "heatmap"  },
  { icon: Warehouse, label: "Hubs",      id: "hubs"     },
  { icon: Users,     label: "Partners",  id: "partners" },
  { icon: FileText,  label: "Reports",   id: "reports"  },
];

/** Layout constant — ALL panels use this width */
export const PANEL_WIDTH = 288;

/** CO₂ conversion factors for equivalents display */
export const CO2_EQUIVALENTS = {
  treeYear:            21.77,  // kg CO₂ absorbed by one tree per year
  carKmPetrol:          0.21,  // kg CO₂ per km (avg petrol car)
  flightAmmanDubai:   195,     // kg CO₂ per passenger one-way
  smartphoneCharge:     0.0085, // kg CO₂ per charge
} as const;
