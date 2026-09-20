"use client";

import { formatNjDateTime } from "@/lib/formatTime";
import type { LineKey } from "@/lib/lineKey";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { tripSummaryLabel } from "@/lib/trip/savedTrip";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import { ensureRouteStats } from "@/lib/trip/tripStats";
import type { LiveTrain } from "@/lib/types";
import { FollowStopList } from "./FollowStopList";
import { TrainListRow } from "./TrainListRow";
import { TripTimeline } from "./TripTimeline";
import { useFollowUpcomingStops } from "./useFollowUpcomingStops";

type TripLivePanelProps = {
  trip: SavedTrip;
  trains: LiveTrain[];
  activeLine: LineKey | null;
  followedTrainId: string | null;
  onFollowTrain: (trainId: string) => void;
  onEditTrip: () => void;
  onEndTrip: () => void;
};

export function TripLivePanel({
  trip,
  trains,
  activeLine,
  followedTrainId,
  onFollowTrain,
  onEditTrip,
  onEndTrip,
}: TripLivePanelProps) {
  const route = ensureRouteStats(trip.route);
  const onRoute = trains.filter((t) => trainMatchesTrip(t, trip));
  const sorted = [...onRoute].sort(
    (a, b) =>
      a.network.localeCompare(b.network) ||
      a.route.localeCompare(b.route) ||
      a.label.localeCompare(b.label),
  );

  const listTrains = followedTrainId ? sorted.filter((t) => t.id === followedTrainId) : sorted;

  const followedTrain = followedTrainId ? (listTrains[0] ?? null) : null;
  const upcoming = useFollowUpcomingStops(followedTrain);

  return (
    <div className="train-panel-inner train-panel-inner--bottom">
      <div className="trip-dock-head">
        <button
          type="button"
          className="trip-dock-action trip-dock-action--end"
          onClick={onEndTrip}
        >
          End
        </button>
        <div className="trip-dock-head-body">
          <p className="panel-kicker">Active trip</p>
          <h2 className="panel-title">{trip.toName}</h2>
          <p className="panel-meta">
            from {trip.fromName} · {tripSummaryLabel(trip)}
            {trip.chosenDeparture
              ? ` · dep ${formatNjDateTime(trip.chosenDeparture.scheduledAt)}`
              : ""}
          </p>
          {route.stats && !followedTrainId && (
            <p className="trip-dock-lines">{route.stats.lines.map((l) => l.label).join(" · ")}</p>
          )}
        </div>
        <button
          type="button"
          className="trip-dock-action"
          onClick={onEditTrip}
          aria-label="Edit trip"
        >
          Edit
        </button>
      </div>

      <p className="panel-meta trip-dock-live-meta">
        {followedTrainId
          ? "Following your train"
          : `${sorted.length} live on your route${activeLine ? " · line filter on" : ""}`}
      </p>

      {!followedTrainId && (
        <div className="trip-live-route">
          <TripTimeline steps={route.steps} compact />
        </div>
      )}

      {followedTrain && upcoming.length > 0 && (
        <div className="trip-follow-stops">
          <FollowStopList stops={upcoming} />
        </div>
      )}

      <p className="panel-kicker trip-live-trains-label">
        {followedTrainId ? "Your train" : "On your route now"}
      </p>
      <ul className="train-list" aria-label="Live trains on trip">
        {listTrains.length === 0 && (
          <li className="train-list-empty">
            <p className="trip-live-empty">
              {followedTrainId
                ? "Your train isn’t on the map right now."
                : "No live trains on these lines right now."}
            </p>
          </li>
        )}
        {listTrains.slice(0, 40).map((train) => (
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
