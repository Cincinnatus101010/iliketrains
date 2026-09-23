"use client";

import { useMemo } from "react";
import { trainLiveSignature } from "@/lib/map/trainSyncKey";
import { findLiveTrainForChosenDeparture } from "@/lib/trip/chosenDepartureLiveMatch";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { liveTrainIdForChosenDeparture } from "@/lib/trip/tracking";
import type { LiveTrain } from "@/types";

export function useTrackedTrain(
  allTrains: LiveTrain[],
  trackingTrainId: string | null,
  savedTrip: SavedTrip | null = null,
) {
  const trackedTrain = useMemo(() => {
    if (!trackingTrainId) return null;
    const byId = allTrains.find((t) => t.id === trackingTrainId);
    if (byId) return byId;
    if (
      savedTrip?.chosenDeparture &&
      liveTrainIdForChosenDeparture(savedTrip) === trackingTrainId
    ) {
      return findLiveTrainForChosenDeparture(savedTrip, allTrains);
    }
    return null;
  }, [allTrains, trackingTrainId, savedTrip]);

  const trackedTrainLiveKey = trackedTrain ? trainLiveSignature(trackedTrain) : null;

  return { trackedTrain, trackedTrainLiveKey };
}
