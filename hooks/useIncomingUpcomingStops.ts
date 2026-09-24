"use client";

import { useEffect, useMemo, useState } from "react";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { incomingApproachProgress } from "@/lib/trip/incomingTrainEstimate";
import type { IncomingTrainMapHint } from "@/lib/trip/incomingTrainMapHint";
import { upcomingStopsAlongBoardingApproach } from "@/lib/trip/incomingUpcomingStops";
import { loadNjRouteStopOrder } from "@/lib/trip/loadNjRouteStopOrder";
import type { ScheduleDeparture, UpcomingStop } from "@/types";

export function useIncomingUpcomingStops(
  incoming: IncomingTrainMapHint | null,
  departure: ScheduleDeparture | null,
): UpcomingStop[] {
  const nowMs = useMinuteClock(Boolean(incoming && departure));
  const [orderedStops, setOrderedStops] = useState<string[]>([]);

  useEffect(() => {
    if (!incoming?.route) {
      setOrderedStops([]);
      return;
    }
    let cancelled = false;
    void loadNjRouteStopOrder(incoming.route).then((names) => {
      if (!cancelled) setOrderedStops(names);
    });
    return () => {
      cancelled = true;
    };
  }, [incoming?.route]);

  return useMemo(() => {
    if (!incoming || !departure) return [];
    const progress = incomingApproachProgress(departure, nowMs);
    return upcomingStopsAlongBoardingApproach(
      orderedStops,
      incoming.boardingStationName,
      departure.destination,
      incoming.approachFromHighDist,
      progress,
    );
  }, [incoming, departure, orderedStops, nowMs]);
}
