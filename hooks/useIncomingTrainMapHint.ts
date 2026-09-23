"use client";

import { useEffect, useState } from "react";
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
  const [hint, setHint] = useState<IncomingTrainMapHint | null>(null);

  useEffect(() => {
    if (!waiting || !savedTrip) {
      setHint(null);
      return;
    }

    let cancelled = false;
    const base = incomingTrainMapHint(savedTrip, nowMs);
    if (!base) {
      setHint(null);
      return;
    }

    void resolveIncomingApproachDirection(
      base.route,
      base.boardingStationName,
      savedTrip.chosenDeparture?.destination,
    ).then((approachFromHighDist) => {
      if (cancelled) return;
      setHint({ ...base, approachFromHighDist });
    });

    return () => {
      cancelled = true;
    };
  }, [waiting, savedTrip, nowMs]);

  return hint;
}
