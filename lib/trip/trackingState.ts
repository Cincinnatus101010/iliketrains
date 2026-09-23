import type { TripTrackingState } from "@/types";

export type { TripTrackingState };

export function parseTripTrackingState(raw: unknown): TripTrackingState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const mode = (raw as { mode?: unknown }).mode;
  if (mode === "off") return { mode: "off" };
  if (mode === "auto") return { mode: "auto" };
  if (mode === "train") {
    const trainId = (raw as { trainId?: unknown }).trainId;
    if (typeof trainId === "string" && trainId.trim())
      return { mode: "train", trainId: trainId.trim() };
  }
  return null;
}

/** Migrate legacy localStorage field. */
export function trackingStateFromLegacyId(
  trackingTrainId: string | null | undefined,
): TripTrackingState | undefined {
  if (trackingTrainId === undefined) return undefined;
  if (trackingTrainId === null) return { mode: "off" };
  const id = trackingTrainId.trim();
  return id ? { mode: "train", trainId: id } : { mode: "off" };
}
