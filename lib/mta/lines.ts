import { colorForSubwayRoute } from "./subwayRoutes";

export type SubwayLine = {
  id: string;
  color: string;
  name: string;
};

const SUBWAY_LINE_NAMES: Record<string, string> = {
  "1": "1 Broadway–7 Av Local",
  "2": "2 7 Av Express",
  "3": "3 7 Av Express",
  "4": "4 Lexington Av Express",
  "5": "5 Lexington Av Express",
  "6": "6 Lexington Av Local",
  "7": "7 Flushing",
  A: "A 8 Av Express",
  C: "C 8 Av Local",
  E: "E 8 Av Local",
  B: "B 6 Av Express",
  D: "D 6 Av Express",
  F: "F 6 Av Local",
  M: "M 6 Av Local",
  G: "G Brooklyn–Queens Crosstown",
  J: "J Nassau St",
  Z: "Z Nassau St Express",
  L: "L Canarsie",
  N: "N Broadway Express",
  Q: "Q Broadway Express",
  R: "R Broadway Local",
  W: "W Broadway Local",
  S: "S Shuttle",
};

export const SUBWAY_LINES: SubwayLine[] = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "A",
  "C",
  "E",
  "B",
  "D",
  "F",
  "M",
  "G",
  "J",
  "Z",
  "L",
  "N",
  "Q",
  "R",
  "W",
  "S",
].map((id) => ({
  id,
  color: colorForSubwayRoute(id),
  name: SUBWAY_LINE_NAMES[id] ?? `Route ${id}`,
}));

export function subwayLineName(routeId: string): string {
  const key = routeId.trim().toUpperCase();
  return SUBWAY_LINE_NAMES[key] ?? `Subway ${key}`;
}
