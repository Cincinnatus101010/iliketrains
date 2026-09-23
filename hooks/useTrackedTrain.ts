"use client";

import { useMemo } from "react";
import { trainLiveSignature } from "@/lib/map/trainSyncKey";
import { findLiveTrainForChosenDeparture } from "@/lib/trip/chosenDepartureLiveMatch";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import type { LiveTrain } from "@/types";

export function useTrackedTrain(
  allTrains: LiveTrain[],
  trackingTrainId: string | null,
  savedTrip: SavedTrip | null = null,
) {
  const trackedTrain = useMemo(() => {
    if (!trackingTrainId) return null;
    if (savedTrip?.chosenDeparture) {
      const matched = findLiveTrainForChosenDeparture(savedTrip, allTrains);
      if (matched) return matched;
    }
    return allTrains.find((t) => t.id === trackingTrainId) ?? null;
  }, [allTrains, trackingTrainId, savedTrip]);

  const trackedTrainLiveKey = trackedTrain ? trainLiveSignature(trackedTrain) : null;

  return { trackedTrain, trackedTrainLiveKey };
}
