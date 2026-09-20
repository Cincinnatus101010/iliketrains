"use client";

import { useCallback, useEffect, useState } from "react";
import { readSavedTrip, type SavedTrip, writeSavedTrip } from "@/lib/trip/savedTrip";
import {
  effectiveTrackingTrainId,
  prepareTripForStart,
  tripWithTracking,
} from "@/lib/trip/tracking";

/** In-memory home screen session (trip persistence + map-only train tracking). */
export type HomeSession = {
  trip: SavedTrip | null;
  /** Follow id when there is no saved trip; cleared when a trip starts. */
  ephemeralTrackingId: string | null;
};

function initialSession(): HomeSession {
  return {
    trip: readSavedTrip(),
    ephemeralTrackingId: null,
  };
}

/**
 * Trip lifecycle and which train the map tracks.
 * `trackingTrainId` comes from the saved trip when present, otherwise `ephemeralTrackingId`.
 */
export function useHomeSession() {
  const [session, setSession] = useState<HomeSession>(initialSession);

  useEffect(() => {
    writeSavedTrip(session.trip);
  }, [session.trip]);

  const savedTrip = session.trip;
  const trackingTrainId = effectiveTrackingTrainId(session.trip, session.ephemeralTrackingId);
  /** Single-train feed + follow camera when any train is tracked. */
  const isTracking = trackingTrainId != null;

  const startTrip = useCallback((trip: SavedTrip) => {
    const prepared = prepareTripForStart(trip);
    setSession({ trip: prepared, ephemeralTrackingId: null });
  }, []);

  const endTrip = useCallback(() => {
    setSession({ trip: null, ephemeralTrackingId: null });
  }, []);

  const toggleTrackTrain = useCallback((trainId: string) => {
    setSession((current) => {
      const activeId = effectiveTrackingTrainId(current.trip, current.ephemeralTrackingId);
      const nextId = activeId === trainId ? null : trainId;
      if (current.trip) {
        const trip = tripWithTracking(current.trip, nextId);
        return { trip, ephemeralTrackingId: null };
      }
      return { ...current, ephemeralTrackingId: nextId };
    });
  }, []);

  const stopTracking = useCallback(() => {
    setSession((current) => {
      const activeId = effectiveTrackingTrainId(current.trip, current.ephemeralTrackingId);
      if (!activeId) return current;
      if (current.trip) {
        const trip = tripWithTracking(current.trip, null);
        return { trip, ephemeralTrackingId: null };
      }
      return { ...current, ephemeralTrackingId: null };
    });
  }, []);

  return {
    savedTrip,
    trackingTrainId,
    isTracking,
    startTrip,
    endTrip,
    toggleTrackTrain,
    stopTracking,
  };
}
