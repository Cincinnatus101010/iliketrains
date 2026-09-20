"use client";

import { FollowStopList } from "@/components/FollowStopList";
import { useFollowUpcomingStops } from "@/components/useFollowUpcomingStops";
import { trainFollowPrimary, trainFollowSecondary } from "@/lib/trainDisplay";
import type { LiveTrain } from "@/lib/types";

type MapContextCardProps = {
  trackedTrain: LiveTrain;
  onStopTracking: () => void;
};

export function MapContextCard({ trackedTrain, onStopTracking }: MapContextCardProps) {
  const upcoming = useFollowUpcomingStops(trackedTrain);
  const primary = trainFollowPrimary(trackedTrain);
  const secondary = trainFollowSecondary(trackedTrain);

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
        <button type="button" className="map-context-card-stop" onClick={onStopTracking}>
          Stop
        </button>
      </div>
    </div>
  );
}
