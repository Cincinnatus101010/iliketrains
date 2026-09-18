import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_PATH = path.join(__dirname, ".raildata-token.json");

type CacheEntry = { token: string; expiresAt: string };

let cachedToken: string | null = null;
let expiresAt = 0;
let backoffUntil = 0;
let lastError: string | null = null;

function loadDisk(): void {
  if (!fs.existsSync(CACHE_PATH)) return;
  try {
    const entry = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) as CacheEntry;
    const exp = Date.parse(entry.expiresAt);
    if (entry.token && exp > Date.now()) {
      cachedToken = entry.token;
      expiresAt = exp;
    }
  } catch {
    /* ignore */
  }
}

function saveDisk(): void {
  if (!cachedToken) return;
  fs.writeFileSync(
    CACHE_PATH,
    JSON.stringify({ token: cachedToken, expiresAt: new Date(expiresAt).toISOString() }),
  );
}

loadDisk();

export function getLastTokenError(): string | null {
  return lastError;
}

export async function getNjToken(username: string, password: string, tokenUrl: string): Promise<string | null> {
  if (!username || !password) {
    lastError = "NJ Transit credentials not configured";
    return null;
  }

  if (cachedToken && Date.now() < expiresAt) {
    return cachedToken;
  }

  if (Date.now() < backoffUntil) {
    return cachedToken;
  }

  const form = new FormData();
  form.append("username", username);
  form.append("password", password);

  const response = await fetch(tokenUrl, { method: "POST", body: form });
  const body = (await response.json()) as {
    UserToken?: string;
    errorMessage?: string;
  };

  if (!response.ok || !body.UserToken?.trim()) {
    lastError = body.errorMessage ?? `HTTP ${response.status}`;
    if (lastError.toLowerCase().includes("daily usage limit")) {
      const tomorrow = new Date();
      tomorrow.setUTCHours(24, 0, 0, 0);
      backoffUntil = tomorrow.getTime();
    } else {
      backoffUntil = Date.now() + 15 * 60 * 1000;
    }
    return cachedToken;
  }

  cachedToken = body.UserToken.trim();
  expiresAt = Date.now() + 23 * 60 * 60 * 1000;
  backoffUntil = 0;
  lastError = null;
  saveDisk();
  return cachedToken;
}
