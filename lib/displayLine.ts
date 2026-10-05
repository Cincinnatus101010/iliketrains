import type { LiveTrain } from "@/app/types";
import { subwayLineName } from "@/lib/mta/lines";
import { lineName as njLineName } from "@/lib/nj/lines";

export function displayLineName(train: LiveTrain): string {
  if (train.network === "mta") return subwayLineName(train.route);
  return train.lineName || njLineName(train.route);
}
