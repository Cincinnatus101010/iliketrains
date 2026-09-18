"use client";

import { Button, Typography } from "@iantroisi/ui";
import { type LineKey, parseLineKey, trainMatchesLineKey } from "@/lib/lineKey";
import { subwayLineName } from "@/lib/mta/lines";
import { lineName as njLineName } from "@/lib/nj/lines";
import type { LiveTrain } from "@/lib/types";
import { TrainListRow } from "./TrainListRow";

type TrainPanelProps = {
  trains: LiveTrain[];
  loading: boolean;
  validating: boolean;
  updatedAt?: string;
  activeLine: LineKey | null;
  onRefresh: () => void;
  highlightTrainIds?: Set<string>;
  followedTrainId?: string | null;
  onFollowTrain?: (trainId: string) => void;
};

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
  highlightTrainIds,
  followedTrainId,
  onFollowTrain,
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
            <TrainListRow
              train={train}
              highlight={highlightTrainIds?.has(train.id)}
              following={followedTrainId === train.id}
              onFollow={onFollowTrain}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
