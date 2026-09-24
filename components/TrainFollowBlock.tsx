"use client";

import { FollowStopList } from "@/components/FollowStopList";
import { useFollowUpcomingStops } from "@/hooks/useFollowUpcomingStops";
import { trainFollowPrimary, trainFollowSecondary } from "@/lib/trainDisplay";
import type { LiveTrain } from "@/types";

type TrainFollowBlockProps = {
  train: LiveTrain;
  onStopTracking: () => void;
  kicker?: string;
};

export function TrainFollowBlock({ train, onStopTracking, kicker }: TrainFollowBlockProps) {
  const upcoming = useFollowUpcomingStops(train);
  const primary = trainFollowPrimary(train);
  const secondary = trainFollowSecondary(train);

  return (
    <div className="train-follow-block" role="status">
      <div className="train-follow-block-head">
        <div className="train-follow-block-body">
          <span className="panel-kicker">{kicker ?? "On this train"}</span>
          <p className="train-follow-block-status" aria-live="polite">
            {primary}
          </p>
          <span className="panel-meta">{secondary}</span>
        </div>
        <button type="button" className="trip-dock-action" onClick={onStopTracking}>
          Stop
        </button>
      </div>
      {upcoming.length > 0 && (
        <div className="trip-follow-stops">
          <FollowStopList stops={upcoming} />
        </div>
      )}
    </div>
  );
}
