/** NJ schedule API uses "Single" for single-track territory — not a platform number. */
export function normalizePlatformTrack(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const track = raw.trim();
  if (/^single$/i.test(track)) return null;
  return track;
}
