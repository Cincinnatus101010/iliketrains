"use client";

import { useMemo } from "react";
import { trainLiveSignature } from "@/lib/map/trainSyncKey";
import type { LiveTrain } from "@/types";

export function useTrackedTrain(allTrains: LiveTrain[], trackingTrainId: string | null) {
  const trackedTrain = useMemo(
    () => (trackingTrainId ? (allTrains.find((t) => t.id === trackingTrainId) ?? null) : null),
    [allTrains, trackingTrainId],
  );

  const trackedTrainLiveKey = trackedTrain ? trainLiveSignature(trackedTrain) : null;

  return { trackedTrain, trackedTrainLiveKey };
}
