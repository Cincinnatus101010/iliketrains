import { NJ_ROUTE_COLORS } from "./njRoutes";

export const NJ_LINE_NAMES: Record<string, string> = {
  NEC: "Northeast Corridor",
  NJCL: "North Jersey Coast",
  MNE: "Morris & Essex",
  MNEG: "Gladstone Branch",
  BNTN: "Montclair–Boonton",
  MNBN: "Main / Bergen County",
  PASC: "Pascack Valley",
  RARV: "Raritan Valley",
  ATLC: "Atlantic City",
};

export type NjLine = {
  id: string;
  color: string;
  name: string;
};

export const NJ_LINES: NjLine[] = Object.entries(NJ_ROUTE_COLORS).map(([id, color]) => ({
  id,
  color,
  name: NJ_LINE_NAMES[id] ?? id,
}));

export function lineName(routeId: string): string {
  return NJ_LINE_NAMES[routeId.toUpperCase()] ?? routeId;
}
