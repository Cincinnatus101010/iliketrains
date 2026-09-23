"use client";

import { formatNjScheduleDeparture } from "@/lib/formatTime";
import type { IncomingTrainMapHint } from "@/lib/trip/incomingTrainMapHint";
import type { ScheduleDeparture } from "@/types";

type TripIncomingBlockProps = {
  incoming: IncomingTrainMapHint;
  departure: ScheduleDeparture;
};

export function TripIncomingBlock({ incoming, departure }: TripIncomingBlockProps) {
  const scheduled = formatNjScheduleDeparture(departure.scheduledAt);
  const delay =
    departure.secLate > 0
      ? `${Math.round(departure.secLate / 60)} min late`
      : departure.status?.trim() || "On schedule";

  return (
    <div className="trip-incoming-block" role="status" aria-live="polite">
      <div className="trip-incoming-block-head">
        <div className="trip-incoming-block-body">
          <span className="panel-kicker">Your train · scheduled (waiting for live GPS)</span>
          <p className="trip-incoming-block-eta">
            {incoming.minutesUntilLabel === "Boarding now"
              ? `At ${incoming.boardingStationName} now`
              : `${incoming.minutesUntilLabel} until ${incoming.boardingStationName}`}
          </p>
          <p className="trip-incoming-block-detail">
            Train {incoming.label} · {incoming.lineName}
            {incoming.track ? ` · Track ${incoming.track}` : ""}
          </p>
          <span className="panel-meta">
            Scheduled {scheduled} · {delay}
          </span>
        </div>
      </div>
    </div>
  );
}
