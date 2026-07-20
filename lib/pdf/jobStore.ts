import type { Deck } from "@/lib/model/deck";

// Hand a deck from the POST /api/pdf route to the /print page that Playwright
// loads, without stuffing a large payload through the URL. Kept on globalThis
// so all route handlers in the same server process share one map.

interface Job {
  deck: Deck;
  ts: number;
}

const g = globalThis as unknown as { __pdfJobs?: Map<string, Job> };
const jobs: Map<string, Job> = g.__pdfJobs ?? (g.__pdfJobs = new Map());

const TTL = 60_000;

export function putJob(token: string, deck: Deck) {
  const now = Date.now();
  for (const [k, v] of jobs) if (now - v.ts > TTL) jobs.delete(k);
  jobs.set(token, { deck, ts: now });
}

export function getJob(token: string): Deck | undefined {
  return jobs.get(token)?.deck;
}

export function dropJob(token: string) {
  jobs.delete(token);
}
