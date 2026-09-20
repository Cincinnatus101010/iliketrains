"use client";

import { FollowStopList } from "@/components/FollowStopList";
import { useFollowUpcomingStops } from "@/components/useFollowUpcomingStops";
import { trainFollowPrimary, trainFollowSecondary } from "@/lib/trainDisplay";
import type { LiveTrain } from "@/lib/types";

type MapContextCardProps = {
  followedTrain: LiveTrain;
  onStopFollow: () => void;
};

export function MapContextCard({ followedTrain, onStopFollow }: MapContextCardProps) {
  const upcoming = useFollowUpcomingStops(followedTrain);
  const primary = trainFollowPrimary(followedTrain);
  const secondary = trainFollowSecondary(followedTrain);

  return (
    <div className="map-context-card glass map-context-card--follow" role="status">
      <div className="map-context-card-follow">
        <div className="map-context-card-follow-body">
          <span className="map-context-card-kicker">On this train</span>
          <p className="map-context-card-follow-status" aria-live="polite">
            {primary}
          </p>
          <span className="map-context-card-follow-sub">{secondary}</span>
          <FollowStopList stops={upcoming} compact />
        </div>
        <button type="button" className="map-context-card-stop" onClick={onStopFollow}>
          Stop
        </button>
      </div>
    </div>
  );
}
