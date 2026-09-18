"use client";

import { displayLineName } from "@/lib/displayLine";
import { trainHeadline, trainTimeLabel } from "@/lib/trainDisplay";
import type { LiveTrain } from "@/lib/types";

type FollowTrainBarProps = {
  train: LiveTrain;
  onStop: () => void;
};

export function FollowTrainBar({ train, onStop }: FollowTrainBarProps) {
  return (
    <div className="follow-train-bar glass" role="status">
      <div className="follow-train-bar-body">
        <span className="follow-train-bar-kicker">Following</span>
        <span className="follow-train-bar-title">
          {displayLineName(train)}
          {train.trainNumber ? ` #${train.trainNumber}` : ""}
        </span>
        <span className="follow-train-bar-meta">
          {trainHeadline(train)} · {trainTimeLabel(train)}
        </span>
      </div>
      <button type="button" className="follow-train-bar-stop" onClick={onStop}>
        Stop
      </button>
    </div>
  );
}
