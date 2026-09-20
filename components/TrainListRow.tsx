import { displayLineName } from "@/lib/displayLine";
import {
  trainFollowPrimary,
  trainFollowSecondary,
  trainHeadline,
  trainMeta,
  trainTimeLabel,
} from "@/lib/trainDisplay";
import type { LiveTrain } from "@/lib/types";

type TrainListRowProps = {
  train: LiveTrain;
  highlight?: boolean;
  following?: boolean;
  onFollow?: (trainId: string) => void;
};

export function TrainListRow({ train, highlight, following, onFollow }: TrainListRowProps) {
  const meta = following
    ? trainFollowSecondary(train)
    : trainMeta(train, { includeDeparture: false });
  const stopLine = following ? trainFollowPrimary(train) : trainHeadline(train);

  return (
    <div
      className={`train-row ${highlight ? "train-row--highlight" : ""} ${following ? "train-row--follow" : ""}`}
    >
      <span className="train-row-rail" style={{ background: train.color }} aria-hidden />
      <div className="train-row-body">
        <span className="train-row-line">
          {displayLineName(train)}
          <span className="train-row-network">{train.network === "mta" ? "NY" : "NJ"}</span>
        </span>
        <span className={`train-row-stop ${following ? "train-row-stop--follow" : ""}`}>
          {stopLine}
        </span>
        {meta ? <span className="train-row-sub">{meta}</span> : null}
      </div>
      <div className="train-row-aside">
        <span className="train-row-time">{trainTimeLabel(train)}</span>
        {onFollow ? (
          <button
            type="button"
            className={`train-row-follow ${following ? "train-row-follow--on" : ""}`}
            aria-pressed={following}
            onClick={() => onFollow(train.id)}
          >
            {following ? "Following" : "Follow"}
          </button>
        ) : (
          <span className="train-row-code">{train.route}</span>
        )}
      </div>
    </div>
  );
}
