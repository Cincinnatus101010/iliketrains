import { displayLineName } from "@/lib/displayLine";
import { trainHeadline, trainMeta, trainTimeLabel } from "@/lib/trainDisplay";
import type { LiveTrain } from "@/lib/types";

type TrainListRowProps = {
  train: LiveTrain;
  highlight?: boolean;
};

export function TrainListRow({ train, highlight }: TrainListRowProps) {
  const meta = trainMeta(train, { includeDeparture: false });

  return (
    <div className={`train-row ${highlight ? "train-row--highlight" : ""}`}>
      <span className="train-row-rail" style={{ background: train.color }} aria-hidden />
      <div className="train-row-body">
        <span className="train-row-line">
          {displayLineName(train)}
          <span className="train-row-network">{train.network === "mta" ? "NY" : "NJ"}</span>
        </span>
        <span className="train-row-stop">{trainHeadline(train)}</span>
        {meta ? <span className="train-row-sub">{meta}</span> : null}
      </div>
      <div className="train-row-aside">
        <span className="train-row-time">{trainTimeLabel(train)}</span>
        <span className="train-row-code">{train.route}</span>
      </div>
    </div>
  );
}
