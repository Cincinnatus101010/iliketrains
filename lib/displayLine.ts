import { subwayLineName } from "@/lib/mta/lines";
import { lineName as njLineName } from "@/lib/nj/lines";
import type { LiveTrain } from "@/lib/types";

export function displayLineName(train: LiveTrain): string {
  if (train.network === "mta") return subwayLineName(train.route);
  return train.lineName || njLineName(train.route);
}
