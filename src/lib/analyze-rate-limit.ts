import "server-only";

const WINDOW_MS = 60_000;
const REQUEST_LIMIT = 5;
const MAX_TRACKED_CLIENTS = 10_000;

type RateLimitEntry = { count: number; resetAt: number };

// This map is deliberately instance-local. It reduces casual bursts on a warm
// Vercel Function, but resets on cold starts and is not shared across instances.
// Production-grade distributed abuse prevention requires an external store or
// a platform-level firewall/rate-limit product, neither of which this app adds.
const requests = new Map<string, RateLimitEntry>();

function getClientKey(request: Request) {
  if (process.env.VERCEL === "1") {
    // Trust the forwarding header only behind Vercel's managed proxy. Outside
    // Vercel, client-supplied forwarding headers are ignored.
    const forwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
    if (forwarded && forwarded.length <= 64) return `vercel:${forwarded}`;
    return "vercel:unknown";
  }
  return "local-instance";
}

function discardExpiredEntries(now: number) {
  for (const [key, entry] of requests) {
    if (entry.resetAt <= now) requests.delete(key);
  }
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export function checkAnalyzeRateLimit(request: Request, now = Date.now()): RateLimitResult {
  if (requests.size >= MAX_TRACKED_CLIENTS) discardExpiredEntries(now);

  const key = getClientKey(request);
  if (requests.size >= MAX_TRACKED_CLIENTS && !requests.has(key)) {
    return { allowed: false, retryAfterSeconds: Math.ceil(WINDOW_MS / 1_000) };
  }
  const current = requests.get(key);
  if (!current || current.resetAt <= now) {
    requests.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= REQUEST_LIMIT) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1_000)) };
  }

  current.count += 1;
  return { allowed: true };
}
