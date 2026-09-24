"use client";

import { FollowStopList } from "@/components/FollowStopList";
import { useIncomingUpcomingStops } from "@/hooks/useIncomingUpcomingStops";
import { useMinuteClock } from "@/hooks/useMinuteClock";
import { formatNjScheduleDeparture } from "@/lib/formatTime";
import { formatMinutesUntilBoarding } from "@/lib/trip/chosenDepartureEta";
import type { IncomingTrainMapHint } from "@/lib/trip/incomingTrainMapHint";
import type { ScheduleDeparture } from "@/types";

type TripIncomingBlockProps = {
  incoming: IncomingTrainMapHint;
  departure: ScheduleDeparture;
};

export function TripIncomingBlock({ incoming, departure }: TripIncomingBlockProps) {
  const nowMs = useMinuteClock(true);
  const scheduled = formatNjScheduleDeparture(departure.scheduledAt);
  const minutesUntilLabel = formatMinutesUntilBoarding(departure, nowMs);
  const delay =
    departure.secLate > 0
      ? `${Math.round(departure.secLate / 60)} min late`
      : departure.status?.trim() || "On schedule";

  const upcoming = useIncomingUpcomingStops(incoming, departure);

  return (
    <div className="trip-incoming-block" role="status" aria-live="polite">
      <div className="trip-incoming-block-head">
        <div className="trip-incoming-block-body">
          <span className="panel-kicker">Your train · scheduled (position from timetable)</span>
          <p className="trip-incoming-block-eta">
            {minutesUntilLabel === "Boarding now"
              ? `At ${incoming.boardingStationName} now`
              : `${minutesUntilLabel} until ${incoming.boardingStationName}`}
          </p>
          <p className="trip-incoming-block-detail">
            Train {incoming.label} · {incoming.lineName}
            {incoming.track ? ` · Track ${incoming.track}` : ""}
          </p>
          <span className="panel-meta">
            Scheduled {scheduled} · {delay} · updates every 30s
          </span>
        </div>
      </div>
      {upcoming.length > 0 && (
        <div className="trip-follow-stops">
          <p className="panel-kicker">Stops before {incoming.boardingStationName}</p>
          <FollowStopList stops={upcoming} compact />
        </div>
      )}
    </div>
  );
}
