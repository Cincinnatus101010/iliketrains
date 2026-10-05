/** NJ schedule and vehicle ids are often the same number with different padding or prefixes. */
export function normalizeNjTrainId(id: string): string {
  const trimmed = id.trim();
  const num = Number.parseInt(trimmed, 10);
  if (Number.isFinite(num)) return String(num);
  const digits = trimmed.replace(/\D/g, "");
  if (digits) {
    const fromDigits = Number.parseInt(digits, 10);
    if (Number.isFinite(fromDigits)) return String(fromDigits);
  }
  return trimmed;
}
