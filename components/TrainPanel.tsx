"use client";

import { Button, Typography } from "@iantroisi/ui";
import { displayLineName } from "@/lib/displayLine";
import { formatNjDateTime } from "@/lib/formatTime";
import { parseLineKey, trainMatchesLineKey, type LineKey } from "@/lib/lineKey";
import { lineName as njLineName } from "@/lib/nj/lines";
import { subwayLineName } from "@/lib/mta/lines";
import type { LiveTrain } from "@/lib/types";

type TrainPanelProps = {
  trains: LiveTrain[];
  loading: boolean;
  validating: boolean;
  updatedAt?: string;
  activeLine: LineKey | null;
  onRefresh: () => void;
};

function njAtStation(train: LiveTrain): boolean {
  if (!train.stopName) return false;
  if (train.platformTrack) return true;
  return !train.inMotion;
}

function njPrimaryLine(train: LiveTrain): string {
  const station = train.stopName;
  if (train.platformTrack && station) {
    return `Track ${train.platformTrack} · ${station}`;
  }
  if (station && njAtStation(train)) {
    return `At ${station}`;
  }
  const dir = train.direction ? `${train.direction} · ` : "";
  return station ? `${dir}Next ${station}` : train.label;
}

function njSubLine(train: LiveTrain): string {
  const parts: string[] = [train.status];
  if (!train.platformTrack && train.trackCircuit) {
    parts.push(`Circuit ${train.trackCircuit}`);
  }
  if (train.scheduledDeparture) {
    parts.push(`Dep ${formatNjDateTime(train.scheduledDeparture)}`);
  }
  if (train.trainNumber) parts.push(`#${train.trainNumber}`);
  return parts.join(" · ");
}

function panelTitle(activeLine: LineKey | null): string {
  const parsed = parseLineKey(activeLine);
  if (!parsed) return "All trains";
  if (parsed.network === "mta") return subwayLineName(parsed.route);
  return njLineName(parsed.route);
}

export function TrainPanel({
  trains,
  loading,
  validating,
  updatedAt,
  activeLine,
  onRefresh,
}: TrainPanelProps) {
  const filtered = trains.filter((t) => trainMatchesLineKey(t, activeLine));
  const sorted = [...filtered].sort(
    (a, b) =>
      a.network.localeCompare(b.network) ||
      a.route.localeCompare(b.route) ||
      a.label.localeCompare(b.label),
  );

  return (
    <div className="train-panel-inner train-panel-inner--bottom">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Live</p>
          <h2 className="panel-title">{panelTitle(activeLine)}</h2>
        </div>
        <Button size="sm" variant="ghost" onClick={onRefresh} disabled={loading}>
          {validating ? "…" : "Sync"}
        </Button>
      </header>
      <p className="panel-meta">
        {sorted.length} active · {updatedAt ? new Date(updatedAt).toLocaleTimeString() : "—"}
      </p>
      <ul className="train-list" aria-label="Live trains">
        {loading && sorted.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">Loading…</Typography>
          </li>
        )}
        {!loading && sorted.length === 0 && (
          <li className="train-list-empty">
            <Typography tone="muted">Nothing on this line right now.</Typography>
          </li>
        )}
        {sorted.slice(0, 60).map((train) => (
          <li key={train.id}>
            <div className="train-row">
              <span className="train-row-rail" style={{ background: train.color }} aria-hidden />
              <div className="train-row-body">
                <span className="train-row-line">
                  {displayLineName(train)}
                  <span className="train-row-network">{train.network === "mta" ? "NY" : "NJ"}</span>
                </span>
                <span className="train-row-stop">
                  {train.network === "mta" ? train.label : njPrimaryLine(train)}
                </span>
                <span className="train-row-sub">
                  {train.network === "mta" ? train.status : njSubLine(train)}
                </span>
              </div>
              <div className="train-row-aside">
                {train.network === "njt" && train.platformTrack && (
                  <span className="train-row-track" title="Platform track">
                    Trk {train.platformTrack}
                  </span>
                )}
                <span className="train-row-code">{train.route}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
