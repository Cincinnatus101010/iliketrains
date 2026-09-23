"use client";

import { useEffect, useState } from "react";
import type { LineKey } from "@/lib/lineKey";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { njStationCodeFromTripKey } from "@/lib/trip/tripLines";
import type { LiveTrain } from "@/types";
import { SchedulePanel } from "./SchedulePanel";
import { TrainFollowBlock } from "./TrainFollowBlock";
import { TrainPanel } from "./TrainPanel";
import { TripLivePanel } from "./TripLivePanel";

type DockTab = "trip" | "live" | "schedule";

type DockPanelProps = {
  trains: LiveTrain[];
  loading: boolean;
  validating: boolean;
  updatedAt?: string;
  activeLine: LineKey | null;
  onRefresh: () => void;
  savedTrip: SavedTrip | null;
  tripHighlightTrainIds: Set<string>;
  trackingTrainId: string | null;
  onTrackTrain: (trainId: string) => void;
  onEditTrip: () => void;
  onEndTrip: () => void;
  onStopTracking: () => void;
  trackedTrain: LiveTrain | null;
};

export function DockPanel({
  savedTrip,
  tripHighlightTrainIds,
  trackingTrainId,
  onTrackTrain,
  onEditTrip,
  onEndTrip,
  onStopTracking,
  trackedTrain,
  ...props
}: DockPanelProps) {
  const [tab, setTab] = useState<DockTab>(() => (savedTrip ? "trip" : "live"));

  const scheduleStationCode = savedTrip ? njStationCodeFromTripKey(savedTrip.fromKey) : null;

  useEffect(() => {
    setTab(savedTrip ? "trip" : "live");
  }, [savedTrip]);

  return (
    <div className="dock-panel">
      <div className="dock-tabs" role="tablist" aria-label="Panel mode">
        {savedTrip && (
          <button
            type="button"
            role="tab"
            aria-selected={tab === "trip"}
            className={`dock-tab ${tab === "trip" ? "dock-tab--on" : ""}`}
            onClick={() => setTab("trip")}
          >
            Trip
          </button>
        )}
        <button
          type="button"
          role="tab"
          aria-selected={tab === "live"}
          className={`dock-tab ${tab === "live" ? "dock-tab--on" : ""}`}
          onClick={() => setTab("live")}
        >
          Live
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "schedule"}
          className={`dock-tab ${tab === "schedule" ? "dock-tab--on" : ""}`}
          onClick={() => setTab("schedule")}
        >
          Schedule
        </button>
      </div>
      {tab === "trip" && savedTrip ? (
        <TripLivePanel
          trip={savedTrip}
          trains={props.trains}
          activeLine={props.activeLine}
          onTrackTrain={onTrackTrain}
          onEditTrip={onEditTrip}
          onEndTrip={onEndTrip}
          onStopTracking={onStopTracking}
        />
      ) : tab === "live" ? (
        <>
          {!savedTrip && trackedTrain && (
            <TrainFollowBlock train={trackedTrain} onStopTracking={onStopTracking} />
          )}
          <TrainPanel
            {...props}
            highlightTrainIds={tripHighlightTrainIds}
            trackingTrainId={trackingTrainId}
            onTrackTrain={onTrackTrain}
          />
        </>
      ) : (
        <SchedulePanel activeLine={props.activeLine} defaultStationCode={scheduleStationCode} />
      )}
    </div>
  );
}
