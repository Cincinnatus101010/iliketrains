"use client";

import { useState } from "react";
import { TrainPanel } from "./TrainPanel";
import { SchedulePanel } from "./SchedulePanel";
import type { LineKey } from "@/lib/lineKey";
import type { LiveTrain } from "@/lib/types";

type DockTab = "live" | "schedule";

type DockPanelProps = {
  trains: LiveTrain[];
  loading: boolean;
  validating: boolean;
  updatedAt?: string;
  activeLine: LineKey | null;
  onRefresh: () => void;
};

export function DockPanel(props: DockPanelProps) {
  const [tab, setTab] = useState<DockTab>("live");

  return (
    <div className="dock-panel">
      <div className="dock-tabs" role="tablist" aria-label="Panel mode">
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
      {tab === "live" ? <TrainPanel {...props} /> : <SchedulePanel activeLine={props.activeLine} />}
    </div>
  );
}
