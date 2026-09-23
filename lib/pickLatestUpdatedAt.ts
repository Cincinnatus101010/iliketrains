export function pickLatestUpdatedAt(...timestamps: (string | undefined)[]): string | undefined {
  let best: string | undefined;
  let bestMs = -Infinity;

  for (const ts of timestamps) {
    if (!ts) continue;
    const ms = Date.parse(ts);
    if (Number.isNaN(ms)) continue;
    if (ms >= bestMs) {
      bestMs = ms;
      best = ts;
    }
  }

  return best;
}
