"use client";

import { useEffect, useState } from "react";
import type { LineKey } from "@/lib/lineKey";
import type { SavedTrip } from "@/lib/trip/savedTrip";
import { njStationCodeFromTripKey } from "@/lib/trip/tripLines";
import type { LiveTrain } from "@/lib/types";
import { SchedulePanel } from "./SchedulePanel";
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
  followedTrainId: string | null;
  onFollowTrain: (trainId: string) => void;
};

export function DockPanel({
  savedTrip,
  tripHighlightTrainIds,
  followedTrainId,
  onFollowTrain,
  ...props
}: DockPanelProps) {
  const [tab, setTab] = useState<DockTab>(savedTrip ? "trip" : "live");

  useEffect(() => {
    if (savedTrip) setTab("trip");
  }, [savedTrip?.savedAt]);

  const scheduleStationCode = savedTrip ? njStationCodeFromTripKey(savedTrip.fromKey) : null;

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
          followedTrainId={followedTrainId}
          onFollowTrain={onFollowTrain}
        />
      ) : tab === "live" ? (
        <TrainPanel
          {...props}
          highlightTrainIds={tripHighlightTrainIds}
          followedTrainId={followedTrainId}
          onFollowTrain={onFollowTrain}
        />
      ) : (
        <SchedulePanel activeLine={props.activeLine} defaultStationCode={scheduleStationCode} />
      )}
    </div>
  );
}
