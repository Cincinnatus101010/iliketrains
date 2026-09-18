"use client";

import { useEffect, useMemo, useState } from "react";
import { loadTripGraph, listPlanStations } from "@/lib/trip/loadGraph";
import { planTrip } from "@/lib/trip/planTrip";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import type { PlannedRoute } from "@/lib/trip/types";
import { TripTimeline } from "./TripTimeline";

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
      setPreview(initialTrip.route);
      setError(null);
      return;
    }
    setFromKey("");
    setToKey("");
    setPreview(null);
    setError(null);
  }, [open, initialTrip]);

  const mtaStations = useMemo(() => stations.filter((s) => s.network === "mta"), [stations]);
  const njStations = useMemo(() => stations.filter((s) => s.network === "njt"), [stations]);

  const stationName = (key: string) => stations.find((s) => s.key === key)?.name ?? key;

  if (!open) return null;

  const swap = () => {
    setFromKey(toKey);
    setToKey(fromKey);
    setPreview(null);
  };

  const buildPreview = async () => {
    setError(null);
    setPreview(null);
    if (!fromKey || !toKey) {
      setError("Choose both a from and to station.");
      return;
    }

    setPlanning(true);
    try {
      const graph = await loadTripGraph();
      if (!graph) {
        setError("Route data missing.");
        return;
      }

      const route = planTrip(graph, fromKey, toKey);
      if (!route) {
        setError("No route found between those stations.");
        return;
      }

      setPreview(route);
    } finally {
      setPlanning(false);
    }
  };

  const startTrip = () => {
    if (!preview || !fromKey || !toKey) {
      void buildPreview();
      return;
    }

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
            <h2 className="panel-title">{initialTrip ? "Your trip" : "New trip"}</h2>
          </div>
          <button type="button" className="nav-sheet-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        {loadingStations && stations.length === 0 && (
          <p className="panel-meta">Loading stations…</p>
        )}

        <div className="trip-endpoints">
          <label className="trip-endpoint">
            <span className="trip-endpoint-marker trip-endpoint-marker--from" aria-hidden />
            <span className="trip-endpoint-field">
              <span className="trip-planner-label">From</span>
              <select
                className="trip-planner-select"
                value={fromKey}
                onChange={(e) => {
                  setFromKey(e.target.value);
                  setPreview(null);
                }}
              >
                <option value="">Choose station…</option>
                <optgroup label="Subway">
                  {mtaStations.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="NJ Rail">
                  {njStations.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </span>
          </label>
          <div className="trip-endpoints-connector" aria-hidden />
          <label className="trip-endpoint">
            <span className="trip-endpoint-marker trip-endpoint-marker--to" aria-hidden />
            <span className="trip-endpoint-field">
              <span className="trip-planner-label">To</span>
              <select
                className="trip-planner-select"
                value={toKey}
                onChange={(e) => {
                  setToKey(e.target.value);
                  setPreview(null);
                }}
              >
                <option value="">Choose station…</option>
                <optgroup label="Subway">
                  {mtaStations.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="NJ Rail">
                  {njStations.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </span>
          </label>
          <button type="button" className="trip-planner-swap trip-endpoints-swap" title="Swap" aria-label="Swap" onClick={swap}>
            ⇅
          </button>
        </div>

        {error && <p className="panel-error">{error}</p>}

        {preview && (
          <div className="nav-sheet-preview">
            <p className="nav-sheet-preview-title">Directions</p>
            <TripTimeline steps={preview.steps} />
          </div>
        )}

        <div className="nav-sheet-footer">
          {!preview ? (
            <button
              type="button"
              className="nav-sheet-primary"
              disabled={planning || !fromKey || !toKey}
              onClick={() => void buildPreview()}
            >
              {planning ? "Finding route…" : "Get directions"}
            </button>
          ) : (
            <button type="button" className="nav-sheet-primary" onClick={startTrip}>
              Start trip
            </button>
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
