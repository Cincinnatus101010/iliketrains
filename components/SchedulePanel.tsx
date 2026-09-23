"use client";

import { Typography } from "@iantroisi/ui";
import { useEffect, useMemo, useState } from "react";
import { useSteddy } from "steddy";
import { fetchStationScheduleClient } from "@/lib/fetchSchedule";
import { formatNjScheduleDeparture } from "@/lib/formatTime";
import { type LineKey, parseLineKey } from "@/lib/lineKey";
import { NJ_LINES } from "@/lib/nj/lines";
import type { NjStation } from "@/types";

type SchedulePanelProps = {
  activeLine: LineKey | null;
  defaultStationCode?: string | null;
};

const DEFAULT_STATION = "NP";

export function SchedulePanel({ activeLine, defaultStationCode }: SchedulePanelProps) {
  const [stations, setStations] = useState<NjStation[]>([]);
  const [stationCode, setStationCode] = useState(defaultStationCode ?? DEFAULT_STATION);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeFilter, setRouteFilter] = useState("");

  useEffect(() => {
    if (defaultStationCode) setStationCode(defaultStationCode);
  }, [defaultStationCode]);

  useEffect(() => {
    const parsed = parseLineKey(activeLine);
    if (parsed?.network === "njt") setRouteFilter(parsed.route);
  }, [activeLine]);

  useEffect(() => {
    void fetch("/api/stations")
      .then((r) => r.json())
      .then((body: { stations: NjStation[]; error: string | null }) => {
        if (body.error) setLoadError(body.error);
        setStations(body.stations ?? []);
      })
      .catch(() => setLoadError("Could not load stations"));
  }, []);

  const scheduleKey = useMemo(
    () => ["schedule", stationCode, routeFilter] as const,
    [stationCode, routeFilter],
  );

  const { data, error, isLoading, isValidating } = useSteddy(
    scheduleKey,
    fetchStationScheduleClient,
    {
      staleTime: routeFilter ? 30 * 60_000 : 60_000,
    },
  );

  const items = data?.items ?? [];
  const routeLabel = routeFilter
    ? (NJ_LINES.find((l) => l.id === routeFilter)?.name ?? routeFilter)
    : null;

  return (
    <div className="train-panel-inner">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Departures</p>
          <h2 className="panel-title">Station schedule</h2>
        </div>
      </header>

      <label className="schedule-station-field">
        <span className="schedule-station-label">Station</span>
        <select
          className="schedule-station-select"
          value={stationCode}
          onChange={(e) => setStationCode(e.target.value)}
        >
          {stations.length === 0 && <option value={DEFAULT_STATION}>Newark Penn (NP)</option>}
          {stations.map((s) => (
            <option key={s.code} value={s.code}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </label>

      <label className="schedule-station-field">
        <span className="schedule-station-label">Line</span>
        <select
          className="schedule-station-select"
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
        >
          <option value="">All lines (next 19 departures)</option>
          {NJ_LINES.map((line) => (
            <option key={line.id} value={line.id}>
              {line.name} ({line.id})
            </option>
          ))}
        </select>
      </label>

      <p className="panel-meta">
        {routeFilter
          ? `${items.length} upcoming ${routeLabel} departures`
          : `Next ${items.length} departures`}
        {data?.stationName ? ` · ${data.stationName}` : ""}
        {isValidating ? " · updating…" : ""}
      </p>

      {Boolean(loadError || data?.error || error) && (
        <p className="panel-error">
          {loadError ??
            data?.error ??
            (error instanceof Error ? error.message : error ? String(error) : "")}
        </p>
      )}

      <ul className="schedule-list" aria-label="Departures">
        {isLoading && items.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">Loading schedule…</Typography>
          </li>
        )}
        {!isLoading && items.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">
              {routeFilter
                ? "No upcoming departures for this line at this station."
                : "No departures returned."}
            </Typography>
          </li>
        )}
        {items.map((item) => (
          <li key={`${item.trainId}-${item.scheduledAt}`}>
            <div className="schedule-row">
              <div className="schedule-row-time">
                <span className="schedule-time">{formatNjScheduleDeparture(item.scheduledAt)}</span>
                <span className="schedule-status">{item.status}</span>
              </div>
              <div className="schedule-row-body">
                <span className="schedule-dest">{item.destination}</span>
                <span className="schedule-line">
                  {routeFilter ? `#${item.trainId}` : item.lineAbbrev || item.line}
                  {!routeFilter && item.trainId ? ` · #${item.trainId}` : ""}
                </span>
              </div>
              <div className="schedule-track" title="Platform track">
                {item.track ? `Trk ${item.track}` : "—"}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
