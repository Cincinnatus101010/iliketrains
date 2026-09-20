"use client";

import { useCallback, useMemo, useState } from "react";
import { readSavedTrip, type SavedTrip, writeSavedTrip } from "@/lib/trip/savedTrip";
import {
  effectiveTrackingTrainId,
  prepareTripForStart,
  tripWithTracking,
} from "@/lib/trip/tracking";

/** React state: trip is persisted; orphan id is follow-without-trip only. */
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

function persistTrip(trip: SavedTrip | null) {
  writeSavedTrip(trip);
}

export function useHomeSession() {
  const [session, setSession] = useState<HomeSession>(initialSession);

  const savedTrip = session.trip;
  const trackingTrainId = effectiveTrackingTrainId(session.trip, session.orphanTrackingId);
  const isOnboard = trackingTrainId != null;

  const startTrip = useCallback((trip: SavedTrip) => {
    const prepared = prepareTripForStart(trip);
    persistTrip(prepared);
    setSession({ trip: prepared, orphanTrackingId: null });
  }, []);

  const endTrip = useCallback(() => {
    persistTrip(null);
    setSession({ trip: null, orphanTrackingId: null });
  }, []);

  const toggleTrackTrain = useCallback((trainId: string) => {
    setSession((current) => {
      const activeId = effectiveTrackingTrainId(current.trip, current.orphanTrackingId);
      const nextId = activeId === trainId ? null : trainId;
      if (current.trip) {
        const trip = tripWithTracking(current.trip, nextId);
        persistTrip(trip);
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
        persistTrip(trip);
        return { trip, orphanTrackingId: null };
      }
      return { ...current, orphanTrackingId: null };
    });
  }, []);

  return useMemo(
    () => ({
      savedTrip,
      trackingTrainId,
      isOnboard,
      startTrip,
      endTrip,
      toggleTrackTrain,
      stopTracking,
    }),
    [savedTrip, trackingTrainId, isOnboard, startTrip, endTrip, toggleTrackTrain, stopTracking],
  );
}
