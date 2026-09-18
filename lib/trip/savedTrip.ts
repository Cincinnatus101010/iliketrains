import type { PlannedRoute } from "./types";

export type SavedTrip = {
  fromKey: string;
  toKey: string;
  fromName: string;
  toName: string;
  route: PlannedRoute;
  savedAt: string;
};

const STORAGE_KEY = "iliketrains.savedTrip.v1";

export function readSavedTrip(): SavedTrip | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedTrip;
    if (!parsed?.fromKey || !parsed?.toKey || !parsed?.route?.steps) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSavedTrip(trip: SavedTrip | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!trip) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trip));
  } catch {
    /* quota / private mode */
  }
}

export function tripSummaryLabel(trip: SavedTrip): string {
  const rides = trip.route.steps.filter((s) => s.kind === "ride").length;
  const walks = trip.route.steps.filter((s) => s.kind === "walk").length;
  const parts: string[] = [];
  if (rides > 0) parts.push(`${rides} ride${rides === 1 ? "" : "s"}`);
  if (walks > 0) parts.push(`${walks} walk${walks === 1 ? "" : "s"}`);
  return parts.join(" · ") || `${trip.route.stopCount} stops`;
}
