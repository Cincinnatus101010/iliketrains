import { displayLineName } from "@/lib/displayLine";
import {
  trainFollowPrimary,
  trainFollowSecondary,
  trainHeadline,
  trainMeta,
  trainTimeLabel,
} from "@/lib/trainDisplay";
import type { LiveTrain } from "@/types";

type TrainListRowProps = {
  train: LiveTrain;
  highlight?: boolean;
  /** This row is the actively tracked train. */
  tracking?: boolean;
  onTrack?: (trainId: string) => void;
};

export function TrainListRow({ train, highlight, tracking, onTrack }: TrainListRowProps) {
  const meta = tracking
    ? trainFollowSecondary(train)
    : trainMeta(train, { includeDeparture: false });
  const stopLine = tracking ? trainFollowPrimary(train) : trainHeadline(train);

  return (
    <div
      className={`train-row ${highlight ? "train-row--highlight" : ""} ${tracking ? "train-row--follow" : ""}`}
    >
      <span className="train-row-rail" style={{ background: train.color }} aria-hidden />
      <div className="train-row-body">
        <span className="train-row-line">
          {displayLineName(train)}
          <span className="train-row-network">{train.network === "mta" ? "NY" : "NJ"}</span>
        </span>
        <span className={`train-row-stop ${tracking ? "train-row-stop--follow" : ""}`}>
          {stopLine}
        </span>
        {meta ? <span className="train-row-sub">{meta}</span> : null}
      </div>
      <div className="train-row-aside">
        <span className="train-row-time">{trainTimeLabel(train)}</span>
        {onTrack ? (
          <button
            type="button"
            className={`train-row-follow ${tracking ? "train-row-follow--on" : ""}`}
            aria-pressed={tracking}
            onClick={() => onTrack(train.id)}
          >
            {tracking ? "Following" : "Follow"}
          </button>
        ) : (
          <span className="train-row-code">{train.route}</span>
        )}
      </div>
    </div>
  );
}
