import type { LiveTrain, MapScope, Network } from "@/lib/types";

export type LineKey = `${Network}:${string}`;

export function lineKey(network: Network, route: string): LineKey {
  return `${network}:${route}`;
}

export function parseLineKey(key: string | null): { network: Network; route: string } | null {
  if (!key) return null;
  const i = key.indexOf(":");
  if (i <= 0) return null;
  const network = key.slice(0, i) as Network;
  if (network !== "mta" && network !== "njt") return null;
  return { network, route: key.slice(i + 1) };
}

/** Whether the selected line filter still applies after changing map scope. */
export function activeLineMatchesScope(line: LineKey | null, scope: MapScope): boolean {
  if (!line) return true;
  const parsed = parseLineKey(line);
  if (!parsed) return true;
  if (scope === "mta") return parsed.network === "mta";
  if (scope === "njt") return parsed.network === "njt";
  return true;
}

export function trainMatchesLineKey(train: LiveTrain, key: string | null): boolean {
  if (!key) return true;
  const parsed = parseLineKey(key);
  if (!parsed) return train.route === key;
  return train.network === parsed.network && train.route === parsed.route;
}
