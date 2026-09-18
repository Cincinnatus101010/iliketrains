"use client";

import { Typography } from "@iantroisi/ui";
import { useEffect, useMemo, useState } from "react";
import { useSteddy } from "steddy";
import { fetchStationScheduleClient } from "@/lib/fetchSchedule";
import { formatNjDateTime } from "@/lib/formatTime";
import { lineName } from "@/lib/nj/lines";
import { filterDeparturesForFirstLeg } from "@/lib/trip/filterDepartures";
import { firstRideStep } from "@/lib/trip/firstRideStep";
import { resolveNjStationCodeForTrip } from "@/lib/trip/resolveNjStation";
import type { PlannedRoute } from "@/lib/trip/types";
import type { NjStation, ScheduleDeparture } from "@/lib/types";

type TripDeparturePickerProps = {
  fromKey: string;
  fromName: string;
  route: PlannedRoute;
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
  selected,
  onSelect,
  onDeparturesLoaded,
}: TripDeparturePickerProps) {
  const [stations, setStations] = useState<NjStation[]>([]);

  useEffect(() => {
    void fetch("/api/stations")
      .then((r) => r.json())
      .then((body: { stations: NjStation[] }) => setStations(body.stations ?? []))
      .catch(() => setStations([]));
  }, []);

  const stationCode = useMemo(
    () => resolveNjStationCodeForTrip(fromKey, fromName, stations),
    [fromKey, fromName, stations],
  );

  const firstLeg = firstRideStep(route);
  const lineCode = firstLeg?.route ?? "";

  const scheduleKey = useMemo(
    () =>
      stationCode && lineCode ? (["trip-schedule", stationCode, lineCode, fromKey] as const) : null,
    [stationCode, lineCode, fromKey],
  );

  const { data, error, isLoading, isValidating } = useSteddy(
    scheduleKey ?? (["trip-schedule", "idle", "", ""] as const),
    fetchStationScheduleClient,
    { staleTime: 60_000 },
  );

  const items = useMemo(() => {
    const list = data?.items ?? [];
    if (!firstLeg) return list;
    return filterDeparturesForFirstLeg(list, firstLeg);
  }, [data?.items, firstLeg]);

  useEffect(() => {
    if (!stationCode || isLoading) return;
    onDeparturesLoaded?.(items.length > 0);
  }, [stationCode, isLoading, items.length, onDeparturesLoaded]);

  if (!stationCode) {
    return (
      <p className="trip-departure-hint">
        {stations.length === 0
          ? "Loading station list…"
          : "Could not match this stop to NJ schedule data."}
      </p>
    );
  }

  if (!firstLeg || !lineCode) {
    return (
      <p className="trip-departure-hint">
        No rail departure list for this route — you can still start and use live map data.
      </p>
    );
  }

  return (
    <div className="trip-departure-picker">
      <p className="nav-sheet-preview-title">Pick a departure</p>
      <p className="trip-departure-sub">
        {lineName(lineCode)} from {data?.stationName ?? stationCode}
        {isValidating ? " · updating…" : ""}
      </p>

      {error != null && (
        <p className="panel-error">{error instanceof Error ? error.message : String(error)}</p>
      )}
      {data?.error && <p className="panel-error">{data.error}</p>}

      <ul className="trip-departure-list" aria-label="Choose a departure">
        {isLoading && items.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">Loading schedule…</Typography>
          </li>
        )}
        {!isLoading && items.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">No upcoming departures for this line.</Typography>
          </li>
        )}
        {items.slice(0, 24).map((item) => {
          const key = departureKey(item);
          const isOn = selected ? departureKey(selected) === key : false;
          return (
            <li key={key}>
              <button
                type="button"
                className={`trip-departure-option ${isOn ? "trip-departure-option--on" : ""}`}
                aria-pressed={isOn}
                onClick={() => onSelect(item)}
              >
                <span className="trip-departure-option-time">
                  {formatNjDateTime(item.scheduledAt)}
                </span>
                <span className="trip-departure-option-body">
                  <span className="trip-departure-option-dest">{item.destination}</span>
                  <span className="trip-departure-option-meta">
                    Train #{item.trainId}
                    {item.status ? ` · ${item.status}` : ""}
                  </span>
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
