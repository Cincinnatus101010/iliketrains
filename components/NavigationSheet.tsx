"use client";

import { useEffect, useMemo, useState } from "react";
import { listPlanStations, loadTripGraph } from "@/lib/trip/loadGraph";
import { planTrip } from "@/lib/trip/planTrip";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { ensureRouteStats } from "@/lib/trip/tripStats";
import type { PlannedRoute } from "@/lib/trip/types";
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
  const [loadingStations, setLoadingStations] = useState(false);
  const [planning, setPlanning] = useState(false);

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
      setError(null);
      return;
    }
    setFromKey("");
    setToKey("");
    setPreview(null);
    setError(null);
  }, [open, initialTrip]);

  const stationName = (key: string) => stations.find((s) => s.key === key)?.name ?? key;

  useEffect(() => {
    if (!open || !fromKey || !toKey) {
      if (!fromKey || !toKey) setPreview(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPlanning(true);
      setError(null);
      void loadTripGraph()
        .then((graph) => {
          if (cancelled) return;
          if (!graph) {
            setError("Route data missing.");
            setPreview(null);
            return;
          }
          const route = planTrip(graph, fromKey, toKey);
          if (!route) {
            setError("No route found between those stations.");
            setPreview(null);
            return;
          }
          setPreview(route);
        })
        .finally(() => {
          if (!cancelled) setPlanning(false);
        });
    }, 350);

    return () => {
      cancelled = true;
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
  };

  const startTrip = () => {
    if (!preview || !fromKey || !toKey) return;

    onStartTrip({
      fromKey,
      toKey,
      fromName: stationName(fromKey),
      toName: stationName(toKey),
      route: preview,
      savedAt: new Date().toISOString(),
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
    <div className="nav-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="nav-sheet glass"
        role="dialog"
        aria-label="Plan a trip"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="nav-sheet-head">
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
          <div className="nav-sheet-preview">
            <TripPlanPreview
              fromName={stationName(fromKey)}
              toName={stationName(toKey)}
              route={preview}
            />
          </div>
        )}

        <div className="nav-sheet-footer">
          <button
            type="button"
            className="nav-sheet-primary"
            disabled={!preview || planning}
            onClick={startTrip}
          >
            {initialTrip ? "Update trip on map" : "Start trip on map"}
          </button>
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
      </div>
    </div>
  );
}
