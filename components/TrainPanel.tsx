"use client";

import { Button, Typography } from "@iantroisi/ui";
import { lineName } from "@/lib/nj/lines";
import type { NjTrain } from "@/lib/types";

type TrainPanelProps = {
  trains: NjTrain[];
  loading: boolean;
  validating: boolean;
  updatedAt?: string;
  activeLine: string | null;
  onRefresh: () => void;
};

export function TrainPanel({
  trains,
  loading,
  validating,
  updatedAt,
  activeLine,
  onRefresh,
}: TrainPanelProps) {
  const filtered = activeLine ? trains.filter((t) => t.route === activeLine) : trains;
  const sorted = [...filtered].sort((a, b) => a.route.localeCompare(b.route) || a.label.localeCompare(b.label));

  return (
    <div className="train-panel-inner">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Live</p>
          <h2 className="panel-title">{activeLine ? lineName(activeLine) : "All trains"}</h2>
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
                <span className="train-row-line">{lineName(train.route)}</span>
                <span className="train-row-stop">{train.label}</span>
                <span className="train-row-sub">
                  {train.trainNumber ? `Train ${train.trainNumber}` : train.status}
                </span>
              </div>
              <span className="train-row-code">{train.route}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
