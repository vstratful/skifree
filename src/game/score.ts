import type { ScoreRecord } from "./types";

const STORAGE_KEY = "skifree.scores.v1";
const MAX_RECORDS = 5;

/**
 * High scores, ranked by distance the way the original's score box is.
 *
 * Every access is wrapped: `localStorage` throws outright in some privacy
 * modes, and a leaderboard is not worth taking the game down for.
 */
export function loadScores(): ScoreRecord[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isScoreRecord).sort(byRank).slice(0, MAX_RECORDS);
  } catch {
    return [];
  }
}

export function saveScore(record: ScoreRecord): ScoreRecord[] {
  const next = [...loadScores(), record].sort(byRank).slice(0, MAX_RECORDS);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Nothing to be done; the run still counted for this session.
  }
  return next;
}

export function isPersonalBest(
  record: ScoreRecord,
  scores: ScoreRecord[],
): boolean {
  return scores.every(
    (other) => other === record || byRank(record, other) <= 0,
  );
}

function byRank(a: ScoreRecord, b: ScoreRecord): number {
  if (b.distance !== a.distance) return b.distance - a.distance;
  return b.style - a.style;
}

function isScoreRecord(value: unknown): value is ScoreRecord {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.distance === "number" &&
    typeof candidate.style === "number" &&
    typeof candidate.time === "number" &&
    typeof candidate.at === "number"
  );
}
