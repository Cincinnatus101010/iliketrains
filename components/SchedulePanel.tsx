"use client";

import { useEffect, useMemo, useState } from "react";
import { useSteddy } from "steddy";
import { Typography } from "@iantroisi/ui";
import { fetchStationScheduleClient } from "@/lib/fetchSchedule";
import { formatNjDateTime } from "@/lib/formatTime";
import { parseLineKey, type LineKey } from "@/lib/lineKey";
import { lineName } from "@/lib/nj/lines";
import type { NjStation } from "@/lib/types";

type SchedulePanelProps = {
  activeLine: LineKey | null;
};

const DEFAULT_STATION = "NP";

export function SchedulePanel({ activeLine }: SchedulePanelProps) {
  const [stations, setStations] = useState<NjStation[]>([]);
  const [stationCode, setStationCode] = useState(DEFAULT_STATION);
  const [loadError, setLoadError] = useState<string | null>(null);

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
    () => ["schedule", stationCode, activeLine ?? ""] as const,
    [stationCode, activeLine],
  );

  const { data, error, isLoading, isValidating } = useSteddy(scheduleKey, fetchStationScheduleClient, {
    staleTime: 60_000,
  });

  const njRouteFilter = useMemo(() => {
    const parsed = parseLineKey(activeLine);
    if (!parsed || parsed.network !== "njt") return null;
    return parsed.route;
  }, [activeLine]);

  const items = useMemo(() => {
    const list = data?.items ?? [];
    if (!njRouteFilter) return list;
    return list.filter((i) => i.lineAbbrev.toUpperCase() === njRouteFilter.toUpperCase());
  }, [data?.items, njRouteFilter]);

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

      <p className="panel-meta">
        Next {items.length} departures
        {data?.stationName ? ` · ${data.stationName}` : ""}
        {isValidating ? " · updating…" : ""}
      </p>

      {Boolean(loadError || data?.error || error) && (
        <p className="panel-error">
          {loadError ?? data?.error ?? (error instanceof Error ? error.message : error ? String(error) : "")}
        </p>
      )}

      <ul className="schedule-list" aria-label="Departures">
        {isLoading && items.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">Loading schedule…</Typography>
          </li>
        )}
        {items.map((item) => (
          <li key={`${item.trainId}-${item.scheduledAt}`}>
            <div className="schedule-row">
              <div className="schedule-row-time">
                <span className="schedule-time">{formatNjDateTime(item.scheduledAt)}</span>
                <span className="schedule-status">{item.status}</span>
              </div>
              <div className="schedule-row-body">
                <span className="schedule-dest">{item.destination}</span>
                <span className="schedule-line">
                  {item.lineAbbrev ? lineName(item.lineAbbrev) : item.line}
                  {item.trainId ? ` · #${item.trainId}` : ""}
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
