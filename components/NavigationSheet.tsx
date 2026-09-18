"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@iantroisi/ui";
import { loadTripGraph, listPlanStations } from "@/lib/trip/loadGraph";
import { planTrip } from "@/lib/trip/planTrip";
import type { PlannedRoute } from "@/lib/trip/types";

type NavigationSheetProps = {
  open: boolean;
  onClose: () => void;
  onRoute: (route: PlannedRoute) => void;
  onClearRoute: () => void;
};

export function NavigationSheet({ open, onClose, onRoute, onClearRoute }: NavigationSheetProps) {
  const [stations, setStations] = useState<{ key: string; name: string; network: "mta" | "njt" }[]>(
    [],
  );
  const [fromKey, setFromKey] = useState("");
  const [toKey, setToKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [planned, setPlanned] = useState<PlannedRoute | null>(null);
  const [loadingStations, setLoadingStations] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoadingStations(true);
    void listPlanStations()
      .then(setStations)
      .finally(() => setLoadingStations(false));
  }, [open]);

  const mtaStations = useMemo(() => stations.filter((s) => s.network === "mta"), [stations]);
  const njStations = useMemo(() => stations.filter((s) => s.network === "njt"), [stations]);

  if (!open) return null;

  const swap = () => {
    setFromKey(toKey);
    setToKey(fromKey);
  };

  const showRoute = async () => {
    setError(null);
    setPlanned(null);
    if (!fromKey || !toKey) {
      setError("Choose both a from and to station.");
      return;
    }

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

    setPlanned(route);
    onRoute(route);
  };

  const clear = () => {
    setPlanned(null);
    setError(null);
    setFromKey("");
    setToKey("");
    onClearRoute();
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
            <h2 className="panel-title">Plan a trip</h2>
          </div>
          <button type="button" className="nav-sheet-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </header>

        {loadingStations && stations.length === 0 && (
          <p className="panel-meta">Loading stations…</p>
        )}

        <div className="trip-planner-row">
          <label className="trip-planner-field">
            <span className="trip-planner-label">From</span>
            <select
              className="trip-planner-select"
              value={fromKey}
              onChange={(e) => setFromKey(e.target.value)}
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
          </label>
          <button type="button" className="trip-planner-swap" title="Swap" aria-label="Swap" onClick={swap}>
            ⇅
          </button>
          <label className="trip-planner-field">
            <span className="trip-planner-label">To</span>
            <select
              className="trip-planner-select"
              value={toKey}
              onChange={(e) => setToKey(e.target.value)}
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
          </label>
        </div>

        <div className="trip-planner-actions">
          <Button size="sm" onClick={() => void showRoute()}>
            Show route
          </Button>
          {(planned || fromKey || toKey) && (
            <Button size="sm" variant="ghost" onClick={clear}>
              Clear
            </Button>
          )}
        </div>

        {error && <p className="panel-error">{error}</p>}

        {planned && (
          <ol className="trip-steps">
            {planned.steps.map((step, i) => (
              <li key={`${step.kind}-${i}`} className={`trip-step trip-step--${step.kind}`}>
                {step.kind === "ride" && step.route ? (
                  <span className="trip-step-badge" style={{ background: step.color ?? "#333" }}>
                    {step.route}
                  </span>
                ) : (
                  <span className="trip-step-badge trip-step-badge--walk">Walk</span>
                )}
                <span className="trip-step-text">
                  {step.fromName}
                  {step.fromName !== step.toName ? ` → ${step.toName}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
