import { describe, expect, it } from "vitest";
import { isOpenIssue, missingRequiredRatings, scoreStatus } from "./stats";

describe("score status colors", () => {
  it("4.0 and above is green", () => expect(scoreStatus(4)).toBe("good"));
  it("3.0 to 3.9 is amber", () => {
    expect(scoreStatus(3)).toBe("fair");
    expect(scoreStatus(3.9)).toBe("fair");
  });
  it("below 3.0 is red", () => expect(scoreStatus(2.99)).toBe("poor"));
});

describe("section 2 is required", () => {
  it("all 13 ratings must be answered", () => {
    expect(missingRequiredRatings({})).toHaveLength(13);
    const all = Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`2.${i + 1}`, 3]));
    expect(missingRequiredRatings(all)).toEqual([]);
  });
});

describe("open issues", () => {
  it("low overall satisfaction (2.10) is an open issue until resolved", () => {
    expect(isOpenIssue({ ratings: { "2.10": 2 }, open_answers: {}, resolved: false })).toBe(true);
    expect(isOpenIssue({ ratings: { "2.10": 2 }, open_answers: {}, resolved: true })).toBe(false);
    expect(isOpenIssue({ ratings: { "2.10": 4 }, open_answers: {}, resolved: false })).toBe(false);
  });
});
