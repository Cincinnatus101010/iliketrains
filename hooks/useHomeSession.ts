"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readSavedTrip, writeSavedTrip } from "@/lib/trip/savedTrip";
import {
  effectiveTrackingTrainId,
  prepareTripForStart,
  tripWithTracking,
} from "@/lib/trip/tracking";
import { isTripExpired, savedAtIsoMs, TRIP_MAX_AGE_MS } from "@/lib/trip/tripExpiry";
import type { HomeSession, SavedTrip } from "@/types";

export type { HomeSession };

function emptySession(): HomeSession {
  return { trip: null, ephemeralTrackingId: null };
}

/**
 * Trip lifecycle and which train the map tracks.
 * `trackingTrainId` comes from the saved trip when present, otherwise `ephemeralTrackingId`.
 */
export function useHomeSession() {
  const [session, setSession] = useState<HomeSession>(emptySession);
  const skipNextPersist = useRef(true);

  useEffect(() => {
    setSession({ trip: readSavedTrip(), ephemeralTrackingId: null });
  }, []);

  useEffect(() => {
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    writeSavedTrip(session.trip);
  }, [session.trip]);

  const savedTrip = session.trip;
  const trackingTrainId = effectiveTrackingTrainId(session.trip, session.ephemeralTrackingId);
  /** Single-train feed + follow camera when any train is tracked. */
  const isTracking = trackingTrainId != null;

  const endTrip = useCallback(() => {
    writeSavedTrip(null);
    setSession(emptySession());
  }, []);

  const startTrip = useCallback((trip: SavedTrip) => {
    const prepared = prepareTripForStart(trip);
    if (isTripExpired(prepared)) {
      writeSavedTrip(null);
      setSession(emptySession());
      return;
    }
    writeSavedTrip(prepared);
    setSession({ trip: prepared, ephemeralTrackingId: null });
  }, []);

  const tripSavedAt = session.trip?.savedAt ?? null;

  useEffect(() => {
    if (!tripSavedAt) return;

    const savedMs = savedAtIsoMs(tripSavedAt);
    if (savedMs === null) {
      endTrip();
      return;
    }

    const delay = Math.max(0, savedMs + TRIP_MAX_AGE_MS - Date.now());
    if (delay <= 0) {
      endTrip();
      return;
    }

    const id = window.setTimeout(endTrip, delay);
    return () => window.clearTimeout(id);
  }, [tripSavedAt, endTrip]);

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
