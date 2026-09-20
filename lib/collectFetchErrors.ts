export function collectFetchErrors(...sources: unknown[]): string[] {
  const out: string[] = [];
  for (const source of sources) {
    if (source == null || source === false) continue;
    if (typeof source === "string") {
      if (source) out.push(source);
      continue;
    }
    if (source instanceof Error) {
      out.push(source.message);
      continue;
    }
    out.push(String(source));
  }
  return out;
}
