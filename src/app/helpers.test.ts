import { describe, it, expect } from "vitest";
import { deliveryUrgencyLevel, idleElapsedMs } from "./helpers";
import type { Rider } from "./types";

const MIN = 60 * 1000;

function makeRider(overrides: Partial<Rider> = {}): Rider {
  return {
    id: "r1",
    name: "Test Rider",
    nameAr: "سائق",
    phone: "+962",
    lat: 31.96,
    lng: 35.91,
    status: "delivering",
    vehicle: "Motorcycle",
    orders: [],
    ...overrides,
  };
}

function makeOrder(acceptedMinsAgo: number, estimateMins = 20) {
  // "Cooking Oil" estimate = 20 min per constants
  const acceptedAt = Date.now() - acceptedMinsAgo * MIN;
  return {
    id: "o1",
    material: "Cooking Oil" as const,
    quantity: 5,
    unit: "kg",
    address: "Amman",
    deliveryLat: 31.96,
    deliveryLng: 35.91,
    status: "inTransit" as const,
    co2Saved: 13.5,
    earnings: 4.5,
    createdAt: "2026-06-28",
    acceptedAt,
  };
}

describe("deliveryUrgencyLevel", () => {
  it("returns 0 for idle rider", () => {
    const rider = makeRider({ status: "idle" });
    expect(deliveryUrgencyLevel(rider)).toBe(0);
  });

  it("returns 0 when active order has no acceptedAt", () => {
    const order = { ...makeOrder(5), acceptedAt: undefined };
    const rider = makeRider({ orders: [order] });
    expect(deliveryUrgencyLevel(rider)).toBe(0);
  });

  it("returns 1 (green) when elapsed < 80% of 20-min estimate", () => {
    // 15 min elapsed / 20 min = 75% → level 1
    const rider = makeRider({ orders: [makeOrder(15)] });
    expect(deliveryUrgencyLevel(rider)).toBe(1);
  });

  it("returns 2 (amber) at 80–100% of estimate", () => {
    // 17 min / 20 min = 85% → level 2
    const rider = makeRider({ orders: [makeOrder(17)] });
    expect(deliveryUrgencyLevel(rider)).toBe(2);
  });

  it("returns 3 (red) at 100–150% of estimate", () => {
    // 22 min / 20 min = 110% → level 3
    const rider = makeRider({ orders: [makeOrder(22)] });
    expect(deliveryUrgencyLevel(rider)).toBe(3);
  });

  it("returns 4 (critical) at ≥ 150% of estimate", () => {
    // 31 min / 20 min = 155% → level 4
    const rider = makeRider({ orders: [makeOrder(31)] });
    expect(deliveryUrgencyLevel(rider)).toBe(4);
  });
});

describe("idleElapsedMs", () => {
  it("returns 0 for a delivering rider", () => {
    const rider = makeRider({ status: "delivering", idleSince: Date.now() - 5 * MIN });
    expect(idleElapsedMs(rider)).toBe(0);
  });

  it("returns 0 for idle rider with no idleSince", () => {
    const rider = makeRider({ status: "idle" });
    expect(idleElapsedMs(rider)).toBe(0);
  });

  it("returns approximate elapsed ms for idle rider with idleSince", () => {
    const idleSince = Date.now() - 10 * MIN;
    const rider = makeRider({ status: "idle", idleSince });
    const elapsed = idleElapsedMs(rider);
    expect(elapsed).toBeGreaterThanOrEqual(9 * MIN);
    expect(elapsed).toBeLessThan(11 * MIN);
  });
});
