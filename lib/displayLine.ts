import type { LiveTrain } from "@/lib/types";
import { lineName as njLineName } from "@/lib/nj/lines";
import { subwayLineName } from "@/lib/mta/lines";

export function displayLineName(train: LiveTrain): string {
  if (train.network === "mta") return subwayLineName(train.route);
  return train.lineName || njLineName(train.route);
}
