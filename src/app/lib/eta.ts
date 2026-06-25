export function etaMultiplier(): number {
  const h = new Date().getHours();
  if (h >= 7  && h <= 9)  return 1.4;
  if (h >= 16 && h <= 19) return 1.3;
  if (h >= 12 && h <= 14) return 1.1;
  return 1.0;
}

// NEVER decrement a counter — always subtract from Date.now()
export function remainingSeconds(adjustedDurationSeconds: number, tripStartedAt: number): number {
  return adjustedDurationSeconds - (Date.now() - tripStartedAt) / 1000;
}

export function formatEta(remaining: number): string {
  if (remaining <= 0) {
    const over = Math.round(Math.abs(remaining) / 60);
    return over === 0 ? "Arriving now" : `Overdue ${over} min`;
  }
  const mins = Math.ceil(remaining / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${mins} min`;
}

export function formatArrivalTime(adjustedDurationSeconds: number, tripStartedAt: number): string {
  return new Date(tripStartedAt + adjustedDurationSeconds * 1000)
    .toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function etaColor(remaining: number, adjustedDurationSeconds: number): string {
  if (remaining < 0) return "var(--color-danger-600)";
  if (remaining / adjustedDurationSeconds > 0.2) return "var(--color-brand-600)";
  return "var(--color-amber-600)";
}

export function routeProgressPct(currentCoordIndex: number, totalCoords: number): number {
  if (totalCoords <= 1) return 100;
  return Math.min(100, Math.round((currentCoordIndex / (totalCoords - 1)) * 100));
}

export function kmRemaining(currentCoordIndex: number, totalCoords: number, totalDistanceKm: number): number {
  const pct = 1 - currentCoordIndex / Math.max(totalCoords - 1, 1);
  return +(pct * totalDistanceKm).toFixed(1);
}
