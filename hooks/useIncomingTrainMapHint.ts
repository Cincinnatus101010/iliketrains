"use client";

import { useEffect, useMemo, useState } from "react";
import { type IncomingTrainMapHint, incomingTrainMapHint } from "@/lib/trip/incomingTrainMapHint";
import { resolveIncomingApproachDirection } from "@/lib/trip/resolveIncomingApproachDirection";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { waitingForChosenTrainLive } from "@/lib/trip/waitingForChosenTrainLive";
import type { LiveTrain } from "@/types";
import { useMinuteClock } from "./useMinuteClock";

export function useIncomingTrainMapHint(
  savedTrip: SavedTrip | null,
  allTrains: LiveTrain[],
): IncomingTrainMapHint | null {
  const waiting = waitingForChosenTrainLive(savedTrip, allTrains);
  const nowMs = useMinuteClock(waiting);

  const base = useMemo(() => {
    if (!waiting || !savedTrip) return null;
    return incomingTrainMapHint(savedTrip, nowMs);
  }, [waiting, savedTrip, nowMs]);

  const [approachFromHighDist, setApproachFromHighDist] = useState<boolean | null>(null);

  useEffect(() => {
    if (!base || !savedTrip) {
      setApproachFromHighDist(null);
      return;
    }

    let cancelled = false;
    setApproachFromHighDist(null);

    void resolveIncomingApproachDirection(
      base.route,
      base.boardingStationName,
      savedTrip.chosenDeparture?.destination,
    ).then((dir) => {
      if (!cancelled) setApproachFromHighDist(dir);
    });

    return () => {
      cancelled = true;
    };
  }, [base, savedTrip]);

  return useMemo(() => {
    if (!base) return null;
    return { ...base, approachFromHighDist };
  }, [base, approachFromHighDist]);
}
