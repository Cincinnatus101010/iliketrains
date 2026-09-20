"use client";

import { useCallback, useEffect, useState } from "react";
import { readSavedTrip, type SavedTrip, writeSavedTrip } from "@/lib/trip/savedTrip";
import {
  effectiveTrackingTrainId,
  prepareTripForStart,
  tripWithTracking,
} from "@/lib/trip/tracking";

/** React session: persisted trip plus ephemeral map follow when no trip is saved. */
export type HomeSession = {
  trip: SavedTrip | null;
  orphanTrackingId: string | null;
};

function initialSession(): HomeSession {
  return {
    trip: readSavedTrip(),
    orphanTrackingId: null,
  };
}

export function useHomeSession() {
  const [session, setSession] = useState<HomeSession>(initialSession);

  useEffect(() => {
    writeSavedTrip(session.trip);
  }, [session.trip]);

  const savedTrip = session.trip;
  const trackingTrainId = effectiveTrackingTrainId(session.trip, session.orphanTrackingId);
  const isOnboard = trackingTrainId != null;

  const startTrip = useCallback((trip: SavedTrip) => {
    const prepared = prepareTripForStart(trip);
    setSession({ trip: prepared, orphanTrackingId: null });
  }, []);

  const endTrip = useCallback(() => {
    setSession({ trip: null, orphanTrackingId: null });
  }, []);

  const toggleTrackTrain = useCallback((trainId: string) => {
    setSession((current) => {
      const activeId = effectiveTrackingTrainId(current.trip, current.orphanTrackingId);
      const nextId = activeId === trainId ? null : trainId;
      if (current.trip) {
        const trip = tripWithTracking(current.trip, nextId);
        return { trip, orphanTrackingId: null };
      }
      return { ...current, orphanTrackingId: nextId };
    });
  }, []);

  const stopTracking = useCallback(() => {
    setSession((current) => {
      const activeId = effectiveTrackingTrainId(current.trip, current.orphanTrackingId);
      if (!activeId) return current;
      if (current.trip) {
        const trip = tripWithTracking(current.trip, null);
        return { trip, orphanTrackingId: null };
      }
      return { ...current, orphanTrackingId: null };
    });
  }, []);

  return {
    savedTrip,
    trackingTrainId,
    isOnboard,
    startTrip,
    endTrip,
    toggleTrackTrain,
    stopTracking,
  };
}
