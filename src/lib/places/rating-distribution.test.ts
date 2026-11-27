import { describe, expect, it } from "vitest";

import { buildRatingDistribution } from "@/lib/places/rating-distribution";

describe("buildRatingDistribution", () => {
  it("returns one row per score from 5 to 1 with its count and percentage", () => {
    expect(buildRatingDistribution([5, 4])).toEqual([
      { rating: 5, count: 1, percentage: 50 },
      { rating: 4, count: 1, percentage: 50 },
      { rating: 3, count: 0, percentage: 0 },
      { rating: 2, count: 0, percentage: 0 },
      { rating: 1, count: 0, percentage: 0 },
    ]);
    expect(
      buildRatingDistribution([5, 5, 5, 1]).map((row) => row.percentage),
    ).toEqual([75, 0, 0, 0, 25]);
  });

  it("returns every score at zero when there are no reviews", () => {
    expect(buildRatingDistribution([])).toEqual([
      { rating: 5, count: 0, percentage: 0 },
      { rating: 4, count: 0, percentage: 0 },
      { rating: 3, count: 0, percentage: 0 },
      { rating: 2, count: 0, percentage: 0 },
      { rating: 1, count: 0, percentage: 0 },
    ]);
  });
});
