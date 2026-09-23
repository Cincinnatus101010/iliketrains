"use client";

import { Typography } from "@iantroisi/ui";
import { useEffect, useMemo } from "react";
import { formatNjScheduleDeparture } from "@/lib/formatTime";
import { lineName } from "@/lib/nj/lines";
import { boardingDepartureKind, boardingDepartureKindLabel } from "@/lib/trip/filterDepartures";
import type { PlannedRoute, ScheduleDeparture, TripBoardingSchedule } from "@/types";

type TripDeparturePickerProps = {
  fromKey: string;
  fromName: string;
  route: PlannedRoute;
  boarding: TripBoardingSchedule | null;
  loading?: boolean;
  selected: ScheduleDeparture | null;
  onSelect: (item: ScheduleDeparture) => void;
  onDeparturesLoaded?: (hasChoices: boolean) => void;
};

function departureKey(item: ScheduleDeparture): string {
  return `${item.trainId}-${item.scheduledAt}`;
}

export function TripDeparturePicker({
  fromKey,
  fromName,
  route,
  boarding,
  loading = false,
  selected,
  onSelect,
  onDeparturesLoaded,
}: TripDeparturePickerProps) {
  const items = useMemo(() => {
    const raw = boarding?.departures ?? [];
    return [...raw].sort((a, b) => {
      const ka = boardingDepartureKind(route, a);
      const kb = boardingDepartureKind(route, b);
      if (ka === kb) return 0;
      return ka === "direct" ? -1 : 1;
    });
  }, [boarding?.departures, route]);
  const lineCode = boarding?.lineCode ?? "";
  const tripNeedsTransfer = (route.stats?.transferCount ?? 0) > 0;
  const boardName = boarding?.boarding.stationName ?? fromName;
  const boardsAtFrom = boarding?.boarding.stationKey === fromKey;

  useEffect(() => {
    if (loading || !boarding) return;
    onDeparturesLoaded?.(items.length > 0);
  }, [boarding, items.length, loading, onDeparturesLoaded]);

  if (!boarding?.boarding || !lineCode) {
    return (
      <p className="trip-departure-hint">
        No rail departure list for this route — you can still start and use live map data.
      </p>
    );
  }

  if (boarding.stationCode == null && !loading) {
    return (
      <p className="trip-departure-hint">{boarding.scheduleError ?? "Schedule unavailable."}</p>
    );
  }

  return (
    <div className="trip-departure-picker">
      <p className="nav-sheet-preview-title">Pick a departure</p>
      <p className="trip-departure-sub">
        {lineName(lineCode)} · {boarding.stationName || boardName}
      </p>
      <p className="trip-departure-arrival-hint">
        {boardsAtFrom
          ? tripNeedsTransfer
            ? `Trains at ${boardName} — direct to your destination or with the transfer shown above.`
            : `Trains at ${boardName} that serve your trip — scheduled time and track.`
          : `First train boards at ${boardName} (~${fromName} is your trip start).`}
      </p>

      {boarding.scheduleError && <p className="panel-error">{boarding.scheduleError}</p>}

      <ul className="trip-departure-list" aria-label="Choose a departure">
        {loading && items.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">Loading schedule…</Typography>
          </li>
        )}
        {!loading && items.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">No upcoming departures for this stop and line.</Typography>
          </li>
        )}
        {items.map((item) => {
          const key = departureKey(item);
          const isOn = selected ? departureKey(selected) === key : false;
          const kind = boardingDepartureKind(route, item);
          const kindLabel = boardingDepartureKindLabel(kind, route);
          return (
            <li key={key}>
              <button
                type="button"
                className={`trip-departure-option ${isOn ? "trip-departure-option--on" : ""}`}
                aria-pressed={isOn}
                onClick={() => onSelect(item)}
              >
                <span className="trip-departure-option-time">
                  {formatNjScheduleDeparture(item.scheduledAt)}
                </span>
                <span className="trip-departure-option-body">
                  <span className="trip-departure-option-dest-row">
                    <span className="trip-departure-option-dest">{item.destination}</span>
                    {tripNeedsTransfer && (
                      <span
                        className={`trip-departure-option-tag trip-departure-option-tag--${kind}`}
                      >
                        {kindLabel}
                      </span>
                    )}
                  </span>
                  <span className="trip-departure-option-meta">{`Train #${item.trainId}`}</span>
                </span>
                <span className="trip-departure-option-track">
                  {item.track ? `Trk ${item.track}` : "—"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
