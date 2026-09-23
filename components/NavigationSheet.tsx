"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchTripPlan } from "@/lib/fetchTripPlan";
import { parseLineKey } from "@/lib/lineKey";
import { listPlanStations } from "@/lib/trip/loadGraph";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { ensureRouteStats } from "@/lib/trip/tripStats";
import type { PlannedRoute, ScheduleDeparture, TripBoardingSchedule } from "@/types";
import { StationPicker } from "./StationPicker";
import { TripPlanPreview } from "./TripPlanPreview";

type NavigationSheetProps = {
  open: boolean;
  onClose: () => void;
  initialTrip: SavedTrip | null;
  onStartTrip: (trip: SavedTrip) => void;
  onEndTrip: () => void;
};

export function NavigationSheet({
  open,
  onClose,
  initialTrip,
  onStartTrip,
  onEndTrip,
}: NavigationSheetProps) {
  const [stations, setStations] = useState<{ key: string; name: string; network: "mta" | "njt" }[]>(
    [],
  );
  const [fromKey, setFromKey] = useState("");
  const [toKey, setToKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PlannedRoute | null>(null);
  const [boarding, setBoarding] = useState<TripBoardingSchedule | null>(null);
  const [loadingStations, setLoadingStations] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [chosenDeparture, setChosenDeparture] = useState<ScheduleDeparture | null>(null);
  const [mustPickDeparture, setMustPickDeparture] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingStations(true);
    void listPlanStations()
      .then(setStations)
      .finally(() => setLoadingStations(false));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initialTrip) {
      setFromKey(initialTrip.fromKey);
      setToKey(initialTrip.toKey);
      setPreview(ensureRouteStats(initialTrip.route));
      setBoarding(null);
      setChosenDeparture(initialTrip.chosenDeparture ?? null);
      setError(null);
      return;
    }
    setFromKey("");
    setToKey("");
    setPreview(null);
    setBoarding(null);
    setChosenDeparture(null);
    setError(null);
  }, [open, initialTrip]);

  const stationName = (key: string) => stations.find((s) => s.key === key)?.name ?? key;

  useEffect(() => {
    if (!open || !fromKey || !toKey) {
      if (!fromKey || !toKey) setPreview(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPlanning(true);
      setError(null);
      void fetchTripPlan(fromKey, toKey, controller.signal)
        .then((body) => {
          if (cancelled) return;
          if (body.error && !body.route) {
            setError(body.error);
            setPreview(null);
            setBoarding(null);
            return;
          }
          setPreview(body.route);
          setBoarding(body.boarding);
          setChosenDeparture(null);
          setMustPickDeparture(false);
          if (body.error) setError(body.error);
        })
        .catch((e: unknown) => {
          if (cancelled || controller.signal.aborted) return;
          setError(e instanceof Error ? e.message : "Could not plan trip.");
          setPreview(null);
          setBoarding(null);
        })
        .finally(() => {
          if (!cancelled) setPlanning(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, fromKey, toKey]);

  const endpointsReady = Boolean(fromKey && toKey);

  const sheetTitle = useMemo(() => {
    if (initialTrip) return "Your trip";
    if (preview && fromKey && toKey) return "Review route";
    return "Plan a trip";
  }, [initialTrip, preview, fromKey, toKey]);

  if (!open) return null;

  const swap = () => {
    setFromKey(toKey);
    setToKey(fromKey);
    setChosenDeparture(null);
  };

  const isNjOrigin = parseLineKey(fromKey)?.network === "njt";
  const needsDeparturePick = Boolean(preview && isNjOrigin && mustPickDeparture);
  const canStart = preview && !planning && (!needsDeparturePick || chosenDeparture != null);

  const startTrip = () => {
    if (!preview || !fromKey || !toKey || !canStart) return;

    onStartTrip({
      fromKey,
      toKey,
      fromName: stationName(fromKey),
      toName: stationName(toKey),
      route: preview,
      savedAt: new Date().toISOString(),
      chosenDeparture: chosenDeparture ?? null,
    });
    onClose();
  };

  const endTrip = () => {
    setPreview(null);
    setFromKey("");
    setToKey("");
    setError(null);
    onEndTrip();
    onClose();
  };

  return (
    <div className="trip-planner-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="trip-planner-drawer glass"
        role="dialog"
        aria-label="Plan a trip"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="nav-sheet-head trip-planner-head">
          <div>
            <p className="panel-kicker">Navigate</p>
            <h2 className="panel-title">{sheetTitle}</h2>
            {!endpointsReady && !loadingStations && (
              <p className="nav-sheet-subtitle">Pick a start and destination to see directions.</p>
            )}
            {planning && endpointsReady && (
              <p className="nav-sheet-subtitle">Finding best route…</p>
            )}
          </div>
          <button type="button" className="nav-sheet-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="trip-planner-scroll">
          {loadingStations && stations.length === 0 && (
            <p className="panel-meta">Loading stations…</p>
          )}

          <div className="trip-endpoints">
            <StationPicker
              label="From"
              markerClass="trip-endpoint-marker--from"
              value={fromKey}
              stations={stations}
              disabled={loadingStations}
              onChange={(key) => {
                setFromKey(key);
                setChosenDeparture(null);
                setError(null);
              }}
            />
            <div className="trip-endpoints-connector" aria-hidden />
            <StationPicker
              label="To"
              markerClass="trip-endpoint-marker--to"
              value={toKey}
              stations={stations}
              disabled={loadingStations}
              onChange={(key) => {
                setToKey(key);
                setChosenDeparture(null);
                setError(null);
              }}
            />
            <button
              type="button"
              className="trip-planner-swap trip-endpoints-swap"
              title="Swap"
              aria-label="Swap from and to"
              disabled={!fromKey && !toKey}
              onClick={swap}
            >
              ⇅
            </button>
          </div>

          {error && <p className="panel-error">{error}</p>}

          {preview && fromKey && toKey && (
            <div className="nav-sheet-preview trip-planner-preview">
              <TripPlanPreview
                fromKey={fromKey}
                fromName={stationName(fromKey)}
                toName={stationName(toKey)}
                route={preview}
                boarding={boarding}
                scheduleLoading={planning}
                chosenDeparture={chosenDeparture}
                onChooseDeparture={setChosenDeparture}
                onDeparturesLoaded={setMustPickDeparture}
              />
            </div>
          )}
        </div>

        <div className="nav-sheet-footer trip-planner-footer">
          <button
            type="button"
            className="nav-sheet-primary"
            disabled={!canStart}
            onClick={startTrip}
          >
            {initialTrip ? "Update trip on map" : "Start trip on map"}
          </button>
          {preview && needsDeparturePick && !chosenDeparture && (
            <p className="nav-sheet-footer-hint">Select a departure time above to continue.</p>
          )}
          {preview && (
            <p className="nav-sheet-footer-hint">
              Shows your path on the map, opens the Trip panel, and highlights live trains on your
              lines.
            </p>
          )}
          {initialTrip && (
            <button type="button" className="nav-sheet-secondary" onClick={endTrip}>
              End trip
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
