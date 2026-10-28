import { RATING_IDS } from "./survey";

export type Status = "good" | "fair" | "poor" | "none";

/** ≥4.0 green, 3.0–3.9 amber, <3.0 red */
export function scoreStatus(score: number | null | undefined): Status {
  if (score == null || Number.isNaN(score)) return "none";
  if (score >= 4) return "good";
  if (score >= 3) return "fair";
  return "poor";
}

export function average(nums: number[]): number | null {
  const v = nums.filter((n) => typeof n === "number" && !Number.isNaN(n));
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export function responseAverage(ratings: Record<string, number>): number | null {
  return average(RATING_IDS.map((id) => ratings[id]).filter((n): n is number => n != null));
}

export function missingRequiredRatings(ratings: Record<string, number>): string[] {
  return RATING_IDS.filter((id) => { const v = ratings[id]; return !(v != null && v >= 1 && v <= 5); });
}

type Issueish = {
  ratings: Record<string, number>;
  open_answers: Record<string, string>;
  resolved: boolean;
};
/** Open issue: a problem described in 3.5 or overall satisfaction (2.10) below 3, not yet resolved. */
export function isOpenIssue(r: Issueish): boolean {
  if (r.resolved) return false;
  const problem = (r.open_answers?.["3.5"] ?? "").trim().length > 0;
  const overall = r.ratings?.["2.10"];
  return problem || (overall != null && overall < 3);
}
