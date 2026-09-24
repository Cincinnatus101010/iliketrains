"use client";

import { formatNjDateTime } from "@/lib/formatTime";
import type { LineKey } from "@/lib/lineKey";
import { isEnRouteToBoarding } from "@/lib/trip/boardingArrival";
import { njTrainIdsMatch } from "@/lib/trip/chosenDepartureLiveMatch";
import type { IncomingTrainMapHint } from "@/lib/trip/incomingTrainMapHint";
import { routeStepsForDisplay } from "@/lib/trip/routeDisplaySteps";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { tripSummaryLabel } from "@/lib/trip/savedTrip";
import { trackingTrainIdForTrip } from "@/lib/trip/tracking";
import { tripBoardingContext } from "@/lib/trip/tripBoarding";
import { trainMatchesTrip } from "@/lib/trip/tripLines";
import { ensureRouteStats, tripConnectionLabel } from "@/lib/trip/tripStats";
import type { LiveTrain } from "@/types";
import { TrainFollowBlock } from "./TrainFollowBlock";
import { TrainListRow } from "./TrainListRow";
import { TripIncomingBlock } from "./TripIncomingBlock";
import { TripTimeline } from "./TripTimeline";

type TripLivePanelProps = {
  trip: SavedTrip;
  trains: LiveTrain[];
  activeLine: LineKey | null;
  trackedTrain: LiveTrain | null;
  incomingTrain: IncomingTrainMapHint | null;
  onTrackTrain: (trainId: string) => void;
  onEditTrip: () => void;
  onEndTrip: () => void;
  onStopTracking: () => void;
};

export function TripLivePanel({
  trip,
  trains,
  activeLine,
  trackedTrain: trackedTrainLive,
  incomingTrain: incoming,
  onTrackTrain,
  onEditTrip,
  onEndTrip,
  onStopTracking,
}: TripLivePanelProps) {
  const trackingTrainId = trackingTrainIdForTrip(trip);
  const route = ensureRouteStats(trip.route);
  const connection = tripConnectionLabel(route);
  const displaySteps = routeStepsForDisplay(route.steps);
  const onRoute = trains.filter((t) => trainMatchesTrip(t, trip));
  const sorted = [...onRoute].sort(
    (a, b) =>
      a.network.localeCompare(b.network) ||
      a.route.localeCompare(b.route) ||
      a.label.localeCompare(b.label),
  );

  const trackedTrain = trackingTrainId && trackedTrainLive ? trackedTrainLive : null;
  const depTrainId = trip.chosenDeparture?.trainId?.trim();
  const matchesTracked = (t: LiveTrain) =>
    Boolean(
      trackedTrain &&
        (t.id === trackedTrain.id ||
          (depTrainId && njTrainIdsMatch(depTrainId, t)) ||
          (trackingTrainId && njTrainIdsMatch(trackingTrainId.replace(/^njt-/i, ""), t))),
    );

  let listTrains: LiveTrain[];
  if (trackedTrain) {
    listTrains = [trackedTrain];
  } else if (trackingTrainId) {
    listTrains = sorted.filter(
      (t) =>
        t.id === trackingTrainId ||
        (depTrainId && njTrainIdsMatch(depTrainId, t)) ||
        njTrainIdsMatch(trackingTrainId.replace(/^njt-/i, ""), t),
    );
  } else {
    listTrains = sorted;
  }

  const showIncomingSchedule = Boolean(incoming && trip.chosenDeparture && !trackedTrain);

  const boardingName = tripBoardingContext(trip.route, trip.fromName)?.stationName ?? trip.fromName;
  const enRouteToBoarding = Boolean(
    trackedTrain && trip.chosenDeparture && isEnRouteToBoarding(trackedTrain, boardingName),
  );
  return (
    <div className="train-panel-inner train-panel-inner--bottom">
      <div className="trip-dock-head">
        <button
          type="button"
          className="trip-dock-action trip-dock-action--end"
          onClick={onEndTrip}
        >
          End trip
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
          {connection !== "Direct" && <p className="trip-dock-transfer">{connection}</p>}
          {route.stats && (
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

      {showIncomingSchedule && incoming && (
        <TripIncomingBlock incoming={incoming} departure={trip.chosenDeparture!} />
      )}

      {trackedTrain && (
        <TrainFollowBlock
          train={trackedTrain}
          onStopTracking={onStopTracking}
          throughStopName={enRouteToBoarding ? boardingName : null}
          kicker={
            enRouteToBoarding
              ? `Train ${trip.chosenDeparture?.trainId ?? trackedTrain.label} · live · toward ${boardingName}`
              : "Live on NJ feed"
          }
        />
      )}

      <p className="panel-meta trip-dock-live-meta">
        {showIncomingSchedule
          ? "Scheduled — map and stop list update from your departure time"
          : trackedTrain
            ? enRouteToBoarding
              ? "Live GPS on map · stop list updates each feed poll"
              : "Following your train · live on NJ feed"
            : trackingTrainId
              ? "Waiting for your train on the live feed"
              : `${sorted.length} live on your route${activeLine ? " · line filter on" : ""}`}
      </p>

      <div className="trip-live-route">
        <TripTimeline steps={displaySteps} compact={Boolean(trackingTrainId)} />
      </div>

      <p className="panel-kicker trip-live-trains-label">
        {trackingTrainId ? "Your train" : "On your route now"}
      </p>
      <ul className="train-list" aria-label="Live trains on trip">
        {listTrains.length === 0 && !showIncomingSchedule && (
          <li className="train-list-empty">
            <p className="trip-live-empty">
              {trackingTrainId
                ? "Your train isn’t on the live feed yet."
                : "No live trains on these lines right now."}
            </p>
          </li>
        )}
        {listTrains.slice(0, 40).map((train) => (
          <li key={train.id}>
            <TrainListRow
              train={train}
              highlight
              tracking={matchesTracked(train)}
              onTrack={onTrackTrain}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
