import type { SavedTrip } from "./trip";

/** In-memory home screen session (trip persistence + map-only train tracking). */
export type HomeSession = {
  trip: SavedTrip | null;
  /** Follow id when there is no saved trip; cleared when a trip starts. */
  ephemeralTrackingId: string | null;
};
