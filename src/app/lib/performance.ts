import type { CompletedTrip } from "../types";

export interface RiderStats {
  riderId: number; riderName: string; tripsCompleted: number;
  avgActualSeconds: number; avgOsrmSeconds: number;
  avgEfficiencyScore: number; onTimeRate: number;
  totalDistanceKm: number; totalCo2Saved: number; totalEarnings: number;
}

export interface DistrictStats {
  district: string; tripsCompleted: number;
  avgActualMinutes: number; avgOsrmMinutes: number;
  avgEfficiencyScore: number; totalCo2Saved: number;
}

export function computeRiderStats(trips: CompletedTrip[]): RiderStats[] {
  const byRider = new Map<number, CompletedTrip[]>();
  for (const trip of trips) {
    byRider.set(trip.riderId, [...(byRider.get(trip.riderId) ?? []), trip]);
  }
  return Array.from(byRider.entries()).map(([riderId, t]) => {
    const n = t.length;
    const onTime = t.filter(x => x.actualSeconds <= x.osrmEstimateSeconds * 1.1).length;
    return {
      riderId, riderName: t[0].riderName, tripsCompleted: n,
      avgActualSeconds:   Math.round(t.reduce((s,x) => s + x.actualSeconds, 0) / n),
      avgOsrmSeconds:     Math.round(t.reduce((s,x) => s + x.osrmEstimateSeconds, 0) / n),
      avgEfficiencyScore: Math.round(t.reduce((s,x) => s + x.efficiencyScore, 0) / n),
      onTimeRate:         Math.round((onTime / n) * 100),
      totalDistanceKm:    +t.reduce((s,x) => s + x.distanceKm, 0).toFixed(1),
      totalCo2Saved:      +t.reduce((s,x) => s + x.co2Saved, 0).toFixed(2),
      totalEarnings:      +t.reduce((s,x) => s + x.earnings, 0).toFixed(2),
    };
  });
}

export function computeDistrictStats(trips: CompletedTrip[]): DistrictStats[] {
  const byDistrict = new Map<string, CompletedTrip[]>();
  for (const trip of trips) {
    byDistrict.set(trip.district, [...(byDistrict.get(trip.district) ?? []), trip]);
  }
  return Array.from(byDistrict.entries())
    .map(([district, t]) => {
      const n = t.length;
      return {
        district, tripsCompleted: n,
        avgActualMinutes:   +(t.reduce((s,x) => s + x.actualSeconds, 0) / n / 60).toFixed(1),
        avgOsrmMinutes:     +(t.reduce((s,x) => s + x.osrmEstimateSeconds, 0) / n / 60).toFixed(1),
        avgEfficiencyScore: Math.round(t.reduce((s,x) => s + x.efficiencyScore, 0) / n),
        totalCo2Saved:      +t.reduce((s,x) => s + x.co2Saved, 0).toFixed(2),
      };
    })
    .sort((a, b) => b.avgActualMinutes - a.avgActualMinutes);
}

export function districtFromCoords(lat: number, lng: number): string {
  const BOXES = [
    { name: "Downtown (Al-Balad)",  minLat:31.943, maxLat:31.960, minLng:35.924, maxLng:35.946 },
    { name: "Shmeisani",            minLat:31.970, maxLat:31.988, minLng:35.870, maxLng:35.895 },
    { name: "Sweifieh",             minLat:31.935, maxLat:31.952, minLng:35.858, maxLng:35.882 },
    { name: "Abdoun",               minLat:31.930, maxLat:31.947, minLng:35.872, maxLng:35.900 },
    { name: "Jubaiha",              minLat:31.992, maxLat:32.012, minLng:35.858, maxLng:35.882 },
    { name: "Tabarbour",            minLat:32.005, maxLat:32.025, minLng:35.908, maxLng:35.938 },
    { name: "8th Circle Area",      minLat:31.950, maxLat:31.968, minLng:35.842, maxLng:35.865 },
    { name: "University District",  minLat:31.998, maxLat:32.018, minLng:35.866, maxLng:35.892 },
    { name: "Tlaa Al-Ali",          minLat:31.940, maxLat:31.958, minLng:35.845, maxLng:35.870 },
    { name: "Airport Road Corridor",minLat:31.895, maxLat:31.925, minLng:35.930, maxLng:35.965 },
  ];
  for (const b of BOXES) {
    if (lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng) return b.name;
  }
  return "Other Amman";
}
