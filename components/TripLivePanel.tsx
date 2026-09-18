"use client";

import type { LineKey } from "@/lib/lineKey";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import { ensureRouteStats, tripStatsHeadline } from "@/lib/trip/tripStats";
import type { LiveTrain } from "@/lib/types";
import { TrainListRow } from "./TrainListRow";
import { TripTimeline } from "./TripTimeline";

type TripLivePanelProps = {
  trip: SavedTrip;
  trains: LiveTrain[];
  activeLine: LineKey | null;
  followedTrainId: string | null;
  onFollowTrain: (trainId: string) => void;
};

export function TripLivePanel({
  trip,
  trains,
  activeLine,
  followedTrainId,
  onFollowTrain,
}: TripLivePanelProps) {
  const route = ensureRouteStats(trip.route);
  const onRoute = trains.filter((t) => trainMatchesTrip(t, trip));
  const sorted = [...onRoute].sort(
    (a, b) =>
      a.network.localeCompare(b.network) ||
      a.route.localeCompare(b.route) ||
      a.label.localeCompare(b.label),
  );

  return (
    <div className="train-panel-inner train-panel-inner--bottom">
      <header className="panel-head">
        <div>
          <p className="panel-kicker">Active trip</p>
          <h2 className="panel-title">
            {trip.fromName} → {trip.toName}
          </h2>
        </div>
      </header>
      <p className="panel-meta">
        {route.stats ? tripStatsHeadline(route.stats) : `${route.stopCount} stops`}
        {" · "}
        {sorted.length} live now
        {activeLine ? " · line filter on" : ""}
      </p>
      <div className="trip-live-route">
        <TripTimeline steps={route.steps} compact />
      </div>
      <p className="panel-kicker trip-live-trains-label">On your route now</p>
      <ul className="train-list" aria-label="Live trains on trip">
        {sorted.length === 0 && (
          <li className="train-list-empty">
            <p className="trip-live-empty">No live trains on these lines right now.</p>
          </li>
        )}
        {sorted.slice(0, 40).map((train) => (
          <li key={train.id}>
            <TrainListRow
              train={train}
              highlight
              following={followedTrainId === train.id}
              onFollow={onFollowTrain}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
