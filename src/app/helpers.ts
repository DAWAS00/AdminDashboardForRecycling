import { useState, useEffect } from "react";
import L from "leaflet";
import { District, Hub, Rider, Order, MaterialFilter, Client, ContractTier } from "./types";
import {
  STATUS_CONFIG,
  MOTO_PATH,
  VAN_PATH,
  HUB_PATH,
  MATERIAL_CONFIG,
  CO2_EQUIVALENTS,
  MATERIAL_DELIVERY_ESTIMATE_MS,
  IDLE_WARNING_MS,
  IDLE_CRITICAL_MS,
  HistoryMetricKey,
  TIER_PRICES_JD,
  TIER_ORDER,
  TIER_MONTHLY_THRESHOLDS
} from "./constants";

export function districtFillColor(d: District): string {
  const gap = d.co2Potential - d.co2Achieved;
  const gapPct = gap / d.co2Potential;
  
  // Interpolates between Forest Green HSL(142, 51%, 24%) for low gap and Amber Gold HSL(39, 91%, 41%) for high gap
  const boundedPct = Math.max(0, Math.min(1, gapPct));
  const h = Math.round(142 + (39 - 142) * boundedPct);
  const s = Math.round(51 + (91 - 51) * boundedPct);
  const l = Math.round(24 + (41 - 24) * boundedPct);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

/** Returns fill color for a district when filtered by a specific material */
export function districtFillColorForMaterial(
  d: District,
  filter: MaterialFilter
): string {
  if (filter === "all") return districtFillColor(d);

  const keyMap: Record<string, keyof import("./types").MaterialBreakdown> = {
    "Cooking Oil":       "cookingOil",
    "Plastic Bottles":   "plastic",
    "Paper & Cardboard": "paper",
    "Electronics":       "electronics",
  };
  const key = keyMap[filter];
  if (!key) return districtFillColor(d);

  const mat = d.materialBreakdown[key];
  if (!mat || mat.potential === 0) return "var(--color-border)"; // no data — desaturated border color
  const gapPct = (mat.potential - mat.achieved) / mat.potential;
  
  // Interpolates between Forest Green and Amber Gold based on gap percentage
  const boundedPct = Math.max(0, Math.min(1, gapPct));
  const h = Math.round(142 + (39 - 142) * boundedPct);
  const s = Math.round(51 + (91 - 51) * boundedPct);
  const l = Math.round(24 + (41 - 24) * boundedPct);
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function hubCapacityPct(hub: Hub): number {
  const total = hub.currentLoad.cookingOil + hub.currentLoad.plastic +
    hub.currentLoad.paper + hub.currentLoad.electronics;
  return Math.min(Math.round((total / hub.capacityKg) * 100), 100);
}

export function hubCapacityColor(pct: number): string {
  if (pct >= 90) return "#ef4444";
  if (pct >= 60) return "#f59e0b";
  return "#1E5C35";
}

export function computeTotals(riders: Rider[]) {
  const all = riders.flatMap(r => r.orders);
  const co2 = all.reduce((s, o) => s + o.co2Saved, 0);
  const earnings = all.reduce((s, o) => s + o.earnings, 0);
  const byMaterial: Record<string, number> = {};
  all.forEach(o => { byMaterial[o.material] = (byMaterial[o.material] || 0) + o.quantity; });
  return { co2, earnings, byMaterial };
}

export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export function makeRiderIcon(rider: Rider, isSelected: boolean): L.DivIcon {
  const sc = STATUS_CONFIG[rider.status];
  const path = rider.vehicle === "Motorcycle" ? MOTO_PATH : VAN_PATH;
  const size = isSelected ? 46 : 38;
  const shadow = isSelected
    ? `box-shadow:0 0 0 3px white,0 0 0 5px ${sc.dot},0 4px 18px rgba(0,0,0,0.22);`
    : `box-shadow:0 2px 8px rgba(0,0,0,0.2);`;
  const firstName = rider.name.split(" ")[0];
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${sc.dot};${shadow}display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="${path}"/></svg>
      <div style="position:absolute;top:${size+5}px;left:50%;transform:translateX(-50%);background:white;border:1.5px solid ${sc.dot};border-radius:20px;padding:2px 8px;font-size:10px;white-space:nowrap;color:#1a1a1a;font-family:'DM Sans',sans-serif;font-weight:600;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,0.1);">${firstName}</div>
    </div>`,
    className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

export function makeHubIcon(hub: Hub, isSelected: boolean): L.DivIcon {
  // dotColor mirrors HUB_STATUS_CONFIG but Leaflet divIcon HTML requires literal
  // color strings (CSS vars can't be resolved inside the html template), so
  // these are kept in sync with HUB_STATUS_CONFIG in constants.ts.
  const dotColor = !hub.active ? "#94A3B8"
    : hub.status === "ready"   ? "#C8860A"
    : hub.status === "shipped" ? "#1E40AF"
    : "#1E5C35";
  const size = isSelected ? 44 : 36;
  const shadow = isSelected
    ? `box-shadow:0 0 0 3px white,0 0 0 5px ${dotColor},0 4px 16px rgba(0,0,0,0.2);`
    : `box-shadow:0 2px 8px rgba(0,0,0,0.18);`;
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:6px;background:${dotColor};${shadow}display:flex;align-items:center;justify-content:center;position:relative;cursor:pointer;opacity:${hub.active?1:0.5};">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="${HUB_PATH}"/></svg>
      <div style="position:absolute;top:${size+4}px;left:50%;transform:translateX(-50%);background:white;border:1.5px solid ${dotColor};border-radius:20px;padding:2px 8px;font-size:10px;white-space:nowrap;color:#111827;font-family:'DM Sans',sans-serif;font-weight:600;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,0.1);">${hub.name.replace("Hub ", "")}</div>
    </div>`,
    className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
}

/* ── StatsBar flyout helpers ── */

export function computeMaterialBreakdown(riders: Rider[], materialName: string) {
  const rows: { riderName: string; quantity: number; unit: string; orderId: string; co2: number; earnings: number; status: string }[] = [];
  riders.forEach(r => {
    r.orders.filter(o => o.material === materialName).forEach(o => {
      rows.push({ riderName: r.name, quantity: o.quantity, unit: o.unit, orderId: o.id, co2: o.co2Saved, earnings: o.earnings, status: o.status });
    });
  });
  const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
  const totalCo2 = rows.reduce((s, r) => s + r.co2, 0);
  const totalEarnings = rows.reduce((s, r) => s + r.earnings, 0);
  return { rows, totalQty, totalCo2, totalEarnings };
}

export function computeEarningsBreakdown(riders: Rider[]) {
  const byRider = riders
    .map(r => ({ name: r.name, total: r.orders.reduce((s, o) => s + o.earnings, 0), orderCount: r.orders.length }))
    .filter(r => r.total > 0)
    .sort((a, b) => b.total - a.total);
  const byMaterial: Record<string, number> = {};
  riders.flatMap(r => r.orders).forEach(o => { byMaterial[o.material] = (byMaterial[o.material] || 0) + o.earnings; });
  const totalOrders = riders.flatMap(r => r.orders).length;
  const totalEarnings = byRider.reduce((s, r) => s + r.total, 0);
  return { byRider, byMaterial, totalOrders, totalEarnings, avgPerOrder: totalOrders > 0 ? totalEarnings / totalOrders : 0 };
}

export function computeHubMaterialStorage(hubs: Hub[], materialKey: string) {
  const keyMap: Record<string, keyof Hub["currentLoad"]> = {
    "Cooking Oil": "cookingOil", "Plastic Bottles": "plastic",
    "Paper & Cardboard": "paper", "Electronics": "electronics",
  };
  const field = keyMap[materialKey] || "cookingOil";
  return hubs.filter(h => h.active).map(h => ({ name: h.name, amount: h.currentLoad[field] })).filter(h => h.amount > 0);
}

// ── CO₂ Equivalents ──────────────────────────────────────────────────────────

export function co2Equivalents(kg: number) {
  return {
    trees:   +(kg / CO2_EQUIVALENTS.treeYear).toFixed(1),
    carKm:   Math.round(kg / CO2_EQUIVALENTS.carKmPetrol),
    flights: +(kg / CO2_EQUIVALENTS.flightAmmanDubai).toFixed(2),
    phones:  Math.round(kg / CO2_EQUIVALENTS.smartphoneCharge),
  };
}

// ── District Priority Score (higher = more urgent to collect) ─────────────────

export function districtPriorityScore(d: District): number {
  const gapPct  = (d.co2Potential - d.co2Achieved) / d.co2Potential;
  const orderPt = Math.min(d.orderCount * 2, 20);
  const gapPt   = Math.round(gapPct * 50);
  return gapPt + orderPt;
}

// ── Hub Coverage (Haversine distance, km) ────────────────────────────────────

export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Returns true if the district centroid is within `radiusKm` of any active hub */
export function isDistrictCovered(
  district: District,
  hubs: Hub[],
  radiusKm = 5
): boolean {
  return hubs
    .filter(h => h.active)
    .some(h => haversineKm(district.centroid[0], district.centroid[1], h.lat, h.lng) <= radiusKm);
}

// ── Delivery timer + alert helpers ───────────────────────────────────────────

/**
 * Returns ms elapsed since the order's acceptedAt timestamp.
 * Returns 0 if acceptedAt is not set (order hasn't been accepted yet).
 */
export function deliveryElapsedMs(order: Order): number {
  if (!order.acceptedAt) return 0;
  return Date.now() - order.acceptedAt;
}

/**
 * Returns urgency level 0–4 for a rider based on delivery elapsed vs estimate.
 *   0 = idle or no active order with a timestamp
 *   1 = green  (elapsed < 80% of estimate)
 *   2 = amber  (elapsed 80–100% of estimate)
 *   3 = red    (elapsed 100–150% of estimate)
 *   4 = critical (elapsed ≥ 150%) — fires the Alert Dot and pulsing border
 */
export function deliveryUrgencyLevel(rider: Rider): 0 | 1 | 2 | 3 | 4 {
  if (rider.status === "idle") return 0;
  const activeOrder = rider.orders.find(
    o => o.status === "inTransit" || o.status === "accepted"
  );
  if (!activeOrder?.acceptedAt) return 0;
  const elapsed  = Date.now() - activeOrder.acceptedAt;
  const estimate = MATERIAL_DELIVERY_ESTIMATE_MS[activeOrder.material] ?? 20 * 60 * 1000;
  const ratio    = elapsed / estimate;
  if (ratio >= 1.5) return 4;
  if (ratio >= 1.0) return 3;
  if (ratio >= 0.8) return 2;
  return 1;
}

/**
 * Returns ms elapsed since the rider became idle.
 * Returns 0 if rider is not idle or idleSince is not set.
 */
export function idleElapsedMs(rider: Rider): number {
  if (rider.status !== "idle" || !rider.idleSince) return 0;
  return Date.now() - rider.idleSince;
}

/**
 * Returns true if ANY rider in the fleet has a critical issue:
 *   - Delivery urgency level 4 (≥ 150% of estimate)
 *   - Idle for ≥ IDLE_CRITICAL_MS (20 min)
 * Used to show/hide the red Alert Dot on the panel header.
 */
export function hasFleetAlerts(riders: Rider[]): boolean {
  return riders.some(r => {
    if (deliveryUrgencyLevel(r) >= 4)      return true;
    if (idleElapsedMs(r) >= IDLE_CRITICAL_MS) return true;
    return false;
  });
}

// ── Stats bar drill-down helpers ─────────────────────────────────────────────

/**
 * Returns all non-pending orders that contribute to a given metric,
 * sorted by the metric value descending (highest first).
 *
 * metric = "co2"      → all riders, all orders, sorted by co2Saved desc
 * metric = "earnings" → all riders, all orders, sorted by earnings desc
 * metric = material   → all riders, only orders matching that material, sorted by quantity desc
 */
export function buildMetricOrderRows(
  riders: Rider[],
  metric: HistoryMetricKey
) {
  type Row = {
    riderId:     string;
    riderName:   string;
    riderStatus: Rider["status"];
    orderId:     string;
    material:    string;
    quantity:    number;
    unit:        string;
    co2Saved:    number;
    earnings:    number;
    orderStatus: Order["status"];
  };

  const rows: Row[] = [];

  for (const rider of riders) {
    for (const order of rider.orders) {
      if (order.status === "pending") continue;
      // For material tiles, skip orders of other materials
      if (
        metric !== "co2" &&
        metric !== "earnings" &&
        order.material !== metric
      ) continue;

      rows.push({
        riderId:     rider.id,
        riderName:   rider.name,
        riderStatus: rider.status,
        orderId:     order.id,
        material:    order.material,
        quantity:    order.quantity,
        unit:        order.unit,
        co2Saved:    order.co2Saved,
        earnings:    order.earnings,
        orderStatus: order.status,
      });
    }
  }

  if (metric === "co2")           rows.sort((a, b) => b.co2Saved  - a.co2Saved);
  else if (metric === "earnings") rows.sort((a, b) => b.earnings  - a.earnings);
  else                            rows.sort((a, b) => b.quantity  - a.quantity);

  return rows;
}

/**
 * For CO₂ or Earnings tiles: returns how much each material contributed
 * as a percentage of today's total. Used for the stacked composition bar.
 */
export function computeMaterialComposition(
  riders: Rider[],
  mode: "co2" | "earnings"
): { material: string; value: number; pct: number; color: string }[] {
  const totals: Record<string, number> = {};

  for (const rider of riders) {
    for (const order of rider.orders) {
      if (order.status === "pending") continue;
      const v = mode === "co2" ? order.co2Saved : order.earnings;
      totals[order.material] = (totals[order.material] ?? 0) + v;
    }
  }

  const grand = Object.values(totals).reduce((s, v) => s + v, 0) || 1;

  return Object.entries(totals)
    .map(([material, value]) => ({
      material,
      value,
      pct:   Math.round((value / grand) * 100),
      color: MATERIAL_CONFIG[material as keyof typeof MATERIAL_CONFIG]?.color
             ?? "var(--text-tertiary)",
    }))
    .sort((a, b) => b.value - a.value);
}

// ── Partner & Rewards helpers ─────────────────────────────────────────────────

/**
 * Health score 0–100 for a partner.
 * Deductions:
 *  - Order recency: no active order in 30 days → -25; in 14–30 days → -10
 *  - Renewal proximity: overdue → -30; within 14 days → -20; within 30 days → -10
 *  - Green points: below tier minimum threshold → -15
 */
export function computePartnerHealth(client: Client): number {
  const TODAY = new Date("2026-06-24");
  let score = 100;

  // Factor 1 — order recency
  const activeOrders = client.orders.filter(
    o => o.status === "completed" || o.status === "inTransit"
  );
  if (activeOrders.length === 0) {
    score -= 25;
  } else {
    const latestMs = activeOrders
      .map(o => new Date(o.createdAt).getTime())
      .sort((a, b) => b - a)[0];
    const daysSince = Math.floor((TODAY.getTime() - latestMs) / (1000 * 60 * 60 * 24));
    if (daysSince > 30) score -= 25;
    else if (daysSince > 14) score -= 10;
  }

  // Factor 2 — renewal proximity
  const renewal = new Date(client.renewalDate);
  const daysToRenewal = Math.floor((renewal.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24));
  if (daysToRenewal < 0)       score -= 30;  // overdue
  else if (daysToRenewal < 14) score -= 20;  // critical
  else if (daysToRenewal < 30) score -= 10;  // warning

  // Factor 3 — green points engagement
  const pointsThreshold: Record<ContractTier, number> = {
    free: 0, basic: 50, pro: 150, enterprise: 400,
  };
  if (client.greenPoints < pointsThreshold[client.contractTier]) score -= 15;

  return Math.max(0, Math.min(100, score));
}

/** Returns true when health score < 60. Triggers ChurnAlertPanel chip. */
export function isChurnRisk(client: Client): boolean {
  return computePartnerHealth(client) < 60;
}

/**
 * Returns monthly order count (last 30 days), next tier, and progress %.
 * Used to render the tier progression bar in the drawer Overview tab.
 */
export function computeTierProgress(client: Client): {
  currentOrders: number;
  nextTier: ContractTier | null;
  nextTierThreshold: number;
  pct: number;
} {
  const TODAY = new Date("2026-06-24");
  const thirtyDaysAgo = new Date(TODAY.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentOrders = client.orders.filter(
    o => o.status !== "pending" && new Date(o.createdAt) >= thirtyDaysAgo
  ).length;

  const idx = TIER_ORDER.indexOf(client.contractTier);
  const nextTier: ContractTier | null =
    idx < TIER_ORDER.length - 1 ? TIER_ORDER[idx + 1] : null;

  if (!nextTier) return { currentOrders, nextTier: null, nextTierThreshold: 0, pct: 100 };

  const threshold = TIER_MONTHLY_THRESHOLDS[nextTier];
  const pct = Math.min(100, Math.round((currentOrders / threshold) * 100));
  return { currentOrders, nextTier, nextTierThreshold: threshold, pct };
}

/**
 * Effective monthly price in JD.
 * Priority: customPriceJD → annual÷12 → standard monthly.
 */
export function getEffectivePriceJD(client: Client): number {
  if (client.customPriceJD !== undefined) return client.customPriceJD;
  const prices = TIER_PRICES_JD[client.contractTier];
  if (client.billingCycle === "annual") return Math.round((prices.annual / 12) * 100) / 100;
  return prices.monthly;
}

/** Monthly Recurring Revenue across all non-free partners (JD). */
export function computePartnerMRR(clients: Client[]): number {
  return Math.round(
    clients
      .filter(c => c.contractTier !== "free")
      .reduce((sum, c) => sum + getEffectivePriceJD(c), 0) * 100
  ) / 100;
}
