import type { SavedTrip } from "@/lib/trip/savedTrip";

/** Short label for the map chrome live-count badge. */
export function mapTopCountLabel(
  mapLiveCount: number,
  opts: { isTracking: boolean; savedTrip: SavedTrip | null },
): string {
  if (opts.isTracking) return "On train";
  if (opts.savedTrip) return `${mapLiveCount} on route`;
  return `${mapLiveCount} live`;
}
