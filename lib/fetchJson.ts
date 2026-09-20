type JsonBody = { error?: string | null };

export async function fetchJson<T extends JsonBody>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, cache: "no-store" });
  const data = (await res.json()) as T;
  if (!res.ok && !data.error) {
    throw new Error(`HTTP ${res.status}`);
  }
  return data;
}
