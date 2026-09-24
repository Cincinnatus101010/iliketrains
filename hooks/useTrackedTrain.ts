"use client";

import { useMemo } from "react";
import { trainLiveSignature } from "@/lib/map/trainSyncKey";
import { resolveTrackedTrain } from "@/lib/trip/resolveTrackedTrain";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import type { LiveTrain } from "@/types";

export function useTrackedTrain(
  allTrains: LiveTrain[],
  trackingTrainId: string | null,
  savedTrip: SavedTrip | null = null,
) {
  const trackedTrain = useMemo(
    () => resolveTrackedTrain(allTrains, trackingTrainId, savedTrip),
    [allTrains, trackingTrainId, savedTrip],
  );

  const trackedTrainLiveKey = trackedTrain ? trainLiveSignature(trackedTrain) : null;

  return { trackedTrain, trackedTrainLiveKey };
}
