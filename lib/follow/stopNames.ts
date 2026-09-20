export function normalizeStopName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+STATION$/i, "")
    .replace(/\./g, "");
}

export function stopNamesMatch(a: string, b: string): boolean {
  const na = normalizeStopName(a);
  const nb = normalizeStopName(b);
  if (na === nb) return true;
  return na.includes(nb) || nb.includes(na);
}

export function indexOfStopName(names: string[], stopName: string | null | undefined): number {
  if (!stopName?.trim()) return -1;
  const exact = names.findIndex((n) => stopNamesMatch(n, stopName));
  if (exact >= 0) return exact;
  return -1;
}
