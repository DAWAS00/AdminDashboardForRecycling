import type { Route } from "../types";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const TIMEOUT_MS = 5000;

export async function fetchOsrmRoute(
  startLat: number, startLng: number,
  endLat: number,   endLng: number,
  signal?: AbortSignal,
): Promise<Route> {
  // OSRM wants longitude first: {lng},{lat};{lng},{lat}
  const url = `${OSRM_BASE}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener("abort", () => controller.abort());
    }
  }

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timerId);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);

    const json = await res.json();
    const leg = json.routes?.[0];
    if (!leg) throw new Error("no routes");

    // OSRM returns [lng, lat] — flip to Leaflet order [lat, lng]
    const coords: [number, number][] = (leg.geometry.coordinates as [number, number][])
      .map(([lng, lat]) => [lat, lng]);

    const durationSeconds = Math.round(leg.duration);
    const distanceKm = +(leg.distance / 1000).toFixed(2);

    return {
      coords,
      distanceKm,
      durationSeconds,
      adjustedDurationSeconds: durationSeconds,
      isFallback: false,
    };
  } catch (err) {
    clearTimeout(timerId);
    console.warn("[osrm] using arc fallback:", (err as Error).message);
    return buildArcFallback(startLat, startLng, endLat, endLng);
  }
}

export const ARC_STEPS = 64;

export function buildArcFallback(
  startLat: number, startLng: number,
  endLat: number,   endLng: number,
): Route {
  const midLat = (startLat + endLat) / 2 + 0.008;
  const midLng = (startLng + endLng) / 2;

  const coords: [number, number][] = [];
  for (let i = 0; i <= ARC_STEPS; i++) {
    const t = i / ARC_STEPS;
    const lat = (1-t)**2 * startLat + 2*(1-t)*t * midLat + t**2 * endLat;
    const lng = (1-t)**2 * startLng + 2*(1-t)*t * midLng + t**2 * endLng;
    coords.push([lat, lng]);
  }

  const straightKm = haversineKm(startLat, startLng, endLat, endLng);
  const distanceKm = +(straightKm * 1.3).toFixed(2);
  const durationSeconds = Math.round((distanceKm / 30) * 3600);

  return { coords, distanceKm, durationSeconds, adjustedDurationSeconds: durationSeconds, isFallback: true };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2
    + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
